# DJENERGY Blog Internal Linking Rules

Updated: 2026-06-01

The Blog should educate buyers and then move them to the correct product,
factory, or inquiry page. Each article gets a commercial next-step module after
the main article content.

## Current Routing

| Blog Intent | Module | Primary Commercial Page | CTA |
| --- | --- | --- | --- |
| BESS basics, advantages, DC/AC, voltage | `bess` | `/product-category/bess-system/` | Request BESS quote |
| Containerized BESS, MWh scale, PCS, grid storage | `containerized-bess` | `/product-category/containerized-bess/` | Request project support |
| C&I solar, C&I ESS cabinet sizing | `ci-ess` | `/product-category/all-in-one-ci-ess/` | Request project sizing |
| LiFePO4, LFP, BMS, lithium comparison, C-rate | `battery-cells` | `/product-category/battery-cells/` | Request datasheet |
| Home solar, off-grid, MPPT/PWM, residential backup | `home-battery` | `/product-category/home-battery/` | Ask about distributor support |

## Current Coverage

- Single Blog articles covered: 29
- Duplicate LV/HV title issue fixed on all articles except the real LV/HV article:
  `/blog/what-is-the-difference-between-lv-and-hv-voltage/`
- The static validation script now blocks deployment if a Blog article is missing
  its next-step module, structured data, or contact CTA.

## Why This Matters

Educational articles can attract long-tail search traffic, but without commercial
internal links they do not help inquiries enough. The next-step module connects
informational intent to product-category pages, product pages, and the contact
page so readers have a clear path from learning to project discussion.

## Next Improvements

1. Add stronger in-body links in the first third of high-traffic articles after
   Search Console shows which pages receive impressions.
2. Add comparison tables to the highest-value guides:
   - C&I ESS cabinet sizing
   - Containerized BESS buyer guide
   - LiFePO4 cell sourcing guide
3. Add author/manufacturer proof snippets to technical articles that discuss
   safety, BMS, testing, and project configuration.
