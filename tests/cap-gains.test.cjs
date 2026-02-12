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

  assert.throws(
    () => calculateCapitalGains(entries),
    /Sell amount exceeds available buys for BTC/,
  );
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

  assert.throws(
    () => calculateCapitalGains(entries),
    /Sell amount exceeds available buys for ETH/,
  );
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
