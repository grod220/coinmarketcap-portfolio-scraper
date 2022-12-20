import { EntriesWithGains } from './cap-gains';

const headings = [
  'type',
  'date',
  'price',
  'amountOfToken',
  'tokenSymbol',
  'fee',
  'capitalGain/Loss',
];
// const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvData}`);
// console.log(csvData);
// window.open(encodedUri);

export const writeToCsv = (entries: EntriesWithGains) => {
  const data: (string | number)[][] = [headings];

  const csvData = [headings, ...entries]
    .map((row) => row.map((i) => `"${i}"`).join(','))
    .join('\n');
};
