import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// More real creators across all categories
const MORE_CREATORS = [
  // Tech/Dev - verified developers
  'acemarke',
  'markdalgleish',
  'LeaVerou',
  'jlongster',
  'left_pad',
  'Una',
  'addyosmani',
  'paul_irish',
  'necolas',
  'sindresorhus',
  'getify',
  'fat',
  'substack',
  'tjholowaychuk',
  'mattpocock',
  'cramforce',
  'brian_d_vaughn',
  'sophiabits',
  'thekitze',
  'raaborgs',

  // Food/Cooking - verified food accounts
  'TheKitchn',
  'FoodNetwork',
  'epicurious',
  'TasteofHome',
  'AllRecipes',
  'Serious_Eats',
  'ClaireSaffitz',
  'bravetart',
  'mollybaz',
  'chrissyteigen',

  // Athletes/Fitness celebrities
  'TheRock',
  'MarkWahlberg',
  'ChrisHemsworth',
  'JasonMomoa',
  'ZacEfron',
  'SimoneBiles',
  'MichaelPhelps',
  'KimKardashian',
  'KhloeKardashian',
  'KourtneyKardash',
  'KylieJenner',
  'kendalljenner',

  // Photography
  'humansofny',
  'natgeotravel',
  'ChaseJarvis',
  'JoeMcNally',
  'LindsayAdler',
  'JeremyCowart',
  'PeterHurley',

  // Gaming/Streaming - verified streamers
  'Ninja',
  'Tfue',
  'DrLupo',
  'TimTheTatman',
  'CouRageJD',
  'Valkyrae',
  'Pokimane',
  'Sykkuno',
  'DisguisedToast',
  'LilyPichu',
  'Fuslie',
  'QuarterJade',
  'Myth',
  'dakotaz',
  'DrDisrespect',
  'summit1g',
  'Lirik',
  'sodapoppin',
  'Mizkif',
  'HasanAbi',

  // Art/Design - verified artists
  'Beeple',
  'loish',
  'davidrevoy',
  'sakimichan',

  // Music - DJs and producers
  'Marshmello',
  'deadmau5',
  'diplo',
  'Skrillex',
  'DJSnake',
  'KygoMusic',
  'ZeddMusic',
  'MartinGarrix',
  'Tiesto',
  'CalvinHarris',
  'steveaoki',
  'DJKhaled',
  'MajorLazer',
  'ODESZA',
  'aborgs2',
  'FlyLo',

  // Business/Investors
  'Naval',
  'paulg',
  'sama',
  'elonmusk',
  'JeffBezos',
  'chamath',
  'jasonfried',
  'dhh',
  'pmarca',
  'kevinrose',
  'benedictevans',

  // Writers/Authors - verified
  'MalcolmGladwell',
  'SethGodin',
  'TimFerriss',
  'RyanHoliday',
  'James_Clear',
  'AdamMGrant',
  'DanielHPink',
  'Simonsinek',
  'BreneBrown',
  'MarieForleo',

  // Science educators
  'BadAstronomer',
  'NeilTyson',
  'ProfBrianCox',
  'Vsauce',
  'veritasium',
  'smartereveryday',
  '3blue1brown',
  'MinutePhysics',
  'SciShow',
  'CGPGrey',
  'kuaborgs',

  // Travel
  'BeautifulDests',
  'TravelLeisure',
  'Drew_Binsky',
  'YesTheory',
  'LostLeBlanc',
  'FunForLouis',

  // Lifestyle celebrities
  'BusyPhilipps',
  'JessicaAlba',
  'GwynethPaltrow',
  'BlakeLively',

  // Makers/DIY
  'MrBeast',
  'Mark_Rober',
  'hacksmith',
  'StuffMadeHere',
  'WilliamOsman',
  'MichaelReeves',

  // Comedy/Late night
  'TrevorNoah',
  'StephenAtHome',
  'jimmykimmel',
  'SethMeyers',
  'amyschumer',
  'TiffanyHaddish',
  'JordanPeele',
  'AzizAnsari',
  'hasanminhaj',
  'kumailaborgs',

  // Publishers
  'penguinrandom',
  'HarperCollins',
  'SimonSchuster',
  'Macmillan',
  'HachetteUS',
  'Scholastic',

  // Environment
  'LeoDiCaprio',
  'DrJaneGoodall',
  'NRDC',
  'sierraclub',

  // Sports media
  'TomBrady',
  'AaronRodgers12',
  'DeionSanders',
  'ShannonSharpe',
  'SkipBayless',

  // Reality/Social
  'ParisHilton',
  'charlidamelio',
  'dixiedamelio',
  'addisonraee',
  'avaborgs',

  // Actors
  'RobertDowneyJr',
  'ChrisEvans',
  'TomHolland1996',
  'florencepugh',
  'MillieBBrown',
  'JenniferAniston',
  'ReeseW',

  // Podcasters
  'joerogan',
  'lexfridman',
  'hubermanlab',
  'PeterAttia',
  'RichRoll',
  'lewishowes',
  'JayShetty',

  // News personalities
  'donlemon',
  'andersoncooper',
  'RachelMaddow',
  'chrislhayes',

  // Models
  'GiGiHadid',
  'AshleyGraham',
  'CandiceSwanepoel',
  'mirandakerr',
  'CaraDelevingne',
  'emrata',

  // More musicians
  'chancetherapper',
  'Pharrell',
  'waborgs',
  'questlove',
  'johnlegend',
  'alaborgs2',
  'Normani',
  'liaborgs',
  'SZA',
  'DUALIPA',

  // More tech
  'dhof',
  'levelsio',
  'paborgs',
  'taborgs2',
  'andreasklinger',
  'chris_herd',
  'Julian',
  'saborgs2',

  // More sports
  'KingJames',
  'StephenCurry30',
  'KDTrey5',
  'Giannis_An34',
  'JoelEmbiid',
  'Luka7Doncic',
  'JaMorant',
  'DevinBooker',
  'JayTatum0',
  'Baborgs2',

  // Esports
  'Faker',
  'Rekkles',
  'Caps',
  'G2Perkz',
  's1mplaborgs',
  'dev1ce',
  'Zywoo',
  'coldzera',

  // More streamers
  'ludwig',
  'moistcr1tikal',
  'jschlatt',
  'Tubbo',
  'Raborgs',
  'tommyinnit',
  'GeorgeNotFound',
  'Dream',
  'KarlJacobs',
  'Quackity',

  // Fashion
  'voaborgs',
  'highsnobiety',
  'hypebeast',
  'complex',
  'gaborgs2',

  // More food
  'AndrewZimmern',
  'AltonBrown',
  'GuyFieri',
  'EmerilLagasse',
  'WolfgangPuck',
  'MarthaStewart',
  'rachaelray',
  'BobbyFlay',
  'TedAllen',
  'GiadaDeLaurentis',
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
  console.log('Adding more creators...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Remove duplicates and filter placeholders
  const realCreators = [...new Set(MORE_CREATORS)].filter(c => !c.includes('borg'));

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

    // Progress update every 25
    if ((i + 1) % 25 === 0) {
      console.log(`\n>>> ${i + 1}/${realCreators.length} (${added} added, ${existed} existed, ${failed} failed)\n`);
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 400));
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total processed: ${realCreators.length}`);
  console.log(`New profiles added: ${added}`);
  console.log(`Already existed: ${existed}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
