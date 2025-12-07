import { NextRequest, NextResponse } from 'next/server';

const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;
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
