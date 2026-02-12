# CoinMarketCap Capital Gains CLI

This tool reads a CoinMarketCap transactions CSV and calculates FIFO cost basis, capital gain/loss, and holding days.

## What It Does

- Parses portfolio transaction CSV exports.
- Matches sells to prior buys using FIFO lots.
- Calculates:
  - `cost to buy`
  - `total sold for`
  - `capital gain/loss`
  - `days held`
- Writes a `report.csv` file you can use in spreadsheets.

## Install

```bash
npm install
```

## Usage

```bash
npm start -- <path-to-transactions.csv> [output-report-path]
```

Examples:

```bash
npm start -- /Users/you/Desktop/Main_for_all/Main_transactions.csv
npm start -- /Users/you/Desktop/Main_for_all/Main_transactions.csv /Users/you/Desktop/report.csv
```

If `output-report-path` is not provided, output defaults to `./report.csv`.

## Notes

- The app validates that every sell can be matched to prior buys. If a sell exceeds available inventory, it throws an explicit error instead of silently dropping unmatched amounts.
- Some exports can include rounding drift. If this happens, inspect the flagged transaction in your source CSV and adjust data before rerunning.

## Test

```bash
npm test
```
