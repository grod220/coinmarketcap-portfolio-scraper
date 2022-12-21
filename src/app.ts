import { scrapeCoinMarketCap } from './scraper';
import { parseScrapedData } from './parser';
import { calculateCapitalGains } from './cap-gains';
import { writeToCsv } from './csv';

(async () => {
  try {
    const rawEntries = await scrapeCoinMarketCap();
    const parsedEntries = parseScrapedData(rawEntries);
    const entriesWithGains = calculateCapitalGains(parsedEntries);
    await writeToCsv(entriesWithGains);
    console.log('Success 🎉. See output: "./report.csv".');
  } catch (e) {
    console.error(e);
  }
})();
