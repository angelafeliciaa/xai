import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const PROFILES_NAMESPACE = 'profiles';

export async function GET() {
  try {
    const indexName = process.env.PINECONE_INDEX!;
    const index = pinecone.index(indexName);

    // Get stats from Pinecone
    const stats = await index.describeIndexStats();

    const profilesCount = stats.namespaces?.['profiles']?.recordCount || 0;
    const tweetsCount = stats.namespaces?.['tweets']?.recordCount || 0;

    // Count brands and creators
    let brandsCount = 0;
    let creatorsCount = 0;

    // Query with high topK to get all profiles and count by type
    const allProfiles = await index.namespace(PROFILES_NAMESPACE).query({
      vector: new Array(1536).fill(0),
      topK: 200,
      includeMetadata: true,
    });

    if (allProfiles.matches) {
      for (const match of allProfiles.matches) {
        if (match.metadata?.type === 'brand') brandsCount++;
        else if (match.metadata?.type === 'creator') creatorsCount++;
      }
    }

    return NextResponse.json({
      profiles: profilesCount,
      tweets: tweetsCount,
      brands: brandsCount,
      creators: creatorsCount,
      index: indexName,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { profiles: 0, tweets: 0, brands: 0, creators: 0, error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
