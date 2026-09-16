#!/usr/bin/env node
/* ==========================================================================
 *  site-check.js —— 粉笔小闯关 · 站点契约自检
 *  ------------------------------------------------------------------
 *  纯静态站最容易死在「改了文件名但没改引用」和「版本号只升了一半」上，
 *  这个脚本把这两件事变成断言。只依赖 Node 内置模块。
 *
 *  检查项：
 *    1. 页面引用的每个 js / css / 图片都真的存在
 *    2. 所有 ?v=N 版本号一致（改完 js/css 忘了升版本 → 用户看到旧缓存）
 *    3. bb-app.js 里 getElementById 的每个 id，页面上真的有
 *    4. 脚本加载顺序正确（字形引擎 → 核心 → 展开器 → 引擎 → 关卡 → 专题 → 应用）
 *    5. 每个页面都有 title / viewport / lang / 报错钩子
 *    6. 两套专题（乘法 / 除法）的关卡数据都体检一遍
 *    7. 专题登记表里的开场白，板书写得进黑板
 *
 *  用法： node tools/site-check.js
 * ========================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PAGES = ["index.html", "level.html"];

let pass = 0;
const fails = [];
function check(name, cond, detail) {
  if (cond) { pass += 1; return; }
  fails.push(name + (detail ? "\n      → " + detail : ""));
}

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p.split("?")[0]));

/* ---------------- 1 + 2 + 5：页面本身的契约 ---------------- */
const versions = new Set();
let refCount = 0;

PAGES.forEach((page) => {
  const html = read(page);
  check(page + " 存在", true);

  check(page + " 声明了 lang=zh-CN", /<html[^>]+lang="zh-CN"/.test(html));
  check(page + " 有 viewport", /name="viewport"/.test(html));
  check(page + " 有 title", /<title>[^<]{4,}<\/title>/.test(html));

  /* 引用的静态资源 */
  const refs = [];
  const re = /(?:src|href)="(\.\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) refs.push(m[1]);

  refs.forEach((ref) => {
    refCount += 1;
    if (/^https?:/.test(ref)) return;
    check(page + " 引用的 " + ref + " 存在", exists(ref), "文件不在磁盘上");
  });

  const vre = /\?v=(\d+)/g;
  while ((m = vre.exec(html))) versions.add(m[1]);
});

check("所有资源用的是同一个版本号（" + [...versions].join("/") + "）", versions.size <= 1,
  "页面上出现了多个版本号： " + [...versions].join("、"));

/* ---------------- 2.5：页面自己的报错钩子 ----------------
 * tools/browser-check.html 靠 window.__bbErrors 抓页面的行内脚本报错
 * （引擎测不出「漏定义的变量」这类问题）。钩子必须在任何其它脚本之前加载。 */
PAGES.forEach((page) => {
  const html = read(page);
  check(page + " 装了报错钩子 window.__bbErrors", /window\.__bbErrors\s*=\s*\[\]/.test(html));
  check(page + " 的报错钩子挂在所有脚本之前",
    html.indexOf("__bbErrors") >= 0 && html.indexOf("__bbErrors") < html.indexOf("<script src="));
});

/* ---------------- 3：JS 要的 id 页面上真的有 ---------------- */
const appJs = read("js/bb-app.js");
const appIds = [];
{
  const re = /getElementById\("([^"]+)"\)/g;
  let m;
  while ((m = re.exec(appJs))) appIds.push(m[1]);
}
const pageIds = new Set();
PAGES.forEach((page) => {
  const html = read(page);
  const re = /id="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) pageIds.add(m[1]);
});
const missingIds = [...new Set(appIds)].filter((id) => !pageIds.has(id));
check("应用层要的 " + new Set(appIds).size + " 个 id 页面都有", missingIds.length === 0,
  "缺少： " + missingIds.join("、"));

/* level.html 上必须凑齐的那几个交互控件 */
["boardHost", "capText", "capTip", "stepDots", "prevBtn", "nextBtn", "replayBtn",
 "autoBtn", "startPractice", "phaseTag", "practice", "practicePanel",
 "lvNo", "lvTitle", "lvSub", "lvGoal", "lvKeys", "lvUnit", "topicSwitch"].forEach((id) => {
  check("level.html 有 #" + id, read("level.html").indexOf('id="' + id + '"') >= 0);
});

/* index.html 的地图页控件 */
["boardHost", "mapGrid", "resumeBtn", "mapProgress", "mapProgressLabel", "clearBtn",
 "topicSwitch", "mapSummary", "brandSub", "brandChip", "pageFoot"].forEach((id) => {
  check("index.html 有 #" + id, read("index.html").indexOf('id="' + id + '"') >= 0);
});

/* ---------------- 4：脚本顺序 ----------------
 * handwrite 提供字形 → core 提供纯函数 → div 把 vdiv 注册进 core
 * → chalk 才敢用 BB.isCompound → 关卡 → 专题登记表 → 页面逻辑。 */
const SCRIPT_ORDER = [
  "lib/handwrite.js", "js/bb-core.js", "js/bb-div.js", "js/bb-chalk.js",
  "js/bb-levels.js", "js/bb-levels-div.js", "js/bb-topics.js", "js/bb-app.js",
];
PAGES.forEach((page) => {
  const html = read(page);
  const order = SCRIPT_ORDER.map((f) => html.indexOf(f));
  const bad = order.some((v, i) => v < 0 || (i > 0 && v < order[i - 1]));
  check(page + " 的脚本顺序正确（handwrite → core → div → chalk → 关卡 → 专题 → app）", !bad,
    "位置：" + order.join(", "));
});

/* ---------------- 6：两套专题的关卡数据体检 ---------------- */
const BB = require(path.join(ROOT, "js", "bb-core.js"));
require(path.join(ROOT, "js", "bb-div.js"));          /* 注册 vdiv */

const DIV_PACKS = [
  { name: "小数乘法", file: "js/bb-levels.js" },
  { name: "小数除法", file: "js/bb-levels-div.js" },
];

DIV_PACKS.forEach((pack) => {
  const DATA = require(path.join(ROOT, pack.file));
  const bad = BB.validateLevels(DATA.LEVELS);
  check("[" + pack.name + "] 八关的板书写得下、字段齐全", bad.length === 0,
    bad.slice(0, 10).join("\n      → "));

  DATA.LEVELS.forEach((lv) => {
    check(lv.id + " 讲解不少于 3 步", lv.steps.length >= 3, "只有 " + lv.steps.length + " 步");
    check(lv.id + " 练习不少于 3 题", lv.practice.length >= 3, "只有 " + lv.practice.length + " 题");
    const kinds = new Set(lv.steps.flatMap((s) => s.ops.map((o) => o.k)));
    check(lv.id + " 的板书类型都是已知的",
      [...kinds].every((k) => BB.isCompound(k) || BB.BOARD_KINDS.indexOf(k) >= 0),
      [...kinds].join(","));

    /* 除不尽的竖式必须交代「算到哪一位」；说保留几位就必须配 roundTo，
       否则板上会拿截断值配「≈」（19.4÷12 写成 ≈1.617 而不是 ≈1.62）。 */
    lv.steps.forEach((s, si) => {
      s.ops.filter((o) => o.k === "vdiv").forEach((o) => {
        const spec = o.spec || {};
        let m = null;
        try { m = BB.vdiv.divModel(spec.a, spec.b, spec); } catch (e) { m = null; }
        if (!m) return;
        if (!m.exact && spec.cycle !== true && spec.stopAfter == null && !m.cycle) {
          check(lv.id + " 第" + (si + 1) + "步 除不尽要说清算到哪一位",
            false, spec.a + "÷" + spec.b + " 既没有 stopAfter 也不是循环小数");
        }
        if (spec.roundTo != null) {
          check(lv.id + " 第" + (si + 1) + "步 roundTo 是 0~6 的整数",
            Number.isInteger(spec.roundTo) && spec.roundTo >= 0 && spec.roundTo <= 6,
            "roundTo=" + spec.roundTo);
          check(lv.id + " 第" + (si + 1) + "步 保留位数不能超过算的位数",
            spec.stopAfter == null || spec.roundTo < spec.stopAfter,
            "stopAfter=" + spec.stopAfter + " roundTo=" + spec.roundTo + "，没有多余的一位可舍入");
        }
      });
    });
  });
});

/* ---------------- 7：专题登记表 ---------------- */
const TOPICS = require(path.join(ROOT, "js", "bb-topics.js"));

check("专题登记表里有乘法和小数除法",
  TOPICS.TOPICS.length >= 2 &&
  TOPICS.TOPICS.some((t) => t.id === "mul") &&
  TOPICS.TOPICS.some((t) => t.id === "div"),
  TOPICS.TOPICS.map((t) => t.id).join(","));

TOPICS.TOPICS.forEach((t) => {
  check("专题 " + t.id + " 挂上了关卡包", !!(t.levels && t.levels.LEVELS && t.levels.LEVELS.length === 8),
    t.levels ? "关卡数 " + (t.levels.LEVELS || []).length : "没有 levels");
  check("专题 " + t.id + " 有关卡包、标题、页脚", !!t.name && !!t.docTitle && !!t.foot);
  check("专题 " + t.id + " 的说明卡是 3 张（含「怎么操作」）", TOPICS.notes(t).length === 3);
});

/* 开场白也是板书，一样不能越界 —— 借 validateLevel 的边界检查跑一遍 */
TOPICS.TOPICS.forEach((t) => {
  const steps = TOPICS.welcomeSteps(t.id);
  const fake = {
    id: "welcome-" + t.id, title: "开场白", unit: "开场", goal: "开场",
    steps: steps,
    practice: [{ id: "w-" + t.id, type: "vf", stem: "占位", answer: true, why: "占位占位占位" }],
  };
  const bad = BB.validateLevel(fake);
  check("专题 " + t.id + " 的开场白板书写得进黑板", bad.length === 0, bad.join("；"));
  check("专题 " + t.id + " 的开场白有 2 屏", steps.length === 2);
});

/* ---------------- 输出 ---------------- */
const LINE = "─".repeat(54);
console.log("粉笔小闯关 · 站点自检");
console.log(LINE);
if (fails.length) fails.forEach((f) => console.log("✗ " + f));
console.log("查了 " + PAGES.length + " 个页面、" + refCount + " 处资源引用、" +
  DIV_PACKS.length + " 套专题、" + TOPICS.TOPICS.length + " 个登记专题");
console.log((fails.length ? "❌ " : "✅ ") + "通过 " + pass + " 项，失败 " + fails.length + " 项");
process.exit(fails.length ? 1 : 0);
