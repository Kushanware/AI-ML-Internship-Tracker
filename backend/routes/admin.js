const express = require('express');
const admin = require('../middleware/admin');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

router.post('/scrape/run', admin, async (req, res) => {
  const child = spawn(process.execPath, ['scripts/scraper/run.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env },
  });
  child.on('exit', (code) => console.log(`[ADMIN] scrape/run exited ${code}`));
  res.status(202).json({ status: 'started' });
});

module.exports = router;
