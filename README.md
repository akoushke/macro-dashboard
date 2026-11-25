# Macro Dashboard

Historical trends for the markets, rates, inflation, labor, housing and liquidity data that
frame equity decisions — all of it since 2020, in one page.

**Live site: https://akoushke.github.io/macro-dashboard/**

Every number comes from [FRED](https://fred.stlouisfed.org/) (Federal Reserve Bank of St. Louis).
A GitHub Action refreshes the data every day, so the page is a plain static site with no API keys,
no backend and no client-side rate limits.

## What it shows

**Overview** — Fear & Greed gauges for stocks and crypto, then a *Signals* strip scoring the
readings traders check first (yield curve, credit spreads, financial conditions, VIX, real policy
rate, Sahm rule, S&P drawdown) against their usual ranges, then a card and chart for each of the 28
series grouped by theme. Hovering any chart drops the same date line on all of them and swaps every
card's headline figure for its value on that date, so one pass of the cursor reads the whole
dashboard at a single moment in time.

**Compare** — any combination of series on one chart, rebased to 100 at the start of the range so
series with different units line up, with an optional log scale for when something like Bitcoin
would otherwise flatten everything else. Useful for questions like "how did Bitcoin track the Fed
balance sheet through 2021?"

**Correlation** — Pearson correlation of month-over-month changes against the S&P 500 over the
selected range, sorted by strength. A quick read on which of these actually moves with the index
in the current regime.

Range selector covers Since 2020, 5Y, 3Y, 1Y, YTD and Max. The view, range and series selection
all live in the URL hash, so any state you land on is shareable.

## Series

| Group | Series |
| --- | --- |
| Sentiment | Fear & Greed for stocks (CNN) and for crypto (alternative.me) |
| Markets | S&P 500, Nasdaq Composite, Bitcoin, VIX, US Dollar Index |
| Rates & Credit | Fed funds, 10Y Treasury, 2Y Treasury, 10Y–2Y spread, Baa corporate credit spread, Chicago Fed financial conditions |
| Inflation | CPI, Core CPI, Core PCE (all year over year) |
| Labor | Unemployment rate, nonfarm payroll change, initial jobless claims, Sahm rule |
| Real Estate | Case-Shiller home prices, 30-year mortgage rate, housing starts |
| Economy & Liquidity | Real GDP, M2, Fed balance sheet, consumer sentiment, retail sales |

Series definitions live in [`scripts/series.mjs`](scripts/series.mjs). To add one, find its ID on
FRED and append an entry — the fetch script and the whole UI are driven off that array. Series from
somewhere other than FRED set a `source` naming a loader in `scripts/fetch-data.mjs`.

## Local development

```sh
node scripts/fetch-data.mjs   # writes data/macro.json
npx serve .                   # or: python3 -m http.server 8000
```

Node 22+ (uses built-in `fetch`). No dependencies and no build step.

## How the data flows

`scripts/fetch-data.mjs` pulls `fred.stlouisfed.org/graph/fredgraph.csv?id=<series>` for each
entry, which needs no API key, keeps observations from 2018 onward (two years of runway so
year-over-year transforms have a comparison point at the left edge of the 2020 view) and writes a
single `data/macro.json`. If one series fails after three attempts, the previous values for it are
carried forward so one bad response can't blank the dashboard.

Fetching on a schedule rather than in the browser also means sources that send no CORS headers are
still usable, which is how the two Fear & Greed indices get in. CNN's endpoint rejects requests that
don't look like a browser and serves a rolling window of roughly five years, returning a 500 for
anything older, so the loader walks forward through candidate start dates until one is accepted.

One gotcha when adding series: the ICE BofA spread series (`BAMLH0A0HYM2` and friends) are licensed
and FRED only returns the last three years of them regardless of the requested start date, which is
why credit risk is tracked through `BAA10Y` instead.

## Disclaimer

For information only. Nothing here is investment advice or a recommendation to buy or sell any
security.
