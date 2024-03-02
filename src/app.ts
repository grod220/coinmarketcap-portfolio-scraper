import { parseScrapedData } from './parser';
import { calculateCapitalGains } from './cap-gains';
import { writeToCsv } from './csv';
import { scrapeCoinMarketCap } from './scraper';

(async () => {
  try {
    const rawEntries = await scrapeCoinMarketCap();
    // If want to write locally to cache
    // await writeFile('src/rawEntries.ts', JSON.stringify(rawEntries, null, 2), 'utf-8');
    const parsedEntries = parseScrapedData(rawEntries);
    const entriesWithGains = calculateCapitalGains(parsedEntries);
    await writeToCsv(entriesWithGains);
    console.log('Success 🎉. See output: "./report.csv".');
  } catch (e) {
    console.error(e);
  }
})();
