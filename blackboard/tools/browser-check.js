#!/usr/bin/env node
/* ==========================================================================
 *  browser-check.js —— 粉笔小闯关 · 真浏览器验收
 *  ------------------------------------------------------------------
 *  只依赖 Node 内置模块 + 系统自带的 Edge / Chrome（不需要 Playwright）。
 *
 *  它做三件事：
 *    1. 起一个本地静态服务器（黑板子站根目录）
 *    2. 用无头浏览器打开 tools/browser-check.html，把页内断言的结果捞回来
 *    3. 给 index.html / level.html 各截一张图
 *
 *  ⚠ Win 上的坑：不能直接 spawnSync(chrome, ["--dump-dom"])。
 *    浏览器会派生一堆子进程，孙进程一直占着 stdout 管道，
 *    spawnSync 等不到 EOF，就会一直挂到超时（表现为「什么都没跑出来」）。
 *    所以这里用 spawn + 轮询：一看到结果就收工，到点就 taskkill /T 连带子树。
 *
 *  用法：
 *    node tools/browser-check.js            # 断言 + 截图
 *    node tools/browser-check.js --no-shot  # 只跑断言
 * ========================================================================== */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const { spawn, spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SHOT = process.argv.indexOf("--no-shot") < 0;
const OUT_DIR = path.join(ROOT, "shots");
const IS_WIN = process.platform === "win32";

/* --base=<url>：不启本地服务器，直接把同一套断言打到一个已部署的地址上。
   本地全绿不等于线上能用（子路径、缓存、慢网络都会在线上才暴露），
   所以上线后要拿这一趟来收口。 */
const BASE_ARG = (process.argv.find((a) => a.startsWith("--base=")) || "").slice(7);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".glb": "model/gltf-binary",
};

function findBrowser() {
  const candidates = [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    const file = path.join(ROOT, url === "/" ? "index.html" : url);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("404 " + url);
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

/* 无头浏览器通用开关：把「联网打招呼」那堆事全关掉，
   否则虚拟时间会因为挂着外部请求而永远不前进。 */
function flags(extra, profile) {
  return [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-sync",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-client-side-phishing-detection",
    "--disable-features=Translate,OptimizationHints,MediaRouter",
    "--metrics-recording-only",
    "--window-size=1440,1024",
    "--user-data-dir=" + profile,
  ].concat(extra || []);
}

function killTree(child) {
  if (!child || child.killed) return;
  try {
    if (IS_WIN) spawnSync("taskkill", ["/T", "/F", "/PID", String(child.pid)], { stdio: "ignore" });
    else process.kill(-child.pid, "SIGKILL");
  } catch (e) { /* 进程已经没了 */ }
  try { child.kill("SIGKILL"); } catch (e) { /* 同上 */ }
}

/**
 * 跑一次浏览器，等到 stdout 里出现 marker 就收工（或到点强杀）。
 * @returns {Promise<{stdout:string, stderr:string, matched:boolean, timedOut:boolean}>}
 */
function capture(browser, args, marker, timeoutMs) {
  return new Promise((resolve) => {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "bb-chrome-"));
    const child = spawn(browser, flags(args, profile), { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let done = false;

    const finish = (matched, timedOut) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      killTree(child);
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* 清不掉就算了 */ }
      resolve({ stdout, stderr, matched, timedOut });
    };

    const timer = setTimeout(() => finish(false, true), timeoutMs);

    child.stdout.on("data", (d) => {
      stdout += d.toString();
      if (marker && new RegExp(marker).test(stdout)) finish(true, false);
    });
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", () => finish(false, false));
    child.on("close", () => finish(marker ? new RegExp(marker).test(stdout) : true, false));
  });
}

/** 跑一次浏览器，等到某个文件写出来就收工 */
function captureFile(browser, args, file, timeoutMs) {
  return new Promise((resolve) => {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "bb-chrome-"));
    try { fs.rmSync(file, { force: true }); } catch (e) { /* 先清掉旧图 */ }
    const child = spawn(browser, flags(args, profile), { stdio: "ignore" });
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(poll);
      clearTimeout(timer);
      killTree(child);
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* 同上 */ }
      resolve(fs.existsSync(file) && fs.statSync(file).size > 0);
    };
    const poll = setInterval(() => {
      if (fs.existsSync(file) && fs.statSync(file).size > 0) finish();
    }, 150);
    const timer = setTimeout(finish, timeoutMs);
    child.on("error", finish);
  });
}

function unescapeJson(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

(async function main() {
  const browser = findBrowser();
  if (!browser) {
    console.error("✗ 没找到 Edge / Chrome，跳过浏览器验收。");
    process.exit(0);
  }
  console.log("浏览器：" + browser);

  let server = null;
  let base = BASE_ARG.replace(/\/+$/, "");
  if (base) {
    console.log("验收目标（远程）：" + base);
  } else {
    const local = await serve();
    server = local.server;
    base = "http://127.0.0.1:" + local.port;
  }
  let failed = 0;

  /* ---------------- 1. 页内断言 ---------------- */
  console.log("粉笔小闯关 · 浏览器自检");
  console.log("─".repeat(54));
  /* --virtual-time-budget：页内自检最后一段要把两个页面放进 iframe 真跑一遍，
     不等虚拟时间的话 --dump-dom 会在 load 那一刻就把「running…」dump 走。 */
  const probe = await capture(browser,
    ["--virtual-time-budget=20000", "--dump-dom", base + "/tools/browser-check.html"],
    "BBCHECK", 60000);
  const m = /BBCHECK([\s\S]*?)BBCHECK/.exec(probe.stdout);

  if (!m) {
    console.log("✗ 没拿到自检结果" + (probe.timedOut ? "（浏览器超时）" : ""));
    const tail = probe.stdout.slice(-800) || probe.stderr.slice(-800);
    if (tail) console.log(tail);
    failed = 1;
  } else {
    const rep = JSON.parse(unescapeJson(m[1]));
    (rep.fails || []).forEach((f) => console.log("✗ " + f));
    (rep.errors || []).forEach((f) => console.log("✗ 控制台报错： " + f));
    console.log("检查了 " + rep.steps + " 步板书、" + rep.questions + " 道题的答案判定");
    if (rep.rules) {
      console.log("量了 " + rep.rules.pairs + " 对「竖式横线—数字」，最紧处留白 " +
        (rep.rules.minClearance == null ? "n/a" : rep.rules.minClearance + "px"));
      if (rep.rules.worst) console.log("最紧的一对：" + rep.rules.worst);
    }
    console.log((rep.ok ? "✅ " : "❌ ") + "通过 " + rep.pass + " 项，失败 " +
      ((rep.fails || []).length + (rep.errors || []).length) + " 项");
    if (!rep.ok) failed = 1;
  }

  /* ---------------- 2. 截图 ---------------- */
  if (SHOT) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const shots = [
      ["index.html", "map"],
      ["level.html?no=1", "level1"],
      ["level.html?no=6&step=2", "level6-partial"],
      ["level.html?no=6&step=4", "level6-pointjump"],
      ["level.html?no=3&step=1", "level3-digits"],
      ["level.html?no=2&step=5", "level2-pad"],
    ];
    for (const [url, name] of shots) {
      const out = path.join(OUT_DIR, name + ".png");
      /* 无头浏览器抓图是在 load 那一刻，等不到 rAF 动画跑完，
         所以出图时强制「减少动效」—— 板书直接静态摆好，正好是我们要验收的终态。 */
      const ok = await captureFile(browser, [
        "--force-prefers-reduced-motion",
        "--screenshot=" + out,
        base + "/" + url,
      ], out, 30000);
      if (ok) {
        console.log("📷 shots/" + name + ".png  (" + Math.round(fs.statSync(out).size / 1024) + " KB)");
      } else {
        console.log("✗ 截图失败：" + name);
        failed = 1;
      }
    }
  }

  if (server) server.close();
  console.log(failed ? "❌ 浏览器验收未通过" : "✅ 浏览器验收通过");
  process.exit(failed);
})();
