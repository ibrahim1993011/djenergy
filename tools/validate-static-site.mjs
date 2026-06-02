import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve(process.argv[2] || "public");
const productionOrigin = (process.argv[3] || "https://djenergy.solar").replace(/\/+$/, "");
const textExtensions = new Set([".css", ".html", ".js", ".json", ".txt", ".xml"]);
const requiredFiles = [
  "index.html",
  "blog/index.html",
  "robots.txt",
  "sitemap_index.xml",
  "llms.txt",
  ".well-known/llms.txt",
  "assets/djenergy-static-fixes.css",
  "wp-content/uploads/2025/12/djenergy-logo-main.png",
  "wp-content/uploads/2025/12/djenergy-logo-dark.png",
  "wp-content/uploads/2025/12/djenergy-icon-32x32.png",
  "wp-content/uploads/2025/12/djenergy-icon-180x180.png",
  "wp-content/uploads/2025/12/djenergy-icon-192x192.png",
  "wp-content/uploads/2026/02/djenergy-logo-light.png",
  "wp-content/uploads/2026/02/djenergy-logo-light-300x68.png",
];
const forbiddenPatterns = [
  /wp\.djenergy\.solar/i,
  /cropped-cropped-cropped-436/i,
  /268%C3%9786/i,
  /268\u00d786/i,
  /372%C3%9784/i,
  /372\u00d784/i,
  /cropped-512%C3%97512/i,
  /cropped-512\u00d7512/i,
];
const commercialSeoPages = [
  ["product-category/battery-cells/index.html", "battery-cells"],
  ["product-category/all-in-one-ci-ess/index.html", "all-in-one-ci-ess"],
  ["product-category/containerized-bess/index.html", "containerized-bess"],
  ["product-category/home-battery/index.html", "home-battery"],
  ["product-category/bess-system/index.html", "bess-system-category"],
];
const allowedLvHvTitlePages = new Set([
  "blog/what-is-the-difference-between-lv-and-hv-voltage/index.html",
]);
const manufacturingProofPages = [
  "factory/index.html",
  "what-we-do/index.html",
];
const productInquiryPages = [
  "product/110kw-174kwh-ci-energy-storage-systems/index.html",
  "product/180kw-372kwh-ci-energy-storage-systems/index.html",
  "product/high-capacity-100kwh-battery-energy-storage-system/index.html",
  "product/16kw-48v-lithium-ion-battery-314ah/index.html",
  "product/lfp-prismatic-cell-314ah/index.html",
  "product/containerized-250kw-750kw-backup-storage/index.html",
  "product/containerized-3-7mw-5mw-solar-energy-plant/index.html",
  "product/containerized-bess-500kw-1mwh-solar-plant/index.html",
  "product/containerized-bess-750kw-1-5mwh/index.html",
  "product/containerized-storage-with-lifepo4-battery/index.html",
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(entryPath));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

async function readText(relativePath) {
  return readFile(path.join(outputDir, ...relativePath.split("/")), "utf8");
}

function addError(errors, message) {
  errors.push(`- ${message}`);
}

function shouldNoindexHtml(relativePath, content) {
  return relativePath === "404.html"
    || relativePath === "feed/index.html"
    || relativePath.endsWith("/feed/index.html")
    || /<title>\s*Redirecting\.\.\.\s*<\/title>/i.test(content)
    || /<meta\s+[^>]*http-equiv=["']refresh["'][^>]*>/i.test(content);
}

function isBlogArticle(relativePath) {
  return relativePath.startsWith("blog/")
    && relativePath.endsWith("/index.html")
    && relativePath !== "blog/index.html"
    && !relativePath.startsWith("blog/page/")
    && !relativePath.includes("/feed/")
    && !relativePath.includes("/tag/")
    && !relativePath.includes("/category/")
    && !/^blog\/20\d{2}\//.test(relativePath);
}

async function validateRequiredFiles(errors) {
  for (const relativePath of requiredFiles) {
    const filePath = path.join(outputDir, ...relativePath.split("/"));
    try {
      const info = await stat(filePath);
      if (!info.isFile() || info.size === 0) {
        addError(errors, `Required file is empty or not a file: ${relativePath}`);
      }
    } catch {
      addError(errors, `Missing required file: ${relativePath}`);
    }
  }
}

async function validateTextAssets(errors) {
  const files = await walk(outputDir);
  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    if (!textExtensions.has(extension)) {
      continue;
    }

    const relativePath = path.relative(outputDir, filePath).split(path.sep).join("/");
    const content = await readFile(filePath, "utf8");

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        addError(errors, `${relativePath} contains forbidden static export reference: ${pattern}`);
      }
    }

    if (extension === ".html") {
      const shouldNoindex = shouldNoindexHtml(relativePath, content);
      const expectedRobotsPattern = shouldNoindex
        ? /<meta\s+[^>]*name=["']robots["'][^>]*content=["']noindex,\s*follow["'][^>]*>/i
        : /<meta\s+[^>]*name=["']robots["'][^>]*content=["']index,\s*follow["'][^>]*>/i;
      if (!expectedRobotsPattern.test(content)) {
        addError(errors, `${relativePath} is missing ${shouldNoindex ? "noindex, follow" : "index, follow"} robots metadata`);
      }
      if (!/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']https:\/\/djenergy\.solar\//i.test(content)) {
        addError(errors, `${relativePath} is missing a production canonical URL`);
      }
      if (!content.includes("djenergy-static-fixes.css")) {
        addError(errors, `${relativePath} is missing the static fixes CSS link`);
      }
      if (!/djenergy-static-fixes\.css\?v=[a-f0-9]{12}/.test(content)) {
        addError(errors, `${relativePath} is missing a cache-busted static fixes CSS link`);
      }
      if (
        isBlogArticle(relativePath)
        && !allowedLvHvTitlePages.has(relativePath)
        && /<title>\s*What is the difference between LV and HV voltage\?\s*<\/title>/i.test(content)
      ) {
        addError(errors, `${relativePath} still has the duplicate LV/HV title`);
      }
    }
  }
}

async function validateKnownPages(errors) {
  const home = await readText("index.html");
  const blog = await readText("blog/index.html");
  const factory = await readText("factory/index.html");
  const css = await readText("assets/djenergy-static-fixes.css");
  const robots = await readText("robots.txt");
  const sitemapIndex = await readText("sitemap_index.xml");
  const llms = await readText("llms.txt");

  if (!home.includes("/wp-content/uploads/2025/12/djenergy-logo-main.png")) {
    addError(errors, "Home page does not reference the stable main logo asset");
  }
  if (!blog.includes("/wp-content/uploads/2025/12/djenergy-logo-main.png")) {
    addError(errors, "Blog page does not reference the stable main logo asset");
  }
  if (!css.includes("aspect-ratio: 16 / 9")) {
    addError(errors, "Static fixes CSS does not preserve the blog thumbnail aspect-ratio guard");
  }
  if (!css.includes("min-height: 44px")) {
    addError(errors, "Static fixes CSS does not preserve the mobile tap target guard");
  }
  if (!css.includes("bottom: 18px !important")) {
    addError(errors, "Static fixes CSS does not preserve the mobile WhatsApp placement guard");
  }
  if (!css.includes("elementor-element-94fb9c1") || !css.includes("flex-direction: column !important")) {
    addError(errors, "Static fixes CSS does not preserve the Factory mobile hero layout guard");
  }
  if (!css.includes("body [class*=\"elementor-\"] .elementor-widget-image img") || !css.includes("height: auto !important")) {
    addError(errors, "Static fixes CSS does not preserve the mobile image ratio guard");
  }
  if (!css.includes("body .qodef-banner .qodef-m-image img") || !css.includes("min-height: 0 !important")) {
    addError(errors, "Static fixes CSS does not preserve the mobile banner image ratio guard");
  }
  if (!css.includes(".elementor .e-con.e-flex > .e-con-inner") || !css.includes("flex-direction: column !important")) {
    addError(errors, "Static fixes CSS does not preserve the mobile Elementor container stacking guard");
  }
  if (!css.includes("elementor-element-5143ff81") || !css.includes("elementor-element-9da0e4b")) {
    addError(errors, "Static fixes CSS does not preserve the mobile About/Solutions hero width guards");
  }
  if (!css.includes("linear-gradient(rgba(15, 23, 42, .68)") || !css.includes("/wp-content/uploads/2026/01/Factory-1.jpg") || !css.includes("text-transform: none !important")) {
    addError(errors, "Static fixes CSS does not preserve the mobile hero readability guards");
  }
  if (!css.includes(".woocommerce-product-gallery .zoomImg")) {
    addError(errors, "Static fixes CSS does not preserve the mobile product zoom guard");
  }
  if (!css.includes("#qodef-page-outer table") || !css.includes("white-space: normal !important")) {
    addError(errors, "Static fixes CSS does not preserve the mobile article table and heading wrap guard");
  }
  if (!css.includes(".dj-product-rfq") || !css.includes(".dj-product-rfq__grid")) {
    addError(errors, "Static fixes CSS does not preserve the product RFQ module styling");
  }
  if (factory.includes("DJENERGY FACTORY-CELLS-TO-SYSTEM ENERGY STORAGE MANUFACTURING")) {
    addError(errors, "Factory page still contains the cramped all-caps mobile hero title");
  }
  if (!factory.includes("DJENERGY Factory: Cells-to-System Energy Storage Manufacturing")) {
    addError(errors, "Factory page is missing the mobile-friendly hero title");
  }
  if (!robots.includes(`Sitemap: ${productionOrigin}/sitemap_index.xml`)) {
    addError(errors, "robots.txt does not point crawlers to the production sitemap index");
  }
  if (!sitemapIndex.includes(`${productionOrigin}/page-sitemap.xml`)) {
    addError(errors, "sitemap_index.xml does not contain production sitemap URLs");
  }
  if (!llms.includes("cells-to-system LiFePO4 energy storage manufacturer")) {
    addError(errors, "llms.txt is missing the core DJENERGY entity description");
  }
  if (!llms.includes("## Buyer Intent Map") || !llms.includes("## Answer Engine Notes")) {
    addError(errors, "llms.txt is missing the GEO buyer-intent and answer-engine sections");
  }
}

async function validateCommercialSeoPages(errors) {
  for (const [relativePath, key] of commercialSeoPages) {
    const content = await readText(relativePath);
    if (!content.includes(`data-dj-seo-enhancement="${key}"`)) {
      addError(errors, `${relativePath} is missing the commercial SEO landing section`);
    }
    if (!content.includes(`data-dj-schema="${key}"`)) {
      addError(errors, `${relativePath} is missing the commercial SEO structured data`);
    }
    if (!/<meta\s+[^>]*name=["']description["'][^>]*content=["'][^"']{80,}["'][^>]*>/i.test(content)) {
      addError(errors, `${relativePath} is missing an optimized meta description`);
    }
    if (!content.includes("Inquiry checklist") || !content.includes("/contact-us/")) {
      addError(errors, `${relativePath} is missing inquiry guidance or contact CTA`);
    }
  }
}

async function validateBlogNextSteps(errors) {
  const files = await walk(outputDir);
  let blogArticleCount = 0;
  let nextStepCount = 0;

  for (const filePath of files) {
    if (path.basename(filePath) !== "index.html") {
      continue;
    }

    const relativePath = path.relative(outputDir, filePath).split(path.sep).join("/");
    if (!isBlogArticle(relativePath)) {
      continue;
    }

    blogArticleCount += 1;
    const content = await readFile(filePath, "utf8");
    if (content.includes("data-dj-blog-next-step=") && content.includes("data-dj-blog-schema=")) {
      nextStepCount += 1;
    } else {
      addError(errors, `${relativePath} is missing the blog commercial next-step module or schema`);
    }
    if (!content.includes("/contact-us/")) {
      addError(errors, `${relativePath} is missing a contact CTA`);
    }
  }

  if (blogArticleCount < 20 || nextStepCount !== blogArticleCount) {
    addError(errors, `Expected all blog articles to have next-step modules; found ${nextStepCount}/${blogArticleCount}`);
  }
}

async function validateManufacturingProofPages(errors) {
  for (const relativePath of manufacturingProofPages) {
    const content = await readText(relativePath);
    if (!content.includes("data-dj-manufacturing-proof=\"cells-to-system\"")) {
      addError(errors, `${relativePath} is missing the cells-to-system manufacturing proof section`);
    }
    if (!content.includes("data-dj-manufacturing-schema=\"cells-to-system\"")) {
      addError(errors, `${relativePath} is missing the manufacturing proof structured data`);
    }
  }
}

async function validateProductInquiryPages(errors) {
  for (const relativePath of productInquiryPages) {
    const content = await readText(relativePath);
    if (!content.includes("data-dj-product-rfq=")) {
      addError(errors, `${relativePath} is missing the product RFQ inquiry module`);
    }
    const rfqModuleCount = (content.match(/data-dj-product-rfq=/g) || []).length;
    if (rfqModuleCount !== 1) {
      addError(errors, `${relativePath} has ${rfqModuleCount} product RFQ inquiry modules`);
    }
    if (!content.includes('id="product-rfq"')) {
      addError(errors, `${relativePath} is missing the product RFQ anchor`);
    }
    if (!content.includes("data-dj-product-rfq-schema=")) {
      addError(errors, `${relativePath} is missing the product RFQ structured data`);
    }
    if (!/"@type"\s*:\s*"Product"|"@type"\s*:\s*\[[^\]]*"Product"/i.test(content)) {
      addError(errors, `${relativePath} is missing Product structured data`);
    }
    if (!content.includes("/contact-us/")) {
      addError(errors, `${relativePath} is missing a product inquiry contact CTA`);
    }
  }

  const highCapacityPage = await readText("product/180kw-372kwh-ci-energy-storage-systems/index.html");
  if (!highCapacityPage.includes("180kW 372kWh C&amp;I Energy Storage System | DJENERGY")
    && !highCapacityPage.includes("180kW 372kWh C&I Energy Storage System | DJENERGY")) {
    addError(errors, "180kW/372kWh product page still has the wrong title");
  }
  if (!highCapacityPage.includes("180kW/372kWh C&I Energy Storage System")) {
    addError(errors, "180kW/372kWh product page still has the wrong product heading or schema name");
  }
}

async function main() {
  const errors = [];
  await validateRequiredFiles(errors);
  await validateTextAssets(errors);
  await validateKnownPages(errors);
  await validateCommercialSeoPages(errors);
  await validateBlogNextSteps(errors);
  await validateManufacturingProofPages(errors);
  await validateProductInquiryPages(errors);

  if (errors.length > 0) {
    console.error(`Static site validation failed with ${errors.length} issue(s):`);
    console.error(errors.join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(`Static site validation passed for ${productionOrigin}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
