import { loadWebsocketEndpoint } from './websocket/storage';
import puppeteer from 'puppeteer';

type OptionalStr = string | null | undefined;

export interface RawEntry {
  token: OptionalStr;
  type: OptionalStr;
  date: OptionalStr;
  price: OptionalStr;
  amountOfToken: OptionalStr;
  tokenSymbol: OptionalStr;
  fee: OptionalStr;
}

// Extremely fragile selectors, but coinmarketcap did not provide any other fields/classes/ids to work with
enum SELECTOR {
  TABLE_ROW = 'table > tbody > tr',
  BACK_BUTTON = '.cmc-body-wrapper div:nth-child(1) > div > div > button',
  BALANCE_TITLE = '.cmc-body-wrapper > div > div > div:nth-child(2) > div > div > div:nth-child(1) > div > div > div > p',
  TRASH_CAN_BUTTON = 'table > tbody > tr:nth-child(1) > td:nth-child(5) > div > button:nth-child(2)',
}

export const scrapeCoinMarketCap = async (): Promise<RawEntry[]> => {
  const browserWSEndpoint = await loadWebsocketEndpoint();
  const browser = await puppeteer.connect({ browserWSEndpoint });
  const page = await browser.newPage();
  await page.goto('https://coinmarketcap.com/portfolio-tracker/');

  await page.waitForSelector(SELECTOR.TABLE_ROW);
  const rowCount = await page.$$eval(SELECTOR.TABLE_ROW, (elements) => {
    return elements.length;
  });

  let allActions = [];

  // n-th child starts at 1
  for (let i = 1; i <= rowCount; i++) {
    await page.click(`${SELECTOR.TABLE_ROW}:nth-child(${i})`);
    await page.waitForSelector(SELECTOR.TRASH_CAN_BUTTON);

    const result = await page.evaluate((SELECTOR) => {
      // select first table (more than one in page)
      const table = Array.from(document.querySelectorAll('table'))[0];
      const rows = Array.from(table.querySelectorAll('tr'));
      return rows.slice(1).map((row) => {
        return {
          token: document.querySelector(SELECTOR.BALANCE_TITLE)?.textContent?.split(' Balance')[0],
          type: row.querySelector('p')?.textContent,
          date: row.querySelector('p:nth-child(2)')?.textContent,
          price: row.querySelector('td:nth-child(2) > p')?.textContent,
          amountOfToken: row
            .querySelector('td:nth-child(3) p:nth-child(2)')
            ?.textContent?.split(' ')[0],
          tokenSymbol: row
            .querySelector('td:nth-child(3) p:nth-child(2)')
            ?.textContent?.split(' ')[1],
          fee: row.querySelector('td:nth-child(4)')?.textContent,
        };
      });
    }, SELECTOR);

    allActions.push(result);

    await page.click(SELECTOR.BACK_BUTTON);
    await page.waitForSelector(SELECTOR.TABLE_ROW);
  }

  return allActions.flat();
};
