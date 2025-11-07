require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const greenhouse = require('./greenhouse');
const lever = require('./lever');
const ashby = require('./ashby');

async function run() {
  await greenhouse.run();
  await lever.run();
  await ashby.run();
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
