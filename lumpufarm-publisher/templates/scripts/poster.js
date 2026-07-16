/**
 * Poster render entry point, shared by every template.
 *
 * The Node renderer calls window.LumpuFarm.render(payload) after the
 * page loads, then polls window.LumpuFarm.isComplete() before taking
 * the screenshot. Opening a template directly in a browser renders
 * built-in preview data, which makes designing templates easy.
 */
import { fitAll } from './autofit.js';
import {
  createCommodityCard,
  createExtreme,
  createStatPill,
} from './components.js';

/** Set to true once the DOM is fully built and text fitted. */
let renderComplete = false;

/** Set to true the moment any render starts (blocks the auto-preview). */
let renderStarted = false;

/** Preview data used when the template is opened directly in a browser. */
const PREVIEW_DATA = {
  date: '16 กรกฎาคม 2569',
  updated: '06:30',
  title: 'ราคาพืชผลเกษตรไทย',
  subtitle: 'Daily Market Update',
  sources: 'ที่มา: กรมการค้าภายใน / ตลาดกลางสินค้าเกษตร',
  items: [
    { name: 'ข้าวหอมมะลิ', location: 'อุบลราชธานี', price: '14,500', unit: 'บาท/ตัน', change: 2.1 },
    { name: 'ยางพารา', location: 'สุราษฎร์ธานี', price: '62.50', unit: 'บาท/กก.', change: 0.8 },
    { name: 'ปาล์มน้ำมัน', location: 'กระบี่', price: '5.80', unit: 'บาท/กก.', change: -1.4 },
    { name: 'มันสำปะหลังโรงงานเชื้อแป้ง 25%', location: 'นครราชสีมา', price: '3.15', unit: 'บาท/กก.', change: 0 },
    { name: 'ข้าวโพดเลี้ยงสัตว์', location: 'เพชรบูรณ์', price: '10.20', unit: 'บาท/กก.', change: 1.2 },
    { name: 'ทุเรียนหมอนทอง', location: 'จันทบุรี', price: '135', unit: 'บาท/กก.', change: -2.6 },
  ],
};

/**
 * Fallback stats when the payload does not include them
 * (e.g. when previewing the template directly in a browser).
 * @param {Array<{ name: string, change: number }>} items
 */
function computeStats(items) {
  const stats = {
    totalIncreased: 0,
    totalDecreased: 0,
    totalUnchanged: 0,
    highestIncrease: null,
    highestDecrease: null,
  };
  for (const item of items) {
    const change = Number(item.change ?? 0);
    if (change > 0) {
      stats.totalIncreased += 1;
      if (!stats.highestIncrease || change > stats.highestIncrease.change) {
        stats.highestIncrease = { name: item.name, change };
      }
    } else if (change < 0) {
      stats.totalDecreased += 1;
      if (!stats.highestDecrease || change < stats.highestDecrease.change) {
        stats.highestDecrease = { name: item.name, change };
      }
    } else {
      stats.totalUnchanged += 1;
    }
  }
  return stats;
}

/** Fill the header: brand, headline, date card. */
function renderHeader(data) {
  document.querySelector('.headline-title').textContent = data.title;
  document.querySelector('.headline-subtitle').textContent = data.subtitle || '';
  document.querySelector('.date-card-value').textContent = data.date;

  const updated = document.querySelector('.date-card-updated');
  if (data.updated) {
    updated.textContent = `อัปเดตล่าสุด ${data.updated} น.`;
  } else {
    updated.remove();
  }
}

/** Fill the commodity grid and the extremes strip. */
function renderBody(data, stats) {
  const grid = document.querySelector('.market-grid');
  grid.replaceChildren(...data.items.map(createCommodityCard));

  const extremes = document.querySelector('.extremes');
  const rows = [
    createExtreme('ขึ้นสูงสุด', stats.highestIncrease, 'up'),
    createExtreme('ลงมากสุด', stats.highestDecrease, 'down'),
  ].filter(Boolean);

  if (rows.length > 0) {
    extremes.replaceChildren(...rows);
  } else {
    extremes.remove();
  }
}

/** Fill the footer: summary stat pills and data sources. */
function renderFooter(data, stats) {
  const summary = document.querySelector('.summary-stats');
  summary.replaceChildren(
    createStatPill('ราคาขึ้น', stats.totalIncreased, 'up'),
    createStatPill('ราคาลง', stats.totalDecreased, 'down'),
    createStatPill('ทรงตัว', stats.totalUnchanged),
  );

  const sources = document.querySelector('.footer-sources');
  sources.textContent = data.sources || 'ที่มา: กรมการค้าภายใน กระทรวงพาณิชย์';
}

/**
 * Main render function called by the Node renderer (or on preview).
 * @param {object} data - Validated payload; may carry precomputed stats.
 */
async function render(data) {
  renderStarted = true;
  renderComplete = false;
  const stats = data.stats ?? computeStats(data.items);

  renderHeader(data);
  renderBody(data, stats);
  renderFooter(data, stats);

  // Fonts must be loaded before measuring text widths for auto-fit.
  await document.fonts.ready;
  fitAll('.card-name', 15);
  fitAll('.card-price', 18);
  fitAll('.extreme-name', 12);
  fitAll('.date-card-value', 14);

  renderComplete = true;
}

// Public bridge used by the Playwright renderer.
window.LumpuFarm = {
  render,
  isComplete: () => renderComplete,
};

// Standalone browser preview: if the Node renderer has not injected a
// payload shortly after load, render built-in preview data instead.
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (!renderStarted) render(PREVIEW_DATA);
  }, 100);
});
