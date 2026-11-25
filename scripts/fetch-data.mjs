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

function csvUrl(id) {
  // `cosd` pins the start date; without it FRED returns its own default window,
  // which is only the last ten years for some series.
  return `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(id)}&cosd=${START_DATE}`;
}

function parseCsv(text, id) {
  const dates = [];
  const values = [];
  const lines = text.trim().split('\n');

  for (const line of lines.slice(1)) {
    const [date, raw] = line.split(',');
    if (!date || date < START_DATE) continue;
    // FRED writes "." for holidays and other gaps in a series.
    const value = Number.parseFloat(raw);
    if (!Number.isFinite(value)) continue;
    dates.push(date);
    values.push(value);
  }

  if (!dates.length) throw new Error(`${id}: no observations after ${START_DATE}`);
  return { dates, values };
}

async function fetchSeries(id) {
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(csvUrl(id), {
        headers: { 'User-Agent': 'macro-dashboard (github.com/akoushke/macro-dashboard)' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseCsv(await res.text(), id);
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
        const { dates, values } = await fetchSeries(meta.id);
        console.log(
          `ok    ${meta.id.padEnd(14)} ${String(values.length).padStart(5)} points, ` +
            `latest ${dates.at(-1)} = ${values.at(-1)}`
        );
        return { ...meta, dates, values };
      } catch (error) {
        // Serve yesterday's numbers rather than breaking the whole dashboard
        // because one series was briefly unavailable.
        const stale = previous.get(meta.id);
        failures.push(`${meta.id}: ${error.message}${stale ? ' (kept previous data)' : ''}`);
        console.error(`FAIL  ${meta.id.padEnd(14)} ${error.message}`);
        return stale ? { ...meta, dates: stale.dates, values: stale.values } : null;
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
