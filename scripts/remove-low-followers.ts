import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const PROFILES_NAMESPACE = 'profiles';
const TWEETS_NAMESPACE = 'tweets';
const MIN_FOLLOWERS = 1000;

interface ProfileMetadata {
  type: string;
  username: string;
  name: string;
  follower_count: number;
  user_id: string;
}

async function main() {
  console.log(`Removing creators with less than ${MIN_FOLLOWERS} followers...\n`);

  const indexName = process.env.PINECONE_INDEX!;
  const index = pinecone.index(indexName);

  // Query all profiles - we need to use list() to get all IDs
  const profilesNs = index.namespace(PROFILES_NAMESPACE);
  const tweetsNs = index.namespace(TWEETS_NAMESPACE);

  // List all vector IDs in profiles namespace
  const allIds: string[] = [];
  let paginationToken: string | undefined;

  console.log('Fetching all profile IDs...');
  do {
    const listResult = await profilesNs.listPaginated({
      limit: 100,
      paginationToken,
    });

    if (listResult.vectors) {
      allIds.push(...listResult.vectors.map(v => v.id));
    }
    paginationToken = listResult.pagination?.next;
  } while (paginationToken);

  console.log(`Found ${allIds.length} total profiles\n`);

  // Fetch metadata for all profiles in batches
  const batchSize = 100;
  const toDelete: { id: string; username: string; followers: number }[] = [];
  const toKeep: { id: string; username: string; followers: number }[] = [];

  for (let i = 0; i < allIds.length; i += batchSize) {
    const batch = allIds.slice(i, i + batchSize);
    const fetchResult = await profilesNs.fetch(batch);

    for (const [id, record] of Object.entries(fetchResult.records || {})) {
      const metadata = record.metadata as unknown as ProfileMetadata;

      // Only check creators, not brands
      if (metadata.type === 'creator' && metadata.follower_count < MIN_FOLLOWERS) {
        toDelete.push({
          id,
          username: metadata.username,
          followers: metadata.follower_count,
        });
      } else {
        toKeep.push({
          id,
          username: metadata.username,
          followers: metadata.follower_count,
        });
      }
    }

    if ((i + batchSize) % 500 === 0 || i + batchSize >= allIds.length) {
      console.log(`Checked ${Math.min(i + batchSize, allIds.length)}/${allIds.length} profiles...`);
    }
  }

  console.log(`\nFound ${toDelete.length} creators with < ${MIN_FOLLOWERS} followers to remove:`);

  if (toDelete.length === 0) {
    console.log('No profiles to remove.');
    return;
  }

  // Show what will be deleted
  console.log('\nProfiles to delete:');
  toDelete.sort((a, b) => a.followers - b.followers);
  for (const p of toDelete) {
    console.log(`  @${p.username} - ${p.followers} followers`);
  }

  console.log(`\nDeleting ${toDelete.length} profiles...`);

  // Delete from profiles namespace
  const profileIdsToDelete = toDelete.map(p => p.id);
  await profilesNs.deleteMany(profileIdsToDelete);
  console.log(`  Deleted ${profileIdsToDelete.length} profile vectors`);

  // Delete associated tweets
  // Tweets are stored with IDs like: username_tweetId
  // We need to list and delete by prefix
  let deletedTweets = 0;
  for (const profile of toDelete) {
    const prefix = `${profile.username}_`;
    let tweetPaginationToken: string | undefined;
    const tweetIds: string[] = [];

    do {
      const listResult = await tweetsNs.listPaginated({
        prefix,
        limit: 100,
        paginationToken: tweetPaginationToken,
      });

      if (listResult.vectors) {
        tweetIds.push(...listResult.vectors.map(v => v.id));
      }
      tweetPaginationToken = listResult.pagination?.next;
    } while (tweetPaginationToken);

    if (tweetIds.length > 0) {
      await tweetsNs.deleteMany(tweetIds);
      deletedTweets += tweetIds.length;
    }
  }
  console.log(`  Deleted ${deletedTweets} tweet vectors`);

  console.log('\n' + '='.repeat(60));
  console.log('CLEANUP COMPLETE');
  console.log('='.repeat(60));
  console.log(`Removed: ${toDelete.length} profiles, ${deletedTweets} tweets`);
  console.log(`Remaining: ${toKeep.length} profiles`);
}

main().catch(console.error);
