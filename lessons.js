/* Guided tutorial content. Plain script so it can be edited without a build step.
   Each lesson may pull in a live chart (`series`), a threshold table, a case
   study computed from the real data, or a checklist. */

window.LESSONS = [
  /* ---- Foundations -------------------------------------------------- */
  {
    id: 'reading-a-chart',
    chapter: 'Foundations',
    title: 'What these charts are actually showing you',
    body: [
      `<p>Every chart here has time along the bottom and a measurement up the side. The only
       thing you have to work out for each one is <em>what is being measured</em>, because this
       dashboard mixes three different kinds of number and they are read differently.</p>`,
      `<p><strong>A price.</strong> The S&amp;P 500 at 7,237 or Bitcoin at $59,515. The number
       itself is meaningless out of context — what matters is the change. Up 20% is up 20%
       whether the index is at 400 or 7,000.</p>`,
      `<p><strong>A rate.</strong> The Fed funds rate at 3.88%, a mortgage at 7.28%. Here the
       <em>level</em> genuinely means something, and changes are measured in
       <strong>percentage points</strong>, not percent. Going from 2% to 4% is a rise of two
       percentage points, which is a doubling. Saying "up 100%" would be technically true and
       completely useless, so this site always says "+2.00 pp" for rates.</p>`,
      `<p><strong>A rate of change.</strong> Inflation is the slippery one. The government
       publishes a price <em>index</em>, which just rises forever. Nobody cares about the index;
       they care how fast it is rising. So the chart below shows the index compared with where
       it stood twelve months earlier — "year over year". When you hear "inflation is 3%", that
       is this calculation. A falling line does not mean prices are falling. It means they are
       still rising, just more slowly.</p>`,
    ],
    series: 'CPIAUCSL',
    takeaway:
      'Before reading any chart here, ask which of the three it is: a price, a rate, or a rate of change. Inflation falling means prices rising more slowly, not getting cheaper.',
  },
  {
    id: 'price-and-drawdown',
    chapter: 'Foundations',
    title: 'Start with the price, and how far it has fallen',
    body: [
      `<p>The S&amp;P 500 is an index of the 500 largest US public companies, weighted so the
       biggest count most. When someone says "the market" did something, this is almost always
       what they mean. It is the thing you are trying to make a decision about; everything else
       on this dashboard exists to give it context.</p>`,
      `<p>The single most useful derived number is the <strong>drawdown</strong>: how far below
       its own highest-ever close the index sits right now. It reframes the question from "is
       this a big number?" to "how much has already been lost?", which is the thing that
       actually matters when you are deciding whether to buy.</p>`,
      `<p>The vocabulary is just drawdown thresholds, and it is worth knowing because the words
       get used as if they were events rather than arbitrary lines:</p>`,
    ],
    series: 'SP500',
    thresholds: {
      intro: 'Standard names for how far the market has fallen from its high:',
      columns: ['Drawdown', 'Name', 'How often'],
      rows: [
        ['0% to −5%', 'Normal noise', 'Several times a year'],
        ['−5% to −10%', 'Pullback', 'About once a year'],
        ['−10% to −20%', 'Correction', 'Roughly every 2 years'],
        ['Worse than −20%', 'Bear market', 'Roughly every 5–7 years'],
      ],
    },
    takeaway:
      'A "correction" is just a 10% fall with a scary name. Knowing the drawdown tells you where you are in that scale instead of reacting to the headline.',
  },
  {
    id: 'timing-truth',
    chapter: 'Foundations',
    title: 'The uncomfortable truth about timing',
    body: [
      `<p>You asked when to buy and when to sell. Before any indicator, you deserve the honest
       answer, because it changes what the rest of this tutorial is even for.</p>`,
      `<p>Wells Fargo looked at the S&amp;P 500 over the thirty years to mid-2025. Staying fully
       invested the whole time returned <strong>8.4% a year</strong>. Missing just the
       <strong>30 best days</strong> out of roughly 7,500 trading days cut that to
       <strong>2.1%</strong> — worse than the 2.5% inflation over the same period. Miss the best
       50 days and you end up slightly negative.</p>`,
      `<p>Now the part that makes timing genuinely hard. Those best days are not scattered
       randomly through calm markets. <strong>Nine of the ten best days happened during
       recessions</strong>, six of them during bear markets. Between 9 and 18 March 2020 — eight
       trading days — the market delivered three of its thirty best days <em>and</em> five of its
       thirty worst. They are interleaved. Any rule that gets you out before the worst days
       almost certainly gets you out before the best ones too.</p>`,
      `<p>There is a measurable cost to acting on fear. Morningstar data covering 60,000 funds
       over 26 years found investors earned about <strong>1.6 percentage points a year less</strong>
       than the funds they were invested in, purely from the timing of when they put money in and
       took it out. (You will see a much larger figure, around 8 points, quoted from a firm called
       DALBAR; independent researchers found that calculation compares two different things and
       the real gap is the smaller one. I am giving you the defensible number.)</p>`,
      `<p>And time is the thing most on your side: over the last century the US market rose in
       <strong>100% of rolling 20-year periods</strong>, but only about <strong>75% of rolling
       one-year periods</strong>.</p>`,
      `<p>So the realistic goal of this dashboard is not to call tops and bottoms. It is to tell
       you <em>what kind of environment you are in</em>, so you can size your risk sensibly, add
       more when conditions are historically favourable, and above all avoid panic-selling into
       exactly the week that contains the best days. That is a much lower bar and an achievable
       one.</p>`,
    ],
    takeaway:
      'Nobody reliably times tops and bottoms, and the best days hide inside the worst weeks. Read these metrics to judge the environment and size your risk — not to find a perfect entry.',
  },

  /* ---- What moves the price ----------------------------------------- */
  {
    id: 'cost-of-money',
    chapter: 'What moves the price',
    title: 'The cost of money sets the price of everything',
    body: [
      `<p>The Federal Reserve sets a short-term interest rate — the <strong>Fed funds rate</strong>
       — which is what banks charge each other overnight. Every other rate in the economy is
       built on top of it, so this one number quietly prices your mortgage, your savings
       account, and every share you own.</p>`,
      `<p>Here is the mechanism, because it is the single most useful thing to understand. A
       share is a claim on profits a company will earn in the future. To decide what that is
       worth today you have to ask: what would I otherwise earn risk-free? If government bonds
       pay nothing, future profits are worth paying a lot for. If bonds pay 5% guaranteed, those
       same future profits have to be discounted much harder, because you now have a decent
       alternative. <strong>Higher rates mechanically lower what any stream of future profit is
       worth</strong>, before a single thing changes about the company itself.</p>`,
      `<p>That is why 2022 happened. Company earnings were broadly fine; the rate used to value
       them went from near zero to over 4% in about a year, and prices fell to match. It is also
       why fast-growing technology companies fall hardest when rates rise — more of their value
       sits further in the future, so it gets discounted more.</p>`,
      `<p>Watch the shape of this line more than its level. Rapid rises are the squeeze. The
       first cut after a hiking cycle is one of the most-watched events in markets.</p>`,
    ],
    series: 'DFF',
    takeaway:
      'Rates are the gravity under every asset price. When the risk-free alternative pays more, everything else must get cheaper to compete.',
  },
  {
    id: 'inflation-and-the-fed',
    chapter: 'What moves the price',
    title: 'Inflation is the reason rates move',
    body: [
      `<p>If rates move markets, then whatever moves rates is upstream of everything. That is
       inflation. The Fed has a public target of <strong>2%</strong>, and it raises rates to pull
       inflation down and cuts them once it is comfortable.</p>`,
      `<p>So the practical question is never "is inflation high?" but "is it heading toward 2%
       fast enough for the Fed to stop squeezing?" Markets spend most of their time betting on
       that one thing.</p>`,
      `<p>Three versions get published and the differences matter:</p>`,
    ],
    series: 'PCEPILFE',
    thresholds: {
      intro: 'Which inflation number to look at, and why:',
      columns: ['Measure', 'What it is', 'Why you would use it'],
      rows: [
        ['CPI', 'Headline consumer prices', 'What the news reports. Includes food and petrol, so it is jumpy.'],
        ['Core CPI', 'CPI minus food and energy', 'Stripping the volatile bits shows the underlying trend.'],
        ['Core PCE', 'A different, broader basket', 'This is the one the Fed actually targets. Watch this to predict the Fed.'],
      ],
    },
    takeaway:
      "Core PCE near 2% is what lets the Fed cut. It runs lower than CPI, so judge it against the 2% target, not against the headline number you saw on the news.",
  },
  {
    id: 'fear-and-greed',
    chapter: 'What moves the price',
    title: 'Fear and greed, read backwards',
    body: [
      `<p>The Fear &amp; Greed index squeezes seven measures of market behaviour — how far prices
       sit above their average, how many shares are hitting highs versus lows, demand for
       safety, demand for risky debt, and volatility — into one number from 0 to 100.</p>`,
      `<p>The crucial thing is that you read it <strong>contrarian</strong>, meaning backwards
       from instinct. Extreme fear has historically been a better moment to buy than extreme
       greed, for a simple structural reason: when everyone who intends to sell has already
       sold, there is nobody left to push prices lower, and plenty of sidelined cash to push them
       up. The reverse is true at the top.</p>`,
      `<p>This is also why the index is near useless in the middle. A reading of 50 tells you
       nothing. The information is concentrated at the edges, which is true of most sentiment
       measures and is worth internalising as a general rule.</p>`,
      `<p>One honest caveat: "extreme fear" is not a buy signal with a date attached. Markets can
       stay fearful for months and fall further while doing it. It tells you about the
       <em>odds</em>, not the timing.</p>`,
    ],
    series: 'CNNFG',
    thresholds: {
      intro: 'How to read the 0–100 scale:',
      columns: ['Reading', 'Label', 'How to think about it'],
      rows: [
        ['0–24', 'Extreme fear', 'Historically the better side to be buying. Expect it to feel awful.'],
        ['25–44', 'Fear', 'Cautious, but normal. Mild tailwind for buyers.'],
        ['45–55', 'Neutral', 'No information. Ignore it.'],
        ['56–74', 'Greed', 'Comfortable, getting fully priced.'],
        ['75–100', 'Extreme greed', 'Crowded. A poor moment to be adding risk.'],
      ],
    },
    takeaway:
      'Sentiment is a contrarian indicator and only speaks at the extremes. Under 25 and over 75 carry information; the middle does not.',
  },
  {
    id: 'credit-early-warning',
    chapter: 'What moves the price',
    title: 'Credit breaks before stocks do',
    body: [
      `<p>This is the indicator most beginners have never heard of and the one professionals
       check first.</p>`,
      `<p>When a company borrows, it pays more than the US government does, because it might not
       pay you back. That extra amount is the <strong>credit spread</strong>. If the government
       pays 4% and a decent company pays 5.6%, the spread is 1.6 percentage points. That gap is
       the market's live, continuously-updated opinion on how likely companies are to get into
       trouble.</p>`,
      `<p>Why it leads: lenders face the problem earlier and more concretely than shareholders.
       A shareholder hopes for upside; a lender's best case is simply being repaid, so lenders
       pay attention to downside first and reprice at the first sign of strain. When spreads
       widen meaningfully while stocks are still calm, the stock market is usually the one that
       has not worked it out yet.</p>`,
      `<p>Watch the direction more than the level. A spread that is low but widening steadily is
       more informative than one that is high and stable.</p>`,
    ],
    series: 'BAA10Y',
    thresholds: {
      intro: 'Rough bands for the Baa corporate spread over the 10-year Treasury:',
      columns: ['Spread', 'Condition', 'What it implies'],
      rows: [
        ['Under 1.8 pp', 'Tight', 'Lenders relaxed, credit easy to get.'],
        ['1.8–2.5 pp', 'Normal', 'Unremarkable.'],
        ['2.5–3.5 pp', 'Widening', 'Lenders pricing real risk. Pay attention.'],
        ['Over 3.5 pp', 'Stressed', 'Historically coincides with or precedes equity trouble.'],
      ],
    },
    takeaway:
      'Credit spreads are an early warning system. Widening spreads during a calm stock market is one of the few genuinely leading signals you get.',
  },
  {
    id: 'yield-curve',
    chapter: 'What moves the price',
    title: 'The recession signal everyone quotes — and what it really says',
    body: [
      `<p>Normally, lending money for ten years pays more than lending for two, because you are
       tying your money up longer. When the two-year pays <em>more</em> than the ten-year, the
       curve is <strong>inverted</strong>, and that is the bond market saying it expects rates to
       be sharply lower in future — which generally means it expects the economy to weaken.</p>`,
      `<p>This lesson matters as much for <em>how</em> to think as for the indicator itself,
       because the yield curve is where beginners most often learn the wrong lesson.</p>`,
      `<p>The record, using the standard 10-year minus 3-month spread: inversions preceded
       <strong>8 of the 10 US recessions since 1957</strong> — 7 of 9 if you set aside 2020, which
       was caused by a pandemic no bond market could have forecast. It missed 1957 and 1960, and
       gave one outright false alarm in 1966.</p>`,
      `<p>Now the three caveats that matter more than the headline:</p>`,
    ],
    series: 'T10Y2Y',
    thresholds: {
      intro: 'What the historical record actually supports:',
      columns: ['Question', 'The honest answer'],
      rows: [
        ['How reliable?', '8 of 10 since 1957. But that is a sample of ten — treat the precision accordingly.'],
        ['How much warning?', '6 to 17 months, median 11.5. A signal tells you "probably coming", never "when".'],
        ['Is the base rate high anyway?', 'A recession began within 24 months in 27.6% of all months since 1953. The signal lifts that materially — it does not create it.'],
        ['Does un-inverting mean safe?', 'No. In the last four cases the recession began as the inversion ended or later. Reading that as an all-clear has been wrong every recent time.'],
        ['Right now', 'The 2022–24 inversion lasted 25 months and no recession has been dated yet. The case is genuinely still open.'],
      ],
    },
    takeaway:
      'The New York Fed publishes this as a probability, never a yes or no — twelve months before the 2007 recession it read only 39%. Copy that habit: treat every indicator here as shifting odds, not announcing outcomes.',
  },

  /* ---- What people are doing ----------------------------------------- */
  {
    id: 'sentiment-vs-behaviour',
    chapter: 'What people are doing',
    title: 'What people say versus what they do',
    body: [
      `<p>Sentiment surveys ask people how they feel. This section watches what they do with
       their money, and the gap between the two is often where the information is.</p>`,
      `<p><strong>Margin debt</strong> is money borrowed specifically to buy shares. Rising fast
       means confidence, but it is also fragility: borrowed positions get force-sold when prices
       fall, which pushes prices down further and triggers more forced selling. It converts a
       dip into a cascade.</p>`,
      `<p><strong>Household stock allocation</strong> is the share of all household wealth sitting
       in equities. This is the one worth sitting with. If households are already at record
       exposure, then the marginal buyer has largely been used up — the money that would push
       prices higher is already in. It is a measure of fuel remaining, and high readings have
       historically meant weak long-run returns ahead.</p>`,
      `<p><strong>The saving rate</strong> is the other side: income not spent, which is dry powder
       waiting to be deployed. Very low readings mean households are stretched and have little
       cushion for a shock.</p>`,
      `<p>Read these together with Fear &amp; Greed. When people <em>say</em> they are terrified but
       their money is still all-in, the fear has not actually been acted on yet, and that is a
       meaningfully different situation from fear plus heavy selling.</p>`,
    ],
    series: 'BOGZ1FL153064486Q',
    takeaway:
      'Positioning tells you how much buying power is left. Crowded positioning plus stated fear is not the same as capitulation — watch what the money does.',
  },
  {
    id: 'real-estate-clock',
    chapter: 'What people are doing',
    title: 'Real estate runs on a different clock',
    body: [
      `<p>Housing behaves nothing like stocks and this trips people up. A share trades in
       milliseconds; a house takes months to sell, costs several percent in fees to transact, and
       almost nobody sells below what they paid if they can avoid it. So housing does not crash
       the way equities do — <strong>it seizes up instead</strong>. Volume collapses long before
       prices move much.</p>`,
      `<p>That makes <em>activity</em> far more informative than price in housing, and it is why
       this dashboard tracks how briskly homes change hands.</p>`,
      `<p>The clearest single number is <strong>months of supply</strong>: at the current pace of
       sales, how long would the homes currently for sale last? Six months is the conventional
       dividing line between a sellers' market and a buyers' market. Pair it with
       <strong>days to sell</strong> and the direction of <strong>inventory</strong>.</p>`,
      `<p>Housing is also the most rate-sensitive thing in the economy, because almost everyone
       borrows to buy. Watch the 30-year mortgage rate: it does not follow the Fed funds rate
       directly, it tracks the 10-year Treasury.</p>`,
    ],
    series: 'MSACSR',
    thresholds: {
      intro: 'Reading the housing market from activity rather than price:',
      columns: ['Measure', 'Buyers in control', 'Sellers in control'],
      rows: [
        ['Months of supply', 'Above 6', 'Below 4'],
        ['Days to sell', 'Above 70', 'Below 40'],
        ['Inventory vs a year ago', 'Rising', 'Falling'],
      ],
    },
    takeaway:
      'In housing, volume moves before price. Rising supply and longer selling times hand negotiating power to buyers months before the price index reflects it.',
  },

  /* ---- Building a system ---------------------------------------------- */
  {
    id: 'engineering-mindset',
    chapter: 'Building a system',
    title: 'Thinking about this like an engineer',
    body: [
      `<p>You asked to approach this with an engineering mindset. That translates better than you
       might expect, because the core discipline is the same: define the measurement, know its
       error bars, and decide the rule before you see the result.</p>`,
      `<p><strong>Work in base rates, not verdicts.</strong> The useful question is never "is a
       crash coming?" but "how does this change the odds from the historical default?" A
       recession started within two years in 27.6% of all months since 1953. That is your
       baseline. An inverted curve raises it; it does not replace it. Every indicator here
       adjusts a probability.</p>`,
      `<p><strong>Respect the sample size.</strong> The yield curve's famous record rests on ten
       recessions. In engineering terms you would never ship a tolerance based on n=10 and quote
       it to two decimals. Treat "8 of 10" as "usually, with wide error bars".</p>`,
      `<p><strong>Separate signal from noise by timescale.</strong> A one-day move is noise. A
       three-month change in direction is a possible regime change. Nothing on this dashboard
       should be acted on because of a single print — this is also why monthly data gets revised,
       sometimes substantially.</p>`,
      `<p><strong>Know which instruments lead and which lag.</strong> This is the most practical
       distinction on the whole dashboard:</p>`,
    ],
    thresholds: {
      intro: 'Order the indicators by when they tell you something:',
      columns: ['Timing', 'Indicators', 'Use'],
      rows: [
        ['Leading', 'Credit spreads, yield curve, jobless claims, housing activity, financial conditions', 'Warn before the economy turns. Noisiest, most false alarms.'],
        ['Coincident', 'S&P 500, Fear & Greed, VIX, retail sales', 'Tell you where you are now.'],
        ['Lagging', 'Unemployment, GDP, inflation, home prices', 'Confirm what already happened. Never trade on these as news.'],
      ],
    },
    body2: [
      `<p><strong>Write the rule before the event.</strong> This is the one that actually saves
       money. "If the market falls 20% I will add to my position" is a decision made with a calm
       brain. Made during the fall, with your savings down a fifth and the news insisting it is
       different this time, you will not do it. Pre-commitment is the entire point — the rule's
       job is to protect you from yourself.</p>`,
      `<p><strong>State what would prove you wrong.</strong> If you cannot name the reading that
       would change your mind, you do not have a thesis, you have a feeling. Write it down next
       to the position.</p>`,
      `<p><strong>Size the position; that is the real lever.</strong> Beginners obsess over entry
       price and ignore how much they put in. Entry timing is mostly luck. Position size is fully
       in your control and determines whether a bad outcome is a lesson or a catastrophe. If a
       50% fall in something would force you to sell it, the position is too big — that is the
       whole test.</p>`,
      `<p><strong>Automate the default.</strong> Buying a fixed amount on a fixed schedule removes
       the timing decision entirely, which given the research in lesson 3 is a feature. Keep
       judgement for whether to add <em>extra</em> when conditions are unusually favourable.</p>`,
    ],
    takeaway:
      'Define the measurement, respect the error bars, write the rule before the event, and control size rather than entry. The goal is fewer unforced errors, not more predictions.',
  },
  {
    id: 'case-studies',
    chapter: 'Building a system',
    title: 'Four moments, and what this dashboard said',
    body: [
      `<p>Theory is cheap, so here is the test. Below are real readings pulled from the same data
       you have been browsing, at four turning points, with what the market actually did next —
       calculated from the price history, not from memory.</p>`,
      `<p>Read down each column and look for the pattern: at good buying moments, fear is extreme
       and the policy response is arriving. At poor ones, sentiment is comfortable, borrowing is
       high, and the Fed is about to tighten.</p>`,
    ],
    caseStudy: {
      series: ['SP500', 'CNNFG', 'VIXCLS', 'DFF', 'CPIAUCSL', 'BAA10Y', 'T10Y2Y'],
      moments: [
        {
          date: '2020-03-23',
          label: 'COVID crash bottom',
          what: `The fastest 30% fall in history. Volatility hit record levels, credit froze, and
            the Fed cut to zero and restarted bond buying. Everything felt terminal.`,
          lesson: `Extreme fear plus a forceful policy response. Note that this was also the week
            containing three of the thirty best days and five of the thirty worst — proof of why
            selling into panic is so expensive.`,
        },
        {
          date: '2022-01-03',
          label: 'The 2022 top',
          what: `Record highs. Sentiment comfortable, margin debt near peak, inflation already
            above 7% and the Fed signalling it would start hiking within weeks.`,
          lesson: `The warning was not in the price, it was in the context: hot inflation plus a
            tightening cycle about to begin plus crowded positioning. The price was the last thing
            to know.`,
        },
        {
          date: '2022-10-12',
          label: 'The 2022 bear bottom',
          what: `Down roughly 25% over nine months. Inflation still high, the curve inverting,
            and a near-universal consensus that recession was unavoidable.`,
          lesson: `Maximum pessimism, with inflation about to roll over. The recession everyone
            was certain about never arrived on schedule — a reminder that consensus is already in
            the price.`,
        },
        {
          date: 'latest',
          label: 'Today',
          what: `Read this one yourself using the table. It is deliberately mixed, which is what
            most real moments look like.`,
          lesson: `Notice the contradiction: sentiment is at extreme fear while borrowing to buy
            shares is up over 40% year on year and household equity allocation is near record.
            People say they are scared; their money says otherwise. Most of the time the honest
            answer is "mixed", and that is precisely when a pre-written rule beats a judgement
            call.`,
        },
      ],
    },
    takeaway:
      'Good buying moments felt terrible and showed extreme fear with policy support arriving. Poor ones felt comfortable, with crowded positioning and tightening ahead.',
  },
  {
    id: 'your-checklist',
    chapter: 'Building a system',
    title: 'A checklist you can actually run',
    body: [
      `<p>Here is the whole tutorial compressed into something you can run in five minutes on this
       dashboard. It does not produce a buy or sell instruction — nothing honestly can. It
       produces a read on the environment, which is what you then size your risk against.</p>`,
      `<p>Run it on a schedule, monthly rather than daily, and write the answers down so you can
       check your own reasoning later. Being able to audit your past thinking is how the error
       rate actually comes down.</p>`,
    ],
    checklist: [
      {
        q: '1. Where are we in the drawdown scale?',
        a: 'Check the S&P 500 drawdown signal. Deeper falls have historically meant better long-run entry points, not worse ones.',
      },
      {
        q: '2. What is the crowd doing?',
        a: 'Fear & Greed under 25 or over 75 carries information. Between 45 and 55, skip this step entirely.',
      },
      {
        q: '3. Is credit calm or cracking?',
        a: 'Corporate spread and financial conditions. Widening while stocks are calm is the single most useful warning you get.',
      },
      {
        q: '4. Which way is the Fed leaning?',
        a: 'Core PCE against the 2% target tells you whether cuts or hikes are more likely. Rate direction is the gravity under all prices.',
      },
      {
        q: '5. Is anything broken in the labour market?',
        a: 'Jobless claims lead; unemployment and the Sahm rule confirm. A rise off the lows is what historically ends cycles.',
      },
      {
        q: '6. How much buying power is left?',
        a: 'Margin debt, household stock allocation and the saving rate. Crowded positioning means less fuel for further gains.',
      },
      {
        q: '7. For housing specifically: who has the power?',
        a: 'Months of supply above 6 and rising days-to-sell mean buyers can negotiate, usually well before prices reflect it.',
      },
      {
        q: '8. What would prove me wrong?',
        a: 'Name the specific reading that would change your mind, and write it down next to the position. No answer means no thesis.',
      },
      {
        q: '9. Is this position small enough to be wrong?',
        a: 'If a 50% fall would force you to sell, it is too big. This is the only question on the list you fully control.',
      },
    ],
    takeaway:
      'Run it monthly, write the answers down, and judge the environment rather than predicting the turn. Controlling size and pre-committing to rules beats forecasting.',
  },
];
