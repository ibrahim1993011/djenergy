import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve(process.argv[2] || "public-source");
const sourceOrigin = (process.argv[3] || "https://djenergy.solar").replace(/\/+$/, "");
const maxUrls = Number(process.argv[4] || 2600);
const sourceHost = new URL(sourceOrigin).hostname;
const textExtensions = new Set([".css", ".html", ".js", ".json", ".txt", ".xml"]);
const ignoredPathPatterns = [
  /^\/wp-admin\//i,
  /^\/wp-login\.php/i,
  /^\/cart\//i,
  /^\/checkout\//i,
  /^\/my-account\//i,
  /^\/cdn-cgi\//i,
  /^\/wp-json\//i,
  /\/wc-logs\//i,
  /\/woocommerce_uploads\//i,
  /\/woocommerce_transient_files\//i,
];

function decodePathPart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeUrl(rawUrl, baseUrl) {
  const trimmed = rawUrl?.trim() || "";
  if (!trimmed
    || trimmed.startsWith("data:")
    || trimmed.startsWith("blob:")
    || trimmed.startsWith("mailto:")
    || trimmed.startsWith("tel:")
    || !/^(https?:\/\/|\/\/|\/|\.{1,2}\/)/i.test(trimmed)) {
    return null;
  }

  try {
    const url = new URL(trimmed.replace(/&amp;/g, "&"), baseUrl);
    if (url.hostname !== sourceHost && !url.hostname.endsWith(`.${sourceHost}`)) {
      return null;
    }
    url.hash = "";
    url.search = "";
    if (ignoredPathPatterns.some((pattern) => pattern.test(url.pathname))) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

function outputPathForUrl(url) {
  const parsed = new URL(url);
  const decodedPath = decodePathPart(parsed.pathname);
  let sitePath = decodedPath;

  if (sitePath === "/" || sitePath === "") {
    sitePath = "/index.html";
  } else if (sitePath.endsWith("/")) {
    sitePath += "index.html";
  } else if (!path.extname(sitePath)) {
    sitePath += "/index.html";
  }

  return path.join(outputDir, ...sitePath.replace(/^\/+/, "").split("/"));
}

function looksLikeText(url, contentType) {
  if (/text|xml|json|javascript|css/i.test(contentType || "")) {
    return true;
  }
  const extension = path.extname(new URL(url).pathname).toLowerCase();
  return textExtensions.has(extension);
}

function enqueueUrl(queue, queued, rawUrl, baseUrl) {
  const normalized = normalizeUrl(rawUrl, baseUrl);
  if (!normalized || queued.has(normalized) || queued.size >= maxUrls) {
    return false;
  }
  queued.add(normalized);
  queue.push(normalized);
  return true;
}

function collectUrlsFromText(content, baseUrl) {
  const found = [];
  const patterns = [
    /\b(?:src|href|content|poster|data-src|data-large_image|data-thumb|data-thumb-srcset|srcset)\s*=\s*["']([^"']+)["']/gi,
    /\b(?:url|image|contentUrl|thumbnailUrl)"\s*:\s*"([^"]+)"/gi,
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
    /<loc>([^<]+)<\/loc>/gi,
    /@import\s+["']([^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      for (const candidate of match[1].split(",")) {
        const url = normalizeUrl(candidate.trim().split(/\s+/)[0], baseUrl);
        if (url) {
          found.push(url);
        }
      }
    }
  }

  return found;
}

async function fetchWithRetry(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 DJENERGY static deployment crawler",
          "Cache-Control": "no-cache",
        },
      });
      return response;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 700));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

async function saveResponse(url, response, queue, queued, stats) {
  const target = outputPathForUrl(url);
  await mkdir(path.dirname(target), { recursive: true });

  const contentType = response.headers.get("content-type") || "";
  if (looksLikeText(url, contentType)) {
    const text = await response.text();
    await writeFile(target, text, "utf8");
    stats.text += 1;
    for (const discovered of collectUrlsFromText(text, url)) {
      enqueueUrl(queue, queued, discovered, url);
    }
    return;
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(target, bytes);
  stats.binary += 1;
}

async function main() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const queue = [];
  const queued = new Set();
  const visited = new Set();
  const stats = { text: 0, binary: 0, skipped: 0, failed: [] };

  for (const seed of [
    "/",
    "/sitemap_index.xml",
    "/page-sitemap.xml",
    "/post-sitemap.xml",
    "/product-sitemap.xml",
    "/category-sitemap.xml",
    "/product_cat-sitemap.xml",
    "/product_brand-sitemap.xml",
    "/products/",
    "/factory/",
    "/blog/",
    "/contact-us/",
  ]) {
    enqueueUrl(queue, queued, seed, sourceOrigin);
  }

  while (queue.length > 0 && visited.size < maxUrls) {
    const url = queue.shift();
    if (visited.has(url)) {
      continue;
    }
    visited.add(url);

    try {
      const response = await fetchWithRetry(url);
      if (!response.ok) {
        stats.skipped += 1;
        stats.failed.push({ url, status: response.status });
        continue;
      }
      await saveResponse(url, response, queue, queued, stats);
    } catch (error) {
      stats.skipped += 1;
      stats.failed.push({ url, error: error.message });
    }
  }

  console.log(JSON.stringify({
    sourceOrigin,
    outputDir,
    queued: queued.size,
    visited: visited.size,
    ...stats,
    failedSamples: stats.failed.slice(0, 30),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
