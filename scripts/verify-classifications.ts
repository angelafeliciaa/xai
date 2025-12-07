import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const XAI_API_KEY = process.env.XAI_API_KEY;
const PROFILES_NAMESPACE = 'profiles';

interface ProfileMetadata {
  username: string;
  name: string;
  description: string;
  type: string;
  follower_count: number;
  sample_tweets?: string[];
  verified?: boolean;
  verified_type?: string;
}

interface ClassificationResult {
  username: string;
  name: string;
  currentType: string;
  suggestedType: string;
  confidence: string;
  reasoning: string;
  mismatch: boolean;
}

// Timeout wrapper for fetch
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function classifyWithGrok(profile: ProfileMetadata): Promise<{
  type: 'brand' | 'creator';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}> {
  const tweets = profile.sample_tweets?.slice(0, 5).join('\n- ') || 'No tweets available';

  const prompt = `Analyze this X/Twitter profile and determine if it's a BRAND (company/organization account) or CREATOR (individual person/influencer).

## PROFILE:
Username: @${profile.username}
Display Name: ${profile.name}
Bio: ${profile.description || 'No bio'}
Followers: ${profile.follower_count.toLocaleString()}
Verified: ${profile.verified ? 'Yes' : 'No'}
Verified Type: ${profile.verified_type || 'N/A'}

## SAMPLE TWEETS:
- ${tweets}

## CLASSIFICATION GUIDELINES:
- BRAND: Company accounts, official product/service accounts, organizations, media outlets, sports teams/leagues
- CREATOR: Individual people, influencers, athletes, musicians, actors, content creators, founders (personal accounts)

Note: Personal accounts of founders/CEOs are CREATORS even if they talk about their company.
News organizations and media companies are BRANDS.
Sports leagues (NBA, NFL) are BRANDS. Individual athletes are CREATORS.`;

  const responseSchema = {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['brand', 'creator'],
        description: 'Whether this is a brand or creator account',
      },
      confidence: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'Confidence level in the classification',
      },
      reasoning: {
        type: 'string',
        description: 'Brief explanation for the classification (1-2 sentences)',
      },
    },
    required: ['type', 'confidence', 'reasoning'],
    additionalProperties: false,
  };

  const response = await fetchWithTimeout('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-reasoning',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.1,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'classification_response',
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  }, 60000); // 60 second timeout

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(content);
}

async function getAllProfiles(): Promise<ProfileMetadata[]> {
  const indexName = process.env.PINECONE_INDEX!;
  const index = pinecone.index(indexName);

  // Query with a zero vector to get all profiles (up to 1000)
  const results = await index.namespace(PROFILES_NAMESPACE).query({
    vector: new Array(1536).fill(0),
    topK: 1000,
    includeMetadata: true,
  });

  return (results.matches || []).map((match) => match.metadata as unknown as ProfileMetadata);
}

async function main() {
  const fs = await import('fs');
  const outputPath = './classification-results.json';

  console.log('Fetching all profiles from database...\n');

  const profiles = await getAllProfiles();
  console.log(`Found ${profiles.length} profiles to verify\n`);

  const results: ClassificationResult[] = [];
  const mismatches: ClassificationResult[] = [];

  // Process one at a time to avoid rate limits and handle timeouts gracefully
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];

    try {
      const classification = await classifyWithGrok(profile);

      const result: ClassificationResult = {
        username: profile.username,
        name: profile.name,
        currentType: profile.type,
        suggestedType: classification.type,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        mismatch: profile.type !== classification.type,
      };

      results.push(result);

      if (result.mismatch) {
        mismatches.push(result);
        console.log(`  ⚠️  Mismatch: @${result.username} - ${result.currentType} -> ${result.suggestedType} (${result.confidence})`);
      }
    } catch (error) {
      console.error(`  ❌ Error classifying @${profile.username}:`, error instanceof Error ? error.message : error);
      // Continue with next profile instead of failing
    }

    // Progress update every 10 profiles
    if ((i + 1) % 10 === 0 || i === profiles.length - 1) {
      console.log(`Processed ${i + 1}/${profiles.length} profiles... (${mismatches.length} mismatches found)`);

      // Save partial results every 50 profiles
      if ((i + 1) % 50 === 0) {
        fs.writeFileSync(
          outputPath,
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              status: 'in_progress',
              totalProfiles: profiles.length,
              processedSoFar: results.length,
              correctlyClassified: results.length - mismatches.length,
              mismatches: mismatches,
            },
            null,
            2
          )
        );
        console.log(`  💾 Partial results saved to ${outputPath}`);
      }
    }

    // Small delay between requests to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(80));
  console.log(`Total profiles verified: ${results.length}`);
  console.log(`Correctly classified: ${results.length - mismatches.length}`);
  console.log(`Potential misclassifications: ${mismatches.length}`);

  if (mismatches.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('POTENTIAL MISCLASSIFICATIONS');
    console.log('='.repeat(80));

    // Group by confidence
    const highConfidence = mismatches.filter((m) => m.confidence === 'high');
    const mediumConfidence = mismatches.filter((m) => m.confidence === 'medium');
    const lowConfidence = mismatches.filter((m) => m.confidence === 'low');

    if (highConfidence.length > 0) {
      console.log('\n--- HIGH CONFIDENCE (likely wrong) ---');
      highConfidence.forEach((m) => {
        console.log(`\n@${m.username} (${m.name})`);
        console.log(`  Current: ${m.currentType} -> Suggested: ${m.suggestedType}`);
        console.log(`  Reason: ${m.reasoning}`);
      });
    }

    if (mediumConfidence.length > 0) {
      console.log('\n--- MEDIUM CONFIDENCE (review recommended) ---');
      mediumConfidence.forEach((m) => {
        console.log(`\n@${m.username} (${m.name})`);
        console.log(`  Current: ${m.currentType} -> Suggested: ${m.suggestedType}`);
        console.log(`  Reason: ${m.reasoning}`);
      });
    }

    if (lowConfidence.length > 0) {
      console.log('\n--- LOW CONFIDENCE (borderline cases) ---');
      lowConfidence.forEach((m) => {
        console.log(`\n@${m.username} (${m.name})`);
        console.log(`  Current: ${m.currentType} -> Suggested: ${m.suggestedType}`);
        console.log(`  Reason: ${m.reasoning}`);
      });
    }
  }

  // Output JSON for further processing
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        status: 'complete',
        totalProfiles: results.length,
        correctlyClassified: results.length - mismatches.length,
        mismatches: mismatches,
      },
      null,
      2
    )
  );
  console.log(`\nDetailed results saved to ${outputPath}`);
}

main().catch(console.error);
