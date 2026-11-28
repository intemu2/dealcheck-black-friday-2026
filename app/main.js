// DealCheck wiring: hash routing (#/ board, #/deal/<id> detail), search, filters
// and sorting over the deals in data.js. All state lives in this module.
import { DEALS, VERDICT_RANK } from './data.js';
import { boardHTML, detailHTML, money, pctOff, saved, stats } from './views.js';

const $ = (id) => document.getElementById(id);
const view = $('view');
const countEl = $('count');

const state = { q: '', category: '', store: '', mindisc: 0, verdict: '', sort: 'best' };

function fillSelect(el, values, allLabel) {
  el.innerHTML = '<option value="">' + allLabel + '</option>' +
    values.map((v) => '<option value="' + v + '">' + v + '</option>').join('');
}

function applyFilters() {
  const q = state.q.trim().toLowerCase();
  let list = DEALS.filter((d) => {
    if (q && !(d.title + ' ' + d.store + ' ' + d.category).toLowerCase().includes(q)) return false;
    if (state.category && d.category !== state.category) return false;
    if (state.store && d.store !== state.store) return false;
    if (state.verdict && d.verdict !== state.verdict) return false;
    if (pctOff(d) < state.mindisc) return false;
    return true;
  });
  if (state.sort === 'best') {
    list = list.slice().sort((a, b) => (VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict]) || (pctOff(b) - pctOff(a)));
  } else if (state.sort === 'discount') {
    list = list.slice().sort((a, b) => pctOff(b) - pctOff(a));
  } else if (state.sort === 'saving') {
    list = list.slice().sort((a, b) => saved(b) - saved(a));
  } else if (state.sort === 'price') {
    list = list.slice().sort((a, b) => a.price - b.price);
  }
  return list;
}

function render() {
  const hash = location.hash || '#/';
  const m = hash.match(/^#\/deal\/([\w-]+)$/);
  const filters = $('filters');
  if (m) {
    const d = DEALS.find((x) => x.id === m[1]);
    filters.style.display = 'none';
    countEl.textContent = '';
    view.innerHTML = d ? detailHTML(d) : '<div class="empty">That deal is not on this board.</div>';
    window.scrollTo(0, 0);
    return;
  }
  filters.style.display = '';
  const list = applyFilters();
  countEl.textContent = 'Showing ' + list.length + ' of ' + DEALS.length + ' deals';
  view.innerHTML = boardHTML(list);
}

function init() {
  const s = stats();
  $('intro').textContent = 'Every deal below was checked on 28 November 2026 at its store or in a named deals roundup. ' +
    s.lows + ' are new lows \u2014 the lowest price ever \u2014 ' + s.strong + ' are strong, ' + s.routine +
    ' are routine, and none is inflated. Total saving across the board: ' + money(s.total) + '.';
  $('stats').textContent = s.n + ' deals \u00b7 ' + s.stores + ' stores \u00b7 ' + s.cats + ' categories \u00b7 ' +
    money(s.total) + ' total saved \u00b7 ' + s.lows + ' new lows';
  fillSelect($('category'), [...new Set(DEALS.map((d) => d.category))].sort(), 'All categories');
  fillSelect($('store'), [...new Set(DEALS.map((d) => d.store))].sort(), 'All stores');
  $('q').addEventListener('input', (e) => { state.q = e.target.value; render(); });
  $('category').addEventListener('change', (e) => { state.category = e.target.value; render(); });
  $('store').addEventListener('change', (e) => { state.store = e.target.value; render(); });
  $('mindisc').addEventListener('change', (e) => { state.mindisc = Number(e.target.value); render(); });
  $('verdict').addEventListener('change', (e) => { state.verdict = e.target.value; render(); });
  $('sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  window.addEventListener('hashchange', render);
  render();
}

init();
