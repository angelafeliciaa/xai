import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const PROFILES_NAMESPACE = 'profiles';
const TWEETS_NAMESPACE = 'tweets';

// Wrong accounts to delete (ingested wrong handles - individuals who registered company names)
const WRONG_ACCOUNTS_TO_DELETE = [
  // Previously identified
  'brand_yeti',           // Dustin Kimmel, not YETI coolers
  'brand_chomps',         // Sofía Figueroa, not CHOMPS snacks
  'brand_datadog',        // "Data" the dog, not Datadog company
  'brand_oura',           // Daouna Jeong, not OURA ring
  'brand_emm4x3',         // Emma (individual), wrongly marked as brand
  'brand_stvnzhn',        // Steven Zhang (individual), wrongly marked as brand

  // Identified from verification (individuals with company-name handles)
  'brand_jacobs',         // Jacob Sørensen (marketing person)
  'brand_realty_income',  // Carlisle Mitchell (17 followers)
  'brand_saic',           // Sai (person tweeting about iOS in Chinese)
  'brand_northrop',       // Gerard Gomes (crypto/sports person)
  'brand_snap_on',        // james ingram (3 followers, doing homework)
  'brand_rtx',            // Person (38 followers, graphic design)
  'brand_alaska_airlines', // Katherine Stone (18-year-old)
  'brand_xpo',            // Person (178 followers, sports tweets)
  'brand_jbhunt',         // Minh Chau (1 follower)
  'brand_gork',           // Parody account ("just gorkin' it")
  'brand_ross',           // Ross Mayfield (individual at Zoom)
  'brand_pvh',            // Peter van Hardenberg (individual)
  'brand_vertex',         // Bryon (individual engineer)
  'brand_emerson',        // Emerson Segura (individual CTO)
  'brand_markel',         // Marcello Farias (individual)

  // Additional batch from verification
  'brand_chipotle',       // Wrong handle (correct is @ChipotleTweets)
  'brand_hermes',         // Wrong handle
  'brand_sjm',            // Individual
  'brand_skechers',       // Wrong handle
  'brand_kelloggs',       // Wrong handle
  'brand_paramount',      // Wrong handle
  'brand_conagra',        // Wrong handle
  'brand_tjx',            // Wrong handle
  'brand_aep',            // Wrong handle
  'brand_caterpillar',    // Wrong handle
  'brand_ge',             // Wrong handle
  'brand_lumen',          // Wrong handle
  'brand_mmm',            // Wrong handle (3M)
  'brand_stanley_black',  // Wrong handle
  'brand_diamondback',    // Wrong handle
  'brand_eaton',          // Wrong handle
  'brand_otis',           // Wrong handle
  'brand_duke_energy',    // Wrong handle
  'brand_msg',            // Wrong handle
  'brand_chomps',         // Wrong handle - individual not CHOMPS snacks
  'brand_pentel',         // Wrong handle - individual not Pentel company
  'brand_sherwin',        // Wrong handle - individual not Sherwin-Williams
  'brand_stryker',        // Wrong handle - individual not Stryker medical
  'brand_jnj',            // Wrong handle - individual not Johnson & Johnson
  'brand_abbott',         // Wrong handle - individual not Abbott Labs
];


// Accounts to reclassify from creator to brand
const RECLASSIFY_TO_BRAND = [
  // Previously identified
  'creator_mindpump',     // Mind Pump Media - it's a media company
  'creator_naborforce',   // Naborforce - it's a company
  'creator_chefsteps',    // ChefSteps - cooking company
  'creator_bonappetit',   // Bon Appétit - Condé Nast media brand
  'creator_theellenshow', // The Ellen Show - TV show account

  // Identified from verification (media brands/publishers wrongly as creators)
  'creator_travelleisure',  // Travel + Leisure - media brand
  'creator_tasteofhome',    // Taste of Home - media brand
  'creator_thekitchn',      // The Kitchn - media brand
  'creator_allrecipes',     // Allrecipes - media brand
  'creator_natgeotravel',   // National Geographic Travel - media brand
  'creator_harpercollins',  // HarperCollins - publisher
  'creator_migos',          // Migos - hip-hop group (brand)
  'creator_nasa',           // NASA - government agency
  'creator_epicurious',     // Epicurious - Condé Nast media brand
  'creator_popsci',         // Popular Science - media brand
  'creator_spacex',         // SpaceX - space company
  'creator_bookriot',       // Book Riot - media brand
  'creator_highsnobiety',   // Highsnobiety - fashion media brand
  'creator_penguinrandom',  // Penguin Random House - publisher
  'creator_hachetteus',     // Hachette US - publisher

  // Additional batch 2 - nonprofits, media brands, companies
  'creator_extinctionr',    // Extinction Rebellion - environmental movement
  'creator_foodnetwork',    // Food Network - media brand
  'creator_wwf',            // WWF - World Wildlife Fund nonprofit
  'creator_collegehumor',   // CollegeHumor - comedy brand
  'creator_adafruit',       // Adafruit - electronics company
  'creator_scishow',        // SciShow - educational media
  'creator_odesza',         // ODESZA - music duo (brand)
  'creator_scarymommy',     // Scary Mommy - parenting media brand
  'creator_goodreads',      // Goodreads - Amazon company
  'creator_scholastic',     // Scholastic - publisher
  'creator_iflscience',     // IFLScience - media brand
  'creator_smosh',          // Smosh - comedy brand
  'creator_climatereality', // Climate Reality - Al Gore's nonprofit
  'creator_ecowatch',       // EcoWatch - environmental media
  'creator_sparkfun',       // SparkFun - electronics company
  'creator_hypebeast',      // HYPEBEAST - fashion media brand
  'creator_natgeo',         // National Geographic - media brand
  'creator_sciencealert',   // ScienceAlert - science media
  'creator_complex',        // Complex - media brand
  'creator_nrdc',           // NRDC - environmental nonprofit
  'creator_simonschuster',  // Simon & Schuster - publisher
  'creator_greenpeace',     // Greenpeace - environmental nonprofit
  'creator_electriclit',    // Electric Literature - literary media
  'creator_funnyordie',     // Funny or Die - comedy brand
  'creator_sierraclub',     // Sierra Club - environmental nonprofit
  'creator_yesthetheory',   // Yes Theory - media brand
  'creator_deltaone',       // DeItaone - news/media account
  'creator_linustech',      // Linus Tech Tips - media brand
  'creator_writersdigest',  // Writer's Digest - media brand
  'creator_arcticmonkeys', // Arctic Monkeys - music band
  'creator_itzyofficial',  // ITZY - K-pop group
  'creator_jonasbrothers', // Jonas Brothers - music group
  'creator_the1975',       // The 1975 - music band
  'creator_imaginedragons',// Imagine Dragons - music band
  'creator_blackpink',     // BLACKPINK - K-pop group
  'creator_falloutboy',    // Fall Out Boy - music band
  'creator_u2',            // U2 - music band
  'creator_zacbrownband',  // Zac Brown Band - music band
  'creator_mintlify',      // Mintlify - company
  'creator_linkinpark',    // Linkin Park - music band
  'creator_therealstanlee',// Stan Lee - celebrity estate
  'creator_bts_twt',       // BTS - K-pop group
  'creator_metallica',     // Metallica - music band
  'creator_olddominion',   // Old Dominion - country band
  'creator_twentyonepilots',// Twenty One Pilots - music band
  'creator_coldplay',      // Coldplay - music band
  'creator_blink182',      // Blink-182 - music band
  'creator_rvsmtown',      // Red Velvet - K-pop group
  'creator_fifthharmony',  // Fifth Harmony - music group
  'creator_panicatthedisco',// Panic! At The Disco - music band
  'creator_wtfpod',        // WTF with Marc Maron - podcast/media
  'creator_ymhstudios',    // Your Mom's House Studios - podcast
  'creator_slipknot',      // Slipknot - metal band
  'creator_bts_bighit',    // BTS BigHit - music label account
  'creator_greenday',      // Green Day - music band
];

async function deleteWrongAccounts() {
  const indexName = process.env.PINECONE_INDEX!;
  const index = pinecone.index(indexName);

  console.log('\n--- DELETING WRONG ACCOUNTS ---\n');

  for (const accountId of WRONG_ACCOUNTS_TO_DELETE) {
    try {
      // Try different case variations
      const variations = [
        accountId,
        accountId.toLowerCase(),
        accountId.replace('brand_', 'brand_').toLowerCase(),
      ];

      for (const id of [...new Set(variations)]) {
        try {
          await index.namespace(PROFILES_NAMESPACE).deleteOne(id);
          console.log(`  ✅ Deleted profile: ${id}`);
        } catch {
          // Try uppercase username
          const parts = id.split('_');
          if (parts.length === 2) {
            const upperId = `${parts[0]}_${parts[1].toUpperCase()}`;
            try {
              await index.namespace(PROFILES_NAMESPACE).deleteOne(upperId);
              console.log(`  ✅ Deleted profile: ${upperId}`);
            } catch {
              // Ignore
            }
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ Error deleting ${accountId}:`, error);
    }
  }
}

async function reclassifyAccounts() {
  const indexName = process.env.PINECONE_INDEX!;
  const index = pinecone.index(indexName);

  console.log('\n--- RECLASSIFYING ACCOUNTS (creator -> brand) ---\n');

  for (const oldId of RECLASSIFY_TO_BRAND) {
    try {
      // Try different case variations
      const variations = [oldId, oldId.toLowerCase()];

      for (const id of [...new Set(variations)]) {
        const result = await index.namespace(PROFILES_NAMESPACE).fetch([id]);

        if (result.records && result.records[id]) {
          const record = result.records[id];
          const metadata = record.metadata as Record<string, unknown>;
          const username = metadata.username as string;

          // Create new ID with brand prefix
          const newId = `brand_${username.toLowerCase()}`;

          // Update metadata type
          metadata.type = 'brand';

          // Delete old record
          await index.namespace(PROFILES_NAMESPACE).deleteOne(id);

          // Upsert with new ID and updated metadata
          await index.namespace(PROFILES_NAMESPACE).upsert([{
            id: newId,
            values: record.values as number[],
            metadata: metadata as Record<string, string | number | boolean | string[]>,
          }]);

          console.log(`  ✅ Reclassified @${username}: creator -> brand (${id} -> ${newId})`);
          break;
        }
      }
    } catch (error) {
      console.error(`  ❌ Error reclassifying ${oldId}:`, error);
    }
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('FIXING CLASSIFICATION ISSUES');
  console.log('='.repeat(60));

  await deleteWrongAccounts();
  await reclassifyAccounts();

  console.log('\n' + '='.repeat(60));
  console.log('FIX COMPLETE');
  console.log('='.repeat(60));
  console.log('\nNote: You may want to re-ingest the correct accounts:');
  console.log('  - @YETICoolers (instead of @yeti)');
  console.log('  - @datadoghq (instead of @datadog)');
  console.log('  - @ouraring (instead of @oura)');
  console.log('  - CHOMPS official handle');
}

main().catch(console.error);
