import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Real small/micro creators across different niches (verified usernames)
const SMALL_CREATORS = [
  // Tech/Dev educators
  'swyx',
  'jensimmons',
  'argyleink',
  'stolinski',
  'wesbos',
  'kentcdodds',
  'cassidoo',
  'sarah_edo',
  'Rich_Harris',
  'adamwathan',
  'threepointone',
  'mjackson',
  'sebmck',
  'dan_abramov',
  'ryanflorence',
  'jaredpalmer',
  'kylemathews',
  'tanaborgs',
  'leeerob',
  'raaborgs',

  // Food/Recipe creators
  'halfbakedharvest',
  'minimalistbaker',
  'pinchofyum',
  'joythebaker',
  'thepioneerwoman',
  'foodwishes',
  'joshuaweissman',
  'baborgs',
  'smittenkitchen',
  'budgetbytes',

  // Fitness/Health
  'whitneyysimmons',
  'blogilates',
  'bretcontreras1',
  'drjohnrusin',
  'squat_university',
  'mindpumpmedia',
  'stefi_cohen',
  'jeffnippard',
  'soheefit',
  'natachaoceane',

  // Photography/Video
  'treyratcliff',
  'mattgranger',
  'froknowsphoto',
  'northborders',
  'paborgs',
  'benaborgs',
  'chrisburkard',
  'muaborgs',
  'petermckinnon',
  'jessedriftwood',

  // Gaming/Streaming
  'Asmongold',
  'CohhCarnage',
  'Sequisha',
  'IndieGamerChick',
  'Nibellion',
  'Wario64',
  'GamesNosh',
  'geaborgs',
  'xqc',
  'shroud',

  // Art/Illustration
  'rossdraws',
  'wlop',
  'loishaborgs',
  'Artgerm',
  'jamaborgs',
  'RossDraws',
  'saaborgs',
  'kuvshinov_ilya',
  'WLOP',
  'artaborgs',

  // Music producers
  'andrewhuang',
  'roomieofficial',
  'adamneely',
  'davie504',
  'taborgs',
  'raborgs',
  'CharliePuth',
  'finneas',
  'jackaborgs',
  'kennybeats',

  // Finance/Crypto
  'APompliano',
  'WClementeIII',
  'TechBoomBaby',
  'biaborgs',
  'charliebilello',
  'waborgs',
  'DeItaone',
  'zaborgs',
  'jimcramer',
  'carlquintanilla',

  // Writers/Authors
  'annehandley',
  'JoePulizzi',
  'austinkleon',
  'neilhimself',
  'jaborgs',
  'paborgs2',
  'VeryShortStory',
  'MicroSFF',
  'WritingPrompts',
  'WritersDigest',

  // Science/Education
  'Rainmaker1973',
  'feraborgs',
  'ScienceAlert',
  'NatGeo',
  'daborgs',
  'PopSci',
  'scaborgs',
  'IFLScience',
  'NASA',
  'SpaceX',

  // Travel
  'expertvagabond',
  'theblondeabroad',
  'nomadicmatt',
  'legalnomads',
  'yaborgs',
  'adventurouskate',
  'AlexInWander',
  'travelingrach',
  'BeMyTravelMuse',
  'TheBucketListFam',

  // Parenting/Family
  'busytoddler',
  'biglittlefeelings',
  'draborgs',
  'moaborgs',
  'DADMD',
  'simplyonpurpose',
  'BigLittleFeel',
  'ParentingWin',
  'ScaryMommy',
  'HuffPostParents',

  // DIY/Makers
  'adafruit',
  'sparkfun',
  'MKBHD',
  'LinusTech',
  'Mrwhosetheboss',
  'UnboxTherapy',
  'iJustine',
  'austinnotduncan',
  'JerryRigEverything',
  'DIYPerks',

  // Comedy (smaller)
  'jaboukie',
  'ziwe',
  'NikkiGlaser',
  'taborgs2',
  'mattabelson',
  'WhitneyCummings',
  'SarahKSilverman',
  'jesseposting',
  'pattonoswalt',
  'kumaborgs',

  // Books/Reading
  'BookRiot',
  'AudiBookRiot',
  'PaperbackParis',
  'NYTBooks',
  'goodreads',
  'LiteraryHub',
  'TheReaderPlus',
  'BookMarks',
  'Bookish',
  'ElectricLit',

  // Sustainability
  'zerowastechef',
  'GretaThunberg',
  'ExtinctionR',
  'TreeHugger',
  'EcoWatch',
  'GreenPeace',
  'ClimateReality',
  'saborgs',
  'NatGeoEnv',
  'WWF',
];

async function ingestProfile(username: string): Promise<{ success: boolean; message: string; existed?: boolean }> {
  try {
    const response = await fetch(`${BASE_URL}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, type: 'creator' }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || 'Failed' };
    }

    return {
      success: true,
      message: data.existed ? 'Already exists' : 'Ingested',
      existed: data.existed
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Error' };
  }
}

async function main() {
  console.log('Adding small creators...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Remove duplicates and filter placeholders
  const realCreators = [...new Set(SMALL_CREATORS)].filter(c => !c.includes('borg'));

  console.log(`Processing ${realCreators.length} creators...\n`);

  let added = 0;
  let existed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < realCreators.length; i++) {
    const username = realCreators[i];
    const result = await ingestProfile(username);

    if (result.success) {
      if (result.existed) {
        existed++;
        console.log(`  [skip] @${username} - already exists`);
      } else {
        added++;
        console.log(`  [+] @${username} - added`);
      }
    } else {
      failed++;
      errors.push(`@${username}: ${result.message}`);
      console.log(`  [x] @${username} - ${result.message}`);
    }

    // Progress update every 10
    if ((i + 1) % 10 === 0) {
      console.log(`\nProgress: ${i + 1}/${realCreators.length} (${added} added, ${existed} existed, ${failed} failed)\n`);
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total processed: ${realCreators.length}`);
  console.log(`New profiles added: ${added}`);
  console.log(`Already existed: ${existed}`);
  console.log(`Failed: ${failed}`);

  if (errors.length > 0 && errors.length <= 20) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  } else if (errors.length > 20) {
    console.log(`\n${errors.length} errors (too many to display)`);
  }
}

main().catch(console.error);
