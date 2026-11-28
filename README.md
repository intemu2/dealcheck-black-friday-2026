# DealCheck — Black Friday Deal Finder

[![make.fun](https://make.fun/badge/black-friday-deal-finder-01.svg)](https://make.fun/c/black-friday-deal-finder-01)
[![rank](https://make.fun/badge/black-friday-deal-finder-01/intemu2/dealcheck-black-friday-2026/rank.svg)](https://make.fun/c/black-friday-deal-finder-01)
[![reward](https://make.fun/badge/black-friday-deal-finder-01/intemu2/dealcheck-black-friday-2026/reward.svg)](https://make.fun/c/black-friday-deal-finder-01)

A static Black Friday deal finder: 94 real deals, each checked on 28 November 2026
at its store or in a named deals roundup, with sale price, usual price, discount,
check time, source, a direct store link, and an honest verdict — new low, strong,
routine, or inflated — with the evidence for it.

Entry for [black-friday-deal-finder-01](https://make.fun/c/black-friday-deal-finder-01)
on make.fun.

## What it does

- 94 deals across 7 stores and 14 categories, $13,412.63 total saved.
- Every deal carries a verdict badge with an evidence sentence on its detail page.
- Cross-store prices ("Also at") on 38 deals.
- Search plus filters for category, store, minimum discount, and verdict; sort by
  best deals first, discount, savings, or price.
- Static files only: no network request, desktop and phone layouts.

## Run it

Serve `app/` with any static server, then open `index.html`:

```sh
cd app && python3 -m http.server 8080
```

## How it was built

`app/data.js` holds the deals (each checked 28 Nov 2026, sources named per deal).
`app/views.js` renders the board and the detail pages, `app/main.js` wires up the
routing, search, filters and sorting. `main.ts` hands the site in via the vendored
make.fun library (`vendor/makefun-frontend.ts`, unchanged from the kit).

Prices change hourly and stock runs out — check the store page before buying.
DealCheck is not affiliated with Amazon, Best Buy, Walmart, Target, Home Depot,
Kohl's, Oura, Ring, RingConn, or ASUS.
