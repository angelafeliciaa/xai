import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;

// S&P 500 and NASDAQ companies - official Twitter handles
const SP500_BRANDS = [
  // Tech Giants
  'Apple',
  'Google',
  'Microsoft',
  'Amazon',
  'Meta',
  'NVIDIA',
  'Salesforce',
  'Adobe',
  'Oracle',
  'IBM',
  'Cisco',
  'Intel',
  'AMD',
  'Qualcomm',
  'Broadcom',
  'ServiceNow',
  'Intuit',
  'Autodesk',
  'Workday',
  'Snowflake',
  'Datadog',
  'CrowdStrike',
  'Palo_Alto_Ntw',
  'Fortinet',
  'Cloudflare',
  'MongoDB',
  'Twilio',
  'Okta',
  'Splunk',
  'VMware',
  'Dell',
  'HP',
  'HPE',
  'NetApp',
  'WesternDigital',
  'Seagate',
  'Micron',

  // Finance/Banking
  'jpmorgan',
  'BankofAmerica',
  'WellsFargo',
  'Citibank',
  'GoldmanSachs',
  'MorganStanley',
  'CharlesSchwab',
  'BlackRock',
  'Vanguard_Group',
  'Fidelity',
  'StateStreet',
  'BNYMellon',
  'CapitalOne',
  'Discover',
  'AmericanExpress',
  'Visa',
  'Mastercard',
  'PayPal',
  'Square',
  'SoFi',
  'Affirm',
  'Markel',
  'Progressive',
  'Allstate',
  'Travelers',
  'MetLife',
  'Prudential',
  'AIG',
  'Chubb',

  // Healthcare/Pharma
  'JNJ',
  'Pfizer',
  'Merck',
  'AbbVie',
  'Lilly',
  'BristolMyers',
  'Amgen',
  'Gilead',
  'Regeneron',
  'Vertex',
  'Moderna',
  'BioNTech',
  'UnitedHealth',
  'CVSHealth',
  'Cigna',
  'Anthem',
  'Humana',
  'Centene',
  'McKesson',
  'AmerisourceBergen',
  'CardinalHealth',
  'Medtronic',
  'Abbott',
  'Danaher',
  'ThermoFisher',
  'BostonScientific',
  'Stryker',
  'Edwards',
  'Intuitive',
  'IDEXX',

  // Consumer/Retail
  'Walmart',
  'Costco',
  'HomeDepot',
  'Lowes',
  'Target',
  'BestBuy',
  'Kroger',
  'Albertsons',
  'DollarGeneral',
  'DollarTree',
  'TJX',
  'Ross',
  'Nordstrom',
  'Macys',
  'Kohls',
  'Gap',
  'VF_Corporation',
  'PVH',
  'Tapestry',
  'Capri',
  'RalphLauren',
  'UnderArmour',
  'Skechers',
  'Crocs',
  'LVMH',
  'Hermes',
  'Kering',

  // Food & Beverage
  'CocaCola',
  'PepsiCo',
  'Nestle',
  'Mondelez',
  'KraftHeinz',
  'GeneralMills',
  'Kelloggs',
  'ConAgra',
  'Hormel',
  'Tyson',
  'BeyondMeat',
  'Hersheys',
  'McCormick',
  'Campbells',
  'SJM',
  'FlowersFoods',

  // Restaurants
  'McDonalds',
  'Starbucks',
  'Wendys',
  'ChipotleTweets',
  'Dominos',
  'YumBrands',
  'DardenRestaurants',
  'SBUX',

  // Entertainment/Media
  'Disney',
  'Netflix',
  'WarnerBrosDiscovery',
  'Paramount',
  'Comcast',
  'Charter',
  'FOXNews',
  'CNBC',
  'Bloomberg',
  'WSJ',
  'naborgs',
  'NYTimes',
  'WashingtonPost',
  'CNN',
  'ESPN',
  'Spotify',
  'LiveNation',
  'MSG',

  // Telecom
  'ATT',
  'Verizon',
  'TMobile',
  'Lumen',

  // Energy
  'ExxonMobil',
  'Chevron',
  'ConocoPhillips',
  'Schlumberger',
  'Halliburton',
  'BakerHughes',
  'EOG',
  'Pioneer',
  'Devon',
  'Diamondback',
  'NextEraEnergy',
  'Duke_Energy',
  'SouthernCompany',
  'Dominion',
  'AEP',
  'Xcel',
  'Entergy',
  'FirstEnergy',

  // Industrial
  'GE',
  'HoneywellNow',
  'MMM',
  '3M',
  'Caterpillar',
  'Deere',
  'ParkerHannifin',
  'Emerson',
  'Rockwell',
  'Illinois_Tool',
  'Eaton',
  'JohnsonControls',
  'Trane',
  'Carrier',
  'Otis',
  'Stanley_Black',
  'Snap_on',
  'Fastenal',
  'WW_Grainger',
  'AECOM',
  'Jacobs',
  'Fluor',

  // Aerospace/Defense
  'Boeing',
  'Airbus',
  'LockheedMartin',
  'RTX',
  'Northrop',
  'GeneralDynamics',
  'L3Harris',
  'TransDigm',
  'Textron',
  'Leidos',
  'SAIC',

  // Transportation
  'UPS',
  'FedEx',
  'XPO',
  'JBHunt',
  'OldDominion',
  'UnionPacific',
  'CSX',
  'NorfolkSouthern',
  'Delta',
  'United',
  'AmericanAir',
  'Southwest',
  'Alaska_Airlines',

  // Auto
  'Tesla',
  'Ford',
  'GM',
  'Stellantis',
  'Rivian',
  'Lucid',
  'Toyota',
  'Honda',
  'Hyundai',
  'BMW',
  'MercedesBenz',
  'Volkswagen',
  'Audi',
  'Porsche',
  'Ferrari',

  // Real Estate
  'Prologis',
  'AmericanTower',
  'CrownCastle',
  'Equinix',
  'DigitalRealty',
  'PublicStorage',
  'SimonProperty',
  'Realty_Income',
  'AvalonBay',
  'Equity_Res',
  'Ventas',
  'Welltower',
  'CBRE',
  'JLL',

  // Materials
  'LindePlc',
  'AirProducts',
  'DuPont',
  'Dow',
  'LyondellBasell',
  'PPG',
  'Sherwin',
  'Ecolab',
  'Nucor',
  'SteelDynamics',
  'Freeport_McMoRan',
  'Newmont',
  'Mosaic',
  'CFIndustries',
];

async function ingestBrand(username: string): Promise<{ success: boolean; message: string; existed?: boolean }> {
  try {
    const response = await fetch(`${BASE_URL}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, type: 'brand' }),  // Note: type = 'brand'
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error?.includes('429')) {
        const xResponse = await fetch(
          `https://api.x.com/2/users/by/username/${username}?user.fields=id`,
          { headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` } }
        );
        console.log('\n' + '='.repeat(60));
        console.log('RATE LIMIT HIT!');
        console.log('='.repeat(60));
        console.log(`Handle: @${username}`);
        console.log(`Endpoint: GET https://api.x.com/2/users/by/username/${username}`);
        console.log('Headers:');
        console.log(`  x-rate-limit-limit: ${xResponse.headers.get('x-rate-limit-limit')}`);
        console.log(`  x-rate-limit-remaining: ${xResponse.headers.get('x-rate-limit-remaining')}`);
        console.log(`  x-rate-limit-reset: ${xResponse.headers.get('x-rate-limit-reset')}`);
        const resetTs = parseInt(xResponse.headers.get('x-rate-limit-reset') || '0');
        if (resetTs) console.log(`  Reset time: ${new Date(resetTs * 1000).toLocaleTimeString()}`);
        console.log('='.repeat(60) + '\n');
      }
      return { success: false, message: data.error || 'Failed' };
    }

    return { success: true, message: data.existed ? 'Already exists' : 'Ingested', existed: data.existed };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Error' };
  }
}

async function main() {
  console.log('Adding S&P 500 / NASDAQ brands...\n');

  const brands = [...new Set(SP500_BRANDS)].filter(c => !c.includes('borg'));
  console.log(`Processing ${brands.length} brands...\n`);

  let added = 0, existed = 0, failed = 0;

  for (let i = 0; i < brands.length; i++) {
    const username = brands[i];
    const result = await ingestBrand(username);

    if (result.success) {
      if (result.existed) { existed++; console.log(`  [skip] @${username}`); }
      else { added++; console.log(`  [+] @${username}`); }
    } else {
      failed++;
      if (!result.message?.includes('429')) console.log(`  [x] @${username} - ${result.message}`);
    }

    if ((i + 1) % 25 === 0) console.log(`\n>>> ${i + 1}/${brands.length} (${added} added, ${existed} existed, ${failed} failed)\n`);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`S&P 500 BRANDS: Total ${brands.length} | Added ${added} | Existed ${existed} | Failed ${failed}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
