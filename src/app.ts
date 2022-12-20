import { scrapeCoinMarketCap } from './scraper';
import { parseScrapedData } from './parser';
import { calculateCapitalGains } from './cap-gains';
import { writeToCsv } from './csv';

(async () => {
  try {
    const rawEntries = await scrapeCoinMarketCap();
    const parsedEntries = parseScrapedData(rawEntries);
    const entriesWithGains = calculateCapitalGains(parsedEntries);
    writeToCsv(entriesWithGains);
  } catch (e) {
    console.error(e);
  }
})();
