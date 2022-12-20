import { RawEntry } from './scraper';
import { parse } from 'date-fns';

export enum ActionType {
  BUY = 'Buy',
  SELL = 'Sell',
}

export interface ParsedEntry {
  date: Date;
  tokenSymbol: string;
  price: number;
  fee: number;
  amountOfToken: number;
  type: ActionType;
  token: string;
}

const parseNumStr = (num: string) => {
  if (num == '--') return 0;
  return parseFloat(num.replace('-', '').replace('+', '').replace('$', '').replace(',', ''));
};

export const parseScrapedData = (rawEntries: RawEntry[]): ParsedEntry[] => {
  return rawEntries.map((entry) => {
    if (!entry.date) throw new Error('missing date');
    if (!entry.tokenSymbol) throw new Error('missing token symbol');
    if (!entry.price) throw new Error('missing token price');
    if (!entry.fee) throw new Error('missing action fee');
    if (!entry.amountOfToken) throw new Error('missing action amount');
    if (!entry.type || !(entry.type === 'Sell' || entry.type === 'Buy'))
      throw new Error('missing action type');
    if (!entry.token) throw new Error('missing action token');

    return {
      date: parse(entry.date, 'MMM d, y, h:m a', new Date()),
      tokenSymbol: entry.tokenSymbol,
      price: parseNumStr(entry.price),
      fee: parseNumStr(entry.fee),
      amountOfToken: parseNumStr(entry.amountOfToken),
      type: entry.type === 'Buy' ? ActionType.BUY : ActionType.SELL,
      token: entry.token,
    };
  });
};
