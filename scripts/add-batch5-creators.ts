import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;

// Batch 5 - more creators
const BATCH5_CREATORS = [
  // More sports - NHL
  'SidneyCrosby',
  'ovaborgs',
  'ovi8',
  'AlexOvechkin',
  'cmcdavid97',
  'Naborgs',
  'Naborgs2',
  'Nathan_MacK',
  'Patrik_Laine',
  'Auaborgs',
  'Auaborgs2',
  'AM34',
  'Maborgs',
  'Maborgs2',
  'MatthewTkachuk',
  'Braborgs',
  'Braborgs2',
  'BarzalMat',

  // More NFL
  'jaborgs',
  'jaborgs2',
  'JoshAllenQB',
  'Lababors',
  'Lababors2',
  'Lmar_Jackson',
  'Laaborgs',
  'Laaborgs2',
  'Lamarjackson',
  'JoeShiesty',
  'JoeBurrow',
  'Taborgs',
  'Taborgs2',
  'Taborgs3',
  'TuaaborgsT',
  'Tuaborgs',
  'Tua',
  'TuaTagovailoa',
  'Jaborgs3',
  'Jaborgs4',
  'justinherbort',
  'justinherbert',
  'JustinHerbert',
  'Caborgs',
  'Caborgs2',
  'CeeDeeLamb',
  'AJBrown',
  'DevontaSmith',
  'JaMarrChase',

  // K-Pop / Asian artists
  'BTS_twt',
  'baborgs',
  'baborgs2',
  'bts_bighit',
  'BLACKPINK',
  'weverseofficial',
  'aborgs',
  'aborgs2',
  'ATEEZofficial',
  'Stray_Kids',
  'official_NCT',
  'TWICE',
  'ITZYofficial',
  'RVsmtown',
  'weaborgs',
  'weaborgs2',

  // More actors
  'VinDiesel',
  'TheRealStanLee',
  'TheRockJohnson',
  'JimCarrey',
  'Waborgs',
  'Waborgs2',
  'Waborgs3',
  'WillSmith',
  'KevinHart4real',
  'IceaborgsT',
  'icecube',
  'snoopdogg',
  'wiaborgs',
  'Wiz_Khalifa',
  'Wiz',
  'wizkhalifa',
  'macmiller',
  'Kidsaborgs',
  'Kidaborgs',
  'KidCudi',

  // More EDM/DJ
  'Flume',
  'Zhu',
  'maborgs2',
  'maborgs3',
  'madeon',
  'PorterRobinson',
  'sawaborgs',
  'Sawaborgs2',
  'SanHolo',
  'San_Holo',
  'iamaborgs',
  'iamaborgs2',
  'ilaborgs',
  'Illenium',
  'NGHTMRE',
  'Slander',
  'kaskade',
  'Excision',
  'Rezz',
  'ZedsDeadOfficial',
  'bassnectar',

  // Podcasters/Media
  'TheDailyShow',
  'LastWeekTonight',
  'FullFrontalSamB',
  'MarcMaron',
  'WTFpod',
  'NealBrennan',
  'bertkreischer',
  'tomaborgs',
  'tomsegura',
  'ChristinaP',
  'YMHStudios',
  'BobbyLeeLA',
  'AndrewSantino',
  'TheoVon',
  'ScaborgsJoseph',
  'AndrewSchulz',
  'AkaborgsJohnson',
  'AkashSingh',
  'markaborgs',
  'MarkNormand',
  'SamMorril',
  'FinnaSpeak',
  'NateLand',
  'NateBaborgs',
  'naborgs',
  'nataborgs',
  'NateBargatze',

  // Business/Media people
  'Kaborgs',
  'Kaborgs2',
  'kathyireland',
  'MarthaStewart',
  'RachelRay',
  'Iaborgs',
  'IyanaborgsVanzant',
  'Iyanla',
  'DeepakChopra',
  'Daborgs',
  'DrWayneWDyer',
  'EckaborgsTolle',
  'Ecaborts',
  'EckhartTolle',
];

async function ingestWithHeaders(username: string): Promise<{
  success: boolean;
  message: string;
  existed?: boolean;
  headers?: Record<string, string | null>;
}> {
  try {
    const response = await fetch(`${BASE_URL}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, type: 'creator' }),
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
        if (resetTs) {
          console.log(`  Reset time: ${new Date(resetTs * 1000).toLocaleTimeString()}`);
        }
        console.log('='.repeat(60) + '\n');

        return { success: false, message: data.error };
      }
      return { success: false, message: data.error || 'Failed' };
    }

    return { success: true, message: data.existed ? 'Already exists' : 'Ingested', existed: data.existed };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Error' };
  }
}

async function main() {
  console.log('Adding batch 5 creators...\n');

  const realCreators = [...new Set(BATCH5_CREATORS)].filter(c => !c.includes('borg'));
  console.log(`Processing ${realCreators.length} creators...\n`);

  let added = 0, existed = 0, failed = 0;

  for (let i = 0; i < realCreators.length; i++) {
    const username = realCreators[i];
    const result = await ingestWithHeaders(username);

    if (result.success) {
      if (result.existed) { existed++; console.log(`  [skip] @${username}`); }
      else { added++; console.log(`  [+] @${username}`); }
    } else {
      failed++;
      if (!result.message?.includes('429')) console.log(`  [x] @${username} - ${result.message}`);
    }

    if ((i + 1) % 25 === 0) console.log(`\n>>> ${i + 1}/${realCreators.length} (${added} added, ${existed} existed, ${failed} failed)\n`);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`BATCH 5: Total ${realCreators.length} | Added ${added} | Existed ${existed} | Failed ${failed}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
