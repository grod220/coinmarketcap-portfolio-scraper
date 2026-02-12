const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateCapitalGains } = require('../build/cap-gains.js');
const { ActionType } = require('../build/parser.js');

test('throws when a sell exceeds available buy inventory', () => {
  const entries = [
    {
      token: 'BTC',
      tokenSymbol: 'BTC',
      type: ActionType.BUY,
      date: new Date('2024-01-01T00:00:00.000Z'),
      price: 100,
      fee: 0,
      amountOfToken: 1,
    },
    {
      token: 'BTC',
      tokenSymbol: 'BTC',
      type: ActionType.SELL,
      date: new Date('2024-01-02T00:00:00.000Z'),
      price: 110,
      fee: 0,
      amountOfToken: 1.0001,
    },
  ];

  assert.throws(() => calculateCapitalGains(entries), /Sell amount exceeds available buys for BTC/);
});

test('throws when selling a token without prior buys', () => {
  const entries = [
    {
      token: 'ETH',
      tokenSymbol: 'ETH',
      type: ActionType.SELL,
      date: new Date('2024-01-02T00:00:00.000Z'),
      price: 100,
      fee: 0,
      amountOfToken: 1,
    },
  ];

  assert.throws(() => calculateCapitalGains(entries), /Sell amount exceeds available buys for ETH/);
});

test('does not mutate input array ordering', () => {
  const entries = [
    {
      token: 'SOL',
      tokenSymbol: 'SOL',
      type: ActionType.SELL,
      date: new Date('2024-01-03T00:00:00.000Z'),
      price: 10,
      fee: 0,
      amountOfToken: 1,
    },
    {
      token: 'SOL',
      tokenSymbol: 'SOL',
      type: ActionType.BUY,
      date: new Date('2024-01-01T00:00:00.000Z'),
      price: 5,
      fee: 0,
      amountOfToken: 1,
    },
  ];

  const before = entries.map((entry) => `${entry.type}:${entry.date.toISOString()}`);

  calculateCapitalGains(entries);

  const after = entries.map((entry) => `${entry.type}:${entry.date.toISOString()}`);
  assert.deepEqual(after, before);
});

test('allocates buy and sell fees correctly for a partial lot sell', () => {
  const entries = [
    {
      token: 'BTC',
      tokenSymbol: 'BTC',
      type: ActionType.BUY,
      date: new Date('2024-01-01T00:00:00.000Z'),
      price: 100,
      fee: 2,
      amountOfToken: 2,
    },
    {
      token: 'BTC',
      tokenSymbol: 'BTC',
      type: ActionType.SELL,
      date: new Date('2024-01-02T00:00:00.000Z'),
      price: 110,
      fee: 1,
      amountOfToken: 1,
    },
  ];

  const result = calculateCapitalGains(entries);
  const sells = result.filter((entry: { type: string }) => entry.type === ActionType.SELL);

  assert.equal(sells.length, 1);
  assert.equal(sells[0].amountOfToken, 1);
  assert.equal(sells[0].costToBuy, 101);
  assert.equal(sells[0].totalSoldFor, 109);
  assert.equal(sells[0].capitalGainOrLoss, 8);
  assert.equal(sells[0].fees, 2);
});

test('matches same-timestamp buy before sell for the same token', () => {
  const timestamp = new Date('2024-01-01T00:00:00.000Z');
  const entries = [
    {
      token: 'ETH',
      tokenSymbol: 'ETH',
      type: ActionType.SELL,
      date: timestamp,
      price: 10,
      fee: 0,
      amountOfToken: 1,
    },
    {
      token: 'ETH',
      tokenSymbol: 'ETH',
      type: ActionType.BUY,
      date: timestamp,
      price: 5,
      fee: 0,
      amountOfToken: 1,
    },
  ];

  assert.doesNotThrow(() => calculateCapitalGains(entries));
});
