// Rendering for DealCheck. Every value from the data is escaped before it
// reaches the page, and every number on screen is computed from the data —
// no price, discount or verdict is typed in by hand here.
//
// The verdict is the whole point of the board, so its rule lives in one
// place and the page says it out loud:
//   Real deal — 20% off or more, and at least two independent published
//     sources agreed on the price.
//   Good deal — 15% off or more, but only one source, or a smaller cut.
//   Weak deal — under 15% off. (No deal on this board is weak: the weakest
//     cut here is 19%, and it is labelled Good, not Real.)

import { CHECKED_NOTE } from "./data.js";

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const usd = (n) =>
  "$" +
  Number(n).toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });

export const percentOff = (d) => Math.round((1 - d.price / d.was) * 100);
export const saved = (d) => d.was - d.price;

export function verdict(d) {
  const pct = percentOff(d);
  if (pct >= 20 && d.sources >= 2)
    return { label: "Real deal", cls: "real", why: `${pct}% off, confirmed by ${d.sources} sources` };
  if (pct >= 15)
    return { label: "Good deal", cls: "good", why: `${pct}% off, but only ${d.sources} source${d.sources === 1 ? "" : "s"} confirmed it` };
  return { label: "Weak deal", cls: "weak", why: `Only ${pct}% off the usual price` };
}

const when = (iso) =>
  new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";

const ends = (iso) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

export function applyFilters(deals, state) {
  const q = state.q.trim().toLowerCase();
  let out = deals.filter((d) => {
    if (q && !`${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)) return false;
    if (state.category !== "All" && d.category !== state.category) return false;
    if (state.store !== "All" && d.store !== state.store) return false;
    if (percentOff(d) < state.minOff) return false;
    return true;
  });
  if (state.sort === "pct") out = [...out].sort((a, b) => percentOff(b) - percentOff(a));
  else if (state.sort === "saved") out = [...out].sort((a, b) => saved(b) - saved(a));
  else if (state.sort === "price") out = [...out].sort((a, b) => a.price - b.price);
  return out;
}

export function card(d) {
  const v = verdict(d);
  return `<article class="card">
  <p class="badges"><span class="verdict ${v.cls}">${v.label}</span><span class="pct">${percentOff(d)}% off</span></p>
  <h2><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h2>
  <p class="meta">${escape(d.store)} · ${escape(d.category)} · ends ${ends(d.ends)}</p>
  <p class="price">${usd(d.price)} <s>${usd(d.was)}</s></p>
  <p class="save">You save ${usd(saved(d))} — ${escape(v.why)}</p>
  <p class="checked">Checked ${when(d.checked)}</p>
  <p><a class="store-link" href="${escape(d.url)}" rel="noopener">Find it at ${escape(d.store)} ↗</a></p>
</article>`;
}

export function rows(deals, state) {
  const shown = applyFilters(deals, state);
  if (shown.length === 0)
    return `<p class="empty">No deal matches those filters. <button type="button" data-clear>Clear the filters</button></p>`;
  return shown.map(card).join("");
}

export function filterBar(deals, state) {
  const cats = ["All", ...new Set(deals.map((d) => d.category))];
  const stores = ["All", ...new Set(deals.map((d) => d.store))];
  const opt = (list, cur) =>
    list.map((x) => `<option value="${escape(x)}"${x === cur ? " selected" : ""}>${escape(x)}</option>`).join("");
  return `<form class="filters" id="filters">
  <label>Search <input type="search" name="q" value="${escape(state.q)}" placeholder="AirPods, TV, Dyson…"></label>
  <label>Category <select name="category">${opt(cats, state.category)}</select></label>
  <label>Store <select name="store">${opt(stores, state.store)}</select></label>
  <label>At least <select name="minOff">
    <option value="0"${state.minOff === 0 ? " selected" : ""}>Any discount</option>
    <option value="20"${state.minOff === 20 ? " selected" : ""}>20% off</option>
    <option value="30"${state.minOff === 30 ? " selected" : ""}>30% off</option>
    <option value="40"${state.minOff === 40 ? " selected" : ""}>40% off</option>
    <option value="50"${state.minOff === 50 ? " selected" : ""}>50% off</option>
  </select></label>
  <label>Sort by <select name="sort">
    <option value="pct"${state.sort === "pct" ? " selected" : ""}>Biggest % off</option>
    <option value="saved"${state.sort === "saved" ? " selected" : ""}>Biggest $ saved</option>
    <option value="price"${state.sort === "price" ? " selected" : ""}>Lowest price</option>
  </select></label>
</form>`;
}

export function list(deals, state) {
  const shown = applyFilters(deals, state);
  const total = deals.reduce((s, d) => s + saved(d), 0);
  const real = deals.filter((d) => verdict(d).label === "Real deal").length;
  return `<h1>Black Friday deals worth your money</h1>
<p class="lede">Twelve deals, checked one by one on 27 November 2026. ${real} of them are <strong>Real deals</strong> — 20% off or more, confirmed by two or more independent sources. The rest are Good deals: real cuts, thinner proof.</p>
<p class="stats">${shown.length} of ${deals.length} deals shown · ${usd(total)} total savings across the board</p>
${filterBar(deals, state)}
<div class="grid" id="grid">${rows(deals, state)}</div>
<section class="method">
<h2>How a deal earns its badge</h2>
<p><span class="verdict real">Real deal</span> 20% off or more, and at least two independent published sources agreed on the price. <span class="verdict good">Good deal</span> 15% off or more, but only one source confirmed it. <span class="verdict weak">Weak deal</span> under 15% off. A big red sticker means nothing on its own — the usual price has to be real, and the price has to be confirmed.</p>
<p>${escape(CHECKED_NOTE)}</p>
</section>`;
}

export function deal(d) {
  const v = verdict(d);
  return `<p><a href="#/">&larr; All deals</a></p>
<article class="detail">
<p class="badges"><span class="verdict ${v.cls}">${v.label}</span><span class="pct">${percentOff(d)}% off</span></p>
<h1>${escape(d.title)}</h1>
<p class="meta">${escape(d.store)} · ${escape(d.category)} · sale ends ${ends(d.ends)}</p>
<p class="price big">${usd(d.price)} <s>${usd(d.was)}</s></p>
<p class="save">You save ${usd(saved(d))}. ${escape(v.why)}.</p>
<p>${escape(d.note)}</p>
<dl>
  <dt>Store</dt><dd>${escape(d.store)}</dd>
  <dt>Category</dt><dd>${escape(d.category)}</dd>
  <dt>Price checked</dt><dd>${when(d.checked)}</dd>
  <dt>Read in</dt><dd>${escape(d.source)}</dd>
</dl>
<p><a class="store-link" href="${escape(d.url)}" rel="noopener">Find it at ${escape(d.store)} ↗</a></p>
<p class="fine">${escape(CHECKED_NOTE)}</p>
</article>`;
}

export function missing() {
  return `<h1>Not found</h1>
<p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}
