// Single source of truth for every tracked series.
// `id` is the FRED series ID unless `source` says otherwise:
// https://fred.stlouisfed.org/series/<id>
//
// source     - which loader in fetch-data.mjs retrieves it (defaults to 'fred')
//
// transform  - how the chart renders by default
//              level    = raw value
//              yoy      = percent change vs 12 months ago
//              mom_diff = absolute change vs previous observation
// direction  - whether a rising value is bullish for equities, used for colour only
// unit       - formatting hint: index | usd | pct | k | m | b | count

export const GROUPS = [
  { id: 'markets', name: 'Markets' },
  { id: 'rates', name: 'Rates & Credit' },
  { id: 'inflation', name: 'Inflation' },
  { id: 'labor', name: 'Labor' },
  { id: 'housing', name: 'Real Estate' },
  { id: 'economy', name: 'Economy & Liquidity' },
];

export const SERIES = [
  // ---- Sentiment -----------------------------------------------------
  // Not on FRED. The daily GitHub Action fetches these server-side, which also
  // sidesteps the CORS headers these APIs do not send.
  {
    id: 'CNNFG',
    source: 'cnn',
    name: 'Fear & Greed (Stocks)',
    group: 'markets',
    unit: 'score',
    transform: 'level',
    direction: 'up_good',
    gauge: 'stocks',
    url: 'https://www.cnn.com/markets/fear-and-greed',
    sourceLabel: 'CNN Business',
    note: 'CNN composite of seven market internals. Extremes tend to mark turning points.',
  },
  {
    id: 'CRYPTOFG',
    source: 'cryptofng',
    name: 'Fear & Greed (Crypto)',
    group: 'markets',
    unit: 'score',
    transform: 'level',
    direction: 'up_good',
    gauge: 'crypto',
    url: 'https://alternative.me/crypto/fear-and-greed-index/',
    sourceLabel: 'alternative.me',
    note: 'The same idea for Bitcoin: volatility, momentum, volume and dominance.',
  },

  // ---- Markets -------------------------------------------------------
  {
    id: 'SP500',
    name: 'S&P 500',
    group: 'markets',
    unit: 'index',
    transform: 'level',
    direction: 'up_good',
    note: 'The benchmark. Everything else here is context for this line.',
  },
  {
    id: 'NASDAQCOM',
    name: 'Nasdaq Composite',
    group: 'markets',
    unit: 'index',
    transform: 'level',
    direction: 'up_good',
    note: 'Long-duration growth. Leads the S&P in both directions when rates move.',
  },
  {
    id: 'CBBTCUSD',
    name: 'Bitcoin',
    group: 'markets',
    unit: 'usd',
    transform: 'level',
    direction: 'up_good',
    note: 'Highest-beta liquidity proxy. Often turns before risk assets.',
  },
  {
    id: 'VIXCLS',
    name: 'VIX (volatility)',
    group: 'markets',
    unit: 'index',
    transform: 'level',
    direction: 'up_bad',
    note: 'Under 15 is calm, over 30 is panic. Sets how big a position should be.',
  },
  {
    id: 'DTWEXBGS',
    name: 'US Dollar Index',
    group: 'markets',
    unit: 'index',
    transform: 'level',
    direction: 'up_bad',
    note: 'A strong dollar cuts overseas earnings and pressures Bitcoin and gold.',
  },

  // ---- Rates & Credit ------------------------------------------------
  {
    id: 'DFF',
    name: 'Fed Funds Rate',
    group: 'rates',
    unit: 'pct',
    transform: 'level',
    direction: 'up_bad',
    note: 'The policy rate, daily effective. The discount rate under every valuation.',
  },
  {
    id: 'DGS10',
    name: '10-Year Treasury',
    group: 'rates',
    unit: 'pct',
    transform: 'level',
    direction: 'up_bad',
    note: 'The risk-free rate equities compete with.',
  },
  {
    id: 'DGS2',
    name: '2-Year Treasury',
    group: 'rates',
    unit: 'pct',
    transform: 'level',
    direction: 'up_bad',
    note: "The market's bet on where the Fed goes next 24 months.",
  },
  {
    id: 'T10Y2Y',
    name: '10Y-2Y Yield Spread',
    group: 'rates',
    unit: 'pct',
    transform: 'level',
    direction: 'up_good',
    note: 'Below zero is an inverted curve, which has preceded every modern recession.',
  },
  {
    id: 'BAA10Y',
    name: 'Corporate Credit Spread',
    group: 'rates',
    unit: 'pct',
    transform: 'level',
    direction: 'up_bad',
    note: 'Baa corporate yield over the 10-year. Credit cracks before equities do.',
  },
  {
    id: 'NFCI',
    name: 'Financial Conditions',
    group: 'rates',
    unit: 'z',
    transform: 'level',
    direction: 'up_bad',
    note: 'Chicago Fed index of credit, leverage and risk. Above zero is tighter than average.',
  },

  // ---- Inflation -----------------------------------------------------
  {
    id: 'CPIAUCSL',
    name: 'CPI Inflation',
    group: 'inflation',
    unit: 'pct',
    transform: 'yoy',
    direction: 'up_bad',
    note: 'Headline inflation, year over year.',
  },
  {
    id: 'CPILFESL',
    name: 'Core CPI',
    group: 'inflation',
    unit: 'pct',
    transform: 'yoy',
    direction: 'up_bad',
    note: 'Strips food and energy. Stickier, so it drives policy more than headline.',
  },
  {
    id: 'PCEPILFE',
    name: 'Core PCE',
    group: 'inflation',
    unit: 'pct',
    transform: 'yoy',
    direction: 'up_bad',
    note: "The Fed's actual 2% target. Watch this one, not CPI, to predict cuts.",
  },

  // ---- Labor ---------------------------------------------------------
  {
    id: 'UNRATE',
    name: 'Unemployment Rate',
    group: 'labor',
    unit: 'pct',
    transform: 'level',
    direction: 'up_bad',
    note: 'Lagging, but a rise off the lows is what ends cycles.',
  },
  {
    id: 'PAYEMS',
    name: 'Nonfarm Payrolls (monthly change)',
    group: 'labor',
    unit: 'k',
    transform: 'mom_diff',
    direction: 'up_good',
    note: 'Jobs added each month. Under 100k signals a stalling economy.',
  },
  {
    id: 'ICSA',
    name: 'Initial Jobless Claims',
    group: 'labor',
    unit: 'count',
    transform: 'level',
    direction: 'up_bad',
    note: 'Weekly and fast. Turns months before the unemployment rate does.',
  },
  {
    id: 'SAHMREALTIME',
    name: 'Sahm Rule Indicator',
    group: 'labor',
    unit: 'pp',
    transform: 'level',
    direction: 'up_bad',
    note: 'Crossing 0.50 has marked the start of every recession since 1960.',
  },

  // ---- Real Estate ---------------------------------------------------
  {
    id: 'CSUSHPINSA',
    name: 'Case-Shiller Home Prices',
    group: 'housing',
    unit: 'pct',
    transform: 'yoy',
    direction: 'up_good',
    note: 'National home price growth, year over year. Reported with a two-month lag.',
  },
  {
    id: 'MORTGAGE30US',
    name: '30-Year Mortgage Rate',
    group: 'housing',
    unit: 'pct',
    transform: 'level',
    direction: 'up_bad',
    note: 'Sets housing affordability and drags on homebuilders and retail.',
  },
  {
    id: 'HOUST',
    name: 'Housing Starts',
    group: 'housing',
    unit: 'k',
    transform: 'level',
    direction: 'up_good',
    note: 'Construction is rate-sensitive and cyclical, so it leads the broader economy.',
  },

  // ---- Economy & Liquidity -------------------------------------------
  {
    id: 'GDPC1',
    name: 'Real GDP',
    group: 'economy',
    unit: 'pct',
    transform: 'yoy',
    direction: 'up_good',
    note: 'Quarterly growth after inflation.',
  },
  {
    id: 'M2SL',
    name: 'M2 Money Supply',
    group: 'economy',
    unit: 'pct',
    transform: 'yoy',
    direction: 'up_good',
    note: 'Money in the system. The 2020 spike explains both the rally and the inflation.',
  },
  {
    id: 'WALCL',
    name: 'Fed Balance Sheet',
    group: 'economy',
    unit: 'm',
    transform: 'level',
    direction: 'up_good',
    note: 'Rising is QE, falling is QT. The clearest read on liquidity.',
  },
  {
    id: 'UMCSENT',
    name: 'Consumer Sentiment',
    group: 'economy',
    unit: 'index',
    transform: 'level',
    direction: 'up_good',
    note: 'How households feel, which shows up in discretionary spending.',
  },
  {
    id: 'RSAFS',
    name: 'Retail Sales',
    group: 'economy',
    unit: 'pct',
    transform: 'yoy',
    direction: 'up_good',
    note: 'Consumer spending is roughly 70% of GDP.',
  },
];
