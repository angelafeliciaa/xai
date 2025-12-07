import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pinecone.index(process.env.PINECONE_INDEX!);

const NEW_RECLASSIFY = [
  'creator_complex',
];

async function main() {
  console.log('Reclassifying new batch (creator -> brand)...\n');

  for (const oldId of NEW_RECLASSIFY) {
    try {
      const result = await index.namespace('profiles').fetch([oldId]);
      if (result.records && result.records[oldId]) {
        const record = result.records[oldId];
        const metadata = record.metadata as Record<string, unknown>;
        const username = metadata.username as string;
        const newId = `brand_${username.toLowerCase()}`;

        metadata.type = 'brand';
        await index.namespace('profiles').deleteOne(oldId);
        await index.namespace('profiles').upsert([{
          id: newId,
          values: record.values as number[],
          metadata: metadata as Record<string, string | number | boolean | string[]>,
        }]);
        console.log(`✅ @${username}: creator -> brand`);
      }
    } catch (error) {
      console.error(`❌ Error with ${oldId}:`, error);
    }
  }
  console.log('\nDone!');
}

main();
