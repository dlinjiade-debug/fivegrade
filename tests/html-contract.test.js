const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("九个旧章节链接保持不变并接入统一工作台与 PWA", () => {
  for (let index = 1; index <= 9; index += 1) {
    const html = read(`unit${index}.html`);
    assert.match(html, /manifest\.webmanifest/);
    assert.match(html, /css\/mystery\.css/);
    assert.match(html, /js\/app-core\.js/);
    assert.match(html, /js\/labs-arithmetic\.js/);
    assert.match(html, /js\/labs-geometry\.js/);
    assert.match(html, /js\/pwa\.js/);
    assert.match(html, new RegExp(`js/unit${index}\\.js`));
  }
});

test("首页是案卷目录与继续上次，不再呈现星星数据看板", () => {
  const html = read("index.html");
  assert.match(html, /九份数学案卷/);
  assert.match(html, /resumeCard/);
  assert.match(html, /错因档案/);
  assert.doesNotMatch(html, /学习总览|pgTotal|18 颗星|排行榜|金币/);
});

test("新版模式与步骤使用独立键，旧进度和错题键仍保留", () => {
  const source = read("js/common.js");
  assert.match(source, /math5_progress_v1/);
  assert.match(source, /math5_wrongbook_v1/);
  assert.match(source, /math5_mystery_session_v2/);
  assert.match(source, /math5_mystery_settings_v2/);
});

test("参考截图没有被当作页面素材嵌入", () => {
  const allHtml = ["index.html", ...Array.from({ length: 9 }, (_, i) => `unit${i + 1}.html`)]
    .map(read).join("\n");
  assert.doesNotMatch(allHtml, /codex-clipboard|8d03172b|SystemCaches/i);
});

test("可见奖励统一为案卷印章，不再出现星星经济文案", () => {
  const lessonSources = Array.from({ length: 9 }, (_, i) => [
    read(`unit${i + 1}.html`), read(`js/unit${i + 1}.js`),
  ]).flat().join("\n");
  assert.doesNotMatch(lessonSources, /⭐|总星数|获得一颗星/);
  assert.match(lessonSources, /案卷印章|完成印章/);
});

test("闯关模式的规律页只显示精简口述任务，完整讲解留在导演模式", () => {
  const shell = read("js/common.js");
  const styles = read("css/mystery.css");
  assert.match(shell, /challenge-conclusion/);
  assert.match(styles, /data-mode=\"challenge\"[^}]*challenge-conclusion/);
  assert.match(styles, /data-mode=\"challenge\"[^}]*data-stage=\"conclusion\"[^}]*> \.section/);
});

test("矮屏会等比收小竖式纸面，避免草稿数字被上下截断", () => {
  const styles = read("css/mystery.css");
  assert.match(styles, /@media \(min-width: 981px\) and \(max-height: 820px\)/);
  assert.match(styles, /\.mystery-stage-panel \.vsheet svg\s*\{[^}]*max-height:\s*calc\(100vh - 352px\)/s);
  assert.match(styles, /\.mystery-stage-panel \.vsheet svg\s*\{[^}]*width:\s*auto/s);
});
