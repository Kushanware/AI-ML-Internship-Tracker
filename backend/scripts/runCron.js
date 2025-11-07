require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const cron = require('node-cron');
const { spawn } = require('child_process');

if (process.env.ENABLE_CRON !== 'true') {
  console.log('Cron disabled (ENABLE_CRON!=true). Exiting.');
  process.exit(0);
}

console.log('Cron scheduler starting...');

cron.schedule('0 0 * * *', () => {
  console.log(`[CRON] Running sendReminders at ${new Date().toISOString()}`);
  const child = spawn(process.execPath, ['scripts/sendReminders.js'], {
    cwd: require('path').join(__dirname, '..'),
    stdio: 'inherit',
  });
  child.on('exit', (code) => console.log(`[CRON] sendReminders exited with code ${code}`));
});

if (process.env.ENABLE_SCRAPERS === 'true') {
  cron.schedule('15 0 * * *', () => {
    console.log(`[CRON] Running scrapers at ${new Date().toISOString()}`);
    const child = spawn(process.execPath, ['scripts/scraper/run.js'], {
      cwd: require('path').join(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env },
    });
    child.on('exit', (code) => console.log(`[CRON] scrapers exited with code ${code}`));
  });
}
