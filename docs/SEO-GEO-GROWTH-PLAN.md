# DJENERGY SEO And GEO Growth Plan

Updated: 2026-06-01

## Baseline

DJENERGY is a cells-to-system LiFePO4 battery and energy storage manufacturer.
The search strategy should prove that positioning with crawlable technical
signals, product-specific landing pages, helpful engineering content, and clear
entity data for search engines and answer engines.

Reference standards:

- Google SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google Helpful Content guidance: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google Image SEO best practices: https://developers.google.com/search/docs/appearance/google-images
- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Bing Webmaster Guidelines: https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a

## Workstreams

| Workstream | Why Start Here | Expected Effect |
| --- | --- | --- |
| Crawl and indexing foundation | Search engines need clean robots, sitemap, canonical URLs, indexable HTML, valid status codes, and accessible CSS/images before content can rank. | Faster discovery, fewer indexing errors, better crawl freshness, and safer deployments. |
| Keyword-to-page mapping | Each page needs one primary intent so product, category, blog, and GEO pages do not compete with each other. | More impressions for commercial and long-tail queries; clearer page optimization priorities. |
| Product and application clusters | Buyers search by product type, capacity, application, and supplier role. DJENERGY should connect cells, modules, C&I cabinets, home batteries, and containerized BESS into topic clusters. | Stronger topical authority and better internal link equity to money pages. |
| Factory proof and E-E-A-T | B2B energy storage buyers need manufacturing proof: cell sourcing, QC, BMS, certifications, project support, datasheets, and response process. | Higher trust, better conversion quality, stronger search quality signals. |
| GEO and country-market pages | Export buyers search by region, grid scenario, voltage standards, and project type. | More long-tail traffic from country and application searches; better AI answer eligibility. |
| Structured data and entity clarity | Organization, Product, Breadcrumb, Article, FAQ, and ItemList schema help machines understand DJENERGY, products, and relationships. | Better rich-result eligibility, clearer brand/entity recognition, stronger GEO/AI extraction. |
| Image and media SEO | Product images, diagrams, factory media, and charts can rank and reinforce page relevance. | More image-search entry points, better page clarity, improved accessibility. |
| Measurement loop | Google Search Console, Bing Webmaster Tools, sitemap submission, query tracking, and page-level actions are needed to know what is working. | Compounding improvements based on actual impressions, clicks, and indexing status. |

## Priority Keyword Clusters

| Cluster | Primary Intent | Core Pages |
| --- | --- | --- |
| LiFePO4 battery cells manufacturer | Source cells for ESS pack/module production | `/product-category/battery-cells/`, `/product/lfp-prismatic-cell-314ah/`, `/factory/` |
| C&I BESS cabinet | Compare commercial storage cabinets and power/kWh configurations | `/bess-system/`, `/product-category/all-in-one-ci-ess/`, `/blog/ci-ess-cabinet-guide/` |
| Containerized BESS supplier | Source 500kW-5MWh containerized systems | `/product-category/containerized-bess/`, containerized product pages |
| Home backup battery | Buy residential LiFePO4 backup batteries | `/home-backup-battery/`, `/product-category/home-battery/` |
| Energy storage system manufacturer China | Verify factory-direct manufacturer capability | `/what-we-do/`, `/factory/`, `/about-us/` |
| BESS knowledge and sizing | Learn system concepts, sizing, PCS/BMS, C-rate, voltage | `/blog/` and article pages |
| Global energy storage solutions | Match product lines to country or market needs | `/global-energy-storage-solutions/` |

## First 30-Day Execution

1. Stabilize deployment and indexing guardrails.
   - Keep `prepare-static-site.mjs` and `validate-static-site.mjs` in the release workflow.
   - Verify production robots, sitemap, canonical, logo, CSS, and indexability after each push.

2. Build a keyword map from current pages.
   - Assign one primary keyword, supporting keywords, search intent, and conversion CTA per indexable page.
   - Flag duplicate or weak pages that need consolidation or new content.

3. Improve core commercial pages first.
   - Priority: `/product/lfp-prismatic-cell-314ah/`, `/bess-system/`, `/product-category/containerized-bess/`, `/factory/`, `/what-we-do/`.
   - Add clearer H1/H2 alignment, comparison tables, specs, buyer FAQs, internal links, and schema.

4. Strengthen blog as a knowledge hub.
   - Link every educational article back to the relevant product/category page.
   - Add "recommended products" and "related technical guides" sections.
   - Use diagrams and alt text where the article explains system design.

5. Expand GEO pages carefully.
   - Start with one strong global hub, then create country/application pages only when each page has unique market relevance.
   - Avoid thin country pages that merely swap country names.

6. Set up measurement.
   - Submit `https://djenergy.solar/sitemap_index.xml` in Google Search Console and Bing Webmaster Tools.
   - Track indexed pages, impressions, clicks, query groups, top pages, and pages discovered but not indexed.

## Working Rule

Every new page should answer four questions before publication:

1. What buyer/search intent does this page serve?
2. What product or capability should the page push traffic toward?
3. Which existing pages should link to it, and which pages should it link back to?
4. What structured data, images, FAQs, and proof points help search engines trust it?
