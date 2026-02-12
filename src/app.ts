import { readTransactionsCsv } from './csv-reader.js';
import { calculateCapitalGains } from './cap-gains.js';
import { writeToCsv } from './csv.js';

const inputCsvPath = process.argv[2];
const outputCsvPath = process.argv[3] ?? './report.csv';

if (!inputCsvPath) {
  console.error('Usage: node build/app.js <path-to-transactions.csv> [output-report-path]');
  process.exit(1);
}

(async () => {
  try {
    const parsedEntries = await readTransactionsCsv(inputCsvPath);
    const entriesWithGains = calculateCapitalGains(parsedEntries);
    await writeToCsv(entriesWithGains, outputCsvPath);
    console.log(`Processed ${parsedEntries.length} transactions. See output: "${outputCsvPath}".`);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
})();
