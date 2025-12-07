import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_BASE = 'http://localhost:3000';

// Mix of creators and brands to hit 1000 profiles
const CREATORS = [
  // Tech YouTubers/creators
  'iJustine', 'austinnotduncan', 'UrAvgConsumer', 'DetroitBORG', 'UnboxTherapy',
  'JerryRigEverything', 'LinusTips', 'dave2d', 'JonnyIve', 'raborramosjr',

  // Gaming creators
  'Pokimane', 'Valkyrae', 'Sykkuno', 'Ludwig', 'HasanAbi',
  'xQc', 'Amouranth', 'iblowtitties', 'AdinRoss', 'KaiCenat',

  // Finance/Business creators
  'naval', 'balaborskii', 'ShaanVP', 'Greg_Isenberg', 'ankurnagpal',
  'thesamparr', 'Codie_Sanchez', 'AlexHormozi', 'GaryVee', 'tonystubblebine',

  // Lifestyle/Fashion creators
  'WeWoreWhat', 'ChiaraFerragni', 'SongofStyle', 'ManRepeller', 'BlairEadie',
  'CamilaCoelho', 'NeginMirsalehi', 'RachelZoe', 'OliviaPalermo', 'ChriselleLim',

  // Food/Cooking creators
  'BonAppetitMag', 'halfbakedharvest', 'minimalistbaker', 'smaborgan', 'cocktailchemistry',
  'JoshuaWeissman', 'bababorgo', 'MillyTabitha', 'TheFlexibleChef', 'RecipeTinEats',

  // Fitness creators
  'Blogilates', 'whitneyysimmons', 'NataschaNina', 'SuzieB_Fitness', 'MassyArias',
  'KaylaItsines', 'JeffCavaliere', 'ChloeTing', 'PamelaReif', 'NatachaOceane',

  // Science/Education creators
  'Veritasium', 'smartereveryday', 'MrBeastYT', 'MarkRober', 'TheSloMoGuys',
  'CGPGrey', 'minutephysics', 'Vsauce', 'kuraborta', 'DrMikeVarshavski',

  // Art/Design creators
  'aarondraplint', 'jessicahische', 'sagmeister', 'itsnicethat', 'designmilk',
];

const BRANDS = [
  // Consumer tech brands
  'SpotifyUSA', 'DropboxSupport', 'SlackHQ', 'NotionHQ', 'FigmaDesign',
  'CanvaDesign', 'Airtable', 'Asana', 'Monday', 'Trello',

  // DTC brands
  'Warby_Parker', 'Glossier', 'Everlane', 'Allbirds', 'Casper',
  'AwayTravel', 'Brooklinen', 'Bombas', 'ThirdLove', 'Rothy',

  // Food/Beverage brands
  'DrinkPoppi', 'DrinkOlipop', 'VitalProteins', 'RXBar', 'KindSnacks',
  'HealthAde', 'GTPombacha', 'Spindrift', 'HintWater', 'BodyArmor',
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
    } else if (data.error) {
      console.log(`  ❌ @${username}: ${data.error}`);
    } else {
      const corrected = data.autoCorrected ? ` (auto-corrected to ${data.correctedType})` : '';
      console.log(`  ✅ @${username} ingested as ${data.profile?.type || type}${corrected}`);
    }

    return !data.error;
  } catch (error) {
    console.log(`  ❌ @${username}: ${error instanceof Error ? error.message : 'Failed'}`);
    return false;
  }
}

async function main() {
  console.log('Adding final batch to hit 1000 profiles...\n');

  let added = 0;
  let skipped = 0;
  let failed = 0;

  console.log('--- CREATORS ---\n');
  for (const username of CREATORS) {
    const success = await ingestProfile(username, 'creator');
    if (success) added++;
    else failed++;

    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n--- BRANDS ---\n');
  for (const username of BRANDS) {
    const success = await ingestProfile(username, 'brand');
    if (success) added++;
    else failed++;

    // Rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Added: ${added}, Failed: ${failed}`);
  console.log('Done!');
}

main().catch(console.error);
