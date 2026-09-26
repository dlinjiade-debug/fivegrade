/* ==========================================================================
 *  bb-div.js —— 小数除法的竖式排版与逐笔展开
 *  ------------------------------------------------------------------
 *  除法比乘法难在「位置」：商写在哪儿、乘积写在哪儿、余数落在哪儿，
 *  一格都不能错。所以这里先把题目算清楚（纯字符串，不下浮点），
 *  再把结果翻译成「列 + 行」的坐标，最后按老师讲课的顺序发射成一串
 *  带 tag 的原子笔画，交给粉笔引擎一笔一笔写。
 *
 *  除号框（横线 + 竖线）从左往右看是这样的：
 *
 *            0 . 1 5        ← 商，每一位都落在被除数对应那一列的正上方
 *        ┌───────────
 *   1 2  │ 1 . 8          ← 除数写在框左边，被除数写在框里
 *          1 2            ← 商的这一位 × 除数
 *          ─────          ← 相减
 *            6 0         ← 差，后面跟着「落下来」的那一位
 *            6 0
 *            ─────
 *              0
 *
 *  发射出来的 tag（only 里就用这些名字）：
 *    bracket / divisor / dividend —— 除号框、除数、被除数（head = 这三个）
 *    st0-q  st0-p  st0-bar  st0-d  st0-b —— 第 1 步：商位、乘积、横线、差、落位
 *    st1-… 以此类推；「st1」这个写法等于「st1 开头的全部」
 *    qdot —— 商的小数点（商是整数时不发射）
 *    res  —— 最终结果；repeat —— 循环小数的循环点（不循环时不发射）
 * ========================================================================== */
(function (root, factory) {
  const isNode = typeof module === "object" && module.exports;
  const BB = isNode ? require("./bb-core.js") : (root && root.BB);
  const api = factory(BB);
  if (isNode) module.exports = api;
  if (root && root.BB) {
    root.BB.vdiv = api;
    root.BB.expandVdiv = api.expandVdiv;   /* 和 expandVcalc 一个用法，自检工具好调 */
    root.BB.divModel = api.divModel;
  }
  if (BB && BB.registerExpander) BB.registerExpander("vdiv", api.expandVdiv);
})(typeof self !== "undefined" ? self : globalThis, function (BB) {
  "use strict";
  if (!BB) throw new Error("bb-div.js 需要先加载 bb-core.js");

  /* 横线画在下一行字框内的比例，和乘法用同一个手感。
     0.38 时「乘积压线」只剩 4px 出头（浏览器门禁量出来 4.4px），
     往 0.30 收一点，乘积与横线、横线与差都留出 8px 以上。 */
  const RULE_DROP = 0.30;

  /* ------------------------------------------------------------------ *
   *  1. 数字的拆解：把一个小数拆成「数字串 + 小数点前面有几位」
   * ------------------------------------------------------------------ */

  /**
   * splitValue("3.15") → { digits:"315", dotAt:1 }
   * splitValue("0.5")  → { digits:"05",  dotAt:1 }   ← 整数部分补一个 0，
   *                                                     竖式里才有「个位」那一列
   */
  function splitValue(value) {
    const dp = BB.decimalPlaces(value);
    let d = BB.digitsOf(value).replace(/^0+(?=\d)/, "");
    if (!d) d = "0";
    let dotAt = d.length - dp;
    while (dotAt < 1) { d = "0" + d; dotAt += 1; }
    return { digits: d, dotAt: dotAt, dp: dp };
  }

  /* ------------------------------------------------------------------ *
   *  2. 把 a ÷ b 算到底：商是几位、每一步的乘积和差各是多少
   * ------------------------------------------------------------------ */

  /**
   * @param a 被除数（字符串或数字）
   * @param b 除数
   * @param opts { stopAfter: 最多算到小数点后几位, maxDigits: 兜底上限 }
   */
  function divModel(a, b, opts) {
    const o = opts || {};
    const A = BB.plain(a);
    const B = BB.plain(b);
    const dpB = BB.decimalPlaces(B);

    /* ① 除数是小数 → 被除数和除数同时把小数点往右搬 dpB 位，
          除数就变成整数了。这一步是「一个数除以小数」的全部秘密。 */
    const shift = dpB;
    const divisor = String(BB.intValue(B));
    const M = Number(divisor);
    if (!M) throw new Error("除数不能是 0");

    const pa = splitValue(A);
    let digits = pa.digits;
    let dotAt = pa.dotAt + shift;
    if (dotAt >= digits.length) {
      /* 小数点被搬到数字串右边 → 这个数其实是整数，把 0 补上、前导 0 去掉 */
      digits = (digits + "0".repeat(dotAt - digits.length)).replace(/^0+(?=\d)/, "") || "0";
      dotAt = digits.length;
    }
    const dividendDigits = digits;

    /* ② 商的整数部分有几位 —— 拿「被除数的整数部分 ÷ 除数」定：
          221.52÷26 得 8，商就只有 1 位整数，商的第一个数字写在个位列上；
          4.8÷15 得 0，商也要老老实实写一个 0 占住个位列（不能省）。
          由此倒推商的第一个数字落在第几列。 */
    const intPart = digits.slice(0, dotAt);
    const intQuot = String(Math.floor(Number(intPart) / M));
    const c0 = Math.max(1, dotAt - intQuot.length + 1);

    /* 被除数右移小数点后可能留下「前导 0」（0.048÷0.15 → 004.8），
       那几位在竖式里不写出来，但要留着列号，商才对得齐。 */
    const shownInt = intPart.replace(/^0+/, "") || "0";
    const leadZeros = intPart.length - shownInt.length;
    const firstCol = leadZeros + 1;

    const maxDigits = o.maxDigits || 16;
    const stopAfter = o.stopAfter == null ? null : o.stopAfter;
    const seq = digits.split("");     /* 会不断往后添 0 */
    const origLen = seq.length;       /* 被除数原本的位数，循环判定要用 */
    const steps = [];
    const remSeen = {};
    let cycle = null;
    let rem = 0;
    let i = 0;

    while (i < seq.length && steps.length < 64) {
      const before = rem;
      rem = rem * 10 + Number(seq[i]);
      const q = Math.floor(rem / M);
      rem -= q * M;
      const col = i + 1;
      steps.push({ col: col, q: q, remBefore: before, rem: rem, digit: Number(seq[i]) });

      /* 循环的判定只在「往后添 0」那一段里做 —— 那一段每一位补的都是 0，
         余数一旦重复，后面必然一模一样。拿被除数原有的几位去比会误判：
         0.35÷4 中途余数也重复过，可它是除得尽的。 */
      if (col > origLen && !cycle) {
        const key = "r" + before;
        if (remSeen[key] != null) cycle = { from: remSeen[key], to: col - 1 };
        else remSeen[key] = col;
      }

      i += 1;
      if (i >= seq.length) {
        if (rem === 0) break;
        const frac = i - dotAt;
        if (stopAfter != null && frac >= stopAfter) break;
        if (frac >= maxDigits) break;
        seq.push("0");
      }
    }

    /* ③ 商的每一位：丢掉整数部分还没开始的那些「0」 */
    const kept = steps.filter(function (s) { return s.col >= c0; });
    kept.forEach(function (s, k) { s.k = k; });
    const all = kept.map(function (s) { return String(s.q); }).join("");
    const before = intQuot.length;                 /* 商的整数部分有几位 */
    const value = before >= all.length ? all : all.slice(0, before) + "." + all.slice(before);
    const hasPoint = kept.length > 0 && kept[kept.length - 1].col > dotAt;

    return {
      a: A, b: B,
      shift: shift, divisor: divisor, divisorLen: divisor.length,
      dividendDigits: dividendDigits, dotAt: dotAt, c0: c0,
      firstCol: firstCol, leadZeros: leadZeros,
      seq: seq.join(""), steps: steps, kept: kept,
      text: value, value: value, exact: rem === 0, remainder: rem,
      cycle: cycle, hasPoint: hasPoint, pointCol: dotAt,
      digitsBeforePoint: before,
    };
  }

  /* ------------------------------------------------------------------ *
   *  3. 坐标：把「第几列 / 第几行」翻译成黑板上的 x、y
   * ------------------------------------------------------------------ */

  function expandVdiv(spec) {
    const s = spec || {};
    const m = s.math || divModel(s.a, s.b, s);
    const size = s.size || 46;
    const rowH = size * (1 + (s.rowGap == null ? 0.34 : s.rowGap));
    const scale = size / BB.GLYPH_BOX;
    /* 列宽比一个数字的实际宽度再放开一档（课本的竖式就是这么排的）。
       为什么非放不可：小数点是**骑在两列之间**的，数字之间的空当就是它的位置。
       按字宽紧排时那个空当只有 9px 左右，塞进一颗 5px 的点之后，
       两边各剩不到 1px —— 纸面上差不多就是贴着隔壁数字，粉笔笔迹再抖一下就糊成一片。
       放开到 1.15 倍（空当约 13px），点两边各留 4px，才分得开。
       注意必须是**均匀**放开：被除数、商、乘积、落位全按同一套列坐标摆，
       一改就是一起改，列对齐关系不受影响。 */
    const COL_FACTOR = 1.15;
    const colW = BB.advanceOf("0") * scale * COL_FACTOR;
    const rightX = s.rightX == null ? 880 : s.rightX;
    const topY = s.y == null ? 92 : s.y;
    const cols = m.seq.length;
    const x0 = rightX - cols * colW;               /* 被除数第 1 列的左边 */
    const dividendY = topY + rowH;
    const leftEdge = x0 + (m.firstCol - 1) * colW; /* 被除数真正要写出来的第一位 */
    /* 除号框竖线的 x：紧挨着被除数那一列。
       人教版的写法是「3⌐96」——竖线右边就是被除数，中间只留一丁点空。
       原来留了 0.62 个字宽，看上去被除数是「飘」在框右边的。 */
    const bx = leftEdge - size * 0.14;
    const ruleY = dividendY - size * RULE_DROP;    /* 除号框横线的 y */

    const cellLeft = function (col) { return x0 + (col - 1) * colW; };
    function digitCell(col, ch) {
      const w = BB.advanceOf(ch) * scale;
      return { ch: ch, x: cellLeft(col) + colW / 2 - w / 2, w: w };
    }
    /* 小数点画在「第 col 列之前」，也就是上一列和这一列的交界线上 ——
       商的小数点「与被除数对齐」，靠的就是两边都骑在同一条分界线上。
       按字框居中即可：「.」的墨迹在字形表里已经挪到字宽正中了
       （见 handwrite.js 里那颗点的注释），所以字框中心就是墨迹中心。 */
    function pointCell(col) {
      const w = BB.advanceOf(".") * scale;
      return { ch: ".", x: cellLeft(col) - w * 0.5, w: w };
    }
    function cellsEndingAt(col, text) {
      const chars = Array.from(String(text));
      const start = col - chars.length + 1;
      return chars.map(function (ch, idx) { return digitCell(start + idx, ch); });
    }

    /* --- 纵向排布：先给每一行定 y（从上往下），再按讲课顺序发射 --- */
    const kept = m.kept;
    let cursor = dividendY + rowH;
    let openDiff = null;                 /* 最近一次开出来的「差」行，落位往它上面加 */
    kept.forEach(function (st, k) {
      if (openDiff) openDiff.brings.push(k);          /* 这一位是落到上一行的 */
      if (st.q > 0) {
        st.productY = cursor; cursor += rowH;
        st.diffY = cursor; cursor += rowH;
        st.barY = st.diffY - size * RULE_DROP;
        st.isLast = k === kept.length - 1;
        /* 差行上先写什么：有余数就写余数；整除且这是最后一步就写 0；
           整除但后面还要继续除，就不写（课本上也只写落下来的那几位）。 */
        st.diffText = st.rem > 0 ? String(st.rem) : (st.isLast ? "0" : "");
        st.brings = [];
        openDiff = st;
      }
    });
    let lastRowY = dividendY;
    kept.forEach(function (st) { if (st.diffY != null) lastRowY = st.diffY; });
    const bottomY = lastRowY + size * 0.95;

    /* --- 发射：顺序 = 老师讲课的顺序 --- */
    const ops = [];
    const S = { size: size };

    /* ① 除号框 */
    ops.push(Object.assign({ k: "line", x1: bx, x2: bx, y: ruleY, y1: ruleY, y2: bottomY, tone: "chalk", tag: "bracket" }, S));
    ops.push(Object.assign({ k: "line", x1: bx, x2: rightX + size * 0.12, y: ruleY, tone: "chalk", tag: "bracket" }, S));

    /* ② 除数（写在框左边，右边贴着竖线） */
    ops.push(Object.assign({
      k: "num", text: m.divisor, layout: BB.layoutRight(m.divisor, bx - size * 0.34, size),
      y: dividendY, tone: "accent", tag: "divisor",
    }, S));

    /* ③ 被除数（含小数点）；小数点右移留下来的前导 0 不写出来 */
    const dividendCells = [];
    for (let c = m.firstCol; c <= m.dividendDigits.length; c += 1) {
      if (c === m.dotAt + 1 && m.dotAt < m.dividendDigits.length) dividendCells.push(pointCell(c));
      dividendCells.push(digitCell(c, m.dividendDigits.charAt(c - 1)));
    }
    ops.push(Object.assign({
      k: "num", text: m.dividendDigits, layout: dividendCells,
      y: dividendY, tone: "chalk", tag: "dividend",
    }, S));

    /* ④ 一步一步除 */
    kept.forEach(function (st, k) {
      const q = String(st.q);
      ops.push(Object.assign({
        k: "num", text: q, layout: [digitCell(st.col, q)],
        y: topY, tone: "accent", tag: "st" + k + "-q",
      }, S));

      if (st.q > 0) {
        const prodText = String(st.q * Number(m.divisor));
        ops.push(Object.assign({
          k: "num", text: prodText, layout: cellsEndingAt(st.col, prodText),
          y: st.productY, tone: "chalk", tag: "st" + k + "-p",
        }, S));
        ops.push(Object.assign({
          k: "line", x1: bx + size * 0.14, x2: rightX + size * 0.12, y: st.barY,
          tone: "chalk", tag: "st" + k + "-bar",
        }, S));
        if (st.diffText) {
          ops.push(Object.assign({
            k: "num", text: st.diffText, layout: cellsEndingAt(st.col, st.diffText),
            y: st.diffY, tone: "chalk", tag: "st" + k + "-d",
          }, S));
        }
        /* 落位：把后面要用到的数字，落在这一行的右边 */
        (st.brings || []).forEach(function (nk) {
          const nt = kept[nk];
          ops.push(Object.assign({
            k: "num", text: String(nt.digit), layout: [digitCell(nt.col, String(nt.digit))],
            y: st.diffY, tone: "accent", tag: "st" + nk + "-b",
          }, S));
        });
      }
    });

    /* ⑤ 商的小数点：商是整数时不画 */
    if (m.hasPoint) {
      ops.push(Object.assign({
        k: "num", text: ".", layout: [pointCell(m.pointCol + 1)],
        y: topY, tone: "accent", tag: "qdot",
      }, S));
    }

    /* ⑥ 循环小数的循环点 */
    if (m.cycle) {
      const from = m.cycle.from;
      const to = m.cycle.to;
      const mark = function (col) {
        ops.push(Object.assign({
          k: "circle", cx: cellLeft(col) + colW / 2, cy: topY - size * 0.12, r: size * 0.056,
          tone: "accent", tag: "repeat",
        }, S));
      };
      mark(from);
      if (to > from) mark(to);
    }

    /* ⑦ 最终结果：除不尽的时候写「≈」，不能写「＝」骗人。
         除不尽 + 要求保留 N 位（roundTo）时，先把结果四舍五入到 N 位再写 ——
         板上为了看清「看哪一位决定舍入」多除的那一位（stopAfter），最后是要舍掉的。
         直接用算出来的那几位配「≈」等于教错：19.4÷12 是 ≈1.62，不是 ≈1.617。 */
    const shownValue = (!m.exact && s.roundTo != null) ? BB.roundTo(m.value, s.roundTo) : m.value;
    ops.push(Object.assign({
      k: "num", text: (m.exact ? "= " : "≈ ") + shownValue, x: rightX + size * 0.5, y: topY,
      tone: "good", tag: "res",
    }, S));

    /* --- only 过滤：支持 head / st1 这类简写 --- */
    const allTags = ops.map(function (o) { return o.tag; });
    let picked = ops;
    if (s.only && s.only.length) {
      const want = [];
      s.only.forEach(function (t) {
        const name = String(t);
        if (allTags.indexOf(name) >= 0) { want.push(name); return; }
        if (name === "head") { want.push("bracket", "divisor", "dividend"); return; }
        const mm = /^st(\d+)$/.exec(name);
        if (mm) {
          allTags.forEach(function (x) {
            if (x.indexOf("st" + mm[1] + "-") === 0) want.push(x);
          });
          return;
        }
        want.push(name);   /* 不认识的标签原样留着，让自检报出来 */
      });
      picked = ops.filter(function (o) { return want.indexOf(o.tag) >= 0; });
    }
    picked.forEach(function (o, i) { o.step = i; });

    return {
      ops: picked, steps: picked.length, math: m, tags: allTags,
      size: size, rowH: rowH, colW: colW, x0: x0, bx: bx, rightX: rightX,
      topY: topY, dividendY: dividendY, ruleY: ruleY, bottomY: bottomY,
      kept: kept, pointCol: m.pointCol, cols: cols,
      resText: (m.exact ? "= " : "≈ ") + shownValue,
    };
  }

  return {
    splitValue: splitValue,
    divModel: divModel,
    expandVdiv: expandVdiv,
  };
});
