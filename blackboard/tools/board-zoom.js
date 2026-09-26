/* 把板书按指定区域放大出图，用来逐笔核对字形、小数点、列对齐。
 *
 * 用法：
 *   node tools/board-zoom.js "<页面参数>" <输出文件名> [x,y,w,h] [放大倍数]
 *
 * 例：
 *   node tools/board-zoom.js "topic=div&no=1&step=4" zoom-div1.png 690,80,240,420 3
 *     → 把 div 第 1 关第 4 步的板书，裁板面坐标 (690,80) 起 240×420 的区域，
 *       放大 3 倍出图。
 *   node tools/board-zoom.js "topic=mul&no=2&step=5" full.png
 *     → 不给裁切框就是整块黑板 1280×720（默认 2 倍）。
 *
 * 画面比例按裁切框算窗口大小，所以出图正好是那一块，不会被「居中留白」缩掉。
 * 跟 zoom-shot.js 一样：出图前先删旧图，跑完干掉浏览器（异步 spawn，别用 spawnSync）。
 */
const http = require("http"), fs = require("fs"), path = require("path"),
  os = require("os"), { spawn } = require("child_process");

const query = process.argv[2];
const outName = process.argv[3];
if (!query || !outName) {
  console.error("用法: node tools/board-zoom.js \"<页面参数>\" <输出文件名> [x,y,w,h] [放大倍数]");
  process.exit(2);
}
const box = (process.argv[4] || "0,0,1280,720").split(/[,\s]+/).map(Number);
const [, , bw, bh] = box;
const k = Number(process.argv[5] || 2);

const ROOT = path.join(__dirname, "..");
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
  if (fs.existsSync(out)) fs.unlinkSync(out);          /* 别拿旧图当新图 */
  const before = Date.now();

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "bbz-"));
  const child = spawn(EDGE, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
    "--disable-background-networking", "--hide-scrollbars",
    "--force-prefers-reduced-motion",
    "--window-size=" + Math.round(bw * k) + "," + Math.round(bh * k),
    "--screenshot=" + out,
    "--user-data-dir=" + profile,
    "http://127.0.0.1:" + srv.address().port + "/tools/board-zoom.html?" +
      query + "&vb=" + box.join(","),
  ], { stdio: "ignore", windowsHide: true });

  let done = false;
  function finish(code, msg) {
    if (done) return;
    done = true;
    clearInterval(timer);
    clearTimeout(give);
    try { spawn("taskkill", ["/T", "/F", "/PID", String(child.pid)], { stdio: "ignore", windowsHide: true }); } catch (e) {}
    try { srv.close(); } catch (e) {}
    console.log(msg);
    process.exitCode = code;
  }

  const timer = setInterval(() => {
    if (!fs.existsSync(out)) return;
    const st = fs.statSync(out);
    /* 还要 mtime 够新：防止浏览器比我们慢一步、旧图刚好还在 */
    if (st.size > 0 && st.mtimeMs >= before) {
      setTimeout(() => finish(0, "ok " + outName + " " + Math.round(st.size / 1024) + "KB " +
        Math.round(bw * k) + "x" + Math.round(bh * k)), 300);
    }
  }, 120);

  const give = setTimeout(() => finish(1, "timeout " + outName), 30000);
  child.on("error", () => finish(1, "spawn 失败"));
});
