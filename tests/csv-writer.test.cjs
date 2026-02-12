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
