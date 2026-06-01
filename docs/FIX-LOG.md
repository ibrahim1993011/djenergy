# DJENERGY Fix Log

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
node tools/validate-static-site.mjs public https://djenergy.solar
```
