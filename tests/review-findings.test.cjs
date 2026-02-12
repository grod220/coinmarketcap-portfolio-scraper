const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { calculateCapitalGains } = require('../build/cap-gains.js');
const { readTransactionsCsv } = require('../build/csv-reader.js');
const { ActionType } = require('../build/parser.js');

test('sell cannot consume a buy lot that occurs later in time', () => {
  const entries = [
    {
      token: 'BTC',
      tokenSymbol: 'BTC',
      type: ActionType.SELL,
      date: new Date('2024-01-01T00:00:00.000Z'),
      price: 100,
      fee: 0,
      amountOfToken: 1,
    },
    {
      token: 'BTC',
      tokenSymbol: 'BTC',
      type: ActionType.BUY,
      date: new Date('2024-01-02T00:00:00.000Z'),
      price: 50,
      fee: 0,
      amountOfToken: 1,
    },
  ];

  assert.throws(() => calculateCapitalGains(entries), /prior buy lots|exceeds available buys/);
});

test('reader handles multiline quoted CSV fields as a single record', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cmc-multiline-'));
  const csvPath = path.join(tempDir, 'transactions.csv');

  const csv = [
    'Date (UTC+1:00),Token,Type,Price (USD),Amount,Total value (USD),Fee,Fee Currency,Notes',
    '"2024-01-01 00:00:00","Bitcoin (BTC)","buy","10,000","1","10,000","--","","first line',
    'second line"',
  ].join('\n');

  await fs.writeFile(csvPath, csv, 'utf8');

  const rows = await readTransactionsCsv(csvPath);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].tokenSymbol, 'BTC');
  assert.equal(rows[0].amountOfToken, 1);
});

test('date parsing is deterministic across host timezones for the same CSV', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cmc-tz-'));
  const csvPath = path.join(tempDir, 'transactions.csv');

  const csv = [
    'Date (UTC+1:00),Token,Type,Price (USD),Amount,Total value (USD),Fee,Fee Currency,Notes',
    '"2024-01-01 00:00:00","Bitcoin (BTC)","buy","1","1","1","--","",""',
  ].join('\n');

  await fs.writeFile(csvPath, csv, 'utf8');

  const script = `
    const path = require('node:path');
    const { readTransactionsCsv } = require(path.join(process.cwd(), 'build/csv-reader.js'));
    (async () => {
      const rows = await readTransactionsCsv(process.argv[1]);
      process.stdout.write(rows[0].date.toISOString());
    })().catch((error) => {
      console.error(error);
      process.exit(1);
    });
  `;

  const isoUtc = execFileSync(process.execPath, ['-e', script, csvPath], {
    cwd: process.cwd(),
    env: { ...process.env, TZ: 'UTC' },
    encoding: 'utf8',
  }).trim();

  const isoNewYork = execFileSync(process.execPath, ['-e', script, csvPath], {
    cwd: process.cwd(),
    env: { ...process.env, TZ: 'America/New_York' },
    encoding: 'utf8',
  }).trim();

  assert.equal(isoUtc, isoNewYork);
  assert.equal(isoUtc, '2023-12-31T23:00:00.000Z');
});
