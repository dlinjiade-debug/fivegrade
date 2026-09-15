const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const PWA = require("../js/pwa-config.js");

test("PWA precache covers every lesson, shared stylesheet, and core learning script", () => {
  assert.match(PWA.CACHE_NAME, /^math-mystery-v\d+$/);
  for (const asset of [
    "./index.html", ...Array.from({ length: 9 }, (_, i) => `./unit${i + 1}.html`),
    "./css/style.css", "./css/mystery.css",
    "./js/common.js", "./js/app-core.js", "./js/handwrite.js", "./js/vertical-calc.js", "./js/voxel3d.js",
    ...Array.from({ length: 9 }, (_, i) => `./js/unit${i + 1}.js`),
    "./js/labs-arithmetic.js", "./js/labs-geometry.js",
    "./js/home.js", "./js/pwa.js", "./js/pwa-config.js",
    "./handout.html", "./css/handout.css", "./js/handout.js", "./data/handout-content.json",
    "./output/pdf/五年级数学知识点精华讲义.pdf",
  ]) assert.ok(PWA.PRECACHE_URLS.includes(asset), `missing ${asset}`);

  const version = PWA.CACHE_NAME.match(/v(\d+)$/)[1];
  const handwriteReleaseAsset = `./js/handwrite.js?v=${version}`;
  const verticalReleaseAsset = `./js/vertical-calc.js?v=${version}`;
  const mysteryStyleReleaseAsset = `./css/mystery.css?v=${version}`;
  const commonReleaseAsset = `./js/common.js?v=${version}`;
  const coreReleaseAsset = `./js/app-core.js?v=${version}`;
  assert.ok(PWA.PRECACHE_URLS.includes(handwriteReleaseAsset), "手写引擎发布版应使用版本化缓存键");
  assert.ok(PWA.PRECACHE_URLS.includes(verticalReleaseAsset), "竖式引擎发布版应使用版本化缓存键");
  assert.ok(PWA.PRECACHE_URLS.includes(mysteryStyleReleaseAsset), "工作台样式发布版应使用版本化缓存键");
  assert.ok(PWA.PRECACHE_URLS.includes(commonReleaseAsset), "公共工作台发布版应使用版本化缓存键");
  assert.ok(PWA.PRECACHE_URLS.includes(coreReleaseAsset), "课程核心发布版应使用版本化缓存键");
  for (const page of ["unit2.html", "unit3.html"]) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    assert.match(html, new RegExp(`js/vertical-calc\\.js\\?v=${version}`));
  }
  for (const page of ["index.html", ...Array.from({ length: 9 }, (_, i) => `unit${i + 1}.html`)]) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    assert.match(html, new RegExp(`css/mystery\\.css\\?v=${version}`));
    assert.match(html, new RegExp(`js/app-core\\.js\\?v=${version}`));
    assert.match(html, new RegExp(`js/common\\.js\\?v=${version}`));
  }
  for (const page of Array.from({ length: 9 }, (_, i) => `unit${i + 1}.html`)) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    assert.match(html, new RegExp(`js/handwrite\\.js\\?v=${version}`));
  }
});

test("manifest declares the installed math mystery app and maskable SVG icon", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  assert.equal(manifest.name, "数学解谜局");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./index.html");
  assert.equal(manifest.theme_color, "#32114f");
  assert.equal(manifest.background_color, "#fff8e8");
  assert.ok(manifest.icons.some((icon) => icon.src === "icons/math-mystery.svg" && icon.sizes === "any" && icon.purpose === "any maskable"));
});

test("service worker precaches fresh release assets, removes stale versions, and uses same-origin GET cache-first updates", () => {
  const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  const version = PWA.CACHE_NAME.match(/v(\d+)$/)[1];
  assert.match(worker, new RegExp(`importScripts\\("\\./js/pwa-config\\.js\\?v=${version}"\\)`));
  assert.match(worker, /install[\s\S]*PWA\.PRECACHE_URLS\.map/);
  assert.match(worker, /install[\s\S]*cache:\s*["']reload["']/);
  assert.match(worker, /install[\s\S]*cache\.put\(url/);
  assert.match(worker, /install[\s\S]*self\.skipWaiting\(\)/);
  assert.match(worker, /activate[\s\S]*caches\.keys\(\)[\s\S]*caches\.delete/);
  assert.match(worker, /request\.method !== "GET"/);
  assert.match(worker, /url\.origin !== self\.location\.origin/);
  assert.match(worker, /caches\.match\(request\)[\s\S]*fetch\(request\)/);
  assert.match(worker, /event\.waitUntil/);
});

test("registration only runs in supported HTTP(S) or localhost contexts", () => {  const client = fs.readFileSync(path.join(root, "js", "pwa.js"), "utf8");
  assert.match(client, /navigator\.serviceWorker/);
  assert.match(client, /location\.protocol === "https:"/);
  assert.match(client, /location\.protocol === "http:"/);
  assert.match(client, /localhost/);
  assert.match(client, /serviceWorker\.register\(["']\.\/sw\.js["']\)/);
});

test("icon is a valid SVG with a warm background and deep-purple artwork", () => {
  const icon = fs.readFileSync(path.join(root, "icons", "math-mystery.svg"), "utf8");
  assert.match(icon, /<svg[\s\S]*<\/svg>/);
  assert.match(icon, /#fff8e8/i);
  assert.match(icon, /#32114f/i);
});

/* 黑板子站（blackboard/）是独立的一套 ?v=N。这里把它和主站预缓存对齐：
   页面按 ?v=N 取资源，预缓存就必须收带版本号的键，否则离线打开会命中不到。 */
test("blackboard sub-site keeps one version and precaches every asset it asks for", () => {
  const pages = ["blackboard/index.html", "blackboard/level.html"];
  const versioned = new Set();

  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    assert.ok(/window\.__bbErrors\s*=\s*\[\]/.test(html), `${page} 缺少报错钩子`);
    for (const m of html.matchAll(/\?v=(\d+)/g)) versioned.add(m[1]);
  }
  assert.equal(versioned.size, 1, `黑板子站出现了多个版本号：${[...versioned].join("、")}`);
  const v = [...versioned][0];

  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    /* 只管 js/css 资源：页面之间的链接（./level.html?no=1）不带版本号是正常的 */
    const refs = [...html.matchAll(/(?:src|href)="(\.\/[^"]+\.(?:js|css)[^"]*)"/g)].map((m) => m[1]);
    assert.ok(refs.length >= 5, `${page} 的资源引用太少（${refs.length}）`);
    for (const ref of refs) {
      assert.ok(ref.endsWith(`?v=${v}`), `${page} 的资源没带版本号：${ref}`);
      const key = "./" + path.posix.join("blackboard", ref.replace(/^\.\//, ""));
      assert.ok(PWA.PRECACHE_URLS.includes(key), `预缓存少了 ${key}`);
    }
  }
});
