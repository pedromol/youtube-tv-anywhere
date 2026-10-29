#!/usr/bin/env node
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(rootDir, "src");
const distDir = path.join(rootDir, "dist");

const sharedPaths = ["popup", "assets"];
const browsers = ["firefox", "chrome"];
const generatedRulesPath = "rules.json";

const HTML_REFERENCE = /(?:src|href)="([^"]+)"/g;
const MODULE_REFERENCE = /(?:from|import)\s*["'](\.[^"']*)["']/g;

const resourceTypes = [
  "main_frame",
  "sub_frame",
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "media",
  "other",
];

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(rootDir, relativePath), "utf8"));
}

async function loadProject() {
  const [base, packageJson, config] = await Promise.all([
    readJson("manifests/base.json"),
    readJson("package.json"),
    import(pathToFileURL(path.join(srcDir, "config.js")).href),
  ]);

  return { base, version: packageJson.version, config };
}

function collectManifestPaths(manifest) {
  const paths = new Set();

  const add = (value) => {
    if (typeof value === "string" && value !== "") {
      paths.add(value);
    }
  };

  const addValues = (values) => {
    if (typeof values === "string") {
      add(values);
      return;
    }

    Object.values(values ?? {}).forEach(add);
  };

  addValues(manifest.icons);
  add(manifest.action?.default_popup);
  addValues(manifest.action?.default_icon);

  (manifest.background?.scripts ?? []).forEach(add);
  add(manifest.background?.page);
  add(manifest.background?.service_worker);

  for (const resource of manifest.declarative_net_request?.rule_resources ?? []) {
    add(resource.path);
  }

  return [...paths];
}

function buildRules(config) {
  return [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "User-Agent",
            operation: "set",
            value: config.TV_USER_AGENT,
          },
        ],
      },
      condition: {
        urlFilter: config.TV_PAGE_URL_FILTER,
        resourceTypes,
      },
    },
  ];
}

async function collectHtmlPaths(absolutePath, relativePath) {
  const html = await readFile(absolutePath, "utf8");
  const paths = [];

  for (const [, reference] of html.matchAll(HTML_REFERENCE)) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) {
      continue;
    }

    paths.push(path.posix.join(path.posix.dirname(relativePath), reference));
  }

  return paths;
}

async function collectModulePaths(absolutePath, relativePath) {
  let source;

  try {
    source = await readFile(absolutePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`missing module: ${path.relative(rootDir, absolutePath)}`);
    }
    throw error;
  }

  return [...source.matchAll(MODULE_REFERENCE)]
    .map(([, specifier]) =>
      path.posix.join(path.posix.dirname(relativePath), specifier),
    )
    .filter((specifier) => specifier.endsWith(".js"));
}

async function resolveRuntimeFiles(entryFiles) {
  const files = new Set();
  const queue = [...entryFiles];

  for (let index = 0; index < queue.length; index += 1) {
    const relativePath = queue[index];

    if (files.has(relativePath)) {
      continue;
    }
    files.add(relativePath);

    if (!relativePath.endsWith(".js")) {
      continue;
    }

    queue.push(
      ...(await collectModulePaths(
        path.join(srcDir, relativePath),
        relativePath,
      )),
    );
  }

  return [...files];
}

async function assertReferences(outDir, manifest) {
  const missing = [];
  const visited = new Set();
  const queue = collectManifestPaths(manifest);

  for (let index = 0; index < queue.length; index += 1) {
    const relativePath = queue[index];

    if (visited.has(relativePath)) {
      continue;
    }
    visited.add(relativePath);

    const absolutePath = path.join(outDir, relativePath);

    if (relativePath.endsWith(".html")) {
      try {
        queue.push(...(await collectHtmlPaths(absolutePath, relativePath)));
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
        missing.push(relativePath);
      }
      continue;
    }

    try {
      await access(absolutePath);
    } catch {
      missing.push(relativePath);
    }
  }

  if (missing.length > 0) {
    throw new Error(`missing files: ${missing.join(", ")}`);
  }
}

async function build(browser, project) {
  const manifest = {
    ...project.base,
    ...(await readJson(`manifests/${browser}.json`)),
    version: project.version,
    host_permissions: [project.config.TV_PAGE_PATTERN],
  };

  if (manifest.manifest_version !== 3) {
    throw new Error(`manifests/${browser}.json is not Manifest V3`);
  }

  const outDir = path.join(distDir, browser);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const runtimeFiles = collectManifestPaths(manifest).filter(
    (relativePath) =>
      !sharedPaths.some((shared) => relativePath.startsWith(`${shared}/`)) &&
      relativePath !== generatedRulesPath,
  );

  const filesToCopy = await resolveRuntimeFiles(runtimeFiles);

  await Promise.all(
    [...sharedPaths, ...filesToCopy].map((relativePath) =>
      cp(path.join(srcDir, relativePath), path.join(outDir, relativePath), {
        recursive: true,
      }),
    ),
  );

  if (manifest.declarative_net_request) {
    await writeFile(
      path.join(outDir, generatedRulesPath),
      `${JSON.stringify(buildRules(project.config), null, 2)}\n`,
    );
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

  const project = await loadProject();
  const outDirs = await Promise.all(
    browsers.map((browser) => build(browser, project)),
  );

  for (const outDir of outDirs) {
    console.log(`${path.basename(outDir)}: ${path.relative(rootDir, outDir)}`);
  }
}

main().catch((error) => {
  console.error(`build failed: ${error.message}`);
  process.exitCode = 1;
});
