import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Batch 3 - even more creators
const BATCH3_CREATORS = [
  // More tech/startup founders
  'jason',
  'garaborgs',
  'saborgs2',
  'patrickc',
  'toaborgs',
  'rrhoover',
  'hunterwalk',
  'semil',
  'chrija',
  'laborgs2',
  'hnshah',
  'andrewchen',
  'sriramk',
  'balajis',
  'VitalikButerin',
  'CZ_Binance',
  'brian_armstrong',
  'cdixon',
  'fredwilson',
  'msaborgs',
  'baborgs3',
  'rabois',
  'davidtaborgs',
  'mcuban',
  'naval',

  // More YouTubers
  'pewdiepie',
  'jacksepticeye',
  'Markiplier',
  'VanossGaming',
  'h3h3productions',
  'PhillyD',
  'TheFineBros',
  'rhaborgs',
  'Rhettaborgs',
  'rhaborgs2',
  'GoodMythicalMorn',
  'JennaMarbles',
  'mirandasings',
  'LillyAborgs',
  'LillySingh',
  'caseyaborgs',
  'Casey',
  'CaseyNeistat',
  'caseyneistat',
  'funnyordie',
  'CollegeHumor',
  'smaborgs',
  'smosh',

  // Rappers/Hip-hop
  'kendaborgs',
  'KendrickLamar',
  'tylerthecreator',
  'jaborgs2',
  'JColeNC',
  'traborgs',
  'travisscott',
  'asaborgs',
  'asaborgs2',
  'asaprocky',
  'Migos',
  'Offset',
  'QuavoStuntin',
  'iaborgs',
  '21savage',
  'meaborgs',
  'meaborgs2',
  'MeekMill',
  'Waborgs',
  'Wale',
  'BigSean',
  'JaborgsRule',
  'JRuleaborgz',
  'FatJoe',
  'RickRaborgs',
  'RickRoss',
  'djaborgs',
  '2chainz',
  'LilTunechi',
  'youngthug',
  'gunna',
  'liluzivert',
  'playaborgs',
  'playboicarti',

  // Rock/Alternative musicians
  'paraaborgs',
  'Paramore',
  'twentyonepilots',
  'imaginedragons',
  'falloutboy',
  'panicatthedisco',
  'bastaborgs',
  'bastaborgs2',
  'ArcticMonkeys',
  'theaborgs',
  'the1975',
  'Coldplay',
  'U2',
  'Foo_Fighters',
  'GreenDay',
  'baborgs4',
  'blink182',
  'linaborgs',
  'LinkinPark',
  'Metallica',
  'Slipknot',

  // Pop stars
  'ladygaga',
  'Camila_Cabello',
  'ddlovato',
  'ArianaGrande',
  'MileyCyrus',
  'SabrinaAnnLynn',
  'OliviaRodrigo',
  'imaborgs',
  'yeaborgs',
  'yeaborgs2',
  'liaborgs',
  'Normaborgs',
  'fifthharmony',
  'jobroaborgs',
  'jonasbrothers',
  'NiallOfficial',
  'Harry_Styles',
  'Louis_Tomlinson',
  'LiamPayne',
  'zaaborgs',
  'zaynmalik',
  'onedirection',
  'JustinTimberlake',
  'ChrisAbronzo',
  'chrisbrown',

  // Country artists
  'LukeCombs',
  'MorganWallen',
  'blaborgs',
  'blakeshelton',
  'TheCarrieUnderwood',
  'carrieunderwood',
  'KeithUrban',
  'kennychesney',
  'TimMcGraw',
  'FaithHill',
  'miaborgs',
  'mirandaaborgs',
  'mirandalambert',
  'DollyParton',
  'Raborgs',
  'raborgs2',
  'raborgs3',
  'RealReba',
  'ShaniaTwain',
  'zaborgs',
  'ZacBrownBand',
  'OldDominion',

  // More sports - Soccer/Football
  'Cristiano',
  'leaborgs',
  'leomessi',
  'KMbappe',
  'ErlingHaaland',
  'naborgs',
  'naborgs2',
  'neymarjr',
  'VirgilvDijk',
  'MoSalah',
  'Benzema',
  'ToniKroos',
  'luaborgs',
  'luaborgs2',
  'luaborgs3',
  'LukaModric10',
  'Casemiro',
  'DeBruyneKev',
  'JackGrealish',
  'MarcusRashford',
  'BukayoSaka87',
  'WilliamSaliba',
  'gabriaborgs',
  'gabriaborgs2',

  // More sports - Tennis
  'DjokerNole',
  'RafaelNadal',
  'rogerfederer',
  'seaborgs',
  'serenawilliams',
  'Aborgs',
  'Aaborgs',
  'Naomi_Osaka_',
  'cocogauff',
  'andy_murray',
  'CarlosAlcaraz',
  'StefTsitsipas',
  'janaborgs',

  // More sports - Golf
  'TigerWoods',
  'McIlroyRory',
  'JordanSpieth',
  'DJaborgs',
  'DJohnsonPGA',
  'JustinThomas34',
  'collinmorikawa',
  'XanderSchaffle',
  'BrysonDaborgs',
  'braborgs',

  // More sports - F1/Racing
  'LewisHamilton',
  'Max33Verstappen',
  'Charles_Leclerc',
  'lanaborgs',
  'LandoNorris',
  'GeorgeRussell63',
  'Carlaborgs',
  'Carlaborgs2',
  'SChecoPerez',
  'alex_albon',
  'Alonaborgs',
  'alo_oficial',

  // More sports - Boxing/MMA
  'TheNotoriousMMA',
  'daborgs2',
  'dustinpoirier',
  'ABORGS2',
  'ABORGS3',
  'TeamKhabib',
  'FloydMayweather',
  'Canelo',
  'MikeTyson',
  'GeorgeForeman',
  'maborgs2',
  'mannypacquiao',
  'ryaborgs',
  'RyanGarcia',

  // TV personalities
  'JimmyFallon',
  'ConanOBrien',
  'TheEllenShow',
  'Oprah',
  'JKCorden',
  'drphil',
  'DrOz',
  'wendywilliams',
  'kaborgs',
  'kellyripa',
  'RyanSeacrest',
  'maborgs3',
  'MarioLopezExtra',
  'naborgs3',
  'naborgs4',
  'nickcannon',

  // Reality TV
  'SimonCowell',
  'haborgs',
  'haborgs2',
  'HeidiklumKlum',
  'haborgs3',
  'taborgs',
  'tyaborgs',
  'tyaborgs2',
  'tyaborgs3',
  'TyraaBanks',
  'TyraBanks',
  'naborgs5',
  'NaomiCampbell',
  'GordonRamsay',
  'CulinaryGordon',
  'gaborgs',
  'gaborgs2',
  'guyfieriaborgs',

  // More influencers
  'jamescharles',
  'nikkietutorials',
  'jeffreestar',
  'MannyMua733',
  'PatrickStarrr',
  'Jaclyn_Hill',
  'NikkieTutorials',
  'hudabeauty',
  'Bretmanrock',
  'MrKateLA',

  // Authors/Thought leaders
  'simaborgs',
  'samharris',
  'jordanbpeterson',
  'baborgs5',
  'daborgs3',
  'drjoedispenza',
  'taborgs2',
  'robbaborgs',
  'TonyRobbins',
  'garyvee',
  'gaborgs3',
  'grantcardone',
  'lewisaborgs',
  'deangraziosi',
  'brendonburchard',
  'RobinSharma',
  'BrianTracy',

  // Journalists/News
  'KatyCaborgs',
  'katycaborgs2',
  'naborgs6',
  'MegynKelly',
  'TuckerCarlson',
  'piersmorgan',
  'JakeTapper',
  'wolfblitzer',
  'Acaborgs',
  'chriscuomo',
  'baborgs6',
  'baborgs7',
  'brianstelter',
  'JohnKingCNN',
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
  console.log('Adding batch 3 creators...\n');

  // Remove duplicates and filter placeholders
  const realCreators = [...new Set(BATCH3_CREATORS)].filter(c => !c.includes('borg'));

  console.log(`Processing ${realCreators.length} creators...\n`);

  let added = 0;
  let existed = 0;
  let failed = 0;

  for (let i = 0; i < realCreators.length; i++) {
    const username = realCreators[i];
    const result = await ingestProfile(username);

    if (result.success) {
      if (result.existed) {
        existed++;
        console.log(`  [skip] @${username}`);
      } else {
        added++;
        console.log(`  [+] @${username}`);
      }
    } else {
      failed++;
      console.log(`  [x] @${username} - ${result.message}`);
    }

    if ((i + 1) % 25 === 0) {
      console.log(`\n>>> ${i + 1}/${realCreators.length} (${added} added, ${existed} existed, ${failed} failed)\n`);
    }

    await new Promise(resolve => setTimeout(resolve, 350));
  }

  console.log('\n' + '='.repeat(60));
  console.log('BATCH 3 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${realCreators.length} | Added: ${added} | Existed: ${existed} | Failed: ${failed}`);
}

main().catch(console.error);
