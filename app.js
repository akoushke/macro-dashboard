/* Macro Dashboard — renders data/macro.json into charts, signals and a
   correlation table. No build step; Chart.js is loaded from a CDN. */

const PALETTE = [
  '#4da3ff', '#f7b955', '#3fb950', '#f85149', '#bc8cff', '#56d4dd',
  '#ff7b72', '#a5d6ff', '#d29922', '#7ee787', '#ffa198', '#d2a8ff',
];

const RANGES = {
  '2020': () => '2020-01-01',
  '5y': () => shiftYears(todayISO(), -5),
  '3y': () => shiftYears(todayISO(), -3),
  '1y': () => shiftYears(todayISO(), -1),
  ytd: () => `${new Date().getUTCFullYear()}-01-01`,
  max: () => '0000-01-01',
};

const state = {
  // First-time visitors land in the tutorial; the hash restores a chosen view.
  view: 'learn',
  level: 1,
  lesson: 0,
  range: '2020',
  compareMode: 'indexed',
  logScale: false,
  selected: new Set(['SP500', 'CBBTCUSD', 'DFF', 'CPIAUCSL']),
};

let DATA = null;
const charts = new Map();

/* ---- Shared crosshair ------------------------------------------------
   Hovering any chart places the same vertical line on every other chart and
   swaps each card's headline figure for its value on that date, so one pass
   of the cursor reads the whole dashboard at a single point in time. */

let hoverTs = null;
let hoverFrame = null;

/** Last observation at or before `ts`; economic prints stay in effect until the next one. */
function indexAt(timestamps, ts) {
  if (!timestamps.length || ts < timestamps[0]) return -1;
  let lo = 0;
  let hi = timestamps.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (timestamps[mid] <= ts) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function setHover(ts) {
  if (hoverTs === ts) return;
  hoverTs = ts;
  if (hoverFrame) return;
  hoverFrame = requestAnimationFrame(() => {
    hoverFrame = null;
    for (const chart of charts.values()) chart.render();
    updateReadouts();
    updateCompareTip();
  });
}

/* Chart.js' built-in index tooltip matches points by array position, so it can
   only ever resolve one of several series sampled at different frequencies.
   This reads every line at the hovered date instead. */
function updateCompareTip() {
  const chart = charts.get('compare');
  const tip = document.getElementById('compare-tip');
  if (!chart || !tip) return;

  const x = hoverTs === null ? -1 : chart.scales.x.getPixelForValue(hoverTs);
  if (x < chart.chartArea.left || x > chart.chartArea.right) {
    tip.hidden = true;
    return;
  }

  const indexed = state.compareMode === 'indexed';
  const rows = chart.$hover.lines
    .map((line) => {
      const i = indexAt(line.timestamps, hoverTs);
      if (i < 0) return '';
      const reading = indexed
        ? `${num(line.values[i], 1)} <span class="tip-raw">${formatValue(line.series, line.raw[i])}</span>`
        : formatValue(line.series, line.values[i]);
      return `<div class="tip-row">
        <span class="tip-dot" style="background:${line.color}"></span>
        <span class="tip-name">${line.series.name}</span>
        <span class="tip-value">${reading}</span>
      </div>`;
    })
    .join('');

  if (!rows) {
    tip.hidden = true;
    return;
  }

  const date = new Date(hoverTs).toISOString().slice(0, 10);
  tip.innerHTML = `<div class="tip-date">${prettyDate(date)}</div>${rows}`;
  tip.hidden = false;

  // Flip to the left of the crosshair when it would overflow the chart.
  const { canvas } = chart;
  const left = x + canvas.offsetLeft;
  const flip = left + tip.offsetWidth + 16 > canvas.offsetLeft + chart.chartArea.right;
  tip.style.left = `${flip ? left - tip.offsetWidth - 14 : left + 14}px`;
  tip.style.top = `${canvas.offsetTop + chart.chartArea.top + 8}px`;
}

function updateReadouts() {
  for (const [key, chart] of charts) {
    if (!key.startsWith('chart-')) continue;
    const { series, dates, values } = chart.$hover;
    const { timestamps } = chart.$hover.lines[0];
    const card = chart.canvas.closest('.card');
    if (!card) continue;

    const i = hoverTs === null ? values.length - 1 : indexAt(timestamps, hoverTs);
    const hasPoint = i >= 0;
    card.querySelector('.card-latest').textContent = hasPoint ? formatValue(series, values[i]) : '—';
    card.querySelector('.card-sub').textContent = hasPoint
      ? `${hoverTs === null ? 'as of' : ''} ${prettyDate(dates[i])}`.trim()
      : 'no reading yet';
    card.classList.toggle('is-scrubbing', hoverTs !== null);
  }
}

const crosshairPlugin = {
  id: 'crosshair',
  afterDatasetsDraw(chart) {
    if (hoverTs === null || !chart.$hover) return;
    const { ctx, chartArea, scales } = chart;
    const x = scales.x.getPixelForValue(hoverTs);
    if (x < chartArea.left || x > chartArea.right) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(230,233,239,0.5)';
    ctx.stroke();

    for (const line of chart.$hover.lines) {
      const i = indexAt(line.timestamps, hoverTs);
      if (i < 0) continue;
      const y = scales.y.getPixelForValue(line.values[i]);
      if (y < chartArea.top || y > chartArea.bottom) continue;
      ctx.beginPath();
      ctx.arc(scales.x.getPixelForValue(line.timestamps[i]), y, 3, 0, Math.PI * 2);
      ctx.fillStyle = line.color;
      ctx.fill();
    }
    ctx.restore();
  },
};

/** Lets a chart participate in the shared crosshair. */
function trackHover(chart, hover) {
  chart.$hover = hover;
  const { canvas } = chart;
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    setHover(chart.scales.x.getValueForPixel(event.clientX - rect.left));
  });
  canvas.addEventListener('mouseleave', () => setHover(null));
}

/* ---- Date helpers ---------------------------------------------------- */

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function shiftYears(iso, delta) {
  const [y, m, d] = iso.split('-');
  return `${Number(y) + delta}-${m}-${d}`;
}

function shiftMonths(iso, delta) {
  const [y, m, d] = iso.split('-').map(Number);
  const total = y * 12 + (m - 1) + delta;
  const year = Math.floor(total / 12);
  const month = String((total % 12) + 1).padStart(2, '0');
  return `${year}-${month}-${String(d).padStart(2, '0')}`;
}

function daysBetween(isoA, isoB) {
  return Math.abs(Date.parse(isoA) - Date.parse(isoB)) / 86400000;
}

/** Index of the observation closest to `target`, assuming `dates` is sorted. */
function closestIndex(dates, target) {
  let lo = 0;
  let hi = dates.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (dates[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && daysBetween(dates[lo - 1], target) < daysBetween(dates[lo], target)) return lo - 1;
  return lo;
}

/* ---- Transforms ------------------------------------------------------ */

/** Applies the series' default transform, returning plain parallel arrays. */
function transformed(series) {
  const { dates, values, transform } = series;

  if (transform === 'yoy') {
    const outDates = [];
    const outValues = [];
    for (let i = 0; i < dates.length; i += 1) {
      const target = shiftYears(dates[i], -1);
      const j = closestIndex(dates, target);
      // Monthly and quarterly series land within a few days of the anniversary;
      // anything further apart is a gap and would produce a bogus growth rate.
      if (j >= i || daysBetween(dates[j], target) > 45 || !values[j]) continue;
      outDates.push(dates[i]);
      outValues.push(((values[i] - values[j]) / Math.abs(values[j])) * 100);
    }
    return { dates: outDates, values: outValues };
  }

  if (transform === 'mom_diff') {
    return {
      dates: dates.slice(1),
      values: values.slice(1).map((v, i) => v - values[i]),
    };
  }

  return { dates, values };
}

function sliceFrom({ dates, values }, start) {
  let i = 0;
  while (i < dates.length && dates[i] < start) i += 1;
  return { dates: dates.slice(i), values: values.slice(i) };
}

/** Transformed series clipped to the active range, memoised per render pass. */
function viewOf(series) {
  return sliceFrom(transformed(series), RANGES[state.range]());
}

/* ---- Formatting ------------------------------------------------------ */

function num(value, digits = 2) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Like `num`, but keeps whole numbers clean so an axis zero reads "0", not "0.0". */
function trim(value, digits) {
  return num(value, Number.isInteger(value) ? 0 : digits);
}

function formatValue(series, value) {
  if (!Number.isFinite(value)) return '—';
  const { unit, transform } = series;

  if (transform === 'yoy') return `${num(value, 1)}%`;

  switch (unit) {
    case 'pct':
      return `${num(value, 2)}%`;
    case 'pp':
      return `${num(value, 2)} pp`;
    case 'z':
      return num(value, 2);
    case 'score':
      return num(value, 0);
    case 'days':
      return `${num(value, 0)} days`;
    case 'months':
      return `${num(value, 1)} mo`;
    case 'usd':
      return Math.abs(value) >= 1000
        ? `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        : `$${trim(value, 2)}`;
    case 'k': {
      if (transform === 'mom_diff') return `${value >= 0 ? '+' : ''}${num(value, 0)}k`;
      return Math.abs(value) >= 1000 ? `${num(value / 1000, 2)}M` : `${num(value, 0)}k`;
    }
    case 'm': {
      const abs = Math.abs(value);
      if (abs >= 1e6) return `$${num(value / 1e6, 2)}T`;
      if (abs >= 1e3) return `$${num(value / 1e3, 1)}B`;
      return `$${num(value, 0)}M`;
    }
    case 'count':
      return Math.abs(value) >= 1000 ? `${num(value / 1000, 0)}k` : num(value, 0);
    default:
      return Math.abs(value) >= 1000 ? num(value, 0) : trim(value, 1);
  }
}

/** True when a change is better expressed in points than in percent. */
function isRateLike(series) {
  return (
    ['pct', 'pp', 'z', 'score', 'days', 'months'].includes(series.unit) ||
    series.transform === 'yoy' ||
    series.transform === 'mom_diff'
  );
}

function changeOverRange(series, values) {
  if (values.length < 2) return null;
  const first = values[0];
  const last = values.at(-1);

  if (isRateLike(series)) {
    const delta = last - first;
    const sign = delta >= 0 ? '+' : '';
    let text;
    if (series.transform === 'mom_diff') text = `${sign}${num(delta, 0)}k`;
    else if (series.unit === 'days') text = `${sign}${num(delta, 0)} days`;
    else if (series.unit === 'months') text = `${sign}${num(delta, 1)} mo`;
    else if (series.unit === 'score') text = `${sign}${num(delta, 0)} pts`;
    else if (series.unit === 'z') text = `${sign}${num(delta, 2)} pts`;
    else text = `${sign}${num(delta, 2)} pp`;
    return { delta, text };
  }

  const pct = ((last - first) / Math.abs(first)) * 100;
  return { delta: pct, text: `${pct >= 0 ? '+' : ''}${num(pct, 1)}%` };
}

function changeClass(series, delta) {
  if (Math.abs(delta) < 1e-9) return 'flat';
  const rising = delta > 0;
  if (series.direction === 'up_good') return rising ? 'up' : 'down';
  if (series.direction === 'up_bad') return rising ? 'down' : 'up';
  return 'flat';
}

function prettyDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/* ---- Charts ---------------------------------------------------------- */

function configureChartDefaults() {
  const { defaults } = Chart;
  defaults.color = '#8a93a6';
  defaults.font.family = getComputedStyle(document.body).fontFamily;
  defaults.font.size = 11;
  defaults.animation = false;
  defaults.maintainAspectRatio = false;
  defaults.elements.point.radius = 0;
  defaults.elements.point.hitRadius = 12;
  defaults.elements.line.borderWidth = 1.8;
  defaults.elements.line.tension = 0;
  Chart.register(crosshairPlugin);
}

function destroyChart(key) {
  charts.get(key)?.destroy();
  charts.delete(key);
}

function toTimestamps(dates) {
  return dates.map((d) => Date.parse(`${d}T00:00:00Z`));
}

function points(dates, values) {
  return toTimestamps(dates).map((x, i) => ({ x, y: values[i] }));
}

function timeScale(extra = {}) {
  return {
    type: 'time',
    time: { unit: 'month' },
    ticks: {
      maxRotation: 0,
      autoSkip: true,
      autoSkipPadding: 24,
      maxTicksLimit: 5,
      padding: 6,
    },
    grid: { color: 'rgba(37,45,59,0.6)', drawTicks: false },
    border: { display: false },
    ...extra,
  };
}

function colorFor(id) {
  const i = DATA.series.findIndex((s) => s.id === id);
  return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
}

function renderCardChart(canvas, series, view) {
  const color = colorFor(series.id);

  destroyChart(canvas.id);
  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [
        {
          data: points(view.dates, view.values),
          borderColor: color,
          backgroundColor: `${color}1f`,
          fill: true,
        },
      ],
    },
    options: {
      parsing: false,
      normalized: true,
      layout: { padding: { top: 6, right: 8 } },
      plugins: {
        legend: { display: false },
        decimation: { enabled: true, algorithm: 'lttb', samples: 260 },
        // The shared crosshair reports values in the card header instead.
        tooltip: { enabled: false },
      },
      scales: {
        x: timeScale(),
        y: {
          ticks: {
            maxTicksLimit: 5,
            padding: 8,
            callback: (v) => formatValue(series, v),
          },
          grid: { color: 'rgba(37,45,59,0.6)', drawTicks: false },
          border: { display: false },
          grace: '8%',
        },
      },
    },
  });

  charts.set(canvas.id, chart);
  trackHover(chart, {
    series,
    dates: view.dates,
    values: view.values,
    lines: [{ timestamps: toTimestamps(view.dates), values: view.values, color }],
  });
}

/* ---- Overview -------------------------------------------------------- */

function renderGroups() {
  const host = document.getElementById('groups');
  host.innerHTML = '';

  for (const group of DATA.groups) {
    const members = DATA.series.filter((s) => s.group === group.id && s.level <= state.level);
    if (!members.length) continue;

    const section = document.createElement('section');
    section.id = `sec-${group.id}`;
    section.innerHTML = `
      <div class="section-head">
        <h2>${group.name}</h2>
        ${group.blurb ? `<p>${group.blurb}</p>` : ''}
      </div>
      <div class="card-grid"></div>`;
    const grid = section.querySelector('.card-grid');

    for (const series of members) {
      const view = viewOf(series);
      const change = changeOverRange(series, view.values);
      const latest = view.values.at(-1);
      const canvasId = `chart-${series.id}`;

      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-head">
          <div>
            <div class="card-title">${series.name}</div>
            <div class="card-sub">${view.dates.length ? `as of ${prettyDate(view.dates.at(-1))}` : 'no data in range'}</div>
          </div>
          <div>
            <div class="card-latest">${formatValue(series, latest)}</div>
            <div class="card-change ${change ? changeClass(series, change.delta) : 'flat'}">
              ${change ? `${change.text} over range` : ''}
            </div>
          </div>
        </div>
        <div class="chart-box"><canvas id="${canvasId}"></canvas></div>
        <p class="card-note">${series.note}</p>
        <a class="card-link" href="${series.url ?? `https://fred.stlouisfed.org/series/${series.id}`}"
           target="_blank" rel="noopener">${series.sourceLabel ?? `FRED: ${series.id}`} ↗</a>`;

      grid.append(card);
      renderCardChart(card.querySelector('canvas'), series, view);
    }

    host.append(section);
  }
}

/* ---- Learn ------------------------------------------------------------
   A linear tutorial. Lesson content lives in lessons.js; anything numeric is
   computed from the same data the dashboard uses, so the tutorial can never
   quote a figure the charts disagree with. */

const seriesById = (id) => DATA.series.find((s) => s.id === id);

/** Value of a series on a given date, using the last reading at or before it.
    Applies the series' transform so an inflation row reports the rate, not the
    underlying price index. */
function valueOn(series, iso) {
  const data = transformed(series);
  const i = iso === 'latest' ? data.dates.length - 1 : closestIndexAtOrBefore(data.dates, iso);
  if (i < 0) return null;
  return { value: data.values[i], date: data.dates[i] };
}

function closestIndexAtOrBefore(dates, iso) {
  if (!dates.length || dates[0] > iso) return -1;
  let lo = 0;
  let hi = dates.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (dates[mid] <= iso) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Actual forward price change, so case studies report fact rather than memory. */
function forwardReturn(id, fromIso, months) {
  const series = seriesById(id);
  if (!series) return null;
  const start = valueOn(series, fromIso);
  const end = valueOn(series, shiftMonths(start.date, months));
  if (!start || !end || end.date <= start.date) return null;
  return ((end.value - start.value) / start.value) * 100;
}

function lessonChart(series) {
  const view = sliceFrom(transformed(series), '2020-01-01');
  return `
    <div class="lesson-chart">
      <div class="lesson-chart-head">
        <div>
          <div class="card-title">${series.name}</div>
          <div class="card-sub">${series.note}</div>
        </div>
        <div class="card-latest">${formatValue(series, view.values.at(-1))}</div>
      </div>
      <div class="chart-box"><canvas id="chart-lesson"></canvas></div>
    </div>`;
}

function thresholdTable({ intro, columns, rows }) {
  return `
    <div class="lesson-table">
      ${intro ? `<p class="lesson-table-intro">${intro}</p>` : ''}
      <table>
        <thead><tr>${columns.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map((r) => `<tr>${r.map((c, i) => `<td${i === 0 ? ' class="key-col"' : ''}>${c}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function caseStudyBlock({ series: ids, moments }) {
  const rows = ids
    .map((id) => {
      const series = seriesById(id);
      if (!series) return '';
      const cells = moments
        .map((m) => {
          const hit = valueOn(series, m.date);
          return `<td>${hit ? formatValue(series, hit.value) : '—'}</td>`;
        })
        .join('');
      return `<tr><td class="key-col">${series.name}</td>${cells}</tr>`;
    })
    .join('');

  const forward = moments
    .map((m) => {
      const r = forwardReturn('SP500', m.date, 12);
      if (r === null) return '<td class="fwd">still running</td>';
      return `<td class="fwd ${r >= 0 ? 'up' : 'down'}">${r >= 0 ? '+' : ''}${num(r, 1)}%</td>`;
    })
    .join('');

  const notes = moments
    .map(
      (m) => `
      <div class="moment">
        <h4>${m.label} <span>${m.date === 'latest' ? 'now' : prettyDate(m.date)}</span></h4>
        <p>${m.what}</p>
        <p class="moment-lesson">${m.lesson}</p>
      </div>`
    )
    .join('');

  return `
    <div class="lesson-table case-table">
      <table>
        <thead>
          <tr>
            <th>Reading</th>
            ${moments.map((m) => `<th>${m.label}<br /><span class="th-date">${m.date === 'latest' ? 'now' : prettyDate(m.date)}</span></th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="fwd-row"><td class="key-col">S&amp;P 500 one year later</td>${forward}</tr>
        </tbody>
      </table>
    </div>
    <div class="moments">${notes}</div>`;
}

function checklistBlock(items) {
  return `<ol class="checklist">${items
    .map((i) => `<li><strong>${i.q}</strong><span>${i.a}</span></li>`)
    .join('')}</ol>`;
}

function renderLessonNav() {
  const lessons = window.LESSONS;
  let html = '';
  let chapter = null;
  lessons.forEach((lesson, i) => {
    if (lesson.chapter !== chapter) {
      chapter = lesson.chapter;
      html += `<div class="lesson-chapter">${chapter}</div>`;
    }
    html += `
      <a class="side-link lesson-link${i === state.lesson ? ' is-active' : ''}"
         href="#lesson-${i}" data-lesson="${i}">
        <span>${lesson.title}</span>
        ${i < state.lesson ? '<span class="side-count done">✓</span>' : ''}
      </a>`;
  });
  document.getElementById('lesson-nav').innerHTML = html;
}

function renderLearn() {
  const lessons = window.LESSONS;
  const lesson = lessons[state.lesson];
  destroyChart('chart-lesson');

  const series = lesson.series ? seriesById(lesson.series) : null;
  const parts = [
    `<div class="lesson-chapter-tag">${lesson.chapter}</div>`,
    `<h2 class="lesson-title">${lesson.title}</h2>`,
    ...lesson.body,
    series ? lessonChart(series) : '',
    lesson.thresholds ? thresholdTable(lesson.thresholds) : '',
    ...(lesson.body2 ?? []),
    lesson.caseStudy ? caseStudyBlock(lesson.caseStudy) : '',
    lesson.checklist ? checklistBlock(lesson.checklist) : '',
    `<div class="takeaway"><strong>The point</strong>${lesson.takeaway}</div>`,
  ];

  document.getElementById('lesson').innerHTML = parts.join('');

  if (series) {
    renderCardChart(
      document.getElementById('chart-lesson'),
      series,
      sliceFrom(transformed(series), '2020-01-01')
    );
  }

  document.getElementById('learn-bar').style.width = `${((state.lesson + 1) / lessons.length) * 100}%`;
  document.getElementById('lesson-count').textContent = `Lesson ${state.lesson + 1} of ${lessons.length}`;
  document.getElementById('lesson-prev').disabled = state.lesson === 0;
  const next = document.getElementById('lesson-next');
  next.disabled = state.lesson === lessons.length - 1;
  next.textContent = state.lesson === lessons.length - 1 ? 'Finished' : 'Next →';

  renderLessonNav();
}

function goToLesson(index) {
  state.lesson = Math.max(0, Math.min(index, window.LESSONS.length - 1));
  syncHash();
  renderLearn();
  document.getElementById('view-learn').scrollIntoView({ block: 'start' });
}

function wireLearn() {
  document.getElementById('lesson-prev').addEventListener('click', () => goToLesson(state.lesson - 1));
  document.getElementById('lesson-next').addEventListener('click', () => goToLesson(state.lesson + 1));
  document.getElementById('lesson-nav').addEventListener('click', (event) => {
    const link = event.target.closest('.lesson-link');
    if (!link) return;
    event.preventDefault();
    goToLesson(Number(link.dataset.lesson));
  });
}

/* ---- Section navigation ----------------------------------------------
   Lists the Overview's sections down the left and highlights whichever one the
   reader is currently looking at. */

function sectionList() {
  return [
    { id: 'sec-gauges', label: 'Fear & Greed', count: DATA.series.filter((s) => s.gauge).length },
    { id: 'sec-signals', label: 'Signals', count: buildSignals().length },
    ...DATA.groups
      .map((group) => ({
        id: `sec-${group.id}`,
        label: group.name,
        count: DATA.series.filter((s) => s.group === group.id && s.level <= state.level).length,
      }))
      .filter((entry) => entry.count > 0),
  ];
}

function renderSideNav() {
  document.getElementById('side-nav').innerHTML = sectionList()
    .map(
      ({ id, label, count }) => `
      <a class="side-link" href="#${id}" data-section="${id}">
        <span>${label}</span>
        <span class="side-count">${count}</span>
      </a>`
    )
    .join('');
}

function highlightSection() {
  const links = [...document.querySelectorAll('.side-link')];
  if (!links.length) return;

  // Whichever section's heading has most recently passed under the toolbar.
  const cutoff = 140;
  let active = links[0];
  for (const link of links) {
    const target = document.getElementById(link.dataset.section);
    if (target && target.getBoundingClientRect().top <= cutoff) active = link;
  }
  // At the very bottom the last section may never reach the cutoff.
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) active = links.at(-1);

  for (const link of links) link.classList.toggle('is-active', link === active);
}

function wireSideNav() {
  document.getElementById('side-nav').addEventListener('click', (event) => {
    const link = event.target.closest('.side-link');
    if (!link) return;
    // Scrolling is handled here so the URL hash stays reserved for view state.
    event.preventDefault();
    document.getElementById(link.dataset.section)?.scrollIntoView({ behavior: 'smooth' });
  });

  let frame = null;
  window.addEventListener(
    'scroll',
    () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        highlightSection();
      });
    },
    { passive: true }
  );
}

/* ---- Fear & Greed gauges --------------------------------------------- */

const FG_ZONES = [
  { to: 25, color: '#f85149', label: 'Extreme fear' },
  { to: 45, color: '#f0883e', label: 'Fear' },
  { to: 55, color: '#d29922', label: 'Neutral' },
  { to: 75, color: '#7ee787', label: 'Greed' },
  { to: 100, color: '#3fb950', label: 'Extreme greed' },
];

const GAUGE_HELP = {
  stocks:
    "Fear &amp; Greed, stocks|CNN's composite of seven market internals: price momentum against the 200-day average, the strength and breadth of advances, put-versus-call volume, junk bond demand, volatility, and safe-haven demand. 0 is maximum fear, 100 is maximum greed.",
  crypto:
    'Fear &amp; Greed, crypto|The same 0-100 idea for Bitcoin, weighted toward price volatility, trading momentum and volume, social activity and market dominance. It swings harder and faster than the stock version.',
};

function shiftDays(iso, delta) {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + delta * 86400000).toISOString().slice(0, 10);
}

function zoneOf(value) {
  return FG_ZONES.find((z) => value <= z.to) ?? FG_ZONES.at(-1);
}

function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** Arc across the top half of the dial, where 0 is hard left and 100 hard right. */
function arcPath(cx, cy, r, fromValue, toValue) {
  const [x1, y1] = polar(cx, cy, r, 180 + (fromValue / 100) * 180);
  const [x2, y2] = polar(cx, cy, r, 180 + (toValue / 100) * 180);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function gaugeSvg(value) {
  const cx = 120;
  const cy = 112;
  const r = 90;
  const zone = zoneOf(value);

  const bands = FG_ZONES.map((z, i) => {
    const from = i === 0 ? 0 : FG_ZONES[i - 1].to;
    // Hairline gap between bands so the boundaries stay legible.
    const pad = 0.6;
    return `<path d="${arcPath(cx, cy, r, from + pad, z.to - pad)}" stroke="${z.color}"
      stroke-width="15" fill="none" opacity="${z === zone ? 1 : 0.28}" stroke-linecap="butt" />`;
  }).join('');

  const angle = 180 + (Math.min(Math.max(value, 0), 100) / 100) * 180;
  const [nx, ny] = polar(cx, cy, r - 15, angle);
  const [bx, by] = polar(cx, cy, 5.5, angle + 90);
  const [bx2, by2] = polar(cx, cy, 5.5, angle - 90);

  return `<svg viewBox="0 0 240 132" class="gauge-svg" role="img"
      aria-label="${num(value, 0)} out of 100, ${zone.label}">
      ${bands}
      <polygon points="${nx.toFixed(1)},${ny.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)} ${bx2.toFixed(1)},${by2.toFixed(1)}"
        fill="${zone.color}" />
      <circle cx="${cx}" cy="${cy}" r="6" fill="${zone.color}" />
      <text x="12" y="128" class="gauge-end">0</text>
      <text x="228" y="128" class="gauge-end" text-anchor="end">100</text>
    </svg>`;
}

function renderGauges() {
  const host = document.getElementById('gauge-grid');
  const gauges = DATA.series.filter((s) => s.gauge);

  host.innerHTML = gauges
    .map((series) => {
      const value = series.values.at(-1);
      const zone = zoneOf(value);
      const last = series.dates.at(-1);

      const history = [
        ['1 week ago', shiftDays(last, -7)],
        ['1 month ago', shiftMonths(last, -1)],
        ['1 year ago', shiftYears(last, -1)],
      ]
        .map(([label, target]) => {
          const j = closestIndex(series.dates, target);
          const past = series.values[j];
          if (!Number.isFinite(past) || series.dates[j] >= last) return '';
          return `<div class="gauge-past">
            <span>${label}</span>
            <b style="color:${zoneOf(past).color}">${num(past, 0)}</b>
          </div>`;
        })
        .join('');

      return `<article class="card gauge-card" data-help="${GAUGE_HELP[series.gauge]}">
        <div class="gauge-head">
          <div>
            <div class="card-title">${series.name.match(/\(([^)]+)\)/)?.[1] ?? series.name}</div>
            <div class="card-sub">as of ${prettyDate(last)}</div>
          </div>
          <a class="card-link" href="${series.url}" target="_blank" rel="noopener">${series.sourceLabel} ↗</a>
        </div>
        ${gaugeSvg(value)}
        <div class="gauge-reading">
          <div class="gauge-value" style="color:${zone.color}">${num(value, 0)}</div>
          <div class="gauge-rating" style="color:${zone.color}">${zone.label}</div>
        </div>
        <div class="gauge-history">${history}</div>
      </article>`;
    })
    .join('');
}

/* ---- Signals --------------------------------------------------------- */

function latestOf(id, useTransform = true) {
  const series = DATA.series.find((s) => s.id === id);
  if (!series) return null;
  const data = useTransform ? transformed(series) : series;
  if (!data.values.length) return null;
  return { series, value: data.values.at(-1), date: data.dates.at(-1), data };
}

function band(value, bands) {
  return bands.find((b) => value < b.below) ?? bands.at(-1);
}

function buildSignals() {
  const out = [];
  const push = (label, value, scored, note) => {
    if (!scored) return;
    out.push({ label, value, status: scored.status, verdict: scored.verdict, note });
  };

  const curve = latestOf('T10Y2Y');
  if (curve) {
    push(
      'Yield curve',
      `${num(curve.value, 2)}%`,
      band(curve.value, [
        { below: -0.1, status: 'bad', verdict: 'Inverted' },
        { below: 0.25, status: 'warn', verdict: 'Flat' },
        { below: Infinity, status: 'good', verdict: 'Normal' },
      ]),
      '10-year minus 2-year Treasury. Inversion has led every modern recession.'
    );
  }

  const credit = latestOf('BAA10Y');
  if (credit) {
    push(
      'Credit spreads',
      `${num(credit.value, 2)}%`,
      band(credit.value, [
        { below: 1.8, status: 'good', verdict: 'Tight' },
        { below: 2.5, status: 'good', verdict: 'Normal' },
        { below: 3.5, status: 'warn', verdict: 'Widening' },
        { below: Infinity, status: 'bad', verdict: 'Stressed' },
      ]),
      'Baa corporate yield over the 10-year. Widening is the earliest risk-off tell.'
    );
  }

  const nfci = latestOf('NFCI');
  if (nfci) {
    push(
      'Financial conditions',
      num(nfci.value, 2),
      band(nfci.value, [
        { below: -0.2, status: 'good', verdict: 'Loose' },
        { below: 0.2, status: 'good', verdict: 'Neutral' },
        { below: 0.5, status: 'warn', verdict: 'Tightening' },
        { below: Infinity, status: 'bad', verdict: 'Tight' },
      ]),
      'Chicago Fed NFCI. Below zero means money is easier to come by than usual.'
    );
  }

  const fg = latestOf('CNNFG');
  if (fg) {
    // Deliberately inverted: crowd fear has historically been the better entry.
    push(
      'Crowd sentiment',
      num(fg.value, 0),
      band(fg.value, [
        { below: 25, status: 'good', verdict: 'Extreme fear' },
        { below: 45, status: 'good', verdict: 'Fear' },
        { below: 55, status: 'warn', verdict: 'Neutral' },
        { below: 75, status: 'warn', verdict: 'Greed' },
        { below: Infinity, status: 'bad', verdict: 'Extreme greed' },
      ]),
      'Fear & Greed, 0 to 100. Scored contrarian: fear has been the better time to buy.'
    );
  }

  const vix = latestOf('VIXCLS');
  if (vix) {
    push(
      'Volatility',
      num(vix.value, 1),
      band(vix.value, [
        { below: 15, status: 'good', verdict: 'Calm' },
        { below: 20, status: 'good', verdict: 'Normal' },
        { below: 30, status: 'warn', verdict: 'Elevated' },
        { below: Infinity, status: 'bad', verdict: 'Panic' },
      ]),
      'VIX. Higher readings argue for smaller positions.'
    );
  }

  const corePce = latestOf('PCEPILFE');
  if (corePce) {
    push(
      'Inflation vs target',
      `${num(corePce.value, 1)}%`,
      band(corePce.value, [
        { below: 2.2, status: 'good', verdict: 'At target' },
        { below: 3, status: 'warn', verdict: 'Above target' },
        { below: Infinity, status: 'bad', verdict: 'Running hot' },
      ]),
      "Core PCE year over year against the Fed's 2% goal."
    );
  }

  const ff = latestOf('DFF');
  const cpi = latestOf('CPIAUCSL');
  if (ff && cpi) {
    const real = ff.value - cpi.value;
    push(
      'Real policy rate',
      `${num(real, 2)}%`,
      band(real, [
        { below: 0, status: 'good', verdict: 'Accommodative' },
        { below: 1, status: 'good', verdict: 'Near neutral' },
        { below: Infinity, status: 'warn', verdict: 'Restrictive' },
      ]),
      'Fed funds minus CPI inflation. Positive means policy is squeezing growth.'
    );
  }

  const fed = DATA.series.find((s) => s.id === 'WALCL');
  if (fed && fed.values.length > 14) {
    const j = closestIndex(fed.dates, shiftMonths(fed.dates.at(-1), -3));
    const pct = ((fed.values.at(-1) - fed.values[j]) / fed.values[j]) * 100;
    push(
      'Fed liquidity',
      `${pct >= 0 ? '+' : ''}${num(pct, 1)}%`,
      band(pct, [
        { below: -0.5, status: 'warn', verdict: 'Tightening' },
        { below: 0.5, status: 'good', verdict: 'Flat' },
        { below: Infinity, status: 'good', verdict: 'Expanding' },
      ]),
      'Three-month change in the Fed balance sheet. Shrinking is QT.'
    );
  }

  const sahm = latestOf('SAHMREALTIME');
  if (sahm) {
    push(
      'Sahm rule',
      num(sahm.value, 2),
      band(sahm.value, [
        { below: 0.3, status: 'good', verdict: 'Clear' },
        { below: 0.5, status: 'warn', verdict: 'Rising' },
        { below: Infinity, status: 'bad', verdict: 'Triggered' },
      ]),
      'Unemployment recession trigger. 0.50 and above has marked every downturn.'
    );
  }

  const spx = DATA.series.find((s) => s.id === 'SP500');
  if (spx) {
    const peak = Math.max(...spx.values);
    const drawdown = ((spx.values.at(-1) - peak) / peak) * 100;
    push(
      'S&P 500 drawdown',
      `${num(drawdown, 1)}%`,
      band(drawdown, [
        { below: -20, status: 'bad', verdict: 'Bear market' },
        { below: -10, status: 'warn', verdict: 'Correction' },
        { below: -5, status: 'good', verdict: 'Pullback' },
        { below: Infinity, status: 'good', verdict: 'Near highs' },
      ]),
      'Distance below the highest close in this dataset.'
    );
  }

  const unrate = DATA.series.find((s) => s.id === 'UNRATE');
  if (unrate && unrate.values.length > 12) {
    const window = unrate.values.slice(-13);
    const rise = unrate.values.at(-1) - Math.min(...window);
    push(
      'Unemployment trend',
      `${rise >= 0 ? '+' : ''}${num(rise, 1)} pp`,
      band(rise, [
        { below: 0.3, status: 'good', verdict: 'Stable' },
        { below: 0.5, status: 'warn', verdict: 'Drifting up' },
        { below: Infinity, status: 'bad', verdict: 'Deteriorating' },
      ]),
      'Rise off the 12-month low. Labor markets break slowly, then quickly.'
    );
  }

  return out;
}

function renderSignals() {
  const host = document.getElementById('signal-grid');
  host.innerHTML = buildSignals()
    .map(
      (s) => `
      <div class="signal" data-status="${s.status}">
        <div class="signal-label">${s.label}</div>
        <div class="signal-value">${s.value}</div>
        <div class="signal-verdict">${s.verdict}</div>
        <div class="signal-note">${s.note}</div>
      </div>`
    )
    .join('');
}

/* ---- Compare --------------------------------------------------------- */

function renderComparePicker() {
  const host = document.getElementById('compare-picker');
  host.innerHTML = DATA.groups
    .map((group) => {
      const items = DATA.series
        .filter((s) => s.group === group.id)
        .map(
          (s) => `
          <label class="picker-item">
            <input type="checkbox" value="${s.id}" ${state.selected.has(s.id) ? 'checked' : ''} />
            <span class="swatch" style="background:${colorFor(s.id)}"></span>
            <span>${s.name}</span>
          </label>`
        )
        .join('');
      return `<div class="picker-group"><h3>${group.name}</h3>${items}</div>`;
    })
    .join('');
}

/** Plain-language note under the chart explaining how to read the current mode. */
function captionFor(datasets) {
  const scale = state.logScale ? ' Vertical distance is percentage change, not absolute change.' : '';

  if (state.compareMode !== 'indexed') {
    return (
      'Showing each series at its reported value on one shared axis. ' +
      'If a line looks flat, its units are much smaller than another series on the chart — ' +
      `switch to Indexed to 100 to compare their moves fairly.${scale}`
    );
  }

  const start = prettyDate(new Date(datasets[0].data[0].x).toISOString().slice(0, 10));
  return (
    `100 is where each series stood on ${start}, so every line starts together and you read ` +
    `percentage moves: 200 means it doubled, 50 means it halved.${scale}`
  );
}

function renderCompare() {
  const canvas = document.getElementById('compare-chart');
  destroyChart('compare');

  const datasets = [];
  const lines = [];
  for (const id of state.selected) {
    const series = DATA.series.find((s) => s.id === id);
    if (!series) continue;
    const view = viewOf(series);
    if (view.values.length < 2) continue;

    const base = view.values[0];
    const values =
      state.compareMode === 'indexed' && base !== 0
        ? view.values.map((v) => (v / base) * 100)
        : view.values;

    datasets.push({
      label: series.name,
      data: points(view.dates, values),
      borderColor: colorFor(id),
      backgroundColor: colorFor(id),
      seriesId: id,
    });
    lines.push({
      series,
      timestamps: toTimestamps(view.dates),
      values,
      raw: view.values,
      color: colorFor(id),
    });
  }

  // A log axis cannot render zero or negative values, which raw spreads and the
  // conditions index both produce.
  const allPositive = datasets.every((d) => d.data.every((p) => p.y > 0));
  const logToggle = document.getElementById('log-toggle');
  logToggle.disabled = !allPositive;
  logToggle.classList.toggle('is-active', state.logScale && allPositive);
  logToggle.dataset.help = allPositive
    ? 'Log scale|Equal percentage moves take equal vertical space, so 100 to 200 looks the same size as 200 to 400. Turn it on when one series dwarfs the rest and flattens everything else into a straight line, which is usually Bitcoin.'
    : 'Log scale unavailable|A log axis has no room for zero or negative numbers, and one of the series you picked goes below zero. Switch to Indexed to 100, or deselect that series.';

  const caption = document.getElementById('compare-caption');
  if (!datasets.length) {
    destroyChart('compare');
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    caption.textContent = 'Pick a series below to plot it.';
    return;
  }
  caption.textContent = captionFor(datasets);

  const useLog = state.logScale && allPositive;
  const indexed = state.compareMode === 'indexed';
  const chart = new Chart(canvas, {
    type: 'line',
    data: { datasets },
    options: {
      parsing: false,
      normalized: true,
      layout: { padding: { top: 6, right: 10 } },
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 16 },
        },
        decimation: { enabled: true, algorithm: 'lttb', samples: 400 },
        // Replaced by the crosshair tooltip, which can read every series.
        tooltip: { enabled: false },
      },
      scales: {
        x: timeScale(),
        y: {
          type: useLog ? 'logarithmic' : 'linear',
          ticks: { padding: 8, callback: (v) => (indexed ? num(v, 0) : num(v, 1)) },
          grid: { color: 'rgba(37,45,59,0.6)', drawTicks: false },
          border: { display: false },
          title: {
            display: indexed,
            text: `Indexed to 100 at range start${useLog ? ' (log scale)' : ''}`,
            color: '#8a93a6',
            padding: { bottom: 8 },
          },
        },
      },
    },
  });

  charts.set('compare', chart);
  trackHover(chart, { lines });
}

/* ---- Correlation ----------------------------------------------------- */

/** Collapses a series to one observation per month, then takes changes. */
function monthlyChanges(series, start) {
  const view = sliceFrom(transformed(series), start);
  const byMonth = new Map();
  view.dates.forEach((d, i) => byMonth.set(d.slice(0, 7), view.values[i]));

  const months = [...byMonth.keys()].sort();
  const useDiff = isRateLike(series);
  const changes = new Map();

  for (let i = 1; i < months.length; i += 1) {
    const prev = byMonth.get(months[i - 1]);
    const curr = byMonth.get(months[i]);
    if (!Number.isFinite(prev) || !Number.isFinite(curr)) continue;
    if (!useDiff && prev === 0) continue;
    changes.set(months[i], useDiff ? curr - prev : ((curr - prev) / Math.abs(prev)) * 100);
  }
  return changes;
}

function pearson(a, b) {
  const n = a.length;
  if (n < 12) return null;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < n; i += 1) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }
  if (varA === 0 || varB === 0) return null;
  return cov / Math.sqrt(varA * varB);
}

function describeCorrelation(r) {
  const strength = Math.abs(r) >= 0.6 ? 'Strong' : Math.abs(r) >= 0.3 ? 'Moderate' : 'Weak';
  if (Math.abs(r) < 0.15) return 'Essentially unrelated month to month.';
  return `${strength} ${r > 0 ? 'positive' : 'inverse'} relationship with the index.`;
}

function renderCorrelation() {
  const table = document.getElementById('corr-table');
  const start = RANGES[state.range]();
  const spx = DATA.series.find((s) => s.id === 'SP500');
  const spxChanges = monthlyChanges(spx, start);

  const rows = DATA.series
    .filter((s) => s.id !== 'SP500')
    .map((series) => {
      const changes = monthlyChanges(series, start);
      const months = [...spxChanges.keys()].filter((m) => changes.has(m));
      const r = pearson(
        months.map((m) => spxChanges.get(m)),
        months.map((m) => changes.get(m))
      );
      return { series, r, n: months.length };
    })
    .sort((a, b) => Math.abs(b.r ?? -1) - Math.abs(a.r ?? -1));

  table.innerHTML = `
    <thead>
      <tr>
        <th>Series</th>
        <th>Correlation</th>
        <th>What it means</th>
        <th>Months</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(({ series, r, n }) => {
          if (r === null) {
            return `<tr><td>${series.name}</td><td class="num flat">n/a</td>
              <td class="corr-desc">Not enough overlapping months in this range.</td>
              <td class="num flat">${n}</td></tr>`;
          }
          const width = Math.round(Math.abs(r) * 100);
          const color = r > 0 ? 'var(--good)' : 'var(--bad)';
          return `<tr>
            <td>${series.name}</td>
            <td class="num" style="color:${color}">
              <span class="corr-cell">
                <span>${r >= 0 ? '+' : ''}${num(r, 2)}</span>
                <span class="corr-bar" style="width:${width}%;background:${color}"></span>
              </span>
            </td>
            <td class="corr-desc">${describeCorrelation(r)}</td>
            <td class="num flat">${n}</td>
          </tr>`;
        })
        .join('')}
    </tbody>`;
}

/* ---- Hover help ------------------------------------------------------
   Any element carrying data-help="Title|Body" gets a styled popover on hover
   or keyboard focus. */

function initHelp() {
  const pop = document.createElement('div');
  pop.className = 'help-pop';
  pop.hidden = true;
  document.body.append(pop);

  const hide = () => {
    pop.classList.remove('is-visible');
    pop.hidden = true;
  };

  const show = (el) => {
    const [title, body] = el.dataset.help.split('|');
    pop.innerHTML = body ? `<strong>${title}</strong>${body}` : title;
    pop.hidden = false;

    // Measure first, then place below the control, flipping above when the
    // popover would run off the bottom of the window.
    const target = el.getBoundingClientRect();
    const { width, height } = pop.getBoundingClientRect();
    const left = Math.min(
      Math.max(12, target.left + target.width / 2 - width / 2),
      window.innerWidth - width - 12
    );
    const below = target.bottom + 10;
    pop.style.left = `${left}px`;
    pop.style.top = `${below + height > window.innerHeight - 12 ? target.top - height - 10 : below}px`;
    pop.classList.add('is-visible');
  };

  const handle = (event) => {
    const el = event.target.closest?.('[data-help]');
    if (el) show(el);
    else hide();
  };

  document.addEventListener('mouseover', handle);
  document.addEventListener('focusin', handle);
  document.addEventListener('mouseleave', hide);
  window.addEventListener('scroll', hide, { passive: true });
}

/* ---- View plumbing --------------------------------------------------- */

function renderActiveView() {
  for (const view of document.querySelectorAll('.view')) {
    view.hidden = view.id !== `view-${state.view}`;
  }

  if (state.view === 'overview') {
    renderGauges();
    renderSignals();
    renderGroups();
    renderSideNav();
    highlightSection();
  } else {
    // Card charts are expensive to keep alive; drop them when hidden.
    for (const key of [...charts.keys()]) {
      if (key.startsWith('chart-')) destroyChart(key);
    }
  }

  // The toolbar's range and detail controls only mean something on Overview.
  document.getElementById('ranges').hidden = state.view === 'learn';
  document.getElementById('levels').hidden = state.view !== 'overview';

  if (state.view === 'learn') renderLearn();
  if (state.view === 'compare') renderCompare();
  if (state.view === 'correlation') renderCorrelation();
}

function setActive(container, attr, value) {
  for (const btn of container.children) {
    btn.classList.toggle('is-active', btn.dataset[attr] === value);
  }
}

/** Pushes `state` back onto the controls, for deep links and back/forward. */
function syncControls() {
  setActive(document.getElementById('tabs'), 'view', state.view);
  setActive(document.getElementById('ranges'), 'range', state.range);
  setActive(document.getElementById('levels'), 'level', String(state.level));
  setActive(document.getElementById('compare-modes'), 'mode', state.compareMode);
  for (const box of document.querySelectorAll('#compare-picker input')) {
    box.checked = state.selected.has(box.value);
  }
}

function syncHash() {
  const params = new URLSearchParams({
    view: state.view,
    range: state.range,
    level: state.level,
    lesson: state.lesson,
    mode: state.compareMode,
    log: state.logScale ? '1' : '0',
    s: [...state.selected].join(','),
  });
  history.replaceState(null, '', `#${params}`);
}

function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  const view = params.get('view');
  const range = params.get('range');
  const mode = params.get('mode');
  const selected = params.get('s');

  if (['learn', 'overview', 'compare', 'correlation'].includes(view)) state.view = view;
  if (range && range in RANGES) state.range = range;
  const level = Number(params.get('level'));
  if ([1, 2, 3].includes(level)) state.level = level;
  const lesson = Number(params.get('lesson'));
  if (Number.isInteger(lesson) && lesson >= 0 && lesson < window.LESSONS.length) state.lesson = lesson;
  if (['indexed', 'raw'].includes(mode)) state.compareMode = mode;
  if (params.has('log')) state.logScale = params.get('log') === '1';
  // An explicit empty `s` means the user cleared the selection, so honour it.
  if (selected !== null) state.selected = new Set(selected.split(',').filter(Boolean));
}

function wireControls() {
  const tabs = document.getElementById('tabs');
  const ranges = document.getElementById('ranges');
  const modes = document.getElementById('compare-modes');

  tabs.addEventListener('click', (event) => {
    const view = event.target.dataset.view;
    if (!view) return;
    state.view = view;
    setActive(tabs, 'view', view);
    syncHash();
    renderActiveView();
  });

  ranges.addEventListener('click', (event) => {
    const range = event.target.dataset.range;
    if (!range) return;
    state.range = range;
    setActive(ranges, 'range', range);
    syncHash();
    renderActiveView();
  });

  const levels = document.getElementById('levels');
  levels.addEventListener('click', (event) => {
    const level = event.target.dataset.level;
    if (!level) return;
    state.level = Number(level);
    setActive(levels, 'level', level);
    syncHash();
    renderActiveView();
  });

  modes.addEventListener('click', (event) => {
    const mode = event.target.dataset.mode;
    if (!mode) return;
    state.compareMode = mode;
    setActive(modes, 'mode', mode);
    syncHash();
    renderCompare();
  });

  document.getElementById('log-toggle').addEventListener('click', () => {
    state.logScale = !state.logScale;
    syncHash();
    renderCompare();
  });

  document.getElementById('compare-picker').addEventListener('change', (event) => {
    const box = event.target;
    if (!box.value) return;
    if (box.checked) state.selected.add(box.value);
    else state.selected.delete(box.value);
    syncHash();
    renderCompare();
  });

  document.getElementById('compare-clear').addEventListener('click', () => {
    state.selected.clear();
    for (const box of document.querySelectorAll('#compare-picker input')) box.checked = false;
    syncHash();
    renderCompare();
  });

  // Keeps shared links and the browser back button working once the page is open.
  window.addEventListener('hashchange', () => {
    readHash();
    syncControls();
    renderActiveView();
  });
}

async function init() {
  const loading = document.getElementById('loading');
  try {
    const res = await fetch('data/macro.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    DATA = await res.json();
  } catch (error) {
    loading.className = 'error';
    loading.textContent = `Could not load data/macro.json (${error.message}).`;
    return;
  }

  configureChartDefaults();
  readHash();
  loading.remove();

  document.getElementById('updated').textContent = `${DATA.series.length} series · data through ${prettyDate(
    DATA.series.reduce((latest, s) => (s.dates.at(-1) > latest ? s.dates.at(-1) : latest), '0000-01-01')
  )} · refreshed ${new Date(DATA.updated).toLocaleString()}`;

  initHelp();
  wireControls();
  wireSideNav();
  wireLearn();
  renderComparePicker();
  syncControls();
  renderActiveView();
  syncHash();
}

init();
