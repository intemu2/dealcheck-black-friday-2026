// DealCheck wiring: hash routes for the list and for one deal, and live
// filtering that re-renders only the grid, so typing never loses the page.
//
//   #/            the board, with search and filters
//   #/deal/<id>   one deal, with its source and check time
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals } from "./data.js";
import { deal, list, missing, rows } from "./views.js";

const app = document.getElementById("app");

const state = { q: "", category: "All", store: "All", minOff: 0, sort: "pct" };

function readParams() {
  // Shareable filtered views: #/?category=Audio&minOff=30&sort=saved
  // (and #/?q=dyson). The form still owns the state after load.
  const m = location.hash.match(/^#\/\?(.+)/);
  if (!m) return;
  const p = new URLSearchParams(m[1]);
  if (p.get("q") !== null) state.q = p.get("q");
  if (p.get("category")) state.category = p.get("category");
  if (p.get("store")) state.store = p.get("store");
  if (p.get("minOff") !== null) state.minOff = Number(p.get("minOff")) || 0;
  if (p.get("sort")) state.sort = p.get("sort");
}

function renderList() {
  document.title = "DealCheck — Black Friday 2026";
  app.innerHTML = list(deals, state);
  const grid = document.getElementById("grid");
  const form = document.getElementById("filters");
  form.addEventListener("input", () => {
    state.q = form.q.value;
    state.category = form.category.value;
    state.store = form.store.value;
    state.minOff = Number(form.minOff.value);
    state.sort = form.sort.value;
    grid.innerHTML = rows(deals, state);
    const count = document.querySelector(".stats");
    if (count) {
      const shown = grid.querySelectorAll(".card").length;
      const total = deals.reduce((s, d) => s + (d.was - d.price), 0).toLocaleString("en-US");
      count.textContent = `${shown} of ${deals.length} deals shown · $${total} total savings across the board`;
    }
  });
  form.addEventListener("submit", (e) => e.preventDefault());
  app.addEventListener("click", (e) => {
    if (e.target.closest("[data-clear]")) {
      state.q = "";
      state.category = "All";
      state.store = "All";
      state.minOff = 0;
      state.sort = "pct";
      render();
    }
  });
}

function render() {
  window.__shotReady = false;
  readParams();
  const match = location.hash.match(/^#\/deal\/([^/?]+)/);
  if (match) {
    const found = deals.find((d) => d.id === decodeURIComponent(match[1]));
    document.title = `${found ? found.title : "Not found"} | DealCheck`;
    app.innerHTML = found ? deal(found) : missing();
  } else {
    renderList();
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener("hashchange", render);
render();
