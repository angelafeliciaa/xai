import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;
const XAI_API_KEY = process.env.XAI_API_KEY;
const PROFILES_NAMESPACE = 'profiles';
const TWEETS_NAMESPACE = 'tweets';
const MAX_TWEETS = 25; // Increased for better embeddings

interface XUser {
  id: string;
  username: string;
  name: string;
  description?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
  verified?: boolean;
  verified_type?: string;
  profile_image_url?: string;
}

interface XTweet {
  id: string;
  text: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
  };
}

interface GrokClassification {
  type: 'brand' | 'creator';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

async function validateWithGrok(
  user: XUser,
  tweets: XTweet[],
  requestedType: 'brand' | 'creator'
): Promise<{ valid: boolean; suggestedType: 'brand' | 'creator'; confidence: string; reasoning: string }> {
  if (!XAI_API_KEY) {
    // If no API key, skip validation and trust the requested type
    return { valid: true, suggestedType: requestedType, confidence: 'skipped', reasoning: 'Grok validation skipped - no API key' };
  }

  const tweetText = tweets.slice(0, 5).map(t => t.text).join('\n- ') || 'No tweets available';

  const prompt = `Analyze this X/Twitter profile and determine if it's a BRAND (company/organization) or CREATOR (individual person).

## PROFILE:
Username: @${user.username}
Display Name: ${user.name}
Bio: ${user.description || 'No bio'}
Followers: ${user.public_metrics?.followers_count?.toLocaleString() || 0}
Verified: ${user.verified ? 'Yes' : 'No'}
Verified Type: ${user.verified_type || 'N/A'}

## SAMPLE TWEETS:
- ${tweetText}

## CLASSIFICATION GUIDELINES:
- BRAND: Company accounts, official product/service accounts, organizations, media outlets, music groups, TV shows
- CREATOR: Individual people, influencers, founders (personal accounts), solo artists

Note: Personal accounts of founders/CEOs are CREATORS even if they talk about their company.
Music groups, media brands, publishers, and organizations are BRANDS.`;

  const responseSchema = {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['brand', 'creator'] },
      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
      reasoning: { type: 'string' },
    },
    required: ['type', 'confidence', 'reasoning'],
    additionalProperties: false,
  };

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.1,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'classification', strict: true, schema: responseSchema },
        },
      }),
    });

    if (!response.ok) {
      console.error(`Grok API error: ${response.status}`);
      // On API error, allow ingestion with requested type
      return { valid: true, suggestedType: requestedType, confidence: 'error', reasoning: 'Grok API error - using requested type' };
    }

    const data = await response.json();
    const result: GrokClassification = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    return {
      valid: result.type === requestedType,
      suggestedType: result.type,
      confidence: result.confidence,
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('Grok validation error:', error);
    return { valid: true, suggestedType: requestedType, confidence: 'error', reasoning: 'Validation failed - using requested type' };
  }
}

async function fetchXUser(username: string): Promise<XUser> {
  const userFields = [
    'id', 'name', 'username', 'description', 'public_metrics',
    'verified', 'verified_type', 'profile_image_url'
  ].join(',');

  const response = await fetch(
    `https://api.x.com/2/users/by/username/${username}?user.fields=${userFields}`,
    {
      headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` },
    }
  );

  if (!response.ok) {
    // Log rate limit headers
    const headers = {
      'x-rate-limit-limit': response.headers.get('x-rate-limit-limit'),
      'x-rate-limit-remaining': response.headers.get('x-rate-limit-remaining'),
      'x-rate-limit-reset': response.headers.get('x-rate-limit-reset'),
    };
    console.error(`X API error ${response.status} for @${username}:`, headers);
    throw new Error(`X API error: ${response.status}`);
  }

  const data = await response.json();
  if (!data.data) {
    throw new Error(`User not found: ${username}`);
  }

  return data.data;
}

async function fetchXTweets(userId: string): Promise<XTweet[]> {
  const tweetFields = ['id', 'text', 'public_metrics'].join(',');

  const response = await fetch(
    `https://api.x.com/2/users/${userId}/tweets?tweet.fields=${tweetFields}&max_results=${MAX_TWEETS}&exclude=replies,retweets`,
    {
      headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` },
    }
  );

  if (!response.ok) {
    throw new Error(`X API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

async function createEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

function computeProfileEmbedding(
  bioEmbedding: number[] | null,
  tweetEmbeddings: number[][]
): number[] {
  if (tweetEmbeddings.length === 0 && !bioEmbedding) {
    throw new Error('Need at least bio or tweets');
  }

  if (tweetEmbeddings.length === 0) return bioEmbedding!;

  // Compute mean of tweet embeddings
  const dim = tweetEmbeddings[0].length;
  const tweetMean = new Array(dim).fill(0);
  for (const emb of tweetEmbeddings) {
    for (let i = 0; i < dim; i++) {
      tweetMean[i] += emb[i] / tweetEmbeddings.length;
    }
  }

  if (!bioEmbedding) return tweetMean;

  // Weighted: 30% bio + 70% tweets
  const profileEmbedding = new Array(dim);
  for (let i = 0; i < dim; i++) {
    profileEmbedding[i] = 0.3 * bioEmbedding[i] + 0.7 * tweetMean[i];
  }

  return profileEmbedding;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, type = 'creator', skipValidation = false, autoCorrect = true } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    if (!X_BEARER_TOKEN) {
      return NextResponse.json({ error: 'X API not configured' }, { status: 500 });
    }

    const indexName = process.env.PINECONE_INDEX!;
    const index = pinecone.index(indexName);

    // Fetch user from X first (needed for validation)
    const user = await fetchXUser(username);

    // Fetch tweets
    const tweets = await fetchXTweets(user.id);

    // Validate classification with Grok (unless skipped)
    let finalType: 'brand' | 'creator' = type;
    let validationResult = null;

    if (!skipValidation) {
      validationResult = await validateWithGrok(user, tweets, type);

      if (!validationResult.valid && validationResult.confidence === 'high') {
        if (autoCorrect) {
          // Auto-correct the type based on Grok's classification
          finalType = validationResult.suggestedType;
          console.log(`Auto-corrected @${username}: ${type} -> ${finalType} (${validationResult.reasoning})`);
        } else {
          // Reject the ingestion
          return NextResponse.json({
            error: 'Classification mismatch',
            message: `Requested type '${type}' but Grok classified as '${validationResult.suggestedType}' with high confidence`,
            suggestedType: validationResult.suggestedType,
            reasoning: validationResult.reasoning,
          }, { status: 400 });
        }
      }
    }

    // Normalize username to lowercase to prevent duplicates
    const normalizedUsername = username.toLowerCase();
    const vectorId = `${finalType}_${normalizedUsername}`;

    // Check if already exists (also check common case variations)
    const caseVariations = [
      `${finalType}_${username}`,
      `${finalType}_${username.toLowerCase()}`,
      `${finalType}_${username.toUpperCase()}`,
      `${finalType}_${username.charAt(0).toUpperCase() + username.slice(1).toLowerCase()}`,
    ];
    const uniqueIds = Array.from(new Set(caseVariations));

    try {
      const existing = await index.namespace(PROFILES_NAMESPACE).fetch(uniqueIds);
      for (const id of uniqueIds) {
        if (existing.records && existing.records[id]) {
          return NextResponse.json({
            message: 'Profile already exists',
            profile: existing.records[id].metadata,
            existed: true,
          });
        }
      }
    } catch {
      // Profile doesn't exist, continue with ingestion
    }

    if (tweets.length === 0) {
      return NextResponse.json(
        { error: 'No tweets found for this user' },
        { status: 400 }
      );
    }

    // Create embeddings
    const textsToEmbed: string[] = [];
    if (user.description) {
      textsToEmbed.push(user.description);
    }
    textsToEmbed.push(...tweets.map((t) => t.text));

    const embeddings = await createEmbeddings(textsToEmbed);

    // Split embeddings
    let bioEmbedding: number[] | null = null;
    let tweetEmbeddings: number[][] = [];

    if (user.description) {
      bioEmbedding = embeddings[0];
      tweetEmbeddings = embeddings.slice(1);
    } else {
      tweetEmbeddings = embeddings;
    }

    // Compute profile embedding
    const profileEmbedding = computeProfileEmbedding(bioEmbedding, tweetEmbeddings);

    // Store all tweets used for embedding (up to 10) for Grok context
    const sampleTweets = tweets.map((t) => t.text.slice(0, 280));

    // Build metadata (no null values)
    const metadata: Record<string, unknown> = {
      type: finalType,
      user_id: user.id,
      username: user.username,
      name: user.name,
      description: (user.description || '').slice(0, 1000),
      follower_count: user.public_metrics?.followers_count || 0,
      following_count: user.public_metrics?.following_count || 0,
      tweet_count: user.public_metrics?.tweet_count || 0,
      verified: user.verified || false,
      indexed_at: new Date().toISOString(),
    };

    if (user.verified_type) metadata.verified_type = user.verified_type;
    if (user.profile_image_url) metadata.profile_image_url = user.profile_image_url;
    if (sampleTweets.length > 0) metadata.sample_tweets = sampleTweets;

    // Upsert profile
    await index.namespace(PROFILES_NAMESPACE).upsert([
      {
        id: vectorId,
        values: profileEmbedding,
        metadata: metadata as Record<string, string | number | boolean | string[]>,
      },
    ]);

    // Also upsert individual tweets for drill-down (if time permits)
    const tweetVectors = tweets.map((tweet, i) => ({
      id: `${user.username}_${tweet.id}`,
      values: tweetEmbeddings[i],
      metadata: {
        post_id: tweet.id,
        text: tweet.text.slice(0, 1000),
        author_id: user.id,
        author_username: user.username,
        author_name: user.name,
        author_followers: user.public_metrics?.followers_count || 0,
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
      } as Record<string, string | number>,
    }));

    await index.namespace(TWEETS_NAMESPACE).upsert(tweetVectors);

    const response: Record<string, unknown> = {
      message: 'Profile ingested successfully',
      profile: metadata,
      tweets_count: tweets.length,
      existed: false,
    };

    // Include validation info if type was auto-corrected
    if (validationResult && finalType !== type) {
      response.autoCorrected = true;
      response.originalType = type;
      response.correctedType = finalType;
      response.validationReasoning = validationResult.reasoning;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ingestion failed' },
      { status: 500 }
    );
  }
}
