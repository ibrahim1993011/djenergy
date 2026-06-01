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
    }
  }
}

async function validateKnownPages(errors) {
  const home = await readText("index.html");
  const blog = await readText("blog/index.html");
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

async function main() {
  const errors = [];
  await validateRequiredFiles(errors);
  await validateTextAssets(errors);
  await validateKnownPages(errors);

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
