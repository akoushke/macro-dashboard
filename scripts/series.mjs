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

// `blurb` is the plain-language "what is this group and how do I read it" note
// shown under each section heading.
export const GROUPS = [
  {
    id: 'sentiment',
    name: 'Sentiment',
    blurb:
      'How people feel, which tends to turn before prices do. Read these as contrarian at the extremes: crowds are usually most fearful near bottoms and most confident near tops. The middle of the range tells you very little.',
  },
  {
    id: 'markets',
    name: 'Markets',
    blurb:
      'The prices themselves. Every other section on this page is context for these lines.',
  },
  {
    id: 'rates',
    name: 'Rates & Credit',
    blurb:
      'The cost of money and how willing lenders are to take risk. Higher rates shrink what investors will pay for future earnings, and widening spreads are the earliest sign credit is in trouble — equities almost always follow credit, not the other way round.',
  },
  {
    id: 'inflation',
    name: 'Inflation',
    blurb:
      'What the Fed is reacting to. Inflation above target keeps rates high and pressures stocks; inflation falling toward 2% is what lets the Fed cut, which is usually what markets are really betting on.',
  },
  {
    id: 'labor',
    name: 'Labor',
    blurb:
      'Jobs decide whether people keep spending. These turn late, so clear deterioration here tends to confirm a downturn rather than predict one — with the exception of jobless claims, which move early.',
  },
  {
    id: 'activity',
    name: 'Buying & Selling Activity',
    blurb:
      'Not how people feel, but what they are actually doing with their money. Rising sales with falling inventory means buyers are in control; rising inventory and longer selling times mean sellers are. When households and borrowed money are already all-in, there is less cash left to push prices higher.',
  },
  {
    id: 'housing',
    name: 'Real Estate',
    blurb:
      'Prices and borrowing costs for homes. Housing is the most rate-sensitive part of the economy, so it bends before almost anything else when the Fed moves.',
  },
  {
    id: 'economy',
    name: 'Economy & Liquidity',
    blurb:
      'Growth, and how much money is sloshing around the system. Liquidity drove both the 2020-21 melt-up and the 2022 drawdown, so it is often a better guide to markets than growth is.',
  },
];

export const SERIES = [
  // ---- Sentiment -----------------------------------------------------
  // Not on FRED. The daily GitHub Action fetches these server-side, which also
  // sidesteps the CORS headers these APIs do not send.
  {
    id: 'CNNFG',
    source: 'cnn',
    name: 'Fear & Greed (Stocks)',
    group: 'sentiment',
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
    group: 'sentiment',
    unit: 'score',
    transform: 'level',
    direction: 'up_good',
    gauge: 'crypto',
    url: 'https://alternative.me/crypto/fear-and-greed-index/',
    sourceLabel: 'alternative.me',
    note: 'The same idea for Bitcoin: volatility, momentum, volume and dominance.',
  },
  {
    id: 'UMCSENT',
    name: 'Consumer Sentiment',
    group: 'sentiment',
    unit: 'index',
    transform: 'level',
    direction: 'up_good',
    note: 'How households feel about their own finances. Shows up later in what they spend.',
  },
  {
    id: 'MICH',
    name: 'Inflation Expectations',
    group: 'sentiment',
    unit: 'pct',
    transform: 'level',
    direction: 'up_bad',
    note: 'What households expect prices to do over the next year. The Fed hikes to keep this anchored.',
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

  // ---- Buying & Selling Activity -------------------------------------
  {
    id: 'HSN1F',
    name: 'New Home Sales',
    group: 'activity',
    unit: 'k',
    transform: 'level',
    direction: 'up_good',
    note: 'Homes actually sold each month, annualised. The cleanest read on housing demand.',
  },
  {
    id: 'NEWLISCOUUS',
    name: 'New Listings',
    group: 'activity',
    unit: 'count',
    transform: 'yoy',
    direction: 'neutral',
    note: 'Homes newly put up for sale, versus a year ago. Rising means more people want out.',
  },
  {
    id: 'ACTLISCOUUS',
    name: 'Homes For Sale',
    group: 'activity',
    unit: 'count',
    transform: 'yoy',
    direction: 'up_bad',
    note: 'Unsold inventory against a year ago. Building inventory is what softens prices.',
  },
  {
    id: 'MEDDAYONMARUS',
    name: 'Days To Sell A Home',
    group: 'activity',
    unit: 'days',
    transform: 'level',
    direction: 'up_bad',
    note: 'Median days on market. Under 40 is a sellers\u2019 market, over 70 means buyers are waiting.',
  },
  {
    id: 'MSACSR',
    name: 'Months Of Housing Supply',
    group: 'activity',
    unit: 'months',
    transform: 'level',
    direction: 'up_bad',
    note: 'How long inventory would last at the current sales pace. Six months is the balance point.',
  },
  {
    id: 'BOGZ1FL663067003Q',
    name: 'Stock Margin Debt',
    group: 'activity',
    unit: 'pct',
    transform: 'yoy',
    direction: 'neutral',
    note: 'Money borrowed to buy shares, versus a year ago. Fast growth marks risk appetite, and also fragility.',
  },
  {
    id: 'BOGZ1FL153064486Q',
    name: 'Household Stock Allocation',
    group: 'activity',
    unit: 'pct',
    transform: 'level',
    direction: 'neutral',
    note: 'Share of household assets held in equities. Record highs mean little cash left to buy with.',
  },
  {
    id: 'PSAVERT',
    name: 'Personal Saving Rate',
    group: 'activity',
    unit: 'pct',
    transform: 'level',
    direction: 'neutral',
    note: 'Income not spent. High means dry powder; very low means households are stretched.',
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
    id: 'RSAFS',
    name: 'Retail Sales',
    group: 'economy',
    unit: 'pct',
    transform: 'yoy',
    direction: 'up_good',
    note: 'Consumer spending is roughly 70% of GDP.',
  },
];
