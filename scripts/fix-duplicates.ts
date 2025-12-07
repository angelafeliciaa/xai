import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const PROFILES_NAMESPACE = 'profiles';

async function findAndFixDuplicates() {
  const indexName = process.env.PINECONE_INDEX!;
  const index = pinecone.index(indexName);

  console.log('Fetching all profiles to check for duplicates...\n');

  // Query with a zero vector to get all profiles
  const results = await index.namespace(PROFILES_NAMESPACE).query({
    vector: new Array(1536).fill(0),
    topK: 1000,
    includeMetadata: true,
  });

  const profiles = results.matches || [];
  console.log(`Found ${profiles.length} profiles\n`);

  // Group by lowercase username
  const usernameMap = new Map<string, { id: string; metadata: Record<string, unknown> }[]>();

  for (const profile of profiles) {
    const metadata = profile.metadata as Record<string, unknown>;
    const username = (metadata.username as string || '').toLowerCase();

    if (!usernameMap.has(username)) {
      usernameMap.set(username, []);
    }
    usernameMap.get(username)!.push({
      id: profile.id,
      metadata,
    });
  }

  // Find duplicates
  const duplicates: { username: string; entries: { id: string; metadata: Record<string, unknown> }[] }[] = [];

  for (const [username, entries] of usernameMap) {
    if (entries.length > 1) {
      duplicates.push({ username, entries });
    }
  }

  if (duplicates.length === 0) {
    console.log('No duplicates found!');
    return;
  }

  console.log(`Found ${duplicates.length} usernames with duplicate entries:\n`);

  for (const dup of duplicates) {
    console.log(`@${dup.username}:`);
    for (const entry of dup.entries) {
      console.log(`  - ${entry.id} (type: ${entry.metadata.type}, followers: ${entry.metadata.follower_count})`);
    }

    // Keep the entry with the normalized ID format (type_username in lowercase)
    // Delete the others
    const expectedId = `${dup.entries[0].metadata.type}_${dup.username}`;
    const toDelete = dup.entries.filter(e => e.id !== expectedId).map(e => e.id);

    if (toDelete.length > 0) {
      console.log(`  Deleting: ${toDelete.join(', ')}`);
      for (const id of toDelete) {
        try {
          await index.namespace(PROFILES_NAMESPACE).deleteOne(id);
          console.log(`  ✅ Deleted ${id}`);
        } catch (error) {
          console.error(`  ❌ Error deleting ${id}:`, error);
        }
      }
    }
    console.log('');
  }

  console.log('Duplicate cleanup complete!');
}

findAndFixDuplicates().catch(console.error);
