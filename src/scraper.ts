import { loadWebsocketEndpoint } from './storage';
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

  let allActions: RawEntry[][] = [];

  // n-th child starts at 1
  for (let i = 1; i <= rowCount; i++) {
    await page.click(`${SELECTOR.TABLE_ROW}:nth-child(${i})`);
    await page.waitForSelector(SELECTOR.TRASH_CAN_BUTTON);
    await page.waitForNetworkIdle();

    const result = await page.evaluate(() => {
      // select first table (more than one in page)
      const table = Array.from(document.querySelectorAll('table'))[0];
      // Skip first row (headers)
      const rows = Array.from(table.querySelectorAll('tr')).slice(1);

      const res = [];
      for (const row of rows) {
        const token = document
          .querySelector(
            '.cmc-body-wrapper > div > div > div:nth-child(2) > div > div > div:nth-child(1) > div > div > div > p',
          )
          ?.textContent?.split(' (')[0];
        row.click();
        const matches = document
          .querySelector('.open > div > div > div:nth-child(4) > div.content')
          ?.textContent?.match(/(?<amount>[\d.]+)(?<symbol>[A-Za-z]+)/);
        const data = {
          token,
          type: document.querySelector('.content > div')?.textContent,
          date: document.querySelector('.open > div > div > div:nth-child(2) div.content')
            ?.textContent,
          tokenSymbol: matches?.groups?.symbol,
          amountOfToken: matches?.groups?.amount,
          price: document.querySelector('.open > div > div > div:nth-child(3) > div.content')
            ?.textContent,
          fee: document.querySelector('.open > div > div > div:nth-child(5) > div.content')
            ?.textContent,
        };
        (document.querySelector('.open') as HTMLElement)?.click();
        res.push(data);
      }
      return res;
    });

    allActions.push(result);

    await page.click(SELECTOR.BACK_BUTTON);
    await page.waitForSelector(SELECTOR.TABLE_ROW);
  }

  return allActions.flat();
};
