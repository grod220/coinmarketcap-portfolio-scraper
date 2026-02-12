const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs/promises');
const path = require('node:path');

const { writeToCsv } = require('../build/csv.js');
const { ActionType } = require('../build/parser.js');

test('writes escaped CSV fields and zero-padded minutes', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cmc-writer-'));
  const outputPath = path.join(tempDir, 'report.csv');

  await writeToCsv(
    [
      {
        token: 'Token, "Alpha"',
        tokenSymbol: 'TKA',
        type: ActionType.BUY,
        date: new Date('2024-01-01T15:05:00.000Z'),
        amountOfToken: 2,
        buyPrice: 10,
        fees: 1,
        totalCost: 21,
      },
    ],
    outputPath,
  );

  const report = await fs.readFile(outputPath, 'utf8');
  const lines = report.trim().split('\n');

  assert.match(lines[1], /Jan-1-2024 \d{1,2}:05 [AP]M/);
  assert.equal(lines[1].startsWith('"Token, ""Alpha""",TKA,Buy,'), true);
});

test('writes sell rows with gain fields populated', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cmc-writer-sell-'));
  const outputPath = path.join(tempDir, 'report.csv');

  await writeToCsv(
    [
      {
        token: 'Bitcoin',
        tokenSymbol: 'BTC',
        type: ActionType.SELL,
        date: new Date('2024-02-02T10:30:00.000Z'),
        amountOfToken: 0.5,
        buyPrice: 20000,
        sellPrice: 25000,
        fees: 5,
        costToBuy: 10005,
        totalSoldFor: 12495,
        capitalGainOrLoss: 2490,
        daysHeld: 30,
      },
    ],
    outputPath,
  );

  const report = await fs.readFile(outputPath, 'utf8');
  const lines = report.trim().split('\n');
  const sellFields = lines[1].split(',');

  assert.equal(sellFields.length, 11);
  assert.equal(sellFields[0], 'Bitcoin');
  assert.equal(sellFields[1], 'BTC');
  assert.equal(sellFields[2], 'Sell');
  assert.equal(sellFields[7], '10005');
  assert.equal(sellFields[8], '12495');
  assert.equal(sellFields[9], '2490');
  assert.equal(sellFields[10], '30');
});
