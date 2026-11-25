#!/usr/bin/env node
// Pulls every series in series.mjs from FRED's public CSV endpoint and writes
// data/macro.json. No API key needed, which is why the CSV endpoint is used
// instead of the JSON API.
//
//   node scripts/fetch-data.mjs

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GROUPS, SERIES } from './series.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = resolve(ROOT, 'data/macro.json');

// Two years of runway before the 2020 default view so year-over-year
// transforms have a comparison point at the very left edge of the chart.
const START_DATE = '2018-01-01';
const ATTEMPTS = 3;

const UA = 'macro-dashboard (github.com/akoushke/macro-dashboard)';

// CNN's dataviz host rejects requests that do not look like a browser.
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  Referer: 'https://www.cnn.com/markets/fear-and-greed',
};

const isoOf = (ms) => new Date(ms).toISOString().slice(0, 10);

async function getJson(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Drops observations before START_DATE and sorts oldest first. */
function clean(pairs, id) {
  const kept = pairs
    .filter(([date, value]) => date >= START_DATE && Number.isFinite(value))
    .sort(([a], [b]) => (a < b ? -1 : 1));
  if (!kept.length) throw new Error(`${id}: no observations after ${START_DATE}`);
  return { dates: kept.map(([d]) => d), values: kept.map(([, v]) => v) };
}

async function fetchFred(id) {
  // `cosd` pins the start date; without it FRED returns its own default window,
  // which is only the last ten years for some series.
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(id)}&cosd=${START_DATE}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();
  const pairs = text
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => {
      const [date, raw] = line.split(',');
      // FRED writes "." for holidays and other gaps in a series.
      return [date, Number.parseFloat(raw)];
    });
  return clean(pairs, id);
}

async function fetchCnn(id) {
  // CNN serves a rolling window of roughly five years and returns a 500 for
  // anything older, so walk forward until a start date is accepted.
  const starts = [START_DATE, '2021-01-01', '2023-01-01', ''];
  let lastError;
  for (const start of starts) {
    try {
      const data = await getJson(
        `https://production.dataviz.cnn.io/index/fearandgreed/graphdata/${start}`,
        BROWSER_HEADERS
      );
      const series = clean(
        data.fear_and_greed_historical.data.map((p) => [isoOf(p.x), Number(p.y)]),
        id
      );
      const now = data.fear_and_greed;
      return {
        ...series,
        extras: {
          rating: now.rating,
          previousClose: now.previous_close,
          previousWeek: now.previous_1_week,
          previousMonth: now.previous_1_month,
          previousYear: now.previous_1_year,
        },
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function fetchCryptoFng(id) {
  const data = await getJson('https://api.alternative.me/fng/?limit=0&format=json', {
    'User-Agent': UA,
  });
  const series = clean(
    data.data.map((p) => [isoOf(Number(p.timestamp) * 1000), Number(p.value)]),
    id
  );
  return {
    ...series,
    extras: { rating: data.data[0].value_classification.toLowerCase() },
  };
}

const LOADERS = { fred: fetchFred, cnn: fetchCnn, cryptofng: fetchCryptoFng };

async function fetchSeries({ id, source = 'fred' }) {
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      return await LOADERS[source](id);
    } catch (error) {
      lastError = error;
      if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, attempt * 1500));
    }
  }
  throw lastError;
}

async function loadPrevious() {
  try {
    const previous = JSON.parse(await readFile(OUT_FILE, 'utf8'));
    return new Map(previous.series.map((s) => [s.id, s]));
  } catch {
    return new Map();
  }
}

async function main() {
  const previous = await loadPrevious();
  const failures = [];

  const series = await Promise.all(
    SERIES.map(async (meta) => {
      try {
        const { dates, values, extras } = await fetchSeries(meta);
        console.log(
          `ok    ${meta.id.padEnd(14)} ${String(values.length).padStart(5)} points, ` +
            `latest ${dates.at(-1)} = ${values.at(-1)}`
        );
        return { ...meta, dates, values, ...(extras ? { extras } : {}) };
      } catch (error) {
        // Serve yesterday's numbers rather than breaking the whole dashboard
        // because one series was briefly unavailable.
        const stale = previous.get(meta.id);
        failures.push(`${meta.id}: ${error.message}${stale ? ' (kept previous data)' : ''}`);
        console.error(`FAIL  ${meta.id.padEnd(14)} ${error.message}`);
        return stale ? { ...meta, dates: stale.dates, values: stale.values, ...(stale.extras ? { extras: stale.extras } : {}) } : null;
      }
    })
  );

  const kept = series.filter(Boolean);
  if (!kept.length) throw new Error('every series failed to fetch');

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(
    OUT_FILE,
    `${JSON.stringify({
      updated: new Date().toISOString(),
      source: 'Federal Reserve Bank of St. Louis (FRED)',
      startDate: START_DATE,
      groups: GROUPS,
      series: kept,
    })}\n`
  );

  console.log(`\nwrote ${OUT_FILE} with ${kept.length}/${SERIES.length} series`);
  if (failures.length) {
    console.error(`\n${failures.length} series had problems:\n  ${failures.join('\n  ')}`);
    // Only hard-fail when a series is missing entirely, not when stale data covered it.
    if (kept.length < SERIES.length) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
