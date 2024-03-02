# CoinMarketCap Portfolio Scraper

Tax day coming up and you have no idea how to report your trades you track on CoinMarketCap portfolio tracker? Don't
worry, I've been there. This tool is for you! 👆

It does a few things:

- Scrapes all portfolio trades from your CoinMarketCap portfolio
- Parses the raw data
- Augments with calculations: capital gain/loss + days held (helpful for tax filing)
- Exports to a csv for importing into Excel or Google sheets 🎉

### How to use

- Run `yarn install`
- In one terminal window:
  - Run `yarn start:chrome`
  - In the browser window that pops up, log into your portfolio at https://coinmarketcap.com/portfolio-tracker/
  - After a successful login, just leave it open
- In another terminal window:
  - Run `yarn start:app`. This may take a minute to scrape every trade from each of your assets.
  - When finished, this terminal window will show a success message.
  - Look for `report.csv` in the base directory

### Note

Sadly, CoinMarketCap doesn't offer an API to get the underlying porfolio information. This means this app can break if
they change the page's html structure. Would require updating the selectors in `parser.ts`.
