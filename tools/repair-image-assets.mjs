import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { auditImages } from "./audit-image-assets.mjs";

const outputDir = path.resolve(process.argv[2] || "public");
const textExtensions = new Set([".css", ".html", ".js", ".json", ".txt", ".xml"]);

function localPath(sitePath) {
  return path.join(outputDir, ...sitePath.replace(/^\/+/, "").split("/"));
}

async function fileExists(sitePath) {
  try {
    const info = await stat(localPath(sitePath));
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

async function copySiteFile(from, to) {
  if (!(await fileExists(from)) || await fileExists(to)) {
    return false;
  }
  const target = localPath(to);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(localPath(from), target);
  return true;
}

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

async function createDecodedFilenameCopies() {
  const uploadsDir = localPath("/wp-content/uploads");
  const files = await walk(uploadsDir);
  let copied = 0;
  const referenceRewrites = [];

  for (const source of files) {
    const name = path.basename(source);
    if (!name.includes("%")) {
      continue;
    }
    let decodedName;
    try {
      decodedName = decodeURIComponent(name);
    } catch {
      continue;
    }
    if (decodedName === name) {
      continue;
    }
    const target = path.join(path.dirname(source), decodedName);
    const relativeEncoded = `/${path.relative(outputDir, source).replaceAll(path.sep, "/")}`;
    const relativeDecoded = `/${path.relative(outputDir, target).replaceAll(path.sep, "/")}`;
    const relativeDoubleEncoded = `${path.dirname(relativeEncoded).replaceAll("\\", "/")}/${encodeURIComponent(name)}`;
    if (target.length > 240) {
      referenceRewrites.push([relativeDecoded, relativeDoubleEncoded]);
      referenceRewrites.push([relativeEncoded, relativeDoubleEncoded]);
      continue;
    }
    try {
      await stat(target);
    } catch {
      await copyFile(source, target);
      copied += 1;
    }
  }

  return { copied, referenceRewrites };
}

async function applyReferenceRewrites(rewrites) {
  if (rewrites.length === 0) {
    return 0;
  }

  const files = await walk(outputDir);
  let changedFiles = 0;
  for (const file of files) {
    if (!textExtensions.has(path.extname(file).toLowerCase())) {
      continue;
    }
    let content = await readFile(file, "utf8");
    const original = content;
    for (const [from, to] of rewrites) {
      content = content.split(from).join(to);
      content = content.split(from.replaceAll("/", "\\/")).join(to.replaceAll("/", "\\/"));
    }
    if (content !== original) {
      await writeFile(file, content);
      changedFiles += 1;
    }
  }
  return changedFiles;
}

function sizeFallbackForHomeBattery(sitePath) {
  const filename = path.basename(sitePath);
  const suffix = filename.match(/-(\d+x\d+)\.jpg$/)?.[1];
  if (filename.includes("-01")) {
    const exact = suffix
      ? `/wp-content/uploads/2025/12/右侧仰视4-源文件-01-${suffix}.jpg`
      : "/wp-content/uploads/2025/12/右侧仰视4-源文件-01-scaled.jpg";
    return exact;
  }
  if (suffix && ["100x100", "150x150", "300x300", "768x771", "800x803", "1020x1024", "1530x1536", "2040x2048"].includes(suffix)) {
    return `/wp-content/uploads/2025/12/右侧仰视4-源文件-01-${suffix}.jpg`;
  }
  return "/wp-content/uploads/2025/12/右侧仰视4-源文件-01-scaled.jpg";
}

function sizeFallbackForCiCabinet(sitePath) {
  const filename = path.basename(sitePath);
  const suffix = filename.match(/-(\d+x\d+)\.jpg$/)?.[1];
  if (suffix && ["212x300", "724x1024", "768x1086", "800x1131", "1086x1536"].includes(suffix)) {
    return `/wp-content/uploads/2025/12/100KW174KWH-ALL-IN-ONE-CI-01-${suffix}.jpg`;
  }
  return "/wp-content/uploads/2025/12/100KW174KWH-ALL-IN-ONE-CI-01.jpg";
}

function fallbackFor(sitePath) {
  if (/\/2022\/10\/footer-img-3\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/1100-x-578-scaled.jpg";
  }
  if (/\/2022\/10\/b-title-img-1\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/Main-home-banner-01.jpg";
  }
  if (/\/2022\/10\/home-3-cf-background-scaled\.png$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/home-2-image-01.png";
  }
  if (/\/2022\/10\/home-3-column-background\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/energy-bess.jpg";
  }
  if (/\/2022\/10\/sidearea-background\.png$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/home-2-image-01.png";
  }
  if (/\/2022\/10\/solutions-background\.png$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/home-2-image-01.png";
  }
  if (/\/2024\/11\/side-2\.png$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/home-2-image-01.png";
  }
  if (/\/2025\/02\/home-3-cf-background-scaled\.webp$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/04/bess-system.webp";
  }
  if (/\/2024\/11\/(?:侧视图|右侧仰视4-源文件-0[123])/.test(sitePath)) {
    return sizeFallbackForHomeBattery(sitePath);
  }
  if (/\/2025\/12\/100KW174KWH-ALL-IN-ONE-CI-06\.jpg$/i.test(sitePath)
    || /\/2026\/01\/100KW174KWH-ALL-IN-ONE-CI-07\.jpg$/i.test(sitePath)
    || /\/2025\/12\/主图\.jpg$/i.test(sitePath)) {
    return sizeFallbackForCiCabinet(sitePath);
  }
  if (/\/2025\/12\/back-img\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/1100-x-578-scaled.jpg";
  }
  if (/\/2025\/12\/Bess\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/energy-bess.jpg";
  }
  if (/\/2025\/12\/Factory\.jpg$/i.test(sitePath) || /\/2025\/12\/our-mission\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2026/01/Factory-1.jpg";
  }
  if (/\/2025\/12\/home-3-column-background\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/energy-bess.jpg";
  }
  if (/\/2026\/01\/1920-faq\.jpg$/i.test(sitePath) || /\/2026\/01\/factory-rd-scaled\.jpg$/i.test(sitePath)
    || /\/2026\/01\/liquid-cooling-production-line\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2026/01/Factory-1.jpg";
  }
  if (/\/2026\/01\/a157be17ea00f2fc9adcf31007682252\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/Main-home-banner-02.jpg";
  }
  if (/\/2026\/01\/CAT\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/1100-x-578-scaled.jpg";
  }
  if (/\/2026\/01\/cells-3\.2v\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2026/01/cells-3.2v-1.jpg";
  }
  if (/\/2026\/01\/commercial-industry-all-in-one\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2026/01/174kwh-all-in-one.jpg";
  }
  if (/\/2026\/01\/djenergy-social-share-white-1200x630-tagline\.png$/i.test(sitePath)) {
    return "/wp-content/uploads/2026/01/资源-5.png";
  }
  if (/\/2026\/01\/djenergy_solutions_bg_mobile_v2_1080x1920\.webp$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/04/bess-system.webp";
  }
  if (/\/2026\/01\/home-page-1-1\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2025/12/Main-home-banner-01.jpg";
  }
  if (/\/2026\/01\/home3\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2026/01/home4.jpg";
  }
  if (/\/2026\/01\/video-page-2560\.jpg$/i.test(sitePath)) {
    return "/wp-content/uploads/2026/01/Factory-1.jpg";
  }
  return null;
}

async function main() {
  const decoded = await createDecodedFilenameCopies();
  const rewrittenTextFiles = await applyReferenceRewrites(decoded.referenceRewrites);
  const before = await auditImages(outputDir);
  const copiedFallbacks = [];
  const unresolved = [];

  for (const item of before.missing) {
    const fallback = fallbackFor(item.url);
    if (!fallback) {
      unresolved.push(item);
      continue;
    }
    if (await copySiteFile(fallback, item.url)) {
      copiedFallbacks.push({ from: fallback, to: item.url });
    } else if (!(await fileExists(item.url))) {
      unresolved.push({ ...item, fallback });
    }
  }

  const after = await auditImages(outputDir);
  console.log(JSON.stringify({
    decodedFilenameCopies: decoded.copied,
    rewrittenTextFiles,
    beforeMissingImages: before.missingImages,
    copiedFallbackImages: copiedFallbacks.length,
    afterMissingImages: after.missingImages,
    unresolved: after.missing,
  }, null, 2));

  if (after.missingImages > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
