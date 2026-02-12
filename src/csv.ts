import { EntriesWithGains } from './cap-gains.js';
import { ActionType } from './parser.js';
import { format } from 'date-fns';
import { writeFile } from 'fs/promises';

const headings = [
  'token',
  'symbol',
  'type',
  'date',
  'price',
  'token amount',
  'fee',
  'cost to buy',
  'total sold for',
  'capital gain/loss',
  'days held',
];

export const writeToCsv = async (entries: EntriesWithGains, outputPath = './report.csv') => {
  const data: (string | number)[][] = [headings];

  for (const entry of entries) {
    if (entry.type === ActionType.BUY) {
      data.push([
        entry.token,
        entry.tokenSymbol,
        entry.type,
        format(entry.date, 'MMM-d-y h:mm a'),
        entry.buyPrice,
        entry.amountOfToken,
        entry.fees,
        entry.totalCost,
      ]);
    } else {
      data.push([
        entry.token,
        entry.tokenSymbol,
        entry.type,
        format(entry.date, 'MMM-d-y h:mm a'),
        entry.sellPrice,
        entry.amountOfToken,
        entry.fees,
        entry.costToBuy,
        entry.totalSoldFor,
        entry.capitalGainOrLoss,
        entry.daysHeld,
      ]);
    }
  }

  const escapeCsvField = (field: string | number): string => {
    const value = String(field);
    if (!/[",\n\r]/.test(value)) return value;
    return `"${value.replaceAll('"', '""')}"`;
  };

  const csvFormat = data.map((row) => row.map(escapeCsvField).join(',')).join('\n');
  await writeFile(outputPath, csvFormat);
};
