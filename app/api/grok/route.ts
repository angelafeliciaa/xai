import { NextRequest, NextResponse } from 'next/server';

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

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
        { error: 'Invalid action. Use "explain_match" or "campaign_brief"' },
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
        model: 'grok-3-fast',
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
