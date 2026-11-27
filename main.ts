// DealCheck — Black Friday 2026, entry program (Node 22, standard library
// only). The site is this directory's app/ folder: plain static files a
// browser opens at app/index.html (ES modules, CSS, no build step), its deals
// held in its own files. Nothing the site runs, styles or shows loads over
// the network, and each deal links out to its store.
//
// This program hands the entry in: it first checks every deal in
// app/data.js — all twelve must carry a store, a category, a sale price, a
// usual price above the sale price, a store link and a check time — then it
// copies app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads (screenshots, the first
// load's files and bytes, and the source), with the vendored make.fun
// library. Leave vendor/makefun-frontend.ts as it is: the scorer requires
// dossier.json to be byte for byte what its own copy writes.
//
// Serve the site locally with `node serve.ts` in the kit, or any static
// server over app/ — for example `python3 -m http.server` inside app/.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";
import { deals } from "./app/data.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Every deal must be checkable from its own fields. A deal that fails here
// never reaches the judge: fix the data, do not ship a broken board.
if (deals.length < 10) throw new Error(`only ${deals.length} deals, need at least 10`);
for (const d of deals) {
  for (const field of ["id", "title", "store", "category", "url", "checked", "source"]) {
    if (!d[field]) throw new Error(`deal ${d.id ?? "?"} is missing ${field}`);
  }
  if (!(d.price > 0) || !(d.was > d.price)) {
    throw new Error(`deal ${d.id} has impossible prices: ${d.price} vs ${d.was}`);
  }
  if (!String(d.url).startsWith("https://")) throw new Error(`deal ${d.id} has no store link`);
  if (Number.isNaN(Date.parse(d.checked))) throw new Error(`deal ${d.id} has no check time`);
}
const shots = existsSync(join(here, "screenshots")) ? readdirSync(join(here, "screenshots")) : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`need 3 or 4 screenshots, found ${shots.length}`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in
// app/ or 16 MiB of app files).
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

console.log(`DealCheck: ${deals.length} deals, ${shots.length} screenshots -> ${out}`);
