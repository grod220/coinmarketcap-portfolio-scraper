import { ActionType, ParsedEntry } from './parser';
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

// Keeps same token types together and within that group sorts by oldest
const oldestFirstInGroup = (a: ParsedEntry, b: ParsedEntry) => {
  if (a.token !== b.token) return a.token > b.token ? 1 : -1;
  return a.date > b.date ? 1 : -1;
};

const oldestFirst = (a: TokenBuy | ParsedEntry, b: TokenBuy | ParsedEntry) => {
  return a.date > b.date ? 1 : -1;
};

const getTokenBuys = (parsedEntries: ParsedEntry[]): TokenBuys => {
  const tokenBuys: TokenBuys = parsedEntries
    .filter((e) => e.type === ActionType.BUY)
    .reduce((acc, curr) => {
      if (!acc[curr.tokenSymbol]) {
        acc[curr.tokenSymbol] = [];
      }
      acc[curr.tokenSymbol].push({
        date: curr.date,
        buyPrice: curr.price,
        fee: curr.fee,
        amountOfToken: curr.amountOfToken,
      });

      acc[curr.tokenSymbol].sort(oldestFirst);

      return acc;
    }, {} as TokenBuys);

  return tokenBuys;
};

const segmentBuys = (
  sellAmount: number,
  tokenBuys: TokenBuy[],
): { used: TokenBuy[]; remaining: TokenBuy[] } => {
  let used = [];
  let remaining = [];
  for (const buy of tokenBuys) {
    if (sellAmount > 0) {
      if (buy.amountOfToken <= sellAmount) {
        used.push(buy);
        sellAmount -= buy.amountOfToken;
      } else {
        used.push({
          date: buy.date,
          buyPrice: buy.buyPrice,
          fee: buy.fee * (sellAmount / buy.amountOfToken),
          amountOfToken: sellAmount,
        });
        remaining.push({
          date: buy.date,
          buyPrice: buy.buyPrice,
          fee: buy.fee * (1 - sellAmount / buy.amountOfToken),
          amountOfToken: buy.amountOfToken - sellAmount,
        });
        sellAmount = 0;
      }
    } else {
      remaining.push(buy);
    }
  }
  return { used, remaining };
};

export const calculateCapitalGains = (parsedEntries: ParsedEntry[]): EntriesWithGains => {
  const tokenBuys = getTokenBuys(parsedEntries);
  parsedEntries.sort(oldestFirstInGroup);

  const entriesWithGains: EntriesWithGains = [];

  for (const entry of parsedEntries) {
    if (entry.type === ActionType.BUY) {
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
      const { used, remaining } = segmentBuys(entry.amountOfToken, tokenBuys[entry.tokenSymbol]);
      tokenBuys[entry.tokenSymbol] = remaining;

      const sells: SellEntry[] = used.map((buy) => {
        const totalSoldFor = entry.price * buy.amountOfToken - entry.fee / used.length;
        const costToBuy = buy.buyPrice * buy.amountOfToken + buy.fee;

        return {
          token: entry.token,
          tokenSymbol: entry.tokenSymbol,
          type: ActionType.SELL,
          date: entry.date,
          amountOfToken: buy.amountOfToken,
          sellPrice: entry.price,
          buyPrice: buy.buyPrice,
          fees: buy.fee + entry.fee / used.length,
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
