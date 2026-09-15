/* ==========================================================================
 *  bb-core.js —— 粉笔小闯关 · 纯函数核心
 *  ------------------------------------------------------------------
 *  这里只放「算得出来、测得出来」的逻辑，不碰 DOM：
 *    · 小数位数 / 整数化 / 四舍五入（全程字符串算法，绕开浮点误差）
 *    · 竖式乘法结构生成（末位对齐、逐位求部分积、积的小数点定位）
 *    · 按「右边对齐」的字形排布（复用 handwrite 的字宽表，保证板书不重叠）
 *    · 板书脚本展开（把一条竖式声明展开成一串可逐步书写的原子操作）
 *    · 答案判定（数值等价，容忍 3.6 / 3.60 这类写法）
 *    · 关卡数据体检（数据写错时在测试里直接报出来）
 * ========================================================================== */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BB = api;
})(typeof self !== "undefined" ? self : globalThis, function () {
  "use strict";

  /* 浏览器里 window / self，Node 里 globalThis —— 用来找 handwrite 的字形引擎。
     注意：不能直接引用外面那个 UMD 的 root 参数，它不在本函数的闭包里。 */
  const GLOBAL = typeof globalThis !== "undefined"
    ? globalThis
    : (typeof self !== "undefined" ? self : null);

  /* ------------------------------------------------------------------ *
   *  1. 数字基本功
   * ------------------------------------------------------------------ */

  /** 转成朴素十进制字符串（干掉科学计数法） */
  function plain(value) {
    const s = String(value == null ? "" : value).trim();
    if (!/e/i.test(s)) return s;
    const n = Number(s);
    if (!isFinite(n)) return s;
    for (let d = 0; d <= 20; d += 1) {
      const t = n.toFixed(d);
      if (Number(t) === n) return t;
    }
    return s;
  }

  /** 小数位数："0.048" → 3，"5.5" → 1，"370" → 0 */
  function decimalPlaces(value) {
    const s = plain(value);
    const dot = s.indexOf(".");
    return dot < 0 ? 0 : s.length - dot - 1;
  }

  /** 只保留数字字符（去掉小数点、正负号、单位） */
  function digitsOf(value) {
    return plain(value).replace(/[^0-9]/g, "");
  }

  /** 按整数看待的数："4.04" → 404，"0.048" → 48 */
  function intValue(value) {
    const d = digitsOf(value).replace(/^0+(?=\d)/, "");
    return d ? Number(d) : 0;
  }

  /** 数字串自增（纯字符串，不经过 Number） */
  function addOne(digits) {
    const out = digits.split("");
    let i = out.length - 1;
    while (i >= 0) {
      if (out[i] === "9") { out[i] = "0"; i -= 1; } else { out[i] = String(Number(out[i]) + 1); break; }
    }
    if (i < 0) out.unshift("1");
    return out.join("");
  }

  /** 四舍五入到 n 位小数，返回字符串；用字符串算法保证 1.005 这类不出错 */
  function roundTo(value, n) {
    const places = Math.max(0, n | 0);
    let s = plain(value);
    let neg = false;
    if (s.charAt(0) === "-") { neg = true; s = s.slice(1); }
    const parts = s.split(".");
    const int = parts[0] || "0";
    const frac = parts[1] || "";
    if (frac.length <= places) {
      const padded = places ? int + "." + frac.padEnd(places, "0") : int;
      return (neg ? "-" : "") + padded;
    }
    const keep = frac.slice(0, places);
    const nextDigit = Number(frac.charAt(places));
    let all = (int + keep).replace(/^0+(?=\d)/, "");
    if (nextDigit >= 5) all = addOne(all);
    if (places === 0) return (neg ? "-" : "") + all;
    while (all.length <= places) all = "0" + all;
    return (neg ? "-" : "") + all.slice(0, all.length - places) + "." + all.slice(all.length - places);
  }

  /** 把整数积按 dp 位小数点上小数点："720" + 5 → "0.00720" */
  function placePoint(digits, dp) {
    let d = digitsOf(digits);
    if (dp <= 0) return d;
    while (d.length <= dp) d = "0" + d;
    return d.slice(0, d.length - dp) + "." + d.slice(d.length - dp);
  }

  /** 去掉小数末尾多余的 0："0.00720" → "0.0072"，"22.220" → "22.22" */
  function trimZeros(text) {
    let s = String(text);
    if (s.indexOf(".") < 0) return s;
    s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s === "" ? "0" : s;
  }

  function nearlyEqual(a, b) {
    const x = Number(a);
    const y = Number(b);
    if (!isFinite(x) || !isFinite(y)) return false;
    return Math.abs(x - y) < 1e-9;
  }

  /* ------------------------------------------------------------------ *
   *  2. 竖式乘法结构
   * ------------------------------------------------------------------ */

  /**
   * 生成小数乘法竖式的完整结构
   *   verticalMul("5.5", "4.04")
   *   → { dpSum:3, prod:22220, rows:[…], raw:"22.220", value:"22.22" }
   */
  function verticalMul(a, b) {
    const A = plain(a), B = plain(b);
    const ia = intValue(A), ib = intValue(B);
    const dpA = decimalPlaces(A), dpB = decimalPlaces(B);
    const dpSum = dpA + dpB;
    const prod = ia * ib;
    const rows = digitsOf(B).replace(/^0+(?=\d)/, "").split("").reverse().map(function (ch, index) {
      const digit = Number(ch);
      const value = ia * digit;
      return {
        digit: digit,
        place: index,
        value: value,
        text: String(value),
        isZero: value === 0,
      };
    });
    const raw = placePoint(String(prod), dpSum);
    return {
      a: A, b: B, ia: ia, ib: ib,
      dpA: dpA, dpB: dpB, dpSum: dpSum,
      prod: prod,
      prodText: String(prod),
      single: rows.length === 1,
      rows: rows,
      raw: raw,
      value: trimZeros(raw),
      trailingZeros: raw.length - trimZeros(raw).length,
    };
  }

  /* ------------------------------------------------------------------ *
   *  3. 字形排布（复用 handwrite 字宽表，取不到就退化到内置表）
   * ------------------------------------------------------------------ */

  const FALLBACK_ADV = {
    "i": 17, "l": 17, "j": 17, "f": 22, "t": 26, "r": 24, "(": 20, ")": 20,
    ".": 16, ",": 16, ":": 16, "²": 22, "³": 22, "1": 26,
    "+": 30, "-": 30, "\u2212": 30, "×": 32, "÷": 32, "=": 32, "<": 28, ">": 28,
    "m": 40, "w": 40, "W": 40, "M": 38, "°": 16, "/": 22,
  };
  const FALLBACK_DEFAULT = 32;
  const GLYPH_BOX = 52;
  const GLYPH_W = 30;

  let glyphEngine = null;

  function setGlyphEngine(engine) {
    glyphEngine = engine || null;
  }
  function engine() {
    if (glyphEngine && glyphEngine.measure) return glyphEngine;
    if (typeof require === "function") {
      try { glyphEngine = require("../lib/handwrite.js"); } catch (e) { /* 单文件环境兜底 */ }
    }
    if (!glyphEngine && GLOBAL && GLOBAL.HW) glyphEngine = GLOBAL.HW;
    return glyphEngine && glyphEngine.measure ? glyphEngine : null;
  }

  function advanceOf(ch) {
    const hw = engine();
    if (hw) return hw.measure(ch);
    return FALLBACK_ADV[ch] || FALLBACK_DEFAULT;
  }

  function textWidth(text, size) {
    const s = size / GLYPH_BOX;
    let w = 0;
    for (const ch of String(text)) w += advanceOf(ch) * s;
    return w;
  }

  /** 按「右边对齐」排布一行字（竖式排版的基础） */
  function layoutRight(text, rightX, size) {
    const s = size / GLYPH_BOX;
    const chars = Array.from(String(text));
    const advs = chars.map(function (ch) { return advanceOf(ch) * s; });
    const total = advs.reduce(function (a, b) { return a + b; }, 0);
    let x = rightX - total;
    return chars.map(function (ch, i) {
      const item = { ch: ch, x: x, w: advs[i] };
      x += advs[i];
      return item;
    });
  }

  function rangeOf(n) {
    const out = [];
    for (let i = 0; i < n; i += 1) out.push(i);
    return out;
  }

  /* ------------------------------------------------------------------ *
   *  4. 竖式板书的展开
   * ------------------------------------------------------------------ */

  const ROW_GAP = 0.36;        /* 行距：相邻两行字框之间的空隙，占字框高的比例 */
  const RULE_DROP = 0.38;      /* 横线画在上一行字框内的位置（占字框高的比例）。
                                  数字最深的墨迹在字框 43/52 处，再算上笔画半个笔宽，
                                  0.38 大约留出 7px 白 —— 太靠上就变成给数字画下划线了。 */
  const PARTIAL_STEP = 1.48;   /* 被乘数行 → 第一行部分积的行距，以 rowH 为单位 */

  /**
   * 把一条竖式声明展开成一串可逐步书写的原子操作
   * spec: { a, b, rightX, y, size, showZeroRows, blankRows, blankSum, only, pointJump }
   *
   * 排版遵循人教版小数乘法竖式：
   *   · 被乘数、乘数「末位对齐」（不看小数点，右边的数字对整齐）
   *   · 乘数只有一位数时，横线下直接写积（没有部分积那一层）
   *   · 乘数是多位数时，一个数位写一行，乘到哪一位就向左错几位
   *   · 最后的积右对齐
   * op.y 一律是「字框顶部」，渲染时直接 translate(x, y) scale()。
   */
  function expandVcalc(spec) {
    const size = spec.size || 56;
    const rightX = spec.rightX;
    const rowH = size * (1 + ROW_GAP);
    const colW = advanceOf("0") * (size / GLYPH_BOX);
    const v = verticalMul(spec.a, spec.b);
    const showZero = spec.showZeroRows !== false;
    const blankRows = spec.blankRows || [];
    const blankSum = !!spec.blankSum;
    const single = v.single;

    const rows = [{ id: "a", text: v.a, right: rightX, blanks: [] }];
    rows.push({ id: "b", text: v.b, right: rightX, blanks: [] });
    if (!single) {
      v.rows.forEach(function (r, i) {
        if (r.isZero && !showZero) return;
        rows.push({
          id: "partial-" + i,
          text: r.text,
          right: rightX - r.place * colW,
          place: r.place,
          isZero: r.isZero,
          blanks: blankRows.indexOf(i) >= 0 ? rangeOf(r.text.length) : [],
        });
      });
    }

    let minX = rightX;
    rows.forEach(function (r) {
      const laid = layoutRight(r.text, r.right, size);
      if (laid.length) minX = Math.min(minX, laid[0].x);
    });
    const prodLaid = layoutRight(v.prodText, rightX, size);
    if (prodLaid.length) minX = Math.min(minX, prodLaid[0].x);
    const mulX = minX - size * 0.98;

    const ops = [];
    let cursor = spec.y;
    let step = 0;
    let sumY = null;

    ops.push({ k: "num", text: v.a, rightX: rightX, y: cursor, size: size, tone: "chalk", tag: "a" });
    cursor += rowH;
    ops.push({
      k: "num", text: "×", rightX: mulX + textWidth("×", size), y: cursor, size: size,
      tone: "accent", tag: "mulSign",
    });
    ops.push({ k: "num", text: v.b, rightX: rightX, y: cursor, size: size, tone: "chalk", tag: "b" });
    cursor += rowH;
    ops.push({
      k: "line", x1: mulX - size * 0.18, x2: rightX + size * 0.12,
      y: cursor - size * RULE_DROP, tone: "chalk", tag: "bar1",
    });
    cursor += rowH * (PARTIAL_STEP - 1);

    if (single) {
      sumY = cursor;
      ops.push({
        k: "num", text: v.prodText, rightX: rightX, y: cursor, size: size,
        tone: spec.sumTone || "accent", tag: "sum",
        blanks: blankSum ? rangeOf(v.prodText.length) : [],
      });
      cursor += rowH;
    } else {
      rows.slice(2).forEach(function (r) {
        ops.push({
          k: "num", text: r.text, rightX: r.right, y: cursor, size: size,
          tone: r.isZero ? "muted" : "chalk", tag: r.id, blanks: r.blanks, isZero: r.isZero,
        });
        cursor += rowH;
      });
      ops.push({
        k: "line", x1: mulX - size * 0.18, x2: rightX + size * 0.12,
        y: cursor - size * RULE_DROP, tone: "chalk", tag: "bar2",
      });
      cursor += rowH * 0.52;
      sumY = cursor;
      ops.push({
        k: "num", text: v.prodText, rightX: rightX, y: cursor, size: size,
        tone: spec.sumTone || "accent", tag: "sum",
        blanks: blankSum ? rangeOf(v.prodText.length) : [],
      });
      cursor += rowH;
    }

    if (spec.pointJump) {
      const pj = expandPointJump({
        math: v, rightX: rightX, y: sumY, size: size,
        tone: spec.sumTone || "accent", skipInt: true,
        noTick: spec.noTick, noResult: spec.noResult,
      });
      pj.ops.forEach(function (o) { ops.push(o); });
    }

    ops.forEach(function (op, i) { op.step = i; });
    const picked = spec.only ? ops.filter(function (op) { return spec.only.indexOf(op.tag) >= 0; }) : ops;
    picked.forEach(function (op, i) { op.step = i; });

    return {
      size: size, rowH: rowH, colW: colW, rightX: rightX, mulX: mulX, minX: minX,
      sumY: sumY, sumText: v.prodText, single: single,
      ops: picked, steps: picked.length, math: v,
    };
  }

  /**
   * 「点小数点」的过程展开成可逐步播放的原子操作：
   *   ① 写出整数积（skipInt 时认为已经写好了）② 位数不够往前补 0
   *   ③ 小数点从右往左跳格，跳一格数一位 ④ 末尾的 0 划掉 ⑤ 写出最终答案
   */
  function expandPointJump(spec) {
    const size = spec.size || 56;
    const rightX = spec.rightX;
    const y = spec.y;
    const tone = spec.tone || "accent";
    const v = spec.math || verticalMul(spec.a, spec.b);
    const raw = v.raw;
    const content = digitsOf(raw);
    const laid = layoutRight(raw, rightX, size);
    const missing = content.length - v.prodText.length;
    const ops = [];

    if (!spec.skipInt) {
      ops.push({
        k: "num", text: v.prodText, rightX: rightX, y: y, size: size,
        tone: tone, tag: "pj-int",
      });
    }

    if (missing > 0) {
      const group = [{ ch: "0", x: laid[0].x, w: laid[0].w }];
      for (let i = 0; i < missing - 1; i += 1) {
        group.push({ ch: "0", x: laid[2 + i].x, w: laid[2 + i].w });
      }
      ops.push({
        k: "num", text: "0".repeat(missing), layout: group, y: y, size: size,
        tone: tone, tag: "pj-pad",
      });
    }

    const slots = layoutRight(content, rightX, size);
    const leftCell = slots[content.length - v.dpSum - 1];
    const rightCell = slots[content.length - v.dpSum];
    const leftEdge = leftCell ? leftCell.x + leftCell.w : rightCell.x;
    const dotX = leftEdge + (rightCell.x - leftEdge) / 2;

    ops.push({
      k: "dot", x0: rightX, x1: dotX, y: y + size * 0.78, size: size,
      stops: v.dpSum, tone: tone, tag: "pj-dot",
    });

    if (v.trailingZeros > 0 && !spec.noTick) {
      for (let i = 0; i < v.trailingZeros; i += 1) {
        const cell = laid[laid.length - 1 - i];
        if (!cell) continue;
        ops.push({ k: "tick", x: cell.x, y: y, size: size, tag: "pj-tick-" + i });
      }
    }

    if (v.trailingZeros > 0 && !spec.noResult) {
      ops.push({
        k: "num", text: "= " + v.value, x: rightX + size * 0.62, y: y, size: size,
        tone: "good", tag: "pj-result",
      });
    }

    return { ops: ops, steps: ops.length, math: v };
  }

  /* ------------------------------------------------------------------ *
   *  5. 答案判定
   * ------------------------------------------------------------------ */

  function normalize(value) {
    return String(value == null ? "" : value)
      .trim()
      .replace(/\s+/g, "")
      .replace(/[，,、]/g, "")
      .replace(/[（(]/g, "")
      .replace(/[）)]/g, "")
      /* 全角符号统一成半角 —— 注意「＝」不能删掉，
         L4 那种「填 ＞ ＜ ＝」的题，答案本身就是个符号。 */
      .replace(/＝/g, "=")
      .replace(/＜/g, "<")
      .replace(/＞/g, ">")
      .replace(/＋/g, "+")
      .replace(/[－—−–]/g, "-")
      .replace(/[хxX*]/g, "×")
      .replace(/元|吨|千瓦时|度|米|千克|个|本|盒|名/g, "");
  }

  function numbersIn(text) {
    const m = normalize(text).match(/-?\d+(?:\.\d+)?/g);
    return m || [];
  }

  /** 一个空格的判定：数值等价即可，容忍 3.6 / 3.60、带单位、写成 22.22 元 */
  function checkBlank(blank, raw) {
    const got = normalize(raw);
    if (got === "") return false;
    const want = normalize(blank.answer);
    if (got === want) return true;
    if (blank.allowText && want.indexOf(got) >= 0) return true;

    const wn = numbersIn(want);
    const gn = numbersIn(got);

    if (!wn.length && !gn.length) {
      /* 纯文字答案（比如「够」）：多写一两个字可以算对，
         但不能把「不够」当成「够」—— 所以只认「谁以谁开头」。 */
      if (/^[<>=+\-×÷≤≥]+$/.test(want)) return false;
      return got.indexOf(want) === 0 || want.indexOf(got) === 0;
    }
    if (!wn.length || !gn.length) return false;
    if (wn.length === 1 && gn.length === 1) return nearlyEqual(gn[0], wn[0]);
    /* 把整道算式一起写进来的（「45×37＝1665」），认最后一个数 */
    if (wn.length === 1 && gn.length > 1) return nearlyEqual(gn[gn.length - 1], wn[0]);
    if (wn.length !== gn.length) return false;
    return wn.every(function (w, i) { return nearlyEqual(w, gn[i]); });
  }

  function gradeQuestion(question, input) {
    const answer = input || {};
    if (!question) return { answered: false, ok: false, flags: [] };
    if (question.type === "choice") {
      return {
        answered: answer.choice != null,
        ok: answer.choice != null && Number(answer.choice) === Number(question.answer),
        flags: [],
      };
    }
    if (question.type === "vf") {
      return {
        answered: answer.vf != null,
        ok: answer.vf != null && !!answer.vf === !!question.answer,
        flags: [],
      };
    }
    if (question.type === "fill") {
      const given = answer.blanks || [];
      const flags = question.blanks.map(function (b, i) { return checkBlank(b, given[i]); });
      const answered = given.some(function (v) { return String(v == null ? "" : v).trim() !== ""; });
      return { answered: answered, ok: flags.every(Boolean), flags: flags };
    }
    return { answered: false, ok: false, flags: [] };
  }

  function gradePractice(questions, inputs) {
    const list = (inputs || []).map(function (input, i) {
      return gradeQuestion(questions[i], input);
    });
    return {
      total: questions.length,
      correct: list.filter(function (r) { return r.ok; }).length,
      allCorrect: list.length === questions.length && list.every(function (r) { return r.ok; }),
      results: list,
    };
  }

  /* ------------------------------------------------------------------ *
   *  6. 关卡数据体检
   * ------------------------------------------------------------------ */

  const BOARD_KINDS = ["cn", "num", "line", "rect", "box", "circle", "arrow", "dot", "tick"];

  function validateLevel(level) {
    const bad = [];
    const tag = level && level.id ? "[" + level.id + "]" : "[?]";
    if (!level || !level.id) bad.push(tag + " 缺少 id");
    if (!level || !level.title) bad.push(tag + " 缺少 title");
    if (!level || !level.unit) bad.push(tag + " 缺少 unit");
    if (!level || !level.goal) bad.push(tag + " 缺少 goal");
    if (!level || !Array.isArray(level.steps) || !level.steps.length) bad.push(tag + " 缺少讲解步骤");

    (level && level.steps ? level.steps : []).forEach(function (step, i) {
      const where = tag + " 第" + (i + 1) + "步";
      if (!step.text) bad.push(where + " 缺少讲解文案");
      if (!Array.isArray(step.ops) || !step.ops.length) bad.push(where + " 没有板书内容");
      (step.ops || []).forEach(function (op) {
        const at = where + "（" + (op.tag || op.k) + "）";
        if (op.k === "vcalc" || op.k === "pointjump") {
          const spec = op.spec || { a: op.a, b: op.b, rightX: op.rightX, y: op.y, size: op.size };
          try {
            const e = op.k === "vcalc" ? expandVcalc(spec) : expandPointJump(spec);
            if (!e.ops.length) bad.push(at + " 展开为空");
            e.ops.forEach(function (o) { boundsOf(o, at, bad); });
          } catch (err) {
            bad.push(at + " 参数错误：" + err.message);
          }
          return;
        }
        if (BOARD_KINDS.indexOf(op.k) < 0) bad.push(at + " 未知板书类型 " + op.k);
        if (op.k === "cn" || op.k === "num") {
          if (!op.text) bad.push(at + " 缺少 text");
          if (op.rightX == null && op.x == null) bad.push(at + " 缺少坐标");
        }
        boundsOf(op, at, bad);
      });
    });

    if (!Array.isArray(level && level.practice) || !level.practice.length) bad.push(tag + " 缺少练习");
    (level && level.practice ? level.practice : []).forEach(function (q, i) {
      const where = tag + " 练习" + (i + 1);
      if (!q.id) bad.push(where + " 缺少 id");
      if (!q.stem) bad.push(where + " 缺少题干");
      if (!q.why) bad.push(where + " 缺少讲解答案的话");
      if (q.type === "choice") {
        if (!Array.isArray(q.options) || q.options.length < 2) bad.push(where + " 选项不足");
        if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= (q.options || []).length) {
          bad.push(where + " 正确答案下标越界");
        }
      } else if (q.type === "vf") {
        if (typeof q.answer !== "boolean") bad.push(where + " 判断题答案必须是 true/false");
      } else if (q.type === "fill") {
        if (!Array.isArray(q.blanks) || !q.blanks.length) bad.push(where + " 填空没有空");
        (q.blanks || []).forEach(function (b, j) {
          if (b.answer == null || b.answer === "") bad.push(where + " 第" + (j + 1) + "空没有答案");
          if (/\d/.test(String(b.answer)) && b.expr == null) {
            bad.push(where + " 第" + (j + 1) + "空是数字答案，必须给 expr 供重算校验");
          }
        });
      } else {
        bad.push(where + " 未知题型 " + q.type);
      }
    });
    return bad;
  }

  function boundsOf(op, at, bad) {
    const size = op.size || 30;
    let left = null;
    let right = null;
    if (op.layout && op.layout.length) {
      left = op.layout[0].x;
      const last = op.layout[op.layout.length - 1];
      right = last.x + (last.w || size * 0.6);
    } else if (op.text) {
      const w = op.k === "cn" ? String(op.text).length * size : textWidth(String(op.text), size);
      left = op.rightX != null && op.k !== "cn" ? op.rightX - w : (op.x || 0);
      right = left + w;
    } else if (op.k === "line") {
      left = Math.min(op.x1, op.x2);
      right = Math.max(op.x1, op.x2);
    } else if (op.x != null) {
      left = op.x;
      right = op.x;
    }
    if (left != null && left < -6) bad.push(at + " 越出黑板左边界（x=" + Math.round(left) + "）");
    if (right != null && right > 1272) bad.push(at + " 越出黑板右边界（到 " + Math.round(right) + "）");
    if ((op.y || 0) + size > 708) bad.push(at + " 越出黑板下边界");
  }

  function validateLevels(levels) {
    let bad = [];
    const seen = {};
    (levels || []).forEach(function (level) {
      if (seen[level.id]) bad.push("关卡 id 重复：" + level.id);
      seen[level.id] = true;
      bad = bad.concat(validateLevel(level));
    });
    return bad;
  }

  return {
    plain: plain,
    decimalPlaces: decimalPlaces,
    digitsOf: digitsOf,
    intValue: intValue,
    roundTo: roundTo,
    placePoint: placePoint,
    trimZeros: trimZeros,
    nearlyEqual: nearlyEqual,
    verticalMul: verticalMul,
    layoutRight: layoutRight,
    textWidth: textWidth,
    advanceOf: advanceOf,
    expandVcalc: expandVcalc,
    expandPointJump: expandPointJump,
    rangeOf: rangeOf,
    setGlyphEngine: setGlyphEngine,
    engine: engine,
    normalize: normalize,
    numbersIn: numbersIn,
    checkBlank: checkBlank,
    gradeQuestion: gradeQuestion,
    gradePractice: gradePractice,
    validateLevel: validateLevel,
    validateLevels: validateLevels,
    BOARD_KINDS: BOARD_KINDS,
    GLYPH_BOX: GLYPH_BOX,
    GLYPH_W: GLYPH_W,
    FALLBACK_ADV: FALLBACK_ADV,
  };
});
