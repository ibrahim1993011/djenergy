# DJENERGY Fix Log

## 2026-06-02: Full-Site Image Asset Closure

### Problems

- The homepage hero image area and multiple product/gallery images could render
  as empty blocks or alt text because the static export referenced upload files
  that were not present in `public/`.
- Several upload files were committed with percent-encoded filenames, while the
  browser requests the decoded filename on static hosting.
- Legacy WordPress/Elementor image paths still pointed to assets that no longer
  exist on the WordPress origin, so re-exporting could reintroduce broken images.

### Durable Fixes

- Added `tools/audit-image-assets.mjs` to scan HTML, CSS, JS, JSON, XML, feeds,
  schema, `srcset`, data attributes, and CSS `background-image` references.
- Added `tools/repair-image-assets.mjs` to copy percent-encoded upload filenames
  to decoded filenames and create business-appropriate fallback files for legacy
  missing image paths.
- Updated the GitHub Actions deployment flow to run image repair before
  validation and deployment.
- Restored the homepage hero to the original Elementor background-image design
  mode after confirming the required `home-page-1-1.jpg` asset exists locally.
- Restored the 16kWh home battery, home-backup, and related blog image
  references to their original full/scaled design paths now that those original
  image assets exist in the static bundle.
- Removed the later forced 900x900/800x803 product-image rewrite rule. Future
  exports should keep the original WordPress/Elementor image choices and rely
  on image asset auditing to prevent broken files.

### Verification

- The full image audit now checks 897 referenced image paths and reports 0
  missing assets.
- After restoring original design image paths, the full image audit still blocks
  deployment when any referenced image asset is missing.
- `tools/validate-static-site.mjs` now fails deployment if any referenced image
  asset is missing.
- Local browser checks confirmed the 16kWh product gallery loads its images and
  the homepage hero displays correctly on desktop and mobile without overlap.

## 2026-06-02: Product Page RFQ And Structured Data

### Problems

- Product detail pages had Product schema from Rank Math on most pages, but they
  did not have a consistent buyer RFQ path or product-specific FAQ/RFQ schema.
- The 180kW/372kWh product URL exposed homepage-style title, H1, and schema
  signals, making the product page harder for search engines and buyers to
  understand.

### Durable Fixes

- `tools/prepare-static-site.mjs` now adds one `dj-product-rfq` module with a
  stable `#product-rfq` anchor to all 10 product pages.
- Each product page is routed to the right buyer path: LiFePO4 cells, C&I ESS,
  containerized BESS, or home battery.
- The generated schema now adds product RFQ FAQ, buyer next-step ItemList, and
  checklist ItemList data.
- If a product page lacks Product schema, the build adds supplemental Product
  structured data. The detection ignores previously generated RFQ schema so
  repeated static preparation will not remove the Product node.
- The 180kW/372kWh product page now gets its own product title, meta
  description, H1, SKU/category data, and Product schema.

### Verification

- `tools/validate-static-site.mjs` blocks deployment if any product page misses
  the RFQ module, RFQ anchor, RFQ schema, Product schema, or contact CTA. It also
  fails if repeated generation creates more than one RFQ module on a product
  page.

## 2026-06-01: Mobile Typography And Image Layout

### Problems

- The Factory hero title kept a cramped two-column layout on mobile. The text
  column was only about 131px wide, which forced the title into many short lines.
- Several Elementor image widgets on Factory, FAQ, and BESS pages inherited a
  fixed mobile height, stretching wide images vertically.
- The About and Solutions hero headings were constrained by mobile padding and
  boxed Elementor containers, leaving the title text too narrow.
- The Solutions mobile hero title could sit on an overly light background,
  reducing readability.
- Solutions model buttons could be laid out off-screen inside boxed flex
  containers even when the page itself did not create horizontal scrolling.
- Long page titles across products and articles used desktop-scale line height
  on mobile, creating unnecessarily tall title blocks.
- A few Blog article tables and headings could run wider than the readable
  mobile content column.

### Durable Fixes

- `tools/prepare-static-site.mjs` now rewrites the Factory hero title to
  `DJENERGY Factory: Cells-to-System Energy Storage Manufacturing`.
- `/assets/djenergy-static-fixes.css` now forces the Factory hero columns to
  stack full-width on mobile.
- The generated mobile CSS caps H1/H2 sizes and line-height for readable mobile
  wrapping, and restores Elementor image widgets to natural aspect ratio.
- Boxed Elementor containers now stack their inner columns on mobile, preventing
  hidden off-screen columns and button groups.
- About and Solutions hero sections now have mobile-specific width and padding
  guards so titles use the available phone width.
- The Solutions mobile hero now uses a darker image overlay so the white title
  remains readable.
- Theme banner images, product zoom overlays, and WooCommerce specification
  tables now have mobile guards so they do not distort or spill past the phone
  viewport.
- Blog/article tables and headings now wrap inside the phone viewport instead
  of relying on desktop-width table cells or no-wrap heading behavior.
- `tools/validate-static-site.mjs` now blocks deployment if the old Factory
  title, missing Factory mobile layout guard, or missing mobile image guard
  returns.

### Verification

- Mobile audit covers sitemap pages at 390px width.
- Target checks: no horizontal scrolling, Factory title full-width, visible
  logo, readable title wrapping, and natural image ratios.

## 2026-06-02: Restore Original Image Design And Home Mobile Hero

### Problems

- Product gallery and home backup product images needed to stay on the original
  Elementor/WooCommerce image sources instead of being normalized to alternate
  resized filenames.
- The homepage hero should use the original split layout pattern: copy on the
  left and a product/system visual on the right, not a full-container factory
  background image.

### Durable Fixes

- `tools/prepare-static-site.mjs` preserves original homepage and product image
  references while still auditing that every image asset exists in the static
  export.
- The generated `/assets/djenergy-static-fixes.css` now removes the homepage
  outer-container background and restores the right-side visual container with
  `/wp-content/uploads/2026/01/DJENERGY-LFP-Cells.jpg`, matching the homepage
  "Battery Cells to Energy Storage Systems" message.
- `tools/validate-static-site.mjs` now checks that the homepage split hero image
  guard is present before deployment.

### Verification

- Local and production mobile checks confirm no broken homepage or product
  images.
- Static image audit checks 897 image references with 0 missing assets.
- Production pages checked: `/`, `/product/16kw-48v-lithium-ion-battery-314ah/`,
  and `/home-backup-battery/`.

## 2026-06-01: Mobile Layout And Tap Targets

### Problems

- Mobile audit needed to confirm the static site did not reintroduce the logo,
  Blog spacing, or horizontal overflow issues after SEO/GEO enhancements.
- Blog sidebar search buttons rendered at 36px high on mobile, below the
  common 44px touch target guideline.
- The WhatsApp floating inquiry button used a fixed mid-screen `top` position on
  mobile, which could overlap reading content.

### Durable Fixes

- `tools/prepare-static-site.mjs` now adds mobile rules to
  `/assets/djenergy-static-fixes.css` so search and submit buttons keep a
  minimum 44px tap target.
- The same generated CSS moves `.dj-wa-icon-float` to the lower-right corner on
  mobile with `bottom: 18px`, while preserving the floating inquiry entry point.
- The static fixes stylesheet is now linked with a generated hash query string
  so browsers refresh the CSS immediately after future style changes.
- These rules are generated every time the static export is prepared, so future
  WordPress/Simply Static uploads keep the mobile fix automatically.

### Verification

- Local mobile viewport checked at 390x844.
- Pages checked: `/`, `/product-category/battery-cells/`,
  `/product-category/containerized-bess/`, `/blog/what-is-a-containerized-bess/`,
  `/factory/`, `/what-we-do/`, and `/contact-us/`.
- Results: no horizontal overflow; mobile logo visible; Blog search buttons
  render at 44px high; WhatsApp button sits at the mobile lower-right corner.

## 2026-05-28: Header Logo And Blog Archive Card Spacing

### Problems

- The production header logo was broken because exported HTML referenced image
  paths with percent-encoded and non-ASCII filenames. Cloudflare/static routing
  could request a decoded path that did not match the stored filename.
- The Blog archive cards showed a large stretched gap between thumbnail images
  and text after static export.

### Durable Fixes

- `tools/prepare-static-site.mjs` copies logo and favicon assets to stable ASCII
  filenames:
  - `/wp-content/uploads/2025/12/djenergy-logo-main.png`
  - `/wp-content/uploads/2025/12/djenergy-logo-dark.png`
  - `/wp-content/uploads/2026/02/djenergy-logo-light.png`
  - `/wp-content/uploads/2026/02/djenergy-logo-light-300x68.png`
  - `/wp-content/uploads/2025/12/djenergy-icon-32x32.png`
  - `/wp-content/uploads/2025/12/djenergy-icon-180x180.png`
  - `/wp-content/uploads/2025/12/djenergy-icon-192x192.png`
- `tools/prepare-static-site.mjs` rewrites old encoded and decoded logo/favicon
  references in HTML, XML, CSS, JS, JSON, and text assets.
- `tools/prepare-static-site.mjs` writes `/assets/djenergy-static-fixes.css`.
  The CSS keeps header logos visible and forces Blog archive thumbnails into a
  stable 16:9 container so text starts immediately after the image.
- `tools/validate-static-site.mjs` is now part of the GitHub Actions deployment
  workflow. It blocks deployment if these issues return.

### Verification

- Production commit: `b661598`
- GitHub Actions deployment: success
- Production checks:
  - Homepage and Blog HTML reference `djenergy-logo-main.png`.
  - Old `cropped-cropped-cropped-436...`, `268...`, `372...`, and `cropped-512...`
    logo/favicon references are absent from text outputs.
  - Blog archive card thumbnails load and text starts with zero gap after the
    thumbnail container.

### Required Before Future Uploads

```bash
node tools/prepare-static-site.mjs public https://djenergy.solar
node tools/repair-image-assets.mjs public
node tools/validate-static-site.mjs public https://djenergy.solar
```
