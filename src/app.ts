// TODO: I think fees are subtracted from cap gains total
// TODO: use puppeteer to navigate automatically
// TODO: list cost basis
// TODO: is it a short-term or long-term cap gains? (less or more than one year)

// const normalizeNumber = (num) => num.replace('-', '').replace('+', '').replace('$', '').replace(',', '');
//
// const allRowsHtmlEl = [...document.querySelectorAll('div:not(.portfolio-tablelist-wrapper) > .cmc-table > tbody > tr')];
//
// const extractedData = allRowsHtmlEl.map((rowEl) => {
//   const type = rowEl.querySelector('p').textContent;
//   const date = rowEl.querySelector('p:nth-child(2)').textContent.split(',').slice(0, 2).join(',');
//   const price = normalizeNumber(rowEl.querySelector('td:nth-child(2) > p').textContent);
//   const amountOfToken = normalizeNumber(
//     rowEl.querySelector('td:nth-child(3) p:nth-child(2)').textContent.split(' ')[0],
//   );
//   const tokenSymbol = rowEl.querySelector('td:nth-child(3) p:nth-child(2)').textContent.split(' ')[1];
//   const fee =
//     rowEl.querySelector('td:nth-child(4)').textContent === '--'
//       ? '0'
//       : normalizeNumber(rowEl.querySelector('td:nth-child(4)').textContent);
//   return [type, date, price, amountOfToken, tokenSymbol, fee];
// });
//
// const tokenBuys = {};
//
// for (let i = extractedData.length - 1; i >= 0; i--) {
//   const tokenSymbol = extractedData[i][4];
//   const price = parseFloat(extractedData[i][2]);
//   const amountOfToken = parseFloat(extractedData[i][3]);
//   const type = extractedData[i][0];
//   // debugger;
//
//   let capitalGain = 0;
//
//   if (!tokenBuys[tokenSymbol]) {
//     tokenBuys[tokenSymbol] = [];
//   }
//
//   if (type === 'Buy') {
//     tokenBuys[tokenSymbol].push({ storedPrice: price, storedAmountOfToken: amountOfToken });
//   } else if (type === 'Sell') {
//     let rollingTokenAmount = amountOfToken;
//
//     while (rollingTokenAmount > 0 && tokenBuys[tokenSymbol].length) {
//       const { storedPrice, storedAmountOfToken } = tokenBuys[tokenSymbol].shift();
//       if (rollingTokenAmount < storedAmountOfToken) {
//         capitalGain += price * rollingTokenAmount - storedPrice * rollingTokenAmount;
//         tokenBuys[tokenSymbol].unshift({ storedPrice, storedAmountOfToken: storedAmountOfToken - rollingTokenAmount });
//         rollingTokenAmount = 0;
//       } else {
//         capitalGain += price * storedAmountOfToken - storedPrice * storedAmountOfToken;
//         rollingTokenAmount -= storedAmountOfToken;
//       }
//     }
//   }
//
//   extractedData[i][6] = capitalGain;
// }

// const header = ['type', 'date', 'price', 'amountOfToken', 'tokenSymbol', 'fee', 'capitalGain/Loss'];
// const csvData = [header, ...extractedData].map((row) => row.map((i) => `"${i}"`).join(',')).join('\n');
// const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvData}`);
// console.log(csvData);
// window.open(encodedUri);

import { loadWebsocketEndpoint } from './websocket/storage';
import puppeteer from 'puppeteer';

const main = async () => {
  console.log('MAIN RUN');
  const browserWSEndpoint = await loadWebsocketEndpoint();
  console.log(browserWSEndpoint);
  const browser = await puppeteer.connect({ browserWSEndpoint });
  const page = await browser.newPage();

  await page.goto('https://developers.google.com/web/');
  await browser.close();
};

(async () => {
  try {
    await main();
  } catch (e) {
    console.log(e);
  }
})();
