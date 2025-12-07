import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const PROFILES_NAMESPACE = 'profiles';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const minFollowers = searchParams.get('min_followers');
    const verifiedOnly = searchParams.get('verified') === 'true';

    const indexName = process.env.PINECONE_INDEX || 'ugc-creators';
    const index = pinecone.index(indexName);

    // Build filter for creators
    const filter: Record<string, unknown> = { type: 'creator' };
    if (minFollowers) {
      filter.follower_count = { $gte: parseInt(minFollowers) };
    }
    if (verifiedOnly) {
      filter.verified = true;
    }

    // Use a zero vector to fetch all creators (Pinecone requires a vector for query)
    // We'll use list() instead if available, or query with a dummy vector
    const results = await index.namespace(PROFILES_NAMESPACE).query({
      vector: new Array(1536).fill(0), // Zero vector for listing
      topK: 100,
      includeMetadata: true,
      filter,
    });

    // Sort by follower count descending
    const creators = (results.matches || [])
      .map((match) => match.metadata)
      .filter((m) => m !== undefined)
      .sort((a, b) => {
        const aCount = (a?.follower_count as number) || 0;
        const bCount = (b?.follower_count as number) || 0;
        return bCount - aCount;
      });

    return NextResponse.json({
      creators,
      count: creators.length,
    });
  } catch (error) {
    console.error('List creators error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list creators' },
      { status: 500 }
    );
  }
}
