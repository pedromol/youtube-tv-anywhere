#!/usr/bin/env node
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(rootDir, "src");
const distDir = path.join(rootDir, "dist");

const sharedPaths = ["popup", "assets"];

const targets = [
  {
    browser: "firefox",
    manifestPath: "manifests/firefox.json",
    runtimeFiles: ["background.js"],
  },
  {
    browser: "chrome",
    manifestPath: "manifests/chrome.json",
    runtimeFiles: ["rules.json"],
  },
];

const HTML_REFERENCE = /(?:src|href)="([^"]+)"/g;

function addPath(set, value) {
  if (typeof value === "string" && value !== "") {
    set.add(value);
  }
}

function collectManifestPaths(manifest) {
  const paths = new Set();

  Object.values(manifest.icons ?? {}).forEach((value) => addPath(paths, value));
  addPath(paths, manifest.action?.default_popup);

  const actionIcons = manifest.action?.default_icon;
  if (typeof actionIcons === "string") {
    addPath(paths, actionIcons);
  } else {
    Object.values(actionIcons ?? {}).forEach((value) => addPath(paths, value));
  }

  (manifest.background?.scripts ?? []).forEach((value) => addPath(paths, value));
  addPath(paths, manifest.background?.page);
  addPath(paths, manifest.background?.service_worker);

  for (const resource of manifest.declarative_net_request?.rule_resources ?? []) {
    addPath(paths, resource.path);
  }

  return [...paths];
}

async function collectHtmlPaths(absolutePath, relativePath) {
  const html = await readFile(absolutePath, "utf8");
  const paths = [];

  for (const [, reference] of html.matchAll(HTML_REFERENCE)) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) {
      continue;
    }

    paths.push(
      path.posix.normalize(
        path.posix.join(path.posix.dirname(relativePath), reference),
      ),
    );
  }

  return paths;
}

async function assertReferences(outDir, manifest) {
  const missing = [];
  const visited = new Set();
  const queue = collectManifestPaths(manifest);

  while (queue.length > 0) {
    const relativePath = queue.shift();

    if (visited.has(relativePath)) {
      continue;
    }
    visited.add(relativePath);

    const absolutePath = path.join(outDir, relativePath);

    try {
      await access(absolutePath);
    } catch {
      missing.push(relativePath);
      continue;
    }

    if (relativePath.endsWith(".html")) {
      queue.push(...(await collectHtmlPaths(absolutePath, relativePath)));
    }
  }

  if (missing.length > 0) {
    throw new Error(`missing files: ${missing.join(", ")}`);
  }
}

async function build(target) {
  const manifest = JSON.parse(
    await readFile(path.join(rootDir, target.manifestPath), "utf8"),
  );

  if (manifest.manifest_version !== 3) {
    throw new Error(`${target.manifestPath} is not Manifest V3`);
  }

  const outDir = path.join(distDir, target.browser);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const relativePath of [...sharedPaths, ...target.runtimeFiles]) {
    await cp(path.join(srcDir, relativePath), path.join(outDir, relativePath), {
      recursive: true,
    });
  }

  await writeFile(
    path.join(outDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  await assertReferences(outDir, manifest);

  return outDir;
}

async function main() {
  if (process.argv.includes("--clean")) {
    await rm(distDir, { recursive: true, force: true });
    console.log("removed dist/");
    return;
  }

  for (const target of targets) {
    const outDir = await build(target);
    console.log(`${target.browser}: ${path.relative(rootDir, outDir)}`);
  }
}

main().catch((error) => {
  console.error(`build failed: ${error.message}`);
  process.exitCode = 1;
});
