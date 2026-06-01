# SEO/GEO Audit Notes

Date: 2026-06-01

## Completed In This Pass

- Added `tools/validate-static-site.mjs` and connected it to GitHub Actions.
- Preserved the May 2026 logo/favicon and Blog card fixes in `docs/FIX-LOG.md`
  and `DEPLOYMENT.md`.
- Added `docs/SEO-GEO-GROWTH-PLAN.md` with keyword clusters and workstreams.
- Changed static feed clones and meta-refresh redirect pages to `noindex, follow`.

## Current Crawl Snapshot

- HTML files in `public/`: 167
- Static feed clone pages: 62
- Meta-refresh redirect pages: 7
- HTML pages without meta description: 44 before feed/redirect cleanup
- Duplicate home title instances: mainly feed clones before noindex cleanup

## Key Findings

1. The technical foundation is mostly in place: production canonical URLs,
   sitemap index, robots.txt, llms.txt, and the global GEO page exist.
2. Feed clone pages were indexable duplicates of regular HTML pages. They should
   stay crawlable but not indexable, which is now enforced.
3. Month archive redirect pages were indexable even though they redirect users to
   `/`. They are now `noindex, follow`.
4. Category, tag, and product taxonomy pages often lack custom meta descriptions.
   These should be improved next, but not all taxonomy pages deserve equal
   attention. Product-category pages should come first.
5. The highest-value commercial clusters are LiFePO4 cells, C&I ESS cabinets,
   containerized BESS, home backup batteries, and factory/OEM capability.

## Next Recommended SEO Changes

1. Add optimized meta descriptions and stronger copy to product-category pages.
2. Add FAQ/Product/Breadcrumb schema where missing on core product and category pages.
3. Build internal links from blog articles to commercial product/category pages.
4. Expand the global GEO hub with unique country/application sections, not thin
   country-name swaps.
5. Submit or re-submit `https://djenergy.solar/sitemap_index.xml` in Google Search
   Console and Bing Webmaster Tools after deployment.
