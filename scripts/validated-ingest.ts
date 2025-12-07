import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;
const XAI_API_KEY = process.env.XAI_API_KEY;

interface AccountToIngest {
  username: string;
  expectedType: 'brand' | 'creator';
  description?: string; // Optional note about who this should be
}

// Accounts to ingest with validation
const ACCOUNTS: AccountToIngest[] = [
  { username: 'xai', expectedType: 'brand', description: 'xAI - AI company founded by Elon Musk' },
  { username: 'x', expectedType: 'brand', description: 'X (formerly Twitter) - social media platform' },
  { username: 'parsatajik', expectedType: 'creator', description: 'Parsa Tajik - individual creator' },
];

interface XProfile {
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
}

interface XTweet {
  text: string;
}

async function fetchProfile(username: string): Promise<XProfile | null> {
  try {
    const userFields = 'id,name,username,description,public_metrics,verified,verified_type';
    const response = await fetch(
      `https://api.x.com/2/users/by/username/${username}?user.fields=${userFields}`,
      { headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` } }
    );

    if (!response.ok) {
      console.error(`  Failed to fetch @${username}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error(`  Error fetching @${username}:`, error);
    return null;
  }
}

async function fetchTweets(userId: string): Promise<XTweet[]> {
  try {
    const response = await fetch(
      `https://api.x.com/2/users/${userId}/tweets?tweet.fields=text&max_results=10&exclude=replies,retweets`,
      { headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` } }
    );

    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function validateWithGrok(
  profile: XProfile,
  tweets: XTweet[],
  expectedType: 'brand' | 'creator'
): Promise<{ valid: boolean; suggestedType: string; confidence: string; reasoning: string }> {
  const tweetText = tweets.slice(0, 5).map(t => t.text).join('\n- ') || 'No tweets available';

  const prompt = `Analyze this X/Twitter profile and determine if it's a BRAND (company/organization) or CREATOR (individual person).

## PROFILE:
Username: @${profile.username}
Display Name: ${profile.name}
Bio: ${profile.description || 'No bio'}
Followers: ${profile.public_metrics?.followers_count?.toLocaleString() || 0}
Verified: ${profile.verified ? 'Yes' : 'No'}
Verified Type: ${profile.verified_type || 'N/A'}

## SAMPLE TWEETS:
- ${tweetText}

## CLASSIFICATION GUIDELINES:
- BRAND: Company accounts, official product/service accounts, organizations, media outlets
- CREATOR: Individual people, influencers, founders (personal accounts)

Note: Personal accounts of founders/CEOs are CREATORS even if they talk about their company.`;

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
      console.error(`  Grok API error: ${response.status}`);
      return { valid: false, suggestedType: 'unknown', confidence: 'low', reasoning: 'API error' };
    }

    const data = await response.json();
    const result = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    return {
      valid: result.type === expectedType,
      suggestedType: result.type,
      confidence: result.confidence,
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('  Grok validation error:', error);
    return { valid: false, suggestedType: 'unknown', confidence: 'low', reasoning: 'Validation failed' };
  }
}

async function ingestProfile(
  username: string,
  type: 'brand' | 'creator'
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, type }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || 'Failed' };
    }

    return { success: true, message: data.existed ? 'Already exists' : 'Ingested successfully' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Error' };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('VALIDATED INGESTION - Pre-verifying accounts before ingesting');
  console.log('='.repeat(70));
  console.log('');

  const results = {
    ingested: [] as string[],
    skipped: [] as { username: string; reason: string }[],
    failed: [] as { username: string; reason: string }[],
  };

  for (const account of ACCOUNTS) {
    console.log(`\n--- Processing @${account.username} (expected: ${account.expectedType}) ---`);
    if (account.description) {
      console.log(`  Note: ${account.description}`);
    }

    // Step 1: Fetch profile
    console.log('  1. Fetching profile from X API...');
    const profile = await fetchProfile(account.username);

    if (!profile) {
      console.log('  ❌ Could not fetch profile');
      results.failed.push({ username: account.username, reason: 'Profile fetch failed' });
      continue;
    }

    console.log(`     Name: ${profile.name}`);
    console.log(`     Followers: ${profile.public_metrics?.followers_count?.toLocaleString() || 0}`);
    console.log(`     Verified: ${profile.verified ? 'Yes' : 'No'} (${profile.verified_type || 'N/A'})`);

    // Step 2: Fetch sample tweets
    console.log('  2. Fetching sample tweets...');
    const tweets = await fetchTweets(profile.id);
    console.log(`     Found ${tweets.length} tweets`);

    // Step 3: Validate with Grok
    console.log('  3. Validating classification with Grok...');
    const validation = await validateWithGrok(profile, tweets, account.expectedType);

    console.log(`     Grok says: ${validation.suggestedType} (${validation.confidence} confidence)`);
    console.log(`     Reasoning: ${validation.reasoning}`);

    if (!validation.valid) {
      console.log(`  ⚠️  MISMATCH: Expected ${account.expectedType}, Grok suggests ${validation.suggestedType}`);
      console.log('  ⏭️  Skipping ingestion to prevent misclassification');
      results.skipped.push({
        username: account.username,
        reason: `Expected ${account.expectedType} but Grok classified as ${validation.suggestedType}: ${validation.reasoning}`,
      });
      continue;
    }

    // Step 4: Ingest (validation passed)
    console.log('  4. Validation passed! Ingesting...');
    const ingestResult = await ingestProfile(account.username, account.expectedType);

    if (ingestResult.success) {
      console.log(`  ✅ ${ingestResult.message}`);
      results.ingested.push(account.username);
    } else {
      console.log(`  ❌ ${ingestResult.message}`);
      results.failed.push({ username: account.username, reason: ingestResult.message });
    }

    // Rate limit delay
    await new Promise((r) => setTimeout(r, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Ingested (${results.ingested.length}): ${results.ingested.join(', ') || 'none'}`);
  console.log(`⏭️  Skipped (${results.skipped.length}):`);
  results.skipped.forEach((s) => console.log(`   - @${s.username}: ${s.reason}`));
  console.log(`❌ Failed (${results.failed.length}):`);
  results.failed.forEach((f) => console.log(`   - @${f.username}: ${f.reason}`));
  console.log('='.repeat(70));
}

main().catch(console.error);
