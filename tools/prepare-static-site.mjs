import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve(process.argv[2] || "public");
const productionOrigin = (process.argv[3] || "https://djenergy.solar").replace(/\/+$/, "");
const sourceOrigins = [
  "https://wp.djenergy.solar",
  "http://wp.djenergy.solar",
];

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".txt",
  ".xml",
]);

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

function productionUrlForHtml(filePath) {
  const relativePath = path.relative(outputDir, filePath).split(path.sep).join("/");
  if (relativePath === "index.html") {
    return `${productionOrigin}/`;
  }
  if (relativePath.endsWith("/index.html")) {
    return `${productionOrigin}/${relativePath.slice(0, -"index.html".length)}`;
  }
  return `${productionOrigin}/${relativePath.replace(/\.html$/, "")}`;
}

function replaceSourceOrigins(content) {
  let result = content;
  for (const sourceOrigin of sourceOrigins) {
    result = result.replaceAll(sourceOrigin, productionOrigin);
  }
  return result;
}

function restoreMirroredEmailLinks(content) {
  return content
    .replace(
      /<a([^>]*?)href=["']\/[^"']*\/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})["']([^>]*)>\s*<span[^>]*class=["'][^"']*\b__cf_email__\b[^"']*["'][^>]*>[\s\S]*?<\/span>\s*<\/a>/gi,
      (_match, before, email, after) => `<a${before}href="mailto:${email}"${after}>${email}</a>`,
    )
    .replace(
      /href=["']\/[^"']*\/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})["']/gi,
      (_match, email) => `href="mailto:${email}"`,
    );
}

function makeAbsoluteReference(value, pageUrl) {
  if (/^(?:https?:|mailto:|tel:|#|data:)/i.test(value)) {
    return value;
  }
  if (value.startsWith("//")) {
    return `https:${value}`;
  }
  if (value.startsWith("/")) {
    return `${productionOrigin}${value}`;
  }
  return new URL(value, pageUrl).href;
}

function makeIndexableHtml(content, canonicalUrl, isErrorPage = false) {
  let result = restoreMirroredEmailLinks(replaceSourceOrigins(content));
  const robotsTag = `<meta name="robots" content="${isErrorPage ? "noindex, follow" : "index, follow"}">`;
  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}">`;
  const robotsPattern = /<meta\s+[^>]*name=["']robots["'][^>]*>/i;
  const canonicalPattern = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;

  if (robotsPattern.test(result)) {
    result = result.replace(robotsPattern, robotsTag);
  } else {
    result = result.replace(/<\/head>/i, `  ${robotsTag}\n</head>`);
  }

  if (canonicalPattern.test(result)) {
    result = result.replace(canonicalPattern, canonicalTag);
  } else {
    result = result.replace(/<\/head>/i, `  ${canonicalTag}\n</head>`);
  }

  result = result.replace(
    /(<meta\s+[^>]*(?:property|name)=["'](?:og:url|og:image|og:image:secure_url|twitter:image)["'][^>]*content=["'])([^"']+)(["'][^>]*>)/gi,
    (_match, before, value, after) => `${before}${makeAbsoluteReference(value, canonicalUrl)}${after}`,
  );

  return result;
}

function makeAbsoluteSitemap(content) {
  return replaceSourceOrigins(content).replace(
    /<loc>([^<]+)<\/loc>/gi,
    (_match, value) => `<loc>${makeAbsoluteReference(value.trim(), `${productionOrigin}/`)}</loc>`,
  );
}

async function writeRobotsFile() {
  const robots = `User-agent: *
Disallow: /wp-content/uploads/wc-logs/
Disallow: /wp-content/uploads/woocommerce_transient_files/
Disallow: /wp-content/uploads/woocommerce_uploads/
Disallow: /*?add-to-cart=
Disallow: /*?*add-to-cart=
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

Sitemap: ${productionOrigin}/sitemap_index.xml
`;
  await writeFile(path.join(outputDir, "robots.txt"), robots, "utf8");
}

async function writeFallback404() {
  const target = path.join(outputDir, "404.html");
  try {
    await readFile(target, "utf8");
    return;
  } catch {
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, follow">
    <title>Page Not Found | DJENERGY</title>
    <style>
      body { align-items: center; background: #f4f4ec; color: #062c28; display: flex; font: 16px Arial, sans-serif; justify-content: center; margin: 0; min-height: 100vh; text-align: center; }
      main { max-width: 540px; padding: 48px 24px; }
      h1 { font-size: clamp(40px, 10vw, 68px); margin: 0 0 12px; }
      p { color: #5d716b; margin: 0 0 28px; }
      a { background: #08745c; border-radius: 28px; color: white; display: inline-block; font-weight: 700; padding: 14px 28px; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <h1>404</h1>
      <p>The page you requested cannot be found.</p>
      <a href="/">Return to DJENERGY home</a>
    </main>
  </body>
</html>
`;
    await writeFile(target, html, "utf8");
  }
}

async function main() {
  const allFiles = await walk(outputDir);
  let htmlCount = 0;
  let textCount = 0;
  let removedCount = 0;

  for (const filePath of allFiles) {
    if (/^[^/\\]+@[^/\\]+\.[^/\\]+$/i.test(path.basename(filePath))) {
      await rm(filePath);
      removedCount += 1;
      continue;
    }

    const extension = path.extname(filePath).toLowerCase();
    if (!textExtensions.has(extension)) {
      continue;
    }

    const original = await readFile(filePath, "utf8");
    const relativePath = path.relative(outputDir, filePath).split(path.sep).join("/");
    const updated = extension === ".html"
      ? makeIndexableHtml(original, productionUrlForHtml(filePath), relativePath === "404.html")
      : extension === ".xml" && /sitemap/i.test(relativePath)
        ? makeAbsoluteSitemap(original)
        : replaceSourceOrigins(original);

    if (updated !== original) {
      await writeFile(filePath, updated, "utf8");
    }

    textCount += 1;
    if (extension === ".html") {
      htmlCount += 1;
    }
  }

  await readFile(path.join(outputDir, "index.html"), "utf8");
  await writeFallback404();
  await writeRobotsFile();
  await mkdir(path.join(outputDir, ".well-known"), { recursive: true });

  console.log(`Prepared ${htmlCount} HTML files, scanned ${textCount} text assets, and removed ${removedCount} invalid email-link pages for ${productionOrigin}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
