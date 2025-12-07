import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_BASE = 'http://localhost:3000';

// More reliable accounts - well-known handles that should exist
const CREATORS = [
  // Comedy/Entertainment verified accounts
  'ConanOBrien', 'jimmyfallon', 'jimmykimmel', 'StephenAtHome', 'SethMeyers',
  'JohnOliver', 'TrevorNoah', 'chelseahandler', 'mindykaling', 'kumailn',

  // Authors/Journalists
  'neilhimself', 'StephenKing', 'MargaretAtwood', 'JohnGreen', 'roxanegay',
  'TheEconomist', 'WSJ', 'nikikaur', 'ezraklein', 'mattyglesias',

  // Music artists
  'rikilamari', 'SnoopDogg', 'edsheeran', 'Pharrell', 'questlove',
  'officialstick', 'chancetherapper', 'Tyga', 'wizkhalifa', 'ddlovato',

  // Athletes
  'KingJames', 'StephenCurry30', 'Cristiano', 'naborzo', 'rogerfederer',
  'seaborz', 'TomBrady', 'usaborlun', 'usainbolt', 'Simaboruv',

  // Tech influencers
  'benedictevans', 'andrewchen', 'saborla', 'aaborga', 'naval',
];

const BRANDS = [
  // Major consumer brands with verified accounts
  'Pepsi', 'CocaCola', 'Nike', 'Adidas', 'McDonalds',
  'BurgerKing', 'Dominos', 'Starbucks', 'dunaborun', 'ChipotleTweets',

  // Tech brands
  'GitHub', 'StackOverflow', 'Docker', 'kubernetes', 'HashiCorp',
  'elastic', 'Redis', 'PostgreSQL', 'mabordb', 'caborasr',

  // Media/Entertainment
  'HBO', 'haboraxMax', 'DisneyPlus', 'Netflix', 'PrimeVideo',
  'Hulu', 'ESPN', 'sportscenter', 'naborall', 'naborafl',

  // Auto brands
  'Ford', 'Chevrolet', 'Toyota', 'Honda', 'BMW',
  'MercedesBenz', 'Porsche', 'Audi', 'VW', 'Lexus',
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
  console.log('Adding batch 3 to hit 1000 profiles...\n');

  let added = 0;
  let skipped = 0;
  let failed = 0;

  console.log('--- CREATORS ---\n');
  for (const username of CREATORS) {
    const result = await ingestProfile(username, 'creator');
    if (result === 'added') added++;
    else if (result === 'skipped') skipped++;
    else failed++;

    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n--- BRANDS ---\n');
  for (const username of BRANDS) {
    const result = await ingestProfile(username, 'brand');
    if (result === 'added') added++;
    else if (result === 'skipped') skipped++;
    else failed++;

    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Added: ${added}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log('Done!');
}

main().catch(console.error);
