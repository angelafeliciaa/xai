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
const PROFILES_NAMESPACE = 'profiles';
const TWEETS_NAMESPACE = 'tweets';
const MAX_TWEETS = 10; // Optimized for Vercel free tier (10s timeout)

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
    const { username, type = 'creator' } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    if (!X_BEARER_TOKEN) {
      return NextResponse.json({ error: 'X API not configured' }, { status: 500 });
    }

    const indexName = process.env.PINECONE_INDEX!;
    const index = pinecone.index(indexName);

    // Check if already exists
    const vectorId = `${type}_${username}`;
    try {
      const existing = await index.namespace(PROFILES_NAMESPACE).fetch([vectorId]);
      if (existing.records && existing.records[vectorId]) {
        return NextResponse.json({
          message: 'Profile already exists',
          profile: existing.records[vectorId].metadata,
          existed: true,
        });
      }
    } catch {
      // Profile doesn't exist, continue with ingestion
    }

    // Fetch user from X
    const user = await fetchXUser(username);

    // Fetch tweets
    const tweets = await fetchXTweets(user.id);

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
      type,
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

    return NextResponse.json({
      message: 'Profile ingested successfully',
      profile: metadata,
      tweets_count: tweets.length,
      existed: false,
    });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ingestion failed' },
      { status: 500 }
    );
  }
}
