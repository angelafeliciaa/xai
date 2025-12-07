import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_BASE = 'http://localhost:3000';

// High-success-rate accounts - verified popular handles
const CREATORS = [
  // Top verified creators
  'oliviarodrigo', 'LIZZO', 'jackharlow', 'Giveon', 'billieeilish',
  'halsey', 'ArianaGrande', 'SelenaGomez', 'justinbieber', 'KendallJenner',
  'khloekardashian', 'KimKardashian', 'kikipalmer', 'MileyCyrus', 'nickjonas',
  'zaaborla', 'haabornn', 'shaborza', 'raborpatz', 'zendaya',
];

const BRANDS = [
  // Major retail/consumer brands
  'bestbuy', 'GameStop', 'Lowes', 'HomeDepot', 'Sephora',
  'ULTA_Beauty', 'WalmartInc', 'amazon', 'eBay', 'etsy',

  // Food/restaurant chains
  'TacoBell', 'KFC', 'PizzaHut', 'PapaJohns', 'LittleCaesars',
  'Chilis', 'Applebees', 'IHOP', 'DennysDiner', 'OliveGarden',

  // Entertainment/Sports
  'NFL', 'NBA', 'MLB', 'NHL', 'MLS',
  'UFC', 'WWE', 'NASCAR', 'PGA', 'ESPN',
];

async function ingestProfile(username: string, type: 'creator' | 'brand') {
  try {
    const response = await fetch(`${API_BASE}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, type }),
    });

    const data = await response.json();

    if (data.existed) {
      console.log(`  ⏭️  @${username} already exists`);
      return 'skipped';
    } else if (data.error) {
      console.log(`  ❌ @${username}: ${data.error}`);
      return 'failed';
    } else {
      const corrected = data.autoCorrected ? ` (auto-corrected to ${data.correctedType})` : '';
      console.log(`  ✅ @${username} ingested as ${data.profile?.type || type}${corrected}`);
      return 'added';
    }
  } catch (error) {
    console.log(`  ❌ @${username}: ${error instanceof Error ? error.message : 'Failed'}`);
    return 'failed';
  }
}

async function main() {
  console.log('Adding batch 4 to hit 1000 profiles...\n');

  let added = 0;
  let skipped = 0;
  let failed = 0;

  console.log('--- CREATORS ---\n');
  for (const username of CREATORS) {
    const result = await ingestProfile(username, 'creator');
    if (result === 'added') added++;
    else if (result === 'skipped') skipped++;
    else failed++;

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n--- BRANDS ---\n');
  for (const username of BRANDS) {
    const result = await ingestProfile(username, 'brand');
    if (result === 'added') added++;
    else if (result === 'skipped') skipped++;
    else failed++;

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Added: ${added}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log('Done!');
}

main().catch(console.error);
