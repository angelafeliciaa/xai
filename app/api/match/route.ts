import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const PROFILES_NAMESPACE = 'profiles';
const TWEETS_NAMESPACE = 'tweets';
const XAI_API_KEY = process.env.XAI_API_KEY;

interface ProfileMetadata {
  username: string;
  name: string;
  description: string;
  type: string;
  follower_count: number;
  sample_tweets?: string[];
}

// Re-rank matches using Grok
async function rerankWithGrok(
  queryProfile: ProfileMetadata,
  candidates: { score: number | undefined; profile: ProfileMetadata }[],
  topK: number
): Promise<{ score: number | undefined; profile: ProfileMetadata }[]> {
  if (!XAI_API_KEY || candidates.length === 0) return candidates.slice(0, topK);

  const isCreatorSearching = queryProfile.type === 'creator';
  const searcherLabel = isCreatorSearching ? 'creator' : 'brand';
  const targetLabel = isCreatorSearching ? 'brand' : 'creator';

  // Build candidate summaries
  const candidateSummaries = candidates.map((c, i) => {
    const p = c.profile;
    const tweets = p.sample_tweets?.slice(0, 3).join(' | ') || 'N/A';
    return `${i + 1}. @${p.username} (${p.name}) - ${p.follower_count.toLocaleString()} followers
   Bio: ${p.description || 'N/A'}
   Sample content: ${tweets.slice(0, 200)}`;
  }).join('\n\n');

  const queryTweets = queryProfile.sample_tweets?.slice(0, 3).join(' | ') || 'N/A';

  const prompt = `You are an expert at matching ${targetLabel}s with ${searcherLabel}s for marketing partnerships.

## ${searcherLabel.toUpperCase()} PROFILE:
@${queryProfile.username} (${queryProfile.name})
Bio: ${queryProfile.description || 'N/A'}
Followers: ${queryProfile.follower_count.toLocaleString()}
Sample content: ${queryTweets.slice(0, 300)}

## CANDIDATE ${targetLabel.toUpperCase()}S:
${candidateSummaries}

## TASK:
Rank these ${candidates.length} ${targetLabel}s from BEST to WORST fit for @${queryProfile.username}.
Consider:
- Industry/niche alignment (beauty creator should match beauty brands, tech founder should match tech companies)
- Audience overlap potential
- Brand safety and values alignment
- Content style compatibility

Return the ranking as an array of numbers (1-indexed) from best to worst fit.`;

  try {
    // Define JSON schema for structured output
    const responseSchema = {
      type: 'object',
      properties: {
        ranking: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Array of candidate numbers (1-indexed) ranked from best to worst fit',
        },
      },
      required: ['ranking'],
      additionalProperties: false,
    };

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-reasoning',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.1,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'ranking_response',
            strict: true,
            schema: responseSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      console.error('Grok rerank failed:', response.status);
      return candidates.slice(0, topK);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    // Parse structured JSON response
    const parsed = JSON.parse(content);
    const ranking = (parsed.ranking || [])
      .map((n: number) => n - 1) // Convert to 0-indexed
      .filter((n: number) => !isNaN(n) && n >= 0 && n < candidates.length);

    if (ranking.length === 0) {
      return candidates.slice(0, topK);
    }

    // Reorder candidates based on Grok's ranking
    const reranked: typeof candidates = [];
    const used = new Set<number>();

    for (const idx of ranking) {
      if (!used.has(idx)) {
        reranked.push(candidates[idx]);
        used.add(idx);
      }
    }

    // Add any candidates not in ranking at the end
    for (let i = 0; i < candidates.length; i++) {
      if (!used.has(i)) {
        reranked.push(candidates[i]);
      }
    }

    return reranked.slice(0, topK);
  } catch (error) {
    console.error('Grok rerank error:', error);
    return candidates.slice(0, topK);
  }
}

// Generate case variations for username lookup
function getUsernameVariations(username: string): string[] {
  const variations = new Set<string>();
  variations.add(username);
  variations.add(username.toLowerCase());
  variations.add(username.toUpperCase());
  // Title case (first letter uppercase)
  variations.add(username.charAt(0).toUpperCase() + username.slice(1).toLowerCase());
  // Original with first letter lowercase
  variations.add(username.charAt(0).toLowerCase() + username.slice(1));
  return Array.from(variations);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    const searcherType = searchParams.get('type') || 'brand'; // brand or creator
    const topK = parseInt(searchParams.get('top_k') || '10');
    const minFollowers = searchParams.get('min_followers');
    const maxFollowers = searchParams.get('max_followers');
    const rerank = searchParams.get('rerank') !== 'false'; // Default to true

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const indexName = process.env.PINECONE_INDEX!;
    const index = pinecone.index(indexName);

    // Try to find the profile with case variations
    let profileData = null;
    const usernameVariations = getUsernameVariations(username);

    outer: for (const prefix of ['brand', 'creator']) {
      for (const usernameVar of usernameVariations) {
        const vectorId = `${prefix}_${usernameVar}`;
        try {
          const result = await index.namespace(PROFILES_NAMESPACE).fetch([vectorId]);
          if (result.records && result.records[vectorId]) {
            profileData = {
              id: vectorId,
              values: result.records[vectorId].values,
              metadata: result.records[vectorId].metadata,
            };
            break outer;
          }
        } catch {
          continue;
        }
      }
    }

    if (!profileData) {
      return NextResponse.json(
        { error: `Profile @${username} not found. Ingest it first using the CLI.` },
        { status: 404 }
      );
    }

    // Determine target type (opposite of searcher)
    const targetType = searcherType === 'brand' ? 'creator' : 'brand';

    // Build filter
    const filter: Record<string, unknown> = { type: targetType };
    
    // Handle follower count filtering with both min and max
    if (minFollowers && maxFollowers) {
      filter.follower_count = {
        $gte: parseInt(minFollowers),
        $lte: parseInt(maxFollowers)
      };
    } else if (minFollowers) {
      filter.follower_count = { $gte: parseInt(minFollowers) };
    } else if (maxFollowers) {
      filter.follower_count = { $lte: parseInt(maxFollowers) };
    }

    // Fetch more candidates for re-ranking (3x topK, min 15)
    const fetchCount = rerank ? Math.max(topK * 3, 15) : topK;

    // Search for matches
    const results = await index.namespace(PROFILES_NAMESPACE).query({
      vector: profileData.values as number[],
      topK: fetchCount,
      includeMetadata: true,
      filter,
    });

    // Format results
    let matches = results.matches?.map((match) => ({
      score: match.score,
      profile: match.metadata as unknown as ProfileMetadata,
    })) || [];

    // Re-rank with Grok if enabled
    if (rerank && matches.length > 0) {
      matches = await rerankWithGrok(
        profileData.metadata as unknown as ProfileMetadata,
        matches,
        topK
      );
    } else {
      matches = matches.slice(0, topK);
    }

    return NextResponse.json({
      query_profile: profileData.metadata,
      matches,
      reranked: rerank,
    });
  } catch (error) {
    console.error('Match error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Match failed' },
      { status: 500 }
    );
  }
}

// Get tweets for a specific creator that match a brand
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand_username, creator_username, top_k = 5 } = body;

    if (!brand_username || !creator_username) {
      return NextResponse.json(
        { error: 'brand_username and creator_username are required' },
        { status: 400 }
      );
    }

    const indexName = process.env.PINECONE_INDEX!;
    const index = pinecone.index(indexName);

    // Get brand profile embedding with case variations
    let brandVector: number[] | null = null;
    const brandVariations = getUsernameVariations(brand_username);

    for (const brandVar of brandVariations) {
      const brandId = `brand_${brandVar}`;
      const brandResult = await index.namespace(PROFILES_NAMESPACE).fetch([brandId]);
      if (brandResult.records && brandResult.records[brandId]) {
        brandVector = brandResult.records[brandId].values as number[];
        break;
      }
    }

    if (!brandVector) {
      return NextResponse.json(
        { error: `Brand @${brand_username} not found` },
        { status: 404 }
      );
    }

    // Search creator's tweets with case variations
    const creatorVariations = getUsernameVariations(creator_username);
    let tweets: { score: number | undefined; tweet: Record<string, unknown> }[] = [];

    for (const creatorVar of creatorVariations) {
      const results = await index.namespace(TWEETS_NAMESPACE).query({
        vector: brandVector,
        topK: top_k,
        includeMetadata: true,
        filter: { author_username: creatorVar },
      });

      if (results.matches && results.matches.length > 0) {
        tweets = results.matches.map((match) => ({
          score: match.score,
          tweet: match.metadata as Record<string, unknown>,
        }));
        break;
      }
    }

    return NextResponse.json({
      brand: brand_username,
      creator: creator_username,
      tweets,
    });
  } catch (error) {
    console.error('Match tweets error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Match tweets failed' },
      { status: 500 }
    );
  }
}
