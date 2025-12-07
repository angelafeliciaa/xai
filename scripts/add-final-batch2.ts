import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_BASE = 'http://localhost:3000';

// More reliable accounts to hit 1000 profiles (need ~65 more)
const CREATORS = [
  // Tech entrepreneurs
  'dhh', 'levelsio', 'paborojd', 'jasonfried', 'rrhoover',
  'saborskij', 'sama', 'paulg', 'vaborlei', 'maborla',

  // Popular podcasters/YouTubers
  'h3h3productions', 'TheKidMero', 'JRichardson', 'benthompson', 'stratechery',
  'kevinroose', 'taylorlorenz', 'raborta', 'MattWolfe', 'AllieMiller',

  // Verified influencers with high engagement
  'JayAborza', 'JColeNC', 'JID', 'VinceStaples', 'tylerthecreator',
  'FrankOcean', 'SZA', 'TheWeeknd', 'PostMalone', 'LilNasX',

  // Sports personalities
  'stephenasmith', 'PatMcAfeeShow', 'ShamsCharania', 'wojespn', 'AdamSchefter',
  'RapSheet', 'JeffPassan', 'JoshPriceless', 'KendrickPerkins', 'RichardJefferson',

  // Comedy/Entertainment
  'Afroman', 'kevinhart4real', 'RealTracyMorgan', 'SHLOBONIK', 'iamcardib',
];

const BRANDS = [
  // Fortune 500 with active X presence
  'united', 'delta', 'JetBlue', 'SouthwestAir', 'Marriott',
  'Hilton', 'Hyatt', 'Airbnb', 'Expedia', 'Uber',

  // Tech companies
  'Stripe', 'Twilio', 'Cloudflare', 'Datadog', 'MongoDB',
  'Snowflake', 'Palantir', 'CrowdStrike', 'Okta', 'Zoom',

  // Consumer brands
  'Nordstrom', 'Macys', 'Target', 'Costco', 'Kroger',
  'CVS_Extra', 'Walgreens', 'RiteAid', 'TraderJoes', 'WholeFoods',

  // Food & Bev
  'Wendys', 'Arbys', 'DunkinDonuts', 'Starbucks', 'McDonaldsCorp',
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
  console.log('Adding batch 2 to hit 1000 profiles...\n');

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
