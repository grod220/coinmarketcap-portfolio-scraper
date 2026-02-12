const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs/promises');
const path = require('node:path');

const { readTransactionsCsv } = require('../build/csv-reader.js');
const { ActionType } = require('../build/parser.js');

test('parses escaped quotes and commas inside quoted fields', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cmc-reader-'));
  const csvPath = path.join(tempDir, 'transactions.csv');

  const csv = [
    'Date (UTC+1:00),Token,Type,Price (USD),Amount,Total value (USD),Fee,Fee Currency,Notes',
    '"2024-01-01 00:00:00","My ""Special"", Coin (MSC)","buy","1,234.56","2.5","3,086.40","--","",""',
  ].join('\n');

  await fs.writeFile(csvPath, csv, 'utf8');

  const rows = await readTransactionsCsv(csvPath);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].token, 'My "Special", Coin');
  assert.equal(rows[0].tokenSymbol, 'MSC');
  assert.equal(rows[0].type, ActionType.BUY);
  assert.equal(rows[0].price, 1234.56);
  assert.equal(rows[0].amountOfToken, 2.5);
});

test('parses timestamp using UTC offset declared in header', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cmc-reader-offset-'));
  const csvPath = path.join(tempDir, 'transactions.csv');

  const csv = [
    'Date (UTC-3:30),Token,Type,Price (USD),Amount,Total value (USD),Fee,Fee Currency,Notes',
    '"2024-01-01 00:00:00","Bitcoin (BTC)","buy","100","1","100","--","",""',
  ].join('\n');

  await fs.writeFile(csvPath, csv, 'utf8');

  const rows = await readTransactionsCsv(csvPath);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].date.toISOString(), '2024-01-01T03:30:00.000Z');
});

test('throws on malformed transaction rows', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cmc-reader-malformed-'));
  const csvPath = path.join(tempDir, 'transactions.csv');

  const csv = [
    'Date (UTC+1:00),Token,Type,Price (USD),Amount,Total value (USD),Fee,Fee Currency,Notes',
    '"2024-01-01 00:00:00","Bitcoin (BTC)","buy","100","1","100"',
  ].join('\n');

  await fs.writeFile(csvPath, csv, 'utf8');

  await assert.rejects(() => readTransactionsCsv(csvPath), /Malformed transaction row/);
});

test('throws on unknown transaction type', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cmc-reader-type-'));
  const csvPath = path.join(tempDir, 'transactions.csv');

  const csv = [
    'Date (UTC+1:00),Token,Type,Price (USD),Amount,Total value (USD),Fee,Fee Currency,Notes',
    '"2024-01-01 00:00:00","Bitcoin (BTC)","transfer","100","1","100","--","",""',
  ].join('\n');

  await fs.writeFile(csvPath, csv, 'utf8');

  await assert.rejects(() => readTransactionsCsv(csvPath), /Unknown transaction type/);
});
