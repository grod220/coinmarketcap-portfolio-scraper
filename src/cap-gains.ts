import { ActionType, ParsedEntry } from './parser.js';
import { differenceInDays } from 'date-fns';

export type EntriesWithGains = (BuyEntry | SellEntry)[];

interface BuyEntry {
  token: string;
  tokenSymbol: string;
  type: ActionType.BUY;
  date: Date;
  amountOfToken: number;
  buyPrice: number;
  fees: number;
  totalCost: number;
}

interface SellEntry {
  token: string;
  tokenSymbol: string;
  type: ActionType.SELL;
  date: Date;
  amountOfToken: number;
  buyPrice: number;
  sellPrice: number;
  fees: number;
  costToBuy: number;
  totalSoldFor: number;
  capitalGainOrLoss: number;
  daysHeld: number;
}

interface TokenBuy {
  date: Date;
  buyPrice: number;
  fee: number;
  amountOfToken: number;
}

type TokenSymbol = string;

// TokenBuy[] sorted by oldest first
type TokenBuys = Record<TokenSymbol, TokenBuy[]>;

const FLOAT_EPSILON = 1e-9;

const segmentBuys = (
  sellAmount: number,
  tokenBuys: TokenBuy[],
): { used: TokenBuy[]; remaining: TokenBuy[]; unmatchedSellAmount: number } => {
  let used: TokenBuy[] = [];
  let remaining: TokenBuy[] = [];
  let remainingSellAmount = sellAmount;

  for (const buy of tokenBuys) {
    if (remainingSellAmount > FLOAT_EPSILON) {
      if (buy.amountOfToken <= remainingSellAmount + FLOAT_EPSILON) {
        used.push(buy);
        remainingSellAmount -= buy.amountOfToken;
      } else {
        const amountUsed = remainingSellAmount;
        const feeRatio = amountUsed / buy.amountOfToken;
        used.push({
          date: buy.date,
          buyPrice: buy.buyPrice,
          fee: buy.fee * feeRatio,
          amountOfToken: amountUsed,
        });
        remaining.push({
          date: buy.date,
          buyPrice: buy.buyPrice,
          fee: buy.fee * (1 - feeRatio),
          amountOfToken: buy.amountOfToken - amountUsed,
        });
        remainingSellAmount = 0;
      }
    } else {
      remaining.push(buy);
    }
  }

  return {
    used,
    remaining,
    unmatchedSellAmount: Math.max(remainingSellAmount, 0),
  };
};

export const calculateCapitalGains = (parsedEntries: ParsedEntry[]): EntriesWithGains => {
  const tokenBuys: TokenBuys = {};
  const sortedEntries = [...parsedEntries]
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const dateDelta = a.entry.date.getTime() - b.entry.date.getTime();
      if (dateDelta !== 0) return dateDelta;
      if (a.entry.tokenSymbol !== b.entry.tokenSymbol) {
        return a.entry.tokenSymbol.localeCompare(b.entry.tokenSymbol);
      }
      // Keep processing deterministic for identical timestamp + token rows.
      if (a.entry.type !== b.entry.type) {
        return a.entry.type === ActionType.BUY ? -1 : 1;
      }
      return a.index - b.index;
    })
    .map(({ entry }) => entry);

  const entriesWithGains: EntriesWithGains = [];

  for (const entry of sortedEntries) {
    if (entry.type === ActionType.BUY) {
      if (!tokenBuys[entry.tokenSymbol]) {
        tokenBuys[entry.tokenSymbol] = [];
      }
      tokenBuys[entry.tokenSymbol].push({
        date: entry.date,
        buyPrice: entry.price,
        fee: entry.fee,
        amountOfToken: entry.amountOfToken,
      });

      entriesWithGains.push({
        token: entry.token,
        tokenSymbol: entry.tokenSymbol,
        type: ActionType.BUY,
        date: entry.date,
        amountOfToken: entry.amountOfToken,
        buyPrice: entry.price,
        fees: entry.fee,
        totalCost: entry.price * entry.amountOfToken + entry.fee,
      });
    } else {
      const currentBuys = tokenBuys[entry.tokenSymbol] ?? [];
      const availableAmount = currentBuys.reduce((sum, buy) => sum + buy.amountOfToken, 0);
      const { used, remaining, unmatchedSellAmount } = segmentBuys(entry.amountOfToken, currentBuys);

      if (unmatchedSellAmount > FLOAT_EPSILON) {
        throw new Error(
          `Sell amount exceeds available buys for ${entry.tokenSymbol} on ${entry.date.toISOString()} ` +
            `(sell=${entry.amountOfToken}, available=${availableAmount}, unmatched=${unmatchedSellAmount}).`,
        );
      }

      if (used.length === 0) {
        throw new Error(
          `Unable to match sell for ${entry.tokenSymbol} on ${entry.date.toISOString()}: no prior buy lots found.`,
        );
      }

      tokenBuys[entry.tokenSymbol] = remaining;

      const matchedSellAmount = used.reduce((sum, buy) => sum + buy.amountOfToken, 0);
      const sells: SellEntry[] = used.map((buy) => {
        const sellFeeShare = entry.fee * (buy.amountOfToken / matchedSellAmount);
        const totalSoldFor = entry.price * buy.amountOfToken - sellFeeShare;
        const costToBuy = buy.buyPrice * buy.amountOfToken + buy.fee;

        return {
          token: entry.token,
          tokenSymbol: entry.tokenSymbol,
          type: ActionType.SELL,
          date: entry.date,
          amountOfToken: buy.amountOfToken,
          sellPrice: entry.price,
          buyPrice: buy.buyPrice,
          fees: buy.fee + sellFeeShare,
          costToBuy,
          totalSoldFor,
          capitalGainOrLoss: totalSoldFor - costToBuy,
          daysHeld: differenceInDays(entry.date, buy.date),
        };
      });

      for (const sell of sells) {
        entriesWithGains.push(sell);
      }
    }
  }

  return entriesWithGains;
};
