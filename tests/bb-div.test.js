/* ==========================================================================
 *  bb-div.test.js —— 小数除法竖式的单测
 *  ------------------------------------------------------------------
 *  除法最容易错的是「位置」：商写在哪一列、乘积写在哪个数底下、
 *  余数落在哪一行。所以这里既验数学（商 × 除数 ＝ 被除数），
 *  也验几何（同一列的字 x 对齐、落位和余数同一行）。
 *  跑法：npm test（即 node --test tests/*.test.js）
 * ========================================================================== */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

const BB = require(path.join(__dirname, "..", "blackboard", "js", "bb-core.js"));
const DIV = require(path.join(__dirname, "..", "blackboard", "js", "bb-div.js"));

const near = (a, b, eps) => Math.abs(Number(a) - Number(b)) < (eps == null ? 1e-9 : eps);

/* ---------------- 1. 数学：商算对了没有 ---------------- */

const TABLE = [
  /* [被除数, 除数, 期望的商, 说明] */
  ["1.8", "12", "0.15", "整数部分不够除，商 0 再点小数点"],
  ["3.15", "3", "1.05", "商中间有 0"],
  ["0.35", "4", "0.0875", "要连着添两个 0"],
  ["0.5", "4", "0.125", "小数点后第一位是 0"],
  ["12", "8", "1.5", "整数除整数，除到余数不为 0 要添 0"],
  ["5.6", "0.35", "16", "除数是小数，两个数一起往右搬两位"],
  ["7.2", "0.9", "8", "搬一位就变整数，商是整数"],
  ["2.5", "0.5", "5", "同上"],
  ["0.9", "0.3", "3", "被除数小数点前只有 0"],
  ["0.048", "0.15", "0.32", "两边都要搬"],
  ["4.5", "0.3", "15", "商的整数部分是两位数"],
  ["1.08", "0.9", "1.2", "除数是小数，商是一位小数"],
  ["9.6", "0.16", "60", "商的末尾有 0"],
  ["22.152", "2.6", "8.52", "商的首位不能多写一个 0"],
  ["7", "8", "0.875", "整数被除数是小数"],
  ["0.63", "7", "0.09", "商中间连着两个 0"],
  ["10", "4", "2.5", "简单情形"],
  ["9.6", "3", "3.2", "除数是整数、除得尽"],
  ["5.5", "4", "1.375", "除到末尾还有余数，连着添两个 0"],
  ["0.25", "0.5", "0.5", "两边都搬，商比被除数小"],
];

test("除法：每一步的商 × 除数 ＋ 余数 ＝ 当时那一段被除数", () => {
  TABLE.forEach(([a, b]) => {
    const m = DIV.divModel(a, b);
    const M = Number(m.divisor);
    m.kept.forEach((s) => {
      const q = s.q;
      /* 这一步真正在除的数（前面几位 + 这一位） */
      const work = s.remBefore * 10 + s.digit;
      assert.equal(q * M + s.rem, work,
        a + "÷" + b + " 第 " + s.col + " 列：商 " + q + " × " + M + " + 余 " + s.rem + " 应该等于 " + work);
      assert.ok(q >= 0 && q <= 9, a + "÷" + b + " 第 " + s.col + " 列商 " + q + " 越界");
    });
  });
});

test("除法：除得尽的题，商 × 除数 必须等于被除数", () => {
  TABLE.forEach(([a, b, want]) => {
    const m = DIV.divModel(a, b);
    assert.ok(m.exact, a + "÷" + b + " 应该是除得尽的");
    assert.ok(near(m.value, want), a + "÷" + b + " 商是 " + m.value + "，应该是 " + want);
    assert.ok(near(Number(m.value) * Number(b), Number(a), 1e-9),
      a + "÷" + b + " 的商 " + m.value + " 乘回去对不上");
  });
});

test("除法：小数点的搬移（除数是小数时两个数一起右移）", () => {
  const m = DIV.divModel("5.6", "0.35");
  assert.equal(m.divisor, "35");
  assert.equal(m.dividendDigits, "560");
  assert.equal(m.shift, 2);

  const m2 = DIV.divModel("3.15", "3");
  assert.equal(m2.divisor, "3");
  assert.equal(m2.dividendDigits, "315");
  assert.equal(m2.shift, 0);

  const m3 = DIV.divModel("0.9", "0.3");
  assert.equal(m3.divisor, "3");
  assert.equal(m3.dividendDigits, "9");
});

test("除法：除数是 0 要报错，不能默默算下去", () => {
  assert.throws(() => DIV.divModel("5", "0"), /除数不能是 0/);
});

/* ---------------- 2. 循环小数 ---------------- */

test("循环小数：1÷3 的循环节是 3", () => {
  const m = DIV.divModel("1", "3", { stopAfter: 6 });
  assert.equal(m.exact, false);
  assert.ok(m.cycle, "1÷3 应该识别出循环");
  assert.equal(m.cycle.from, 2);
  assert.equal(m.cycle.to, 2);
  assert.equal(m.value, "0.333333");
});

test("循环小数：5.7÷9 的循环节是 3", () => {
  const m = DIV.divModel("5.7", "9", { stopAfter: 4 });
  assert.ok(m.cycle);
  assert.equal(m.cycle.from, m.cycle.to);
  assert.equal(m.value, "0.6333");
});

test("循环小数：除得尽的题不能误报循环（余数中途重复过也不行）", () => {
  ["0.35:4", "1.2:0.8", "3.15:3", "22.152:2.6", "0.63:7"].forEach((pair) => {
    const [a, b] = pair.split(":");
    const m = DIV.divModel(a, b);
    assert.equal(m.cycle, null, a + "÷" + b + " 是除得尽的，不该报循环");
  });
});

test("商的写法：整数商不点小数点，小数商补前导 0", () => {
  assert.equal(DIV.divModel("5.6", "0.35").value, "16");
  assert.equal(DIV.divModel("7.2", "0.9").value, "8");
  assert.equal(DIV.divModel("5.6", "0.35").hasPoint, false);
  assert.equal(DIV.divModel("1.8", "12").value, "0.15");
  assert.equal(DIV.divModel("1.8", "12").hasPoint, true);
  assert.equal(DIV.divModel("0.63", "7").value, "0.09");
  assert.equal(DIV.divModel("0.048", "0.15").value, "0.32");
  assert.equal(DIV.divModel("0.25", "0.5").value, "0.5");
});

test("被除数右移小数点后的前导 0 不写出来，但列号要留着", () => {
  /* 0.048÷0.15 → 两边右移两位 → 4.8÷15；竖式上写「4.8」而不是「004.8」 */
  const m = DIV.divModel("0.048", "0.15");
  assert.equal(m.dividendDigits, "0048");
  assert.equal(m.dotAt, 3, "小数点在第 3 位之后（保留列号）");
  assert.equal(m.leadZeros, 2, "前两位 0 不写");
  assert.equal(m.firstCol, 3, "被除数从第 3 列开始写");
  const e = DIV.expandVdiv({ a: "0.048", b: "0.15", rightX: 880, y: 92, size: 46 });
  const panel = e.ops.filter((o) => o.tag === "dividend")[0];
  assert.equal(panel.layout.length, 3, "4 . 8 —— 三个字形位");
  assert.deepEqual(panel.layout.map((c) => c.ch), ["4", ".", "8"]);
  /* 商的 0 要正好压在「4」那一列上 */
  const q0 = e.ops.filter((o) => o.tag === "st0-q")[0];
  const col4 = e.x0 + (m.firstCol - 1) * e.colW + e.colW / 2;
  assert.ok(near(q0.layout[0].x + q0.layout[0].w / 2, col4, 2), "商的个位 0 要写在「4」的上面");
});

/* ---------------- 3. 板书结构 ---------------- */

const EXP = (spec) => DIV.expandVdiv(Object.assign({ a: "1.8", b: "12", rightX: 880, y: 92, size: 46 }, spec));

test("板书：先画除号框（竖线 + 横线），再写除数、被除数", () => {
  const e = EXP({ only: ["head"] });
  const tags = e.ops.map((o) => o.tag);
  assert.deepEqual(tags.slice(0, 4), ["bracket", "bracket", "divisor", "dividend"]);
  const lines = e.ops.filter((o) => o.k === "line");
  assert.equal(lines.length, 2, "除号框就是竖线 + 横线两条");
  const vertical = lines[0];
  assert.equal(vertical.x1, vertical.x2, "第一条是竖线");
  assert.ok(vertical.y2 > vertical.y1, "竖线往下画");
  assert.equal(e.ops.filter((o) => o.k === "num" && o.tag === "divisor").length, 1);
});

test("板书：商写在被除数对应那一列的正上方", () => {
  const e = EXP({});
  const colOf = (col) => e.x0 + (col - 1) * e.colW + e.colW / 2;
  e.kept.forEach((st, k) => {
    const q = e.ops.filter((o) => o.tag === "st" + k + "-q")[0];
    assert.ok(q, "第 " + k + " 步应该有商位");
    const center = q.layout[0].x + q.layout[0].w / 2;
    assert.ok(near(center, colOf(st.col), 2),
      "第 " + k + " 步商的 x（" + center.toFixed(1) + "）应该落在第 " + st.col + " 列（" + colOf(st.col).toFixed(1) + "）");
    assert.equal(q.y, e.topY, "商都写在最上面那一行");
  });
});

test("板书：乘积写在那一列底下，且与商位右端对齐", () => {
  const e = EXP({});
  const colOf = (col) => e.x0 + (col - 1) * e.colW + e.colW / 2;
  e.kept.forEach((st, k) => {
    if (st.q <= 0) return;
    const p = e.ops.filter((o) => o.tag === "st" + k + "-p")[0];
    assert.ok(p, "第 " + k + " 步应该有乘积");
    assert.equal(p.text, String(st.q * Number(e.math.divisor)));
    const last = p.layout[p.layout.length - 1];
    assert.ok(near(last.x + last.w / 2, colOf(st.col), 2), "乘积的最后一位要和商位同列");
    assert.ok(p.y > e.dividendY, "乘积写在被除数下面");
  });
});

test("板书：相减的横线画在乘积和被除数之间，不压到数字", () => {
  const e = EXP({});
  const size = e.size;
  e.kept.forEach((st, k) => {
    if (st.q <= 0) return;
    const bar = e.ops.filter((o) => o.tag === "st" + k + "-bar")[0];
    const p = e.ops.filter((o) => o.tag === "st" + k + "-p")[0];
    assert.ok(bar && p);
    assert.ok(bar.y > p.y + size * 0.5, "横线要压在乘积下面");
    assert.ok(bar.y < st.diffY, "横线要在差行的上面");
  });
});

test("板书：落下来的数字和余数写在同一行", () => {
  const e = EXP({});
  let found = 0;
  e.ops.filter((o) => /-b$/.test(o.tag)).forEach((b) => {
    const k = Number(/st(\d+)-b/.exec(b.tag)[1]);
    const owner = e.kept.filter((st, idx) => idx < k && st.brings && st.brings.indexOf(k) >= 0)[0];
    assert.ok(owner, b.tag + " 应该挂在前面某一步的差行上");
    assert.equal(b.y, owner.diffY, "落位要和差行的 y 一样（同一行往右接）");
    assert.ok(b.layout[0].x > e.x0 + (e.kept[0].col - 1) * e.colW, "落位要写在右边");
    found += 1;
  });
  assert.ok(found >= 1, "1.8÷12 应该至少有一处落位");
});

test("板书：商的小数点与除号框横线，位置都对准", () => {
  const e = EXP({});
  const dot = e.ops.filter((o) => o.tag === "qdot")[0];
  assert.ok(dot, "1.8÷12 的商有小数点");
  const boundary = e.x0 + e.math.pointCol * e.colW;
  const center = dot.layout[0].x + dot.layout[0].w / 2;
  assert.ok(near(center, boundary, 3), "小数点要落在被除数小数点那一列的分界上");
  assert.ok(e.ruleY < e.dividendY, "除号框横线在被除数上面");
  assert.ok(e.bottomY > e.dividendY, "除号框竖线要伸到最后一行下面");
});

/* 这一组是「放大看图」查出来的毛病，锁住它别再回来：
   字形表里「.」的墨迹原本挤在字框 12.2~17.8（字宽只有 16），越出了右边缘，
   于是不管竖排横排，这颗点都被画到下一个数字身上 —— 9.6÷3 的板书放大看，
   被除数的点和「6」糊成一团。 */
test("字形：小数点的墨迹落在自己字宽的正中（否则会糊到隔壁数字上）", () => {
  const HW = BB.engine();
  const path = HW.GLYPH["."][0];
  const m = /^M\s*([-\d.]+)\s*[, ]\s*([-\d.]+)/.exec(path);
  assert.ok(m, "小数点字形应该是「一个圆」，路径以圆心起笔");
  const cx = Number(m[1]);
  assert.ok(near(cx, BB.advanceOf(".") / 2, 0.01),
    "圆心 x 要在字宽正中（" + BB.advanceOf(".") / 2 + "），实际 " + cx);
  /* 墨迹（半径 2.8）不能越出字框 */
  assert.ok(cx - 2.8 >= 0 && cx + 2.8 <= BB.advanceOf("."),
    "墨迹 " + (cx - 2.8) + "~" + (cx + 2.8) + " 越出了字宽 " + BB.advanceOf("."));
});

test("板书：列宽比字宽放开一档（小数点才有地方站）", () => {
  /* 点是骑在两列之间的，它的位置就是数字之间的空当。
     按字宽紧排时空当只有 8~9px，塞进一颗 5px 的点之后两边各剩不到 1px，
     纸面上就是贴着隔壁数字。具体留白多少由浏览器门禁量（当前 4.8px）。 */
  const e = EXP({});
  const bare = BB.advanceOf("0") * (46 / BB.GLYPH_BOX);
  assert.ok(e.colW >= bare * 1.1,
    "列宽要至少放开一成：当前 " + e.colW.toFixed(1) + "，一个数字才 " + bare.toFixed(1));
});

/* ---------------- 4. only 过滤与简写 ---------------- */

test("only：head 等于「框 + 除数 + 被除数」", () => {
  const e = EXP({ only: ["head"] });
  assert.equal(e.ops.length, 4);
  assert.deepEqual([...new Set(e.ops.map((o) => o.tag))].sort(), ["bracket", "dividend", "divisor"]);
});

test("only：st1 是「第 2 步的全部笔画」的简写，且保序", () => {
  const all = EXP({});
  const one = EXP({ only: ["st1"] });
  const want = all.tags.filter((t) => t.indexOf("st1-") === 0);
  assert.ok(want.length >= 2, "第 2 步至少该有商位和落位");
  assert.deepEqual([...new Set(one.ops.map((o) => o.tag))], [...new Set(want)]);
  one.ops.forEach((o, i) => assert.equal(o.step, i, "过滤之后要重新编号"));
});

test("only：按讲课顺序分段取用，拼起来正好是整块板书", () => {
  const all = EXP({});
  const segA = EXP({ only: ["head", "st0"] });
  const segB = EXP({ only: ["st1", "st2", "qdot", "res"] });
  const got = segA.ops.concat(segB.ops).map((o) => o.tag).sort();
  assert.deepEqual(got, all.tags.slice().sort(), "分段讲解不能漏笔画，也不能重复写");
  assert.equal(segA.ops.length + segB.ops.length, all.ops.length);
});

test("只有整除的题才不发射 qdot", () => {
  assert.equal(DIV.expandVdiv({ a: "7.2", b: "0.9", rightX: 880, y: 92, size: 46 })
    .ops.filter((o) => o.tag === "qdot").length, 0);
  assert.equal(DIV.expandVdiv({ a: "3.15", b: "3", rightX: 880, y: 92, size: 46 })
    .ops.filter((o) => o.tag === "qdot").length, 1);
});

/* ---------------- 5. 板面边界 ---------------- */

test("板书：所有笔画都在黑板范围内（1280 × 720）", () => {
  const cases = [["1.8", "12"], ["3.15", "3"], ["5.6", "0.35"], ["0.35", "4"], ["22.152", "2.6"]];
  cases.forEach(([a, b]) => {
    const e = DIV.expandVdiv({ a, b, rightX: 880, y: 92, size: 46 });
    e.ops.forEach((o) => {
      const size = o.size || 30;
      let left = null;
      let right = null;
      if (o.layout && o.layout.length) {
        left = o.layout[0].x;
        const last = o.layout[o.layout.length - 1];
        right = last.x + last.w;
      } else if (o.text) {
        const w = BB.textWidth(o.text, size);
        left = o.x != null ? o.x : o.rightX - w;
        right = left + w;
      } else if (o.k === "line") {
        left = Math.min(o.x1, o.x2);
        right = Math.max(o.x1, o.x2);
      }
      if (left != null) assert.ok(left > -6, a + "÷" + b + " 越出左边界 x=" + left.toFixed(0));
      if (right != null) assert.ok(right < 1272, a + "÷" + b + " 越出右边界 " + right.toFixed(0));
      if (o.y != null) assert.ok(o.y + size < 708, a + "÷" + b + " 越出下边界 y=" + o.y.toFixed(0));
    });
  });
});

test("竖式越高的题，字号要能撑住板面高度", () => {
  /* 「除数是小数」那种要走两步的题，行数最多，专门量一下 */
  const e = DIV.expandVdiv({ a: "0.048", b: "0.15", rightX: 880, y: 92, size: 46 });
  assert.ok(e.bottomY < 660, "板书底部到了 " + e.bottomY.toFixed(0) + "，太靠下了");
});

/* ---------------- 6. 注册进 bb-core 的展开器 ---------------- */

test("vdiv 已经注册成复合板书，bb-core 认识它", () => {
  assert.ok(BB.isCompound("vdiv"), "vdiv 要注册进 bb-core");
  const list = BB.expandOp({ k: "vdiv", spec: { a: "1.8", b: "12", rightX: 880, y: 92, size: 46 } });
  assert.ok(list.length > 4);
  assert.ok(BB.expanderKinds().indexOf("vdiv") >= 0);
});

/* ---------------- 7. 除不尽时的「≈」必须是四舍五入过的 ----------------
   这是拿截图查出来的：stopAfter 算出来的几位是**截断**的，
   直接配「≈」写出去就是教错（19.4÷12 写成 ≈1.617，该是 ≈1.62）。
   所以 roundTo 是必需的，而不是可选的美化。 */

test("四舍五入（复用 bb-core 的 roundTo）按位进位、进退位都对", () => {
  assert.equal(BB.roundTo("1.617", 2), "1.62");
  assert.equal(BB.roundTo("0.4545", 2), "0.45");
  assert.equal(BB.roundTo("0.333", 2), "0.33");
  assert.equal(BB.roundTo("9.999", 2), "10.00", "进位后仍要保留两位");
  assert.equal(BB.roundTo("0.048", 2), "0.05");
  assert.equal(BB.roundTo("0.35", 1), "0.4");
  assert.equal(BB.roundTo("2.5", 0), "3");
  assert.equal(BB.roundTo("2.4", 0), "2");
  assert.equal(BB.roundTo("1.2", 3), "1.200", "位数不够要补 0");
  assert.equal(BB.roundTo("7", 2), "7.00");
  /* 超长小数不能掉精度（Number().toFixed() 在这上面会出问题） */
  assert.equal(BB.roundTo("0.123456789012345678901", 20), "0.12345678901234567890");
});

test("除不尽时写「≈ 四舍五入值」，除得尽时照样写「＝」", () => {
  const approx = DIV.expandVdiv({ a: "19.4", b: "12", stopAfter: 3, roundTo: 2, rightX: 880, y: 92, size: 46 });
  const resOp = approx.ops.filter((o) => o.tag === "res")[0];
  assert.equal(resOp.text, "≈ 1.62", "保留两位必须是四舍五入过的，不是截断的 1.617");
  assert.equal(approx.resText, "≈ 1.62");

  /* 板上仍然要写出多除的那一位（这是「看哪一位决定舍入」的教学重点） */
  assert.equal(approx.math.value, "1.616", "板上的商仍然是三位小数（截断，不是四舍五入）");

  const cyc = DIV.expandVdiv({ a: "1", b: "3", stopAfter: 3, roundTo: 2, rightX: 880, y: 92, size: 46 });
  assert.equal(cyc.ops.filter((o) => o.tag === "res")[0].text, "≈ 0.33");

  /* 除得尽：roundTo 不该改动结果，也不该把「＝」换成「≈」 */
  const exact = DIV.expandVdiv({ a: "9.6", b: "3", stopAfter: 3, roundTo: 2, rightX: 880, y: 92, size: 46 });
  assert.equal(exact.ops.filter((o) => o.tag === "res")[0].text, "= 3.2");

  /* 没给 roundTo 就不动（向后兼容：老关卡照旧，宁可让人看到截断值） */
  const plain = DIV.expandVdiv({ a: "19.4", b: "12", stopAfter: 3, rightX: 880, y: 92, size: 46 });
  assert.equal(plain.ops.filter((o) => o.tag === "res")[0].text, "≈ 1.616");
});
