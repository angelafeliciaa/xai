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
      systemPrompt = `You are an expert brand-creator matchmaking analyst. Your job is to explain why a creator is a good match for a brand based on their content style, audience, and voice alignment. Be concise, insightful, and specific. Focus on actionable insights.`;

      userPrompt = `Explain why ${creator.name} (@${creator.username}) is a ${Math.round(matchScore * 100)}% match for ${brand.name} (@${brand.username}).

Brand Info:
- Name: ${brand.name}
- Bio: ${brand.description || 'No bio available'}
- Followers: ${formatFollowers(brand.follower_count)}

Creator Info:
- Name: ${creator.name}
- Bio: ${creator.description || 'No bio available'}
- Followers: ${formatFollowers(creator.follower_count)}
${creator.sample_tweets?.length ? `- Sample tweets:\n${creator.sample_tweets.slice(0, 3).map((t: string) => `  "${t}"`).join('\n')}` : ''}

Provide a 2-3 sentence explanation of why this creator's content style and audience align with the brand. Be specific about the content themes and voice that make them compatible.`;
    } else if (action === 'campaign_brief') {
      systemPrompt = `You are a creative strategist specializing in influencer marketing campaigns. Generate concise, actionable campaign briefs that leverage the unique strengths of both brand and creator.`;

      userPrompt = `Generate a campaign brief for a partnership between ${brand.name} and ${creator.name}.

Brand: ${brand.name} (@${brand.username})
- Bio: ${brand.description || 'No bio'}
- Followers: ${formatFollowers(brand.follower_count)}

Creator: ${creator.name} (@${creator.username})
- Bio: ${creator.description || 'No bio'}
- Followers: ${formatFollowers(creator.follower_count)}
${creator.sample_tweets?.length ? `- Recent content themes:\n${creator.sample_tweets.slice(0, 3).map((t: string) => `  "${t}"`).join('\n')}` : ''}

${matchingTweets?.length ? `Most relevant creator tweets for this brand:\n${matchingTweets.slice(0, 3).map((t: { text: string }) => `- "${t.text}"`).join('\n')}` : ''}

Generate a brief campaign proposal with:
1. **Campaign Concept** (1-2 sentences)
2. **Content Ideas** (3 bullet points)
3. **Key Messages** (2-3 talking points)
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
        max_tokens: 500,
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
