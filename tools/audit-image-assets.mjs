import { access, readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const outputDir = path.resolve(process.argv[2] || "public");
const textExtensions = new Set([".css", ".html", ".js", ".json", ".txt", ".xml"]);
const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);

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

function normalizeSlashes(value) {
  return value.replace(/\\\//g, "/").replace(/&amp;/g, "&");
}

function withoutQueryOrHash(value) {
  return value.split("#")[0].split("?")[0];
}

function isImagePath(value) {
  const clean = withoutQueryOrHash(value).toLowerCase();
  return imageExtensions.has(path.extname(clean));
}

function decodePathname(pathname) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function toSitePath(rawUrl) {
  let value = normalizeSlashes(rawUrl.trim());
  if (!value || value.startsWith("data:") || value.startsWith("blob:") || value.startsWith("mailto:") || value.startsWith("tel:")) {
    return null;
  }
  if (value.startsWith("//")) {
    value = `https:${value}`;
  }
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (!/djenergy\.solar$/i.test(url.hostname)) {
        return null;
      }
      return withoutQueryOrHash(url.pathname);
    } catch {
      return null;
    }
  }
  if (!value.startsWith("/")) {
    return null;
  }
  return withoutQueryOrHash(value);
}

function addUrl(urls, rawUrl, sourceFile) {
  const pathname = toSitePath(rawUrl);
  if (!pathname || !isImagePath(pathname)) {
    return;
  }

  const normalized = decodePathname(pathname);
  if (!urls.has(normalized)) {
    urls.set(normalized, new Set());
  }
  urls.get(normalized).add(sourceFile);
}

function collectUrlsFromText(content, sourceFile) {
  const urls = new Map();
  const patterns = [
    /\b(?:src|href|content|poster|data-src|data-large_image|data-thumb|data-thumb-srcset|srcset)\s*=\s*["']([^"']+)["']/gi,
    /\b(?:url|image|contentUrl|thumbnailUrl)"\s*:\s*"([^"]+)"/gi,
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const rawValue = match[1];
      for (const candidate of rawValue.split(",")) {
        addUrl(urls, candidate.trim().split(/\s+/)[0], sourceFile);
      }
    }
  }

  return urls;
}

async function exists(relativeSitePath) {
  const localPath = path.join(outputDir, ...relativeSitePath.replace(/^\/+/, "").split("/"));
  try {
    const info = await stat(localPath);
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

export async function auditImages(directory = outputDir) {
  const previousOutputDir = globalThis.__auditImageAssetsOutputDir;
  globalThis.__auditImageAssetsOutputDir = directory;
  try {
    await access(directory);
    const files = await walk(directory);
    const allUrls = new Map();

    for (const file of files) {
      if (!textExtensions.has(path.extname(file).toLowerCase())) {
        continue;
      }
      const content = await readFile(file, "utf8");
      const relativeFile = path.relative(directory, file).replaceAll(path.sep, "/");
      const urls = collectUrlsFromText(content, relativeFile);
      for (const [url, sources] of urls) {
        if (!allUrls.has(url)) {
          allUrls.set(url, new Set());
        }
        for (const source of sources) {
          allUrls.get(url).add(source);
        }
      }
    }

    const missing = [];
    for (const [url, sources] of allUrls) {
      if (!(await existsInDirectory(directory, url))) {
        missing.push({
          url,
          sourceCount: sources.size,
          sampleSources: [...sources].slice(0, 5),
        });
      }
    }

    missing.sort((a, b) => a.url.localeCompare(b.url));
    return {
      checkedImages: allUrls.size,
      missingImages: missing.length,
      missing,
    };
  } finally {
    globalThis.__auditImageAssetsOutputDir = previousOutputDir;
  }
}

async function existsInDirectory(directory, relativeSitePath) {
  const localPath = path.join(directory, ...relativeSitePath.replace(/^\/+/, "").split("/"));
  try {
    const info = await stat(localPath);
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

async function main() {
  await access(outputDir);
  const summary = await auditImages(outputDir);
  console.log(JSON.stringify(summary, null, 2));

  if (process.argv.includes("--fail-on-missing") && summary.missingImages > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
