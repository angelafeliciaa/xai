import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const PROFILES_NAMESPACE = 'profiles';

interface ProfileMetadata {
  username: string;
  name: string;
  type: string;
  follower_count: number;
}

async function main() {
  console.log('Checking for duplicate profiles...\n');

  const indexName = process.env.PINECONE_INDEX!;
  const index = pinecone.index(indexName);
  const profilesNs = index.namespace(PROFILES_NAMESPACE);

  // List all vector IDs
  const allIds: string[] = [];
  let paginationToken: string | undefined;

  console.log('Fetching all profile IDs...');
  do {
    const listResult = await profilesNs.listPaginated({
      limit: 100,
      paginationToken,
    });

    if (listResult.vectors) {
      allIds.push(...listResult.vectors.map(v => v.id).filter((id): id is string => id !== undefined));
    }
    paginationToken = listResult.pagination?.next;
  } while (paginationToken);

  console.log(`Found ${allIds.length} total profile vectors\n`);

  // Fetch metadata for all profiles in batches
  const batchSize = 100;
  const usernameToIds: Map<string, { id: string; type: string; name: string; followers: number }[]> = new Map();

  for (let i = 0; i < allIds.length; i += batchSize) {
    const batch = allIds.slice(i, i + batchSize);
    const fetchResult = await profilesNs.fetch(batch);

    for (const [id, record] of Object.entries(fetchResult.records || {})) {
      const metadata = record.metadata as unknown as ProfileMetadata;
      const usernameLower = metadata.username?.toLowerCase();

      if (!usernameLower) continue;

      if (!usernameToIds.has(usernameLower)) {
        usernameToIds.set(usernameLower, []);
      }
      usernameToIds.get(usernameLower)!.push({
        id,
        type: metadata.type,
        name: metadata.name,
        followers: metadata.follower_count,
      });
    }

    if ((i + batchSize) % 500 === 0 || i + batchSize >= allIds.length) {
      console.log(`Checked ${Math.min(i + batchSize, allIds.length)}/${allIds.length} profiles...`);
    }
  }

  // Find duplicates
  const duplicates: { username: string; entries: { id: string; type: string; name: string; followers: number }[] }[] = [];

  for (const [username, entries] of usernameToIds) {
    if (entries.length > 1) {
      duplicates.push({ username, entries });
    }
  }

  // Report results
  console.log('\n' + '='.repeat(60));
  console.log('DUPLICATE CHECK RESULTS');
  console.log('='.repeat(60));
  console.log(`Total unique usernames: ${usernameToIds.size}`);
  console.log(`Duplicate usernames found: ${duplicates.length}`);

  if (duplicates.length > 0) {
    console.log('\n--- DUPLICATES ---\n');
    for (const dup of duplicates) {
      console.log(`@${dup.username}:`);
      for (const entry of dup.entries) {
        console.log(`  - ID: ${entry.id}`);
        console.log(`    Type: ${entry.type}, Name: ${entry.name}, Followers: ${entry.followers}`);
      }
      console.log();
    }

    // Suggest cleanup
    console.log('--- SUGGESTED CLEANUP ---\n');
    console.log('IDs to delete (keeping higher follower count or brand type):');
    const toDelete: string[] = [];

    for (const dup of duplicates) {
      // Sort by: brand first, then by follower count
      const sorted = [...dup.entries].sort((a, b) => {
        if (a.type === 'brand' && b.type !== 'brand') return -1;
        if (b.type === 'brand' && a.type !== 'brand') return 1;
        return b.followers - a.followers;
      });

      // Keep the first one, delete the rest
      const keep = sorted[0];
      const deleteEntries = sorted.slice(1);

      console.log(`@${dup.username}: Keep ${keep.id} (${keep.type}, ${keep.followers} followers)`);
      for (const d of deleteEntries) {
        console.log(`  Delete: ${d.id}`);
        toDelete.push(d.id);
      }
    }

    if (toDelete.length > 0) {
      console.log(`\nTotal IDs to delete: ${toDelete.length}`);
      console.log('\nRun with --fix flag to delete duplicates');

      // Check if --fix flag is passed
      if (process.argv.includes('--fix')) {
        console.log('\nDeleting duplicates...');
        await profilesNs.deleteMany(toDelete);
        console.log(`Deleted ${toDelete.length} duplicate profiles`);
      }
    }
  } else {
    console.log('\nNo duplicates found! Database is clean.');
  }
}

main().catch(console.error);
