import { RawEntry } from './scraper';
import { parse } from 'date-fns';

export interface ParsedEntry {
  date: Date;
  tokenSymbol: string;
  price: number;
  fee: number;
  amountOfToken: number;
  type: string;
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
    if (!entry.type) throw new Error('missing action type');
    if (!entry.token) throw new Error('missing action token');

    return {
      date: parse(entry.date, 'MMM d, y, H:m a', new Date()),
      tokenSymbol: entry.tokenSymbol,
      price: parseNumStr(entry.price),
      fee: parseNumStr(entry.fee),
      amountOfToken: parseNumStr(entry.amountOfToken),
      type: entry.type,
      token: entry.token,
    };
  });
};
