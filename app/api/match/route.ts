import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const PROFILES_NAMESPACE = 'profiles';
const TWEETS_NAMESPACE = 'tweets';

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

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const indexName = process.env.PINECONE_INDEX || 'ugc-creators';
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
    if (minFollowers) {
      filter.follower_count = { $gte: parseInt(minFollowers) };
    }

    // Search for matches
    const results = await index.namespace(PROFILES_NAMESPACE).query({
      vector: profileData.values as number[],
      topK,
      includeMetadata: true,
      filter,
    });

    // Format results
    const matches = results.matches?.map((match) => ({
      score: match.score,
      profile: match.metadata,
    })) || [];

    return NextResponse.json({
      query_profile: profileData.metadata,
      matches,
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

    const indexName = process.env.PINECONE_INDEX || 'ugc-creators';
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
