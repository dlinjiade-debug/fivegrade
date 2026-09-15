/* 出「板书特写」截图：2 倍分辨率、只画不走动画，方便放大核对字形与排版。
 *
 * 用法： node tools/zoom-shot.js "level.html?no=2&step=5" zoom-level2.png
 *
 * 两个必须踩准的点：
 *   1) 出图前先删掉旧图。否则「文件存在且非空」立刻成立，
 *      脚本会拿上一轮的旧图谎报成功（踩过）。
 *   2) 用当前工作目录当站点根，起一个随机端口，跑完就把浏览器进程树杀掉。
 */
const http = require("http"), fs = require("fs"), path = require("path"),
  os = require("os"), { spawn, spawnSync } = require("child_process");

const url = process.argv[2];
const outName = process.argv[3];
if (!url || !outName) {
  console.error("用法: node tools/zoom-shot.js <页面路径> <输出文件名>");
  process.exit(2);
}

const ROOT = process.cwd();
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml",
};

const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split("?")[0]);
  const f = path.join(ROOT, u === "/" ? "index.html" : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    r.writeHead(404); r.end(); return;
  }
  r.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(r);
});

srv.listen(0, "127.0.0.1", () => {
  const out = path.join(ROOT, "shots", outName);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (fs.existsSync(out)) fs.unlinkSync(out);          /* ← 关键：别拿旧图当新图 */
  const before = Date.now();

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "bbz-"));
  const child = spawn(EDGE, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
    "--disable-background-networking", "--hide-scrollbars",
    "--force-prefers-reduced-motion",                   /* 直接给终态板书，不走动画 */
    "--force-device-scale-factor=2",
    "--window-size=1366,760",
    "--screenshot=" + out,
    "--user-data-dir=" + profile,
    "http://127.0.0.1:" + srv.address().port + "/" + url,
  ], { stdio: "ignore" });

  let done = false;
  function finish(code, msg) {
    if (done) return;
    done = true;
    clearInterval(timer);
    try { spawnSync("taskkill", ["/T", "/F", "/PID", String(child.pid)], { stdio: "ignore" }); } catch (e) {}
    try { srv.close(); } catch (e) {}
    console.log(msg);
    process.exit(code);
  }

  const timer = setInterval(() => {
    if (!fs.existsSync(out)) return;
    const st = fs.statSync(out);
    /* 还要 mtime 足够新：防止浏览器比我们慢一步、旧图刚好还在 */
    if (st.size > 0 && st.mtimeMs >= before) {
      setTimeout(() => finish(0, "ok " + outName + " " + Math.round(st.size / 1024) + "KB"), 300);
    }
  }, 150);

  setTimeout(() => finish(1, "timeout"), 30000);
});
