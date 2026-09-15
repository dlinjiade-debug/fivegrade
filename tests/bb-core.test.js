/* ==========================================================================
 *  bb-core.test.js —— 粉笔小闯关 · 纯函数单测
 *  跑法：npm test（即 node --test tests/*.test.js）
 * ========================================================================== */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

const BB = require(path.join(__dirname, "..", "blackboard", "js", "bb-core.js"));

test("小数位数：整数是 0 位", () => {
  assert.equal(BB.decimalPlaces("5"), 0);
  assert.equal(BB.decimalPlaces("370"), 0);
  assert.equal(BB.decimalPlaces("0.72"), 2);
  assert.equal(BB.decimalPlaces("1.5"), 1);
  assert.equal(BB.decimalPlaces("0.048"), 3);
});

test("整数化：不看小数点取整数", () => {
  assert.equal(BB.intValue("0.72"), 72);
  assert.equal(BB.intValue("5"), 5);
  assert.equal(BB.intValue("4.04"), 404);
  assert.equal(BB.intValue("0.15"), 15);
});

test("取数字串：只去掉小数点，前面的 0 要留着（补 0 动画靠它定位）", () => {
  assert.equal(BB.digitsOf("0.72"), "072");
  assert.equal(BB.digitsOf("1665"), "1665");
  assert.equal(BB.digitsOf("1.665"), "1665");
  assert.equal(BB.digitsOf("0.00720"), "000720");
});

test("点小数点：位数不够时前面补 0", () => {
  assert.equal(BB.placePoint("1665", 2), "16.65");
  assert.equal(BB.placePoint("1665", 0), "1665");
  assert.equal(BB.placePoint("720", 5), "0.00720");
  assert.equal(BB.placePoint("360", 2), "3.60");
});

test("去尾零：只去小数部分末尾的 0", () => {
  assert.equal(BB.trimZeros("3.60"), "3.6");
  assert.equal(BB.trimZeros("0.100"), "0.1");
  assert.equal(BB.trimZeros("1665"), "1665");
  assert.equal(BB.trimZeros("22.220"), "22.22");
  assert.equal(BB.trimZeros("10"), "10");
});

test("四舍五入：字符串算法，不踩浮点误差", () => {
  assert.equal(BB.roundTo("22.152", 2), "22.15");
  assert.equal(BB.roundTo("22.152", 0), "22");
  assert.equal(BB.roundTo("3.572", 1), "3.6");
  assert.equal(BB.roundTo("1.25", 1), "1.3");
  /* 保留两位就老老实实写两位：9.20 才对，写成 9.2 反而丢了「保留两位」的意思 */
  assert.equal(BB.roundTo("9.204", 2), "9.20");
});

test("竖式结构：乘数一位数时不写部分积", () => {
  const v = BB.verticalMul("0.72", "5");
  assert.equal(v.single, true, "一位乘数应该是 single");
  assert.equal(v.rows.length, 1);
  assert.equal(v.prodText, "360", "整数积");
  assert.equal(v.raw, "3.60");
  assert.equal(v.value, "3.6");
  assert.equal(v.trailingZeros, 1);
});

test("竖式结构：多位乘数逐位求积，错位靠 place 记录", () => {
  const v = BB.verticalMul("5.5", "4.04");
  assert.equal(v.single, false);
  assert.equal(v.prodText, "22220");
  /* 每一行写的都是「乘那一位得到的数」，向左错几列由 place 决定 */
  assert.deepEqual(v.rows.map((r) => [r.digit, r.place, r.text]),
    [[4, 0, "220"], [0, 1, "0"], [4, 2, "220"]]);
  assert.deepEqual(v.rows.map((r) => r.isZero), [false, true, false]);
  assert.equal(v.value, "22.22");
  assert.equal(v.trailingZeros, 1);
});

test("竖式结构：0.048×0.15 位数不够，值是 0.0072", () => {
  const v = BB.verticalMul("0.048", "0.15");
  assert.equal(v.prodText, "720");
  assert.equal(v.raw, "0.00720");
  assert.equal(v.value, "0.0072");
  assert.equal(v.dpSum, 5);
});

test("竖式结构：乘数的前导 0 不算一个数位（0.37 只写两行部分积）", () => {
  const v = BB.verticalMul("4.5", "0.37");
  assert.deepEqual(v.rows.map((r) => [r.digit, r.place, r.text]),
    [[7, 0, "315"], [3, 1, "135"]], "前导 0 不该单独占一行");
  assert.equal(v.value, "1.665");
});

test("竖式结构：乘数去掉前导 0 后只剩一位，就直接写积", () => {
  const v = BB.verticalMul("4.5", "0.5");
  assert.equal(v.single, true, "0.5 是「一位乘数」，不该写部分积");
  assert.equal(v.rows.length, 1);
  assert.equal(v.value, "2.25");
});

test("竖式展开：末位对齐，横线在乘数下面", () => {
  const e = BB.expandVcalc({ a: "5.5", b: "4.04", rightX: 880, y: 110, size: 56 });
  const tags = e.ops.map((o) => o.tag);
  assert.deepEqual(tags,
    ["a", "mulSign", "b", "bar1", "partial-0", "partial-1", "partial-2", "bar2", "sum"]);

  const a = e.ops[0];
  const b = e.ops[2];
  assert.equal(a.rightX, b.rightX, "被乘数和乘数右端（末位）对齐");

  const bar1 = e.ops[3];
  assert.equal(bar1.k, "line");
  assert.ok(bar1.y > b.y, "第一条横线在乘数下方");
  assert.ok(bar1.x1 < bar1.x2);
});

test("竖式展开：部分积按乘到的数位向左错位", () => {
  const e = BB.expandVcalc({ a: "5.5", b: "4.04", rightX: 880, y: 110, size: 56 });
  const rows = ["partial-0", "partial-1", "partial-2"].map(
    (t) => e.ops.filter((o) => o.tag === t)[0]);
  assert.ok(rows[0].rightX > rows[1].rightX, "个位那一行最靠右");
  assert.equal(rows[0].rightX, rows[1].rightX + e.colW, "十位错开一列");
  assert.equal(rows[0].rightX, rows[2].rightX + 2 * e.colW, "百位错开两列");
});

test("竖式展开：only 用来「接着上一屏只写某几行」，按原顺序重编号", () => {
  const e = BB.expandVcalc({ a: "5.5", b: "4.04", rightX: 880, y: 110, only: ["sum", "bar2"] });
  assert.deepEqual(e.ops.map((o) => o.tag), ["bar2", "sum"],
    "只写的那几个要按竖式原本的先后顺序写出来");
  assert.deepEqual(e.ops.map((o) => o.step), [0, 1]);
});

test("竖式展开：blankSum 把积挖成待填空格", () => {
  const e = BB.expandVcalc({ a: "1.2", b: "3", rightX: 880, y: 110, blankSum: true });
  const sum = e.ops.filter((o) => o.tag === "sum")[0];
  assert.deepEqual(sum.blanks, [0, 1], "3.60 两个字符都要挖空");
});

test("点小数点：跳格数等于两个因数的小数位数之和", () => {
  const v = BB.verticalMul("4.5", "3.7");
  const pj = BB.expandPointJump({ math: v, rightX: 880, y: 300, size: 56, skipInt: true });
  const dot = pj.ops.filter((o) => o.k === "dot")[0];
  assert.equal(dot.stops, 2, "一位加一位 = 2 格");
  assert.ok(dot.x0 > dot.x1, "小数点从右往左跳");
});

test("点小数点：末尾的 0 要划掉并写出化简结果", () => {
  const v = BB.verticalMul("0.72", "5");
  const pj = BB.expandPointJump({ math: v, rightX: 880, y: 300, size: 56, skipInt: true });
  const ticks = pj.ops.filter((o) => o.k === "tick");
  const result = pj.ops.filter((o) => o.tag === "pj-result")[0];
  assert.equal(ticks.length, 1, "3.60 只有一个末尾 0");
  assert.equal(result.text, "= 3.6");
});

test("答案判定：小数写法宽容，3.60 与 3.6 一样", () => {
  assert.ok(BB.checkBlank({ answer: "3.6" }, "3.60"));
  assert.ok(BB.checkBlank({ answer: "0.1" }, "0.100"));
  assert.ok(BB.checkBlank({ answer: "22.22" }, " 22.22 元 "));
  assert.ok(BB.checkBlank({ answer: "969.6" }, "969.6元"));
  assert.ok(!BB.checkBlank({ answer: "3.572" }, "3.57"));
  assert.ok(!BB.checkBlank({ answer: "8" }, ""));
});

test("答案判定：选择题 / 判断题 / 填空题", () => {
  const q = { type: "choice", options: ["a", "b", "c"], answer: 2 };
  assert.equal(BB.gradeQuestion(q, { choice: 2 }).ok, true);
  assert.equal(BB.gradeQuestion(q, { choice: 0 }).ok, false);
  assert.equal(BB.gradeQuestion(q, {}).answered, false);

  const vf = { type: "vf", answer: false };
  assert.equal(BB.gradeQuestion(vf, { vf: false }).ok, true);
  assert.equal(BB.gradeQuestion(vf, { vf: true }).ok, false);

  const fill = { type: "fill", blanks: [{ answer: "0.35" }, { answer: "4" }, { answer: "1.4" }] };
  const r = BB.gradeQuestion(fill, { blanks: ["0.35", "4", "1.40"] });
  assert.equal(r.ok, true, "1.4 与 1.40 等价");
  assert.deepEqual(r.flags, [true, true, true]);
  const bad = BB.gradeQuestion(fill, { blanks: ["0.35", "5", "1.4"] });
  assert.deepEqual(bad.flags, [true, false, true], "错哪一个要能指出来");
});

test("答案判定：填符号的题（＞＜＝）也判得对", () => {
  assert.ok(BB.checkBlank({ answer: "=" }, "="));
  assert.ok(BB.checkBlank({ answer: "=" }, "＝"), "全角等号要认");
  assert.ok(BB.checkBlank({ answer: "<" }, "＜"));
  assert.ok(BB.checkBlank({ answer: ">" }, " > "));
  assert.ok(!BB.checkBlank({ answer: "<" }, ">"), "填反了不能算对");
  assert.ok(!BB.checkBlank({ answer: "=" }, "<="), "符号答案必须完全一致");
  assert.ok(!BB.checkBlank({ answer: "=" }, ""), "空着不算答对");
});

test("答案判定：把整道算式一起写进来也认", () => {
  assert.ok(BB.checkBlank({ answer: "1665" }, "45×37=1665"));
  assert.ok(BB.checkBlank({ answer: "1.4" }, "0.35×4＝1.4"));
  assert.ok(!BB.checkBlank({ answer: "1.4" }, "0.35×4=1.5"), "算式里的结果不对就不能算对");
  assert.ok(!BB.checkBlank({ answer: "8" }, "2.5×3.2"), "只写算式没写结果不算答对");
});

test("答案判定：文字答案不能把「不够」当成「够」", () => {
  assert.ok(BB.checkBlank({ answer: "够" }, "够"));
  assert.ok(BB.checkBlank({ answer: "够" }, "够吃"));
  assert.ok(!BB.checkBlank({ answer: "够" }, "不够"));
});

test("关卡数据体检：真实数据没有越界或缺失", () => {
  const DATA = require(path.join(__dirname, "..", "blackboard", "js", "bb-levels.js"));
  const bad = BB.validateLevels(DATA.LEVELS);
  assert.deepEqual(bad, [], "体检报告：\n" + bad.join("\n"));
});

/* --------------------------------------------------------------------------
 *  竖式横线不许压到数字上
 *  横线贴数字下沿这种事，截图缩略图上根本看不出来（已经看岔过一次），
 *  所以在这里用纯数学锁死：从字形表量出真实墨迹深度，逐条竖式验算留白。
 *  浏览器端还有一条同意图的门禁（tools/browser-check.html），量的是渲染后的
 *  getBBox —— 两边互为交叉验证。
 * ------------------------------------------------------------------------ */
test("竖式横线：每条横线都离上面那行数字够远", () => {
  const HW = require(path.join(__dirname, "..", "blackboard", "lib", "handwrite.js"));
  BB.setGlyphEngine(HW);
  const DATA = require(path.join(__dirname, "..", "blackboard", "js", "bb-levels.js"));

  /* 0-9 字形里最深的那一点（字框坐标）—— 跟着字形数据走，不写死 */
  let deepestInk = 0;
  Object.keys(HW.GLYPH).forEach((ch) => {
    if (!/^[0-9]$/.test(ch)) return;
    HW.GLYPH[ch].forEach((d) => {
      const nums = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      for (let i = 1; i < nums.length; i += 2) deepestInk = Math.max(deepestInk, nums[i]);
    });
  });
  assert.ok(deepestInk > 30 && deepestInk < BB.GLYPH_BOX,
    "字形墨迹深度量得不对：" + deepestInk);

  /* 对应 bb-chalk.js 里的 stroke-width：数字 4.6、横线 3.2 */
  const NUM_STROKE = 4.6;
  const LINE_STROKE = 3.2;
  const MIN_GAP = 3;

  function spanOf(op, size) {
    if (op.rightX != null) return [op.rightX - BB.textWidth(String(op.text), size), op.rightX];
    return [op.x, op.x + BB.textWidth(String(op.text || "0"), size)];
  }

  const tight = [];
  let pairs = 0;

  DATA.LEVELS.forEach((lv) => {
    lv.steps.forEach((st, si) => {
      (st.ops || []).forEach((op) => {
        if (op.k !== "vcalc") return;
        const e = BB.expandVcalc(op.spec);
        const nums = e.ops.filter((o) => o.k === "num" && o.text != null);
        e.ops.filter((o) => o.k === "line").forEach((ln) => {
          const lx1 = Math.min(ln.x1, ln.x2);
          const lx2 = Math.max(ln.x1, ln.x2);
          nums.forEach((n) => {
            const size = n.size || e.size;
            /* 判定「在横线上方」要用墨迹底，不能用字框底：字框底下半截本来就是空的，
               拿它比会把紧挨着横线的那一行（也就是真正要防的那一行）漏掉。 */
            const inkBottom = n.y + (deepestInk / BB.GLYPH_BOX) * size + NUM_STROKE / 2;
            if (inkBottom > ln.y) return;
            const range = spanOf(n, size);
            if (range[1] < lx1 || range[0] > lx2) return;   /* 水平不重叠就不算冲突 */
            pairs += 1;
            const gap = (ln.y - LINE_STROKE / 2) - inkBottom;
            if (gap < MIN_GAP) {
              tight.push(lv.id + " 第" + (si + 1) + "步 「" + n.text +
                "」离横线只有 " + gap.toFixed(1) + "px");
            }
          });
        });
      });
    });
  });

  assert.ok(pairs >= 8, "只量到 " + pairs + " 对，门禁可能在空转");
  assert.deepEqual(tight, [], "横线贴到数字上了：\n" + tight.join("\n"));
});
