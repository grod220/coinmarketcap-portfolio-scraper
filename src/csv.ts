import { EntriesWithGains } from './cap-gains';
import { ActionType } from './parser';
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

export const writeToCsv = async (entries: EntriesWithGains) => {
  const data: (string | number)[][] = [headings];

  for (const entry of entries) {
    if (entry.type === ActionType.BUY) {
      data.push([
        entry.token,
        entry.tokenSymbol,
        entry.type,
        format(entry.date, 'MMM-d-y h:m a'),
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
        format(entry.date, 'MMM-d-y h:m a'),
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

  const csvFormat = data.map((row) => row.join(',')).join('\n');
  await writeFile('./report.csv', csvFormat);
};
