import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function GET() {
  try {
    const indexName = process.env.PINECONE_INDEX!;
    const index = pinecone.index(indexName);

    // Get stats from Pinecone
    const stats = await index.describeIndexStats();

    const profilesCount = stats.namespaces?.['profiles']?.recordCount || 0;
    const tweetsCount = stats.namespaces?.['tweets']?.recordCount || 0;

    return NextResponse.json({
      profiles: profilesCount,
      tweets: tweetsCount,
      index: indexName,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { profiles: 0, tweets: 0, error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
