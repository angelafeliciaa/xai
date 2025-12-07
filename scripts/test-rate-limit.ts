import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;

async function testRateLimit() {
  console.log('Testing X API rate limits...\n');

  const response = await fetch(
    'https://api.x.com/2/users/by/username/elonmusk?user.fields=id,name',
    {
      headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` },
    }
  );

  console.log('Status:', response.status);
  console.log('\nRate Limit Headers:');
  console.log('  x-rate-limit-limit:', response.headers.get('x-rate-limit-limit'));
  console.log('  x-rate-limit-remaining:', response.headers.get('x-rate-limit-remaining'));
  console.log('  x-rate-limit-reset:', response.headers.get('x-rate-limit-reset'));

  const resetTime = response.headers.get('x-rate-limit-reset');
  if (resetTime) {
    const resetDate = new Date(parseInt(resetTime) * 1000);
    console.log('  Reset time (local):', resetDate.toLocaleString());
    const now = new Date();
    const minutesUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / 60000);
    console.log('  Minutes until reset:', minutesUntilReset);
  }

  console.log('\nAll headers:');
  response.headers.forEach((value, key) => {
    if (key.includes('rate') || key.includes('limit')) {
      console.log(`  ${key}: ${value}`);
    }
  });

  const data = await response.json();
  console.log('\nResponse:', JSON.stringify(data, null, 2));
}

testRateLimit().catch(console.error);
