# DJENERGY Static Publishing Pipeline

## Confirmed architecture

- WordPress / Elementor origin: `https://wp.djenergy.solar`
- Public production site: `https://djenergy.solar`
- Static generator: Simply Static Free `3.7.1` using ZIP export
- GitHub repository: `ibrahim1993011/djenergy`
- Cloudflare Pages project: `djenergy` serving `djenergy.solar`

## Required publishing behavior

The WordPress origin remains set to discourage indexing. This prevents duplicate
indexing of the authoring site. The deployment workflow processes the exported
static files before publication:

- Replace source-origin URLs with `https://djenergy.solar`.
- Replace exported `noindex` robots metadata with `index, follow`.
- Add or update canonical URLs for each HTML output page.
- Restore public email links that may be rewritten during mirror capture.
- Normalize JSON-LD structured data URLs so Organization, WebSite, WebPage, logo,
  image, and search target references point at the production domain.
- Write a clean production `robots.txt`; Cloudflare can layer its managed crawler signals at the edge.
- Write `llms.txt` and `.well-known/llms.txt` as AI/GEO discovery summaries.
- Write the supplemental `/global-energy-storage-solutions/` country/GEO landing page
  and add it to the page sitemap.
- Create a fallback `404.html` when Simply Static 404 generation is disabled.
- Copy logo/favicon assets with stable ASCII filenames and rewrite exported references
  to avoid Cloudflare URL-decoding misses.
- Copy percent-encoded upload filenames to their decoded filenames and create
  business-appropriate fallback files for legacy image paths that no longer
  exist in WordPress, so exported pages do not ship broken images.
- Write `/assets/djenergy-static-fixes.css` to preserve the header logo display and
  the Blog archive card thumbnail/text spacing after each export.
- Run `tools/validate-static-site.mjs` before Cloudflare deployment. The validation
  fails the release if old encoded logo references, source-origin URLs, missing
  canonicals, missing sitemap signals, missing referenced image assets, or
  missing static CSS guards reappear.

## GitHub repository contents

Commit these items to `ibrahim1993011/djenergy`:

- `.github/workflows/deploy-cloudflare-pages.yml`
- `tools/audit-image-assets.mjs`
- `tools/prepare-static-site.mjs`
- `tools/repair-image-assets.mjs`
- `tools/validate-static-site.mjs`
- `public/` (the prepared full-site static output)

## GitHub Actions secrets

Set these repository secrets after creating a Cloudflare API token restricted to
the `djenergy` Pages deployment:

- `CLOUDFLARE_ACCOUNT_ID`: `ae2e103b74958a2d22ad305afe8f249f`
- `CLOUDFLARE_API_TOKEN`: Cloudflare Pages deploy token

Until both secrets are present, the GitHub Actions workflow validates/prepares the
site but intentionally skips the live Pages deployment.

## WordPress export notes

- Keep `Settings > Reading > Discourage search engines from indexing this site`
  enabled on the WordPress origin.
- Keep Simply Static URL replacement on `Relative Path` with path `/`.
- Keep `Generate 404 Page?` disabled until its generation failure is repaired.
- The latest downloaded Simply Static ZIP contains assets only and no HTML or XML
  pages, so it is not suitable as a full production deployment package.
- Until full-site ZIP output is corrected, deploy the prepared `public/` mirror of
  the currently published site and run `tools/prepare-static-site.mjs` before
  each Cloudflare Pages release.

## Local pre-publish checks

Run these commands before every manual upload or commit:

```bash
node tools/prepare-static-site.mjs public https://djenergy.solar
node tools/repair-image-assets.mjs public
node tools/validate-static-site.mjs public https://djenergy.solar
```

The validation protects the May 2026 fixes:

- Header logo must use `/wp-content/uploads/2025/12/djenergy-logo-main.png`.
- Dark/light logo and favicon files must use stable ASCII filenames.
- Old encoded logo paths such as `cropped-cropped-cropped-436...`, `268%C3...`,
  `372%C3...`, and `cropped-512...` must not appear in HTML, XML, CSS, JS, JSON,
  or text outputs.
- Blog archive pages must include `/assets/djenergy-static-fixes.css`, which keeps
  card images at a fixed 16:9 ratio and removes the stretched gap between image
  and text.
- Every referenced local image in HTML, CSS, JS, JSON, XML, feeds, schema, srcset,
  data attributes, and CSS background images must exist in `public/`.
- Public pages must have `index, follow` robots metadata and production canonical
  URLs.
- Static feed clones and meta-refresh redirect pages must have `noindex, follow`
  so they do not compete with real product, category, blog, and GEO pages.
