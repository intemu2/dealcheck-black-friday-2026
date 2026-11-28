// Rendering for the DealCheck board and deal detail pages: pure functions from
// deal data to HTML strings, so the board and the detail page never disagree.
import { DEALS, VERDICT_LABEL } from './data.js';

export function money(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
}

export function pctOff(d) {
  return Math.round((1 - d.price / d.was) * 100);
}

export function saved(d) {
  return d.was - d.price;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function endsText(iso) {
  const [y, m, day] = iso.split('-').map(Number);
  return MONTHS[m - 1] + ' ' + day + ', ' + y;
}

export function checkedShort(iso) {
  const d = new Date(iso);
  return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate();
}

export function checkedLong(iso) {
  const d = new Date(iso);
  let h = d.getUTCHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear() + ', ' + h + ':' + min + ' ' + ampm + ' UTC';
}

export function alsoAtText(d) {
  if (!d.alsoAt || d.alsoAt.length === 0) return '';
  return 'Also at: ' + d.alsoAt.map((a) => a.store + ' ' + money(a.price)).join(' \u00b7 ');
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function cardHTML(d) {
  const also = alsoAtText(d);
  return '<article class="card" data-deal="' + d.id + '">' +
    '<div><span class="badge badge-' + d.verdict + '">' + VERDICT_LABEL[d.verdict] + '</span>' +
    '<span class="off">' + pctOff(d) + '% off</span></div>' +
    '<h2><a href="#/deal/' + d.id + '">' + esc(d.title) + '</a></h2>' +
    '<p class="meta">' + esc(d.store) + ' \u00b7 ' + esc(d.category) + '</p>' +
    '<p class="price">' + money(d.price) + '<span class="was">' + money(d.was) + '</span></p>' +
    '<p class="save">Save ' + money(saved(d)) + ' \u00b7 ends ' + endsText(d.ends) + '</p>' +
    (also ? '<p class="also">' + esc(also) + '</p>' : '') +
    '<p class="checked">Checked ' + checkedShort(d.checked) + '</p>' +
    '</article>';
}

export function boardHTML(list) {
  if (list.length === 0) {
    return '<div class="empty">No deals match those filters. Try clearing the search or widening the discount.</div>';
  }
  return '<div class="grid">' + list.map(cardHTML).join('') + '</div>';
}

export function detailHTML(d) {
  const also = alsoAtText(d);
  return '<div class="detail">' +
    '<a class="back" href="#/">&larr; All deals</a>' +
    '<h2>' + esc(d.title) + '</h2>' +
    '<div><span class="badge badge-' + d.verdict + '">' + VERDICT_LABEL[d.verdict] + '</span>' +
    '<span class="off">' + pctOff(d) + '% off</span></div>' +
    '<p class="price">' + money(d.price) + '<span class="was">' + money(d.was) + '</span></p>' +
    '<p class="save">You save ' + money(saved(d)) + ' (' + pctOff(d) + '% off) \u00b7 ends ' + endsText(d.ends) + '</p>' +
    '<div class="evidence"><b>Why ' + VERDICT_LABEL[d.verdict] + ':</b> ' + esc(d.evidence) + '</div>' +
    '<dl class="facts">' +
    '<div><dt>Store</dt><dd>' + esc(d.store) + '</dd></div>' +
    '<div><dt>Category</dt><dd>' + esc(d.category) + '</dd></div>' +
    '<div><dt>Checked</dt><dd>' + checkedLong(d.checked) + '</dd></div>' +
    '<div><dt>Read in</dt><dd>' + esc(d.sources) + '</dd></div>' +
    (also ? '<div><dt>Also at</dt><dd>' + esc(also) + '</dd></div>' : '') +
    '</dl>' +
    '<a class="cta" href="' + esc(d.url) + '" target="_blank" rel="noopener">Find it at ' + esc(d.store) + ' &rarr;</a>' +
    '<p class="note">Prices change hourly and stock runs out &mdash; check the store page before buying.</p>' +
    '</div>';
}

export function stats() {
  const stores = new Set(DEALS.map((d) => d.store)).size;
  const cats = new Set(DEALS.map((d) => d.category)).size;
  const total = DEALS.reduce((s, d) => s + saved(d), 0);
  const lows = DEALS.filter((d) => d.verdict === 'newlow').length;
  const strong = DEALS.filter((d) => d.verdict === 'strong').length;
  const routine = DEALS.filter((d) => d.verdict === 'routine').length;
  return { n: DEALS.length, stores, cats, total, lows, strong, routine };
}
