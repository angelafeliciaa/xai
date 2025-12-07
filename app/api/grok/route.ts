import { NextRequest, NextResponse } from 'next/server';

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;
const X_API_URL = 'https://api.x.com/2/users/by/username/';
const USERFIELDS = "public_metrics"

interface ProfileData {
  name: string;
  username: string;
  description?: string;
  follower_count: number;
  sample_tweets?: string[];
}

export async function POST(request: NextRequest) {
  if (!XAI_API_KEY) {
    return NextResponse.json(
      { error: 'XAI_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { action, brand, creator, matchScore, matchingTweets } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const engagement = await fetch(
      `https://api.x.com/2/users/by/username/${creator.username}?user.fields=${USERFIELDS}`,
      {
        headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` },
      }
    );
  
    if (!engagement.ok) {
      throw new Error(`X API error: ${engagement.status}`);
    }
  
    const engagementData = await engagement.json();
    if (!engagementData.data) {
      throw new Error(`User not found: ${creator.username}`);
    }  

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'explain_match') {
      systemPrompt = `You are an expert brand-creator matchmaking analyst. Your job is to explain why a creator is a good match for a brand based on their actual content, voice, and audience alignment. Analyze the sample tweets to identify specific themes, tone, and topics that make them compatible. Be concise, insightful, and specific.`;

      // Format tweets with numbering for clarity
      const formatTweets = (tweets: string[] | undefined, limit = 10) => {
        if (!tweets?.length) return 'No tweets available';
        return tweets.slice(0, limit).map((t: string, i: number) => `  ${i + 1}. "${t}"`).join('\n');
      };

      userPrompt = `Analyze why ${creator.name} (@${creator.username}) is a ${Math.round(matchScore * 100)}% match for ${brand.name} (@${brand.username}).

## BRAND: ${brand.name} (@${brand.username})
Bio: ${brand.description || 'No bio available'}
Followers: ${formatFollowers(brand.follower_count)}
Recent tweets:
${formatTweets(brand.sample_tweets)}

## CREATOR: ${creator.name} (@${creator.username})
Bio: ${creator.description || 'No bio available'}
Followers: ${formatFollowers(creator.follower_count)}
Recent tweets:
${formatTweets(creator.sample_tweets)}

Based on analyzing both their actual tweet content, provide a 2-3 sentence explanation of:
1. What specific content themes/topics they share
2. How their voice and tone align
3. Why this creator would authentically represent this brand`;
    } else if (action === 'predict_performance') {
      systemPrompt = `You are a data-driven influencer marketing analyst specializing in campaign performance prediction. Analyze creator and brand data to provide realistic performance predictions with clear reasoning. Base predictions on follower count, engagement patterns, content alignment, and audience demographics.`;

      const formatTweets = (tweets: string[] | undefined, limit = 10) => {
        if (!tweets?.length) return 'No tweets available';
        return tweets.slice(0, limit).map((t: string, i: number) => `  ${i + 1}. "${t}"`).join('\n');
      };

      userPrompt = `Predict campaign performance for ${creator.name} (@${creator.username}) promoting ${brand.name} (@${brand.username}).

## BRAND: ${brand.name} (@${brand.username})
Bio: ${brand.description || 'No bio available'}
Followers: ${formatFollowers(brand.follower_count)}
Recent tweets:
${formatTweets(brand.sample_tweets)}

## CREATOR: ${creator.name} (@${creator.username})
Bio: ${creator.description || 'No bio available'}
Followers: ${formatFollowers(creator.follower_count)}
Recent tweets:
${formatTweets(creator.sample_tweets)}

Match Score: ${Math.round(matchScore * 100)}%

The user's engagement rate is: ${engagementData}

Provide realistic predictions in this EXACT format:

**PREDICTIONS**
- CTR: [X.X]%
- Engagement Rate: [X.X]%
- Conversion Rate: [X.X]%
- Estimated Reach: [number]

**REASONING**
[2-3 sentences explaining why these numbers make sense based on the data]

**RISKS**
[1-2 sentences on potential concerns or misalignments]

**CONFIDENCE**
[High/Medium/Low] - [why]`;
    } else if (action === 'campaign_brief') {
      systemPrompt = `You are a creative strategist specializing in influencer marketing campaigns. Analyze the brand and creator's actual content to generate authentic, tailored campaign briefs that leverage their unique voices and shared themes.`;

      // Format tweets with numbering
      const formatTweets = (tweets: string[] | undefined, limit = 10) => {
        if (!tweets?.length) return 'No tweets available';
        return tweets.slice(0, limit).map((t: string, i: number) => `  ${i + 1}. "${t}"`).join('\n');
      };

      userPrompt = `Generate a campaign brief for a partnership between ${brand.name} and ${creator.name}.

## BRAND: ${brand.name} (@${brand.username})
Bio: ${brand.description || 'No bio'}
Followers: ${formatFollowers(brand.follower_count)}
Recent brand tweets:
${formatTweets(brand.sample_tweets)}

## CREATOR: ${creator.name} (@${creator.username})
Bio: ${creator.description || 'No bio'}
Followers: ${formatFollowers(creator.follower_count)}
Recent creator tweets:
${formatTweets(creator.sample_tweets)}

${matchingTweets?.length ? `## MOST RELEVANT TWEETS (highest semantic match to brand):\n${matchingTweets.slice(0, 5).map((t: { text: string }, i: number) => `${i + 1}. "${t.text}"`).join('\n')}` : ''}

Based on analyzing their actual content, generate a campaign proposal that feels authentic to both voices:

1. **Campaign Concept** (1-2 sentences - reference specific themes from their tweets)
2. **Content Ideas** (3 bullet points - inspired by creator's actual content style)
3. **Key Messages** (2-3 talking points - align brand values with creator voice)
4. **Expected Outcome** (1 sentence)

Keep it concise and actionable.`;
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "explain_match", "predict_performance", or "campaign_brief"' },
        { status: 400 }
      );
    }

    const response = await fetch(XAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-reasoning',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Grok API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate response from Grok' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from Grok' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content,
      model: data.model,
      usage: data.usage,
    });
  } catch (error) {
    console.error('Grok API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}
