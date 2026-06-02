# SEO/GEO Audit Notes

Date: 2026-06-01

## Completed In This Pass

- Added `tools/validate-static-site.mjs` and connected it to GitHub Actions.
- Preserved the May 2026 logo/favicon and Blog card fixes in `docs/FIX-LOG.md`
  and `DEPLOYMENT.md`.
- Added `docs/SEO-GEO-GROWTH-PLAN.md` with keyword clusters and workstreams.
- Changed static feed clones and meta-refresh redirect pages to `noindex, follow`.
- Added `docs/KEYWORD-MAP.md` so each priority page has one primary search
  intent, supporting keywords, and a conversion CTA.
- Enhanced five product-category pages with optimized titles, meta descriptions,
  buyer-intent intro sections, inquiry checklists, internal CTAs, FAQ schema, and
  ItemList buyer-path schema.
- Added Blog commercial next-step modules across 29 single articles and documented
  the routing rules in `docs/BLOG-INTERNAL-LINKS.md`.
- Corrected duplicate Blog titles that reused "What is the difference between LV
  and HV voltage?" on unrelated articles.
- Added cells-to-system manufacturing proof sections to `/factory/` and
  `/what-we-do/`.
- Added product RFQ modules and RFQ/FAQ structured data to all 10 product pages,
  with profile-specific paths for LiFePO4 cells, C&I ESS cabinets, containerized
  BESS, and home batteries.
- Corrected the `/product/180kw-372kwh-ci-energy-storage-systems/` page so it no
  longer exposes the homepage title/H1/schema signals.

## Current Crawl Snapshot

- HTML files in `public/`: 167
- Static feed clone pages: 62
- Meta-refresh redirect pages: 7
- Single Blog articles with commercial next-step modules: 29
- HTML pages without meta description: 44 before feed/redirect cleanup
- Duplicate home title instances: mainly feed clones before noindex cleanup

## Key Findings

1. The technical foundation is mostly in place: production canonical URLs,
   sitemap index, robots.txt, llms.txt, and the global GEO page exist.
2. Feed clone pages were indexable duplicates of regular HTML pages. They should
   stay crawlable but not indexable, which is now enforced.
3. Month archive redirect pages were indexable even though they redirect users to
   `/`. They are now `noindex, follow`.
4. Product-category pages were thin list pages. The five highest-value product
   categories now have commercial landing-page content and structured data.
   Lower-priority taxonomy pages should be reviewed later.
5. The highest-value commercial clusters are LiFePO4 cells, C&I ESS cabinets,
   containerized BESS, home backup batteries, and factory/OEM capability.
6. Blog pages now send educational traffic to matching commercial pages and
   contact CTAs, improving the path from traffic to inquiry.

## Next Recommended SEO Changes

1. Improve `/factory/` and `/what-we-do/` with more specific proof: QC process,
   production capacity, test equipment, certificates, and project workflow photos.
2. Expand the strongest product pages with more unique specs, comparison blocks,
   downloadable datasheet CTAs, and project photos after buyer priorities are
   confirmed.
3. Add in-body links to the highest-impression Blog articles after Search Console
   data identifies winners.
4. Expand the global GEO hub with unique country/application sections, not thin
   country-name swaps.
5. Submit or re-submit `https://djenergy.solar/sitemap_index.xml` in Google Search
   Console and Bing Webmaster Tools after deployment.
