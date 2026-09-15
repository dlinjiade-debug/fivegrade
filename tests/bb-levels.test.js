/* ==========================================================================
 *  bb-levels.test.js —— 粉笔小闯关 · 关卡内容契约
 *  ------------------------------------------------------------------
 *  math-check.js 管「算得对不对」（答案重算），这里管「页面用得上用不上」：
 *    · 填空题的 {} 个数必须和 blanks 个数一致，否则输入框会少一个 / 多一个
 *    · 每道题都要有解析，否则答错的孩子看不到为什么
 *    · 接续板书（keep）不能接在空气上
 * ========================================================================== */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

const DATA = require(path.join(__dirname, "..", "blackboard", "js", "bb-levels.js"));
const BB = require(path.join(__dirname, "..", "blackboard", "js", "bb-core.js"));

const LEVELS = DATA.LEVELS;

test("一共八关，编号连续，都标了人教版五年级上册", () => {
  assert.equal(LEVELS.length, 8);
  LEVELS.forEach((lv, i) => {
    assert.equal(lv.no, i + 1, lv.id + " 的编号");
    assert.match(lv.unit, /人教版五年级上册/);
    assert.ok(lv.title && lv.title.length >= 2, lv.id + " 要有标题");
    assert.ok(lv.sub && lv.sub.length >= 4, lv.id + " 要有副标题");
    assert.ok(lv.goal && lv.goal.length >= 6, lv.id + " 要有学习目标");
    assert.ok(Array.isArray(lv.keys) && lv.keys.length >= 2, lv.id + " 要有要点");
  });
});

test("每一关：讲解至少 3 步，每步都有字幕、有提示、写得下东西", () => {
  LEVELS.forEach((lv) => {
    assert.ok(lv.steps.length >= 3, lv.id + " 讲解步骤太少");
    lv.steps.forEach((step, i) => {
      const where = lv.id + " 第" + (i + 1) + "步";
      assert.ok(typeof step.text === "string" && step.text.length >= 6, where + " 缺字幕");
      assert.ok(typeof step.tip === "string" && step.tip.length >= 4, where + " 缺小提示");
      assert.ok(Array.isArray(step.ops) && step.ops.length > 0, where + " 没有板书");
    });
  });
});

test("填空题的 {} 个数和 blanks 个数对得上（或改用 rows）", () => {
  LEVELS.forEach((lv) => {
    lv.practice.forEach((q) => {
      if (q.type !== "fill") return;
      const where = lv.id + "/" + q.id;
      if (q.rows) {
        assert.equal(q.rows.length, q.blanks.length,
          where + " rows 有 " + q.rows.length + " 行，却写了 " + q.blanks.length + " 个空");
        return;
      }
      const holes = String(q.stem).split("{}").length - 1;
      assert.equal(holes, q.blanks.length,
        where + " 题干里有 " + holes + " 个 {}，却配了 " + q.blanks.length + " 个答案");
      assert.ok(holes > 0, where + " 是填空题却没有 {}");
    });
  });
});

test("每道题都有解析，且首次答错时看得到", () => {
  LEVELS.forEach((lv) => {
    lv.practice.forEach((q) => {
      assert.ok(typeof q.why === "string" && q.why.length >= 10,
        lv.id + "/" + q.id + " 解析太短，孩子看不懂");
    });
  });
});

test("选择题：选项不重复、至少 3 个、答案下标有效", () => {
  LEVELS.forEach((lv) => {
    lv.practice.forEach((q) => {
      if (q.type !== "choice") return;
      assert.ok(q.options.length >= 3, lv.id + "/" + q.id + " 选项太少");
      assert.equal(new Set(q.options).size, q.options.length, lv.id + "/" + q.id + " 选项重复");
      assert.ok(q.answer >= 0 && q.answer < q.options.length, lv.id + "/" + q.id + " 答案下标越界");
    });
  });
});

test("接续板书（keep）一定有东西可接", () => {
  LEVELS.forEach((lv) => {
    lv.steps.forEach((step, i) => {
      if (!step.keep) return;
      let from = i;
      while (from > 0 && lv.steps[from].keep) from -= 1;
      const hasWork = lv.steps.slice(from, i + 1)
        .some((s) => s.ops.some((o) => o.k === "vcalc" || o.k === "pointjump"));
      assert.ok(hasWork, lv.id + " 第" + (i + 1) + "步 说要接着上一屏，可上一屏是空的");
    });
  });
});

test("每一关都至少有一道需要动手算的题（不是全选择题）", () => {
  LEVELS.forEach((lv) => {
    const hands = lv.practice.filter((q) => q.type === "fill").length;
    assert.ok(hands >= 1, lv.id + " 全是选择题，练不到笔算");
  });
});

test("练习题的题型都在页面支持范围内", () => {
  const supported = ["choice", "vf", "fill"];
  LEVELS.forEach((lv) => {
    lv.practice.forEach((q) => {
      assert.ok(supported.indexOf(q.type) >= 0,
        lv.id + "/" + q.id + " 题型 " + q.type + " 页面渲染不了");
    });
  });
});

test("板书里的竖式都能算出自洽的积", () => {
  let n = 0;
  LEVELS.forEach((lv) => {
    lv.steps.forEach((step) => {
      step.ops.forEach((op) => {
        if (op.k !== "vcalc") return;
        n += 1;
        const v = BB.verticalMul(op.spec.a, op.spec.b);
        assert.ok(v.raw.length > 0, lv.id + " 竖式算出空结果");
        assert.equal(BB.trimZeros(v.raw), v.value);
      });
    });
  });
  assert.ok(n >= 8, "板书里只用了 " + n + " 次竖式，太少了");
});

test("板书里出现的小数点定位，位数之和与因数一致", () => {
  LEVELS.forEach((lv) => {
    lv.steps.forEach((step) => {
      step.ops.forEach((op) => {
        if (op.k !== "vcalc") return;
        const v = BB.verticalMul(op.spec.a, op.spec.b);
        assert.equal(v.dpSum, BB.decimalPlaces(op.spec.a) + BB.decimalPlaces(op.spec.b));
      });
    });
  });
});
