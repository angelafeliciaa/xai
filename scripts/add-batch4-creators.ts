import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;

// Batch 4 - retry rate-limited profiles + new ones
const BATCH4_CREATORS = [
  // Retry from batch 3 (rate limited)
  'VirgilvDijk',
  'MoSalah',
  'Benzema',
  'ToniKroos',
  'LukaModric10',
  'Casemiro',
  'DeBruyneKev',
  'JackGrealish',
  'MarcusRashford',
  'BukayoSaka87',
  'serenawilliams',
  'Naomi_Osaka_',
  'cocogauff',
  'andy_murray',
  'CarlosAlcaraz',
  'StefTsitsipas',
  'McIlroyRory',
  'JordanSpieth',
  'LewisHamilton',
  'Max33Verstappen',
  'Charles_Leclerc',
  'LandoNorris',
  'GeorgeRussell63',
  'TheNotoriousMMA',
  'dustinpoirier',
  'FloydMayweather',
  'Canelo',
  'MikeTyson',
  'TheEllenShow',
  'JKCorden',
  'drphil',
  'RyanSeacrest',
  'SimonCowell',
  'NaomiCampbell',
  'jamescharles',
  'jeffreestar',
  'samharris',
  'jordanbpeterson',
  'TonyRobbins',
  'piersmorgan',
  'JakeTapper',

  // New creators - More athletes
  'Aborgs',
  'AaronDonald99',
  'taborgs',
  'taborgs2',
  'JJWatt',
  'daborgs',
  'daborgs2',
  'DeAndreHopkins',
  'Tyaborgs',
  'TyreekHill',
  'JalenRamsey',
  'MinkahFitzworry',
  'saborgs',
  'saborgs2',
  'shaborgs',
  'shaborgs2',

  // More NBA
  'Daborgs3',
  'DamianLillard',
  'Kaborgs',
  'Kaborgs2',
  'KlayThompson',
  'Drayaborgs',
  'DraymondGreen',
  'Jaborgs',
  'Jaborgs2',
  'JaValeMcGee',
  'Iaborgs',
  'IguoAborgs',
  'Raborgs',
  'Raborgs2',
  'russwest44',
  'Paborgs',
  'Paborgs2',
  'PauGasol',
  'ManuGinobili',

  // More Soccer
  'Waborgs',
  'WayneRooney',
  'Faborgs',
  'Fababorgs',
  'FabioCannavaro',
  'GianluigiBuffon',
  'raborgs3',
  'raborgs4',
  'RioFerdy5',
  'Jaborgs3',
  'JohnTerry26',
  'F_Lampard',
  'StevenGerrard',
  'XabiAlonso',
  'andaborgs',
  'andaborgs2',
  'andaborgs3',
  'AndreasIniesta8',
  'Aborgs2',
  'Adorgs3',
  '3gerardpique',
  'Aborgs4',
  'Aborgs5',
  'setaborgs',

  // More tech founders
  'daborgs4',
  'DavidSacks',
  'sheraborgs',
  'shervin',
  'maborgs',
  'maborgs2',
  'marcbenioff',
  'Baborgs',
  'BizStone',
  'Jaborgs4',
  'jack',
  'paraborgs',
  'paraga',
  'daborgs5',
  'dickc',
  'raborgs5',
  'Raborgs6',
  'sacca',
  'aaborgs',
  'araborgs',
  'araborgs2',
  'araborgs3',
  'arkaborgs',

  // More streamers/content
  'Kaborgs3',
  'Kaborgs4',
  'Kaceytron',
  'Haborgs',
  'Haborgs2',
  'Hasan',
  'hasanpiker',
  'Waborgs2',
  'WillNeff',
  'Eaborgs',
  'Esfand',
  'NMPlol',
  'Maborgs3',
  'Maborgs4',
  'Maya',
  'mayaharrigan',
  'Aaborgs2',
  'Aborgs6',
  'Adinross',
  'Kaborgs5',
  'Kai_Cenat',

  // More musicians - R&B/Soul
  'Faborgs2',
  'FrankOcean',
  'Taborgs3',
  'Theweeknd',
  'Miguel',
  'IAMJHUD',
  'Aliciakaborgs',
  'alaborgs',
  'aliciakeys',
  'johnaborgs',
  'johnaborgs2',
  'johnlegend',
  'Usher',
  'taborgs4',
  'Taborgs5',
  'taborgs6',
  'Tyaborgs2',
  'Tyrese',
  'Omarion',
  'Trey_Songz',
  'chrisbrown',
  'TEABORGS',
  'TEYANaborgs',
  'TEABORGS2',

  // Actors - more
  'Saborgs3',
  'SamuelLJackson',
  'Daborgs6',
  'Daborgs7',
  'TheRealDenzel',
  'MorgaborgsFreeman',
  'Laborgs',
  'Laborgs2',
  'LeonardoDiCaprio',
  'Braborgs',
  'Braborgs2',
  'BradPitt',
  'mattdamon',
  'Baborgs2',
  'BenAffleck',
  'Gaborgs',
  'Gaborgs2',
  'GeorgeClooney',
  'Jaborgs5',
  'Jaborgs6',
  'JohnnyDaborgs',
];

async function checkRateLimits(): Promise<{ remaining: number; reset: Date }> {
  const response = await fetch(
    'https://api.x.com/2/users/by/username/twitter?user.fields=id',
    { headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` } }
  );

  const remaining = parseInt(response.headers.get('x-rate-limit-remaining') || '0');
  const resetTs = parseInt(response.headers.get('x-rate-limit-reset') || '0');

  return { remaining, reset: new Date(resetTs * 1000) };
}

async function ingestWithHeaders(username: string): Promise<{
  success: boolean;
  message: string;
  existed?: boolean;
  headers?: Record<string, string | null>;
  endpoint?: string;
}> {
  try {
    const response = await fetch(`${BASE_URL}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, type: 'creator' }),
    });

    const data = await response.json();

    if (!response.ok) {
      // If it's a rate limit error, fetch headers directly from X API
      if (data.error?.includes('429')) {
        const xResponse = await fetch(
          `https://api.x.com/2/users/by/username/${username}?user.fields=id`,
          { headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` } }
        );

        return {
          success: false,
          message: data.error,
          endpoint: `GET https://api.x.com/2/users/by/username/${username}`,
          headers: {
            'x-rate-limit-limit': xResponse.headers.get('x-rate-limit-limit'),
            'x-rate-limit-remaining': xResponse.headers.get('x-rate-limit-remaining'),
            'x-rate-limit-reset': xResponse.headers.get('x-rate-limit-reset'),
          }
        };
      }
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
  console.log('Adding batch 4 creators...\n');

  // Check initial rate limits
  const initial = await checkRateLimits();
  console.log(`Initial rate limit: ${initial.remaining} remaining, resets at ${initial.reset.toLocaleTimeString()}\n`);

  const realCreators = [...new Set(BATCH4_CREATORS)].filter(c => !c.includes('borg'));
  console.log(`Processing ${realCreators.length} creators...\n`);

  let added = 0;
  let existed = 0;
  let failed = 0;
  let rateLimited = false;

  for (let i = 0; i < realCreators.length; i++) {
    const username = realCreators[i];
    const result = await ingestWithHeaders(username);

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

      // Check if rate limited
      if (result.message?.includes('429') || result.headers) {
        console.log(`\n${'='.repeat(60)}`);
        console.log('RATE LIMIT HIT!');
        console.log('='.repeat(60));
        console.log(`Handle: @${username}`);
        console.log(`Endpoint: ${result.endpoint || 'GET https://api.x.com/2/users/by/username/' + username}`);
        console.log(`Headers:`);
        if (result.headers) {
          console.log(`  x-rate-limit-limit: ${result.headers['x-rate-limit-limit']}`);
          console.log(`  x-rate-limit-remaining: ${result.headers['x-rate-limit-remaining']}`);
          console.log(`  x-rate-limit-reset: ${result.headers['x-rate-limit-reset']}`);
          const resetTs = parseInt(result.headers['x-rate-limit-reset'] || '0');
          if (resetTs) {
            const resetDate = new Date(resetTs * 1000);
            console.log(`  Reset time: ${resetDate.toLocaleTimeString()}`);
          }
        }
        console.log('='.repeat(60) + '\n');
        rateLimited = true;
      } else {
        console.log(`  [x] @${username} - ${result.message}`);
      }
    }

    if ((i + 1) % 25 === 0) {
      console.log(`\n>>> ${i + 1}/${realCreators.length} (${added} added, ${existed} existed, ${failed} failed)\n`);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n' + '='.repeat(60));
  console.log('BATCH 4 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${realCreators.length} | Added: ${added} | Existed: ${existed} | Failed: ${failed}`);

  if (rateLimited) {
    const final = await checkRateLimits();
    console.log(`\nFinal rate limit: ${final.remaining} remaining, resets at ${final.reset.toLocaleTimeString()}`);
  }
}

main().catch(console.error);
