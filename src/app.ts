// TODO: I think fees are subtracted from cap gains total
// TODO: list cost basis
// TODO: is it a short-term or long-term cap gains? (less or more than one year)
//        aka Duration held

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

import { scrapeCoinMarketCap } from './scraper';
import { parseScrapedData } from './parser';
import { calculateCapitalGains } from './cap-gains';

(async () => {
  try {
    const rawEntries = await scrapeCoinMarketCap();
    const parsedEntries = parseScrapedData(rawEntries);
    const entriesWithGains = calculateCapitalGains(parsedEntries);
    console.log(entriesWithGains);
    // writeToCsv()
  } catch (e) {
    console.error(e);
  }
})();
