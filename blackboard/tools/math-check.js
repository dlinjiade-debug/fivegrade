#!/usr/bin/env node
/* ==========================================================================
 *  math-check.js —— 粉笔小闯关 · 内容自检
 *  ------------------------------------------------------------------
 *  只依赖 Node 内置模块。把「内容里容易写错的地方」写成可执行断言：
 *    1. 每一道填空的数字答案都用 expr 重新算一遍，对不上就报错
 *    2. 板书脚本里 vcalc / pointjump 的 only 标签必须真的存在，
 *       否则那一步会「什么都不写」，孩子看着黑板发呆
 *    3. 每一关的步骤都有文案、练习都有解析
 *    4. 板书不能越出黑板边界（交给 bb-core 的 validateLevels）
 *
 *  用法： node tools/math-check.js
 * ========================================================================== */
"use strict";

const path = require("path");
const BB = require(path.join(__dirname, "..", "js", "bb-core.js"));
const DATA = require(path.join(__dirname, "..", "js", "bb-levels.js"));

let pass = 0;
const fails = [];

function check(name, cond, detail) {
  if (cond) { pass += 1; return; }
  fails.push(name + (detail ? "\n      → " + detail : ""));
}

/** 只允许四则运算和 round()，用于重算答案 */
function evaluate(expr) {
  const round = function (x, n) { return Number(BB.roundTo(String(x), n)); };
  const fn = new Function("round", "return (" + expr + ");");
  return fn(round);
}

const same = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-9;

const levels = DATA.LEVELS;

/* ---------------- 1. 关卡基本契约 ---------------- */
check("一共 8 关", levels.length === 8, "实际 " + levels.length);
check("关卡编号连续", levels.every((l, i) => l.no === i + 1));
check("每关都有单元标注", levels.every((l) => /人教版五年级上册/.test(l.unit)));

/* ---------------- 2. 数字答案重算 ---------------- */
let numericBlanks = 0;
let nonNumeric = 0;
const evalCache = {};

levels.forEach((level) => {
  level.practice.forEach((q) => {
    if (q.type !== "fill") return;
    q.blanks.forEach((blank, i) => {
      const where = level.id + "/" + q.id + " 第" + (i + 1) + "空";
      if (!/\d/.test(String(blank.answer))) {
        nonNumeric += 1;
        check(where + " 非数字答案不写 expr", blank.expr == null, "给了多余的 expr");
        return;
      }
      numericBlanks += 1;
      if (blank.expr == null) { check(where + " 缺少 expr", false); return; }
      let got;
      try {
        got = evaluate(blank.expr);
      } catch (err) {
        check(where + " expr 无法计算：" + blank.expr, false, err.message);
        return;
      }
      evalCache[blank.expr] = got;
      check(
        where + " 答案与算式一致（" + blank.expr + " → " + got + "）",
        same(got, blank.answer),
        "写的是 " + blank.answer
      );
    });
  });
});

/* ---------------- 3. 选择 / 判断题 ---------------- */
levels.forEach((level) => {
  level.practice.forEach((q) => {
    const where = level.id + "/" + q.id;
    if (q.type === "choice") {
      check(where + " 选项不重复", new Set(q.options).size === q.options.length);
      check(where + " 选项至少 3 个", q.options.length >= 3, "只有 " + q.options.length);
      check(where + " 正确选项有内容", typeof q.options[q.answer] === "string" && q.options[q.answer].length > 0);
    }
    check(where + " 有解析", typeof q.why === "string" && q.why.length >= 8, q.why);
    check(where + " 有题干", typeof q.stem === "string" && q.stem.length >= 4, q.stem);
  });
});

/* ---------------- 4. 板书脚本的 only 标签必须存在 ---------------- */
function tagsOf(op) {
  if (op.k === "vcalc") return BB.expandVcalc(op.spec).ops.map((o) => o.tag);
  if (op.k === "pointjump") return BB.expandPointJump(op.spec).ops.map((o) => o.tag);
  return [op.tag || op.k];
}

levels.forEach((level) => {
  level.steps.forEach((step, si) => {
    const where = level.id + " 第" + (si + 1) + "步";
    check(where + " 有讲解文案", typeof step.text === "string" && step.text.length >= 6, step.text);
    check(where + " 有板书", Array.isArray(step.ops) && step.ops.length > 0);
    let draws = 0;
    step.ops.forEach((op) => {
      const tags = tagsOf(op);
      if (op.k === "vcalc" || op.k === "pointjump") {
        const only = op.spec && op.spec.only;
        if (only) {
          const all = op.k === "vcalc"
            ? BB.expandVcalc(Object.assign({}, op.spec, { only: null })).ops.map((o) => o.tag)
            : BB.expandPointJump(op.spec).ops.map((o) => o.tag);
          const unknown = only.filter((t) => all.indexOf(t) < 0);
          check(where + " only 里的标签都存在", unknown.length === 0, "不存在的标签：" + unknown.join(", "));
          draws += tags.length;
        } else {
          draws += tags.length;
        }
        if (op.k === "vcalc" && op.spec.pointJump) {
          /* 开了 pointJump 时，vcalc 自己展开的 sum 写的就是「整数积」，
             点小数点是在它上面跳，不冲突；但 sum 和点小数点不能写成两步。 */
          check(
            where + " 点小数点不能和写积挤在同一步里",
            !op.spec.only || op.spec.only.indexOf("pj-dot") < 0 || op.spec.only.indexOf("sum") < 0,
            "同一步里既写 sum 又点 pj-dot，小数点会点在还没写出来的数上"
          );
        }
      } else {
        draws += tags.length;
      }
    });
    check(where + " 这一步真的会写字", draws > 0);
  });
});

/* ---------------- 4.5 keep 步必须真的接得上上一屏 ----------------
 * 标了 keep 的步骤，屏幕上不会有它自己的「算式本体」，
 * 靠的是同一屏前几步留在板上的竖式。要是前面没有竖式，
 * 这一步就只会写几个零散笔画，孩子看着黑板发呆。 */
const hasWork = (step) => step.ops.some((op) => op.k === "vcalc" || op.k === "pointjump");
levels.forEach((level) => {
  level.steps.forEach((step, si) => {
    if (!step.keep) return;
    let from = si;
    while (from > 0 && level.steps[from].keep) from -= 1;
    const ok = level.steps.slice(from, si + 1).some(hasWork);
    check(
      level.id + " 第" + (si + 1) + "步 接续的屏幕上有竖式",
      ok,
      "这一屏从第 " + (from + 1) + " 步开始，却没有任何竖式可接续"
    );
  });
});

/* ---------------- 5. 竖式展开的数学自洽 ---------------- */
const vcalcSpecs = [];
levels.forEach((level) => {
  level.steps.forEach((step, si) => {
    step.ops.forEach((op) => {
      if (op.k === "vcalc") vcalcSpecs.push([level.id + " 第" + (si + 1) + "步", op.spec]);
    });
  });
});

check("板书里用了竖式", vcalcSpecs.length > 0);
vcalcSpecs.forEach(([where, spec]) => {
  const v = BB.verticalMul(spec.a, spec.b);
  check(where + " 竖式积与小数位自洽（" + spec.a + "×" + spec.b + "＝" + v.value + "）",
    same(Number(v.value) || 0, Number(v.raw) || 0) && v.raw.length > 0);
});

/* ---------------- 6. 边界与结构（bb-core 的体检） ---------------- */
const bad = BB.validateLevels(levels);
check("板书全部在黑板范围内、数据完整", bad.length === 0, bad.slice(0, 12).join("\n      → "));

/* ---------------- 输出 ---------------- */
const LINE = "─".repeat(54);
console.log("粉笔小闯关 · 内容自检");
console.log(LINE);
if (fails.length) {
  fails.forEach((f) => console.log("✗ " + f));
  console.log(LINE);
}
console.log("重算过的数字答案：" + numericBlanks + " 个；文字答案：" + nonNumeric + " 个");
console.log((fails.length ? "❌ " : "✅ ") + "通过 " + pass + " 项，失败 " + fails.length + " 项");
process.exit(fails.length ? 1 : 0);
