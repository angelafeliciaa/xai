import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const PROFILES_NAMESPACE = 'profiles';
const TWEETS_NAMESPACE = 'tweets';

// Wrong accounts to delete (ingested wrong handles)
const WRONG_ACCOUNTS_TO_DELETE = [
  'brand_yeti',      // Dustin Kimmel, not YETI coolers
  'brand_chomps',    // Sofía Figueroa, not CHOMPS snacks
  'brand_datadog',   // "Data" the dog, not Datadog company
  'brand_oura',      // Daouna Jeong, not OURA ring
  'brand_emm4x3',    // Emma (individual), wrongly marked as brand
  'brand_stvnzhn',   // Steven Zhang (individual), wrongly marked as brand
];

// Accounts to reclassify from creator to brand
const RECLASSIFY_TO_BRAND = [
  'creator_mindpump',     // Mind Pump Media - it's a media company
  'creator_naborforce',   // Naborforce - it's a company
  'creator_chefsteps',    // ChefSteps - cooking company
  'creator_bonappetit',   // Bon Appétit - Condé Nast media brand
  'creator_theellenshow', // The Ellen Show - TV show account
];

async function deleteWrongAccounts() {
  const indexName = process.env.PINECONE_INDEX!;
  const index = pinecone.index(indexName);

  console.log('\n--- DELETING WRONG ACCOUNTS ---\n');

  for (const accountId of WRONG_ACCOUNTS_TO_DELETE) {
    try {
      // Try different case variations
      const variations = [
        accountId,
        accountId.toLowerCase(),
        accountId.replace('brand_', 'brand_').toLowerCase(),
      ];

      for (const id of [...new Set(variations)]) {
        try {
          await index.namespace(PROFILES_NAMESPACE).deleteOne(id);
          console.log(`  ✅ Deleted profile: ${id}`);
        } catch {
          // Try uppercase username
          const parts = id.split('_');
          if (parts.length === 2) {
            const upperId = `${parts[0]}_${parts[1].toUpperCase()}`;
            try {
              await index.namespace(PROFILES_NAMESPACE).deleteOne(upperId);
              console.log(`  ✅ Deleted profile: ${upperId}`);
            } catch {
              // Ignore
            }
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ Error deleting ${accountId}:`, error);
    }
  }
}

async function reclassifyAccounts() {
  const indexName = process.env.PINECONE_INDEX!;
  const index = pinecone.index(indexName);

  console.log('\n--- RECLASSIFYING ACCOUNTS (creator -> brand) ---\n');

  for (const oldId of RECLASSIFY_TO_BRAND) {
    try {
      // Try different case variations
      const variations = [oldId, oldId.toLowerCase()];

      for (const id of [...new Set(variations)]) {
        const result = await index.namespace(PROFILES_NAMESPACE).fetch([id]);

        if (result.records && result.records[id]) {
          const record = result.records[id];
          const metadata = record.metadata as Record<string, unknown>;
          const username = metadata.username as string;

          // Create new ID with brand prefix
          const newId = `brand_${username.toLowerCase()}`;

          // Update metadata type
          metadata.type = 'brand';

          // Delete old record
          await index.namespace(PROFILES_NAMESPACE).deleteOne(id);

          // Upsert with new ID and updated metadata
          await index.namespace(PROFILES_NAMESPACE).upsert([{
            id: newId,
            values: record.values as number[],
            metadata: metadata as Record<string, string | number | boolean | string[]>,
          }]);

          console.log(`  ✅ Reclassified @${username}: creator -> brand (${id} -> ${newId})`);
          break;
        }
      }
    } catch (error) {
      console.error(`  ❌ Error reclassifying ${oldId}:`, error);
    }
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('FIXING CLASSIFICATION ISSUES');
  console.log('='.repeat(60));

  await deleteWrongAccounts();
  await reclassifyAccounts();

  console.log('\n' + '='.repeat(60));
  console.log('FIX COMPLETE');
  console.log('='.repeat(60));
  console.log('\nNote: You may want to re-ingest the correct accounts:');
  console.log('  - @YETICoolers (instead of @yeti)');
  console.log('  - @datadoghq (instead of @datadog)');
  console.log('  - @ouraring (instead of @oura)');
  console.log('  - CHOMPS official handle');
}

main().catch(console.error);
