#!/usr/bin/env node
/* ==========================================================================
 *  math-check.js —— 粉笔小闯关 · 内容自检（乘法 + 除法两套专题）
 *  ------------------------------------------------------------------
 *  只依赖 Node 内置模块。把「内容里容易写错的地方」写成可执行断言：
 *    1. 每一道填空的数字答案都用 expr 重新算一遍，对不上就报错
 *    2. 板书脚本里 vcalc / pointjump / vdiv 的 only 标签必须真的存在，
 *       否则那一步会「什么都不写」，孩子看着黑板发呆
 *    3. 每一关的步骤都有文案、练习都有解析
 *    4. 竖式本身要算得对（乘法验积，除法验「商 × 除数 ＝ 被除数」）
 *    5. 板书不能越出黑板边界（交给 bb-core 的 validateLevels）
 *
 *  用法： node tools/math-check.js
 * ========================================================================== */
"use strict";

const path = require("path");
const BB = require(path.join(__dirname, "..", "js", "bb-core.js"));
require(path.join(__dirname, "..", "js", "bb-div.js"));   /* 注册 vdiv 展开器 */

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

/* ------------------------------------------------------------------ *
 *  两套专题：除了「怎么验竖式」不同，其余检查一视同仁
 * ------------------------------------------------------------------ */
const PACKS = [
  {
    key: "mul",
    name: "小数乘法",
    unit: /人教版五年级上册 · 第 1 单元/,
    levels: require(path.join(__dirname, "..", "js", "bb-levels.js")).LEVELS,
    isWork: (op) => op.k === "vcalc" || op.k === "pointjump",
    tagsOf: (op) => {
      if (op.k === "vcalc") return BB.expandVcalc(op.spec).ops.map((o) => o.tag);
      if (op.k === "pointjump") return BB.expandPointJump(op.spec).ops.map((o) => o.tag);
      return [op.tag || op.k];
    },
    /* 只用声明、不带 only 时，这条竖式一共有哪些标签 */
    allTagsOf: (op) => (op.k === "vcalc"
      ? BB.expandVcalc(Object.assign({}, op.spec, { only: null })).ops.map((o) => o.tag)
      : BB.expandPointJump(op.spec).ops.map((o) => o.tag)),
    checkWork: (where, op) => {
      const v = BB.verticalMul(op.spec.a, op.spec.b);
      check(where + " 竖式积与小数位自洽（" + op.spec.a + "×" + op.spec.b + "＝" + v.value + "）",
        same(Number(v.value) || 0, Number(v.raw) || 0) && v.raw.length > 0);
      /* 整数积必须真的等于两个整数因数相乘 */
      check(where + " 整数积算对了（" + v.ia + "×" + v.ib + "＝" + v.prod + "）",
        v.prod === v.ia * v.ib);
    },
  },
  {
    key: "div",
    name: "小数除法",
    unit: /人教版五年级上册 · 第 3 单元/,
    levels: require(path.join(__dirname, "..", "js", "bb-levels-div.js")).LEVELS,
    isWork: (op) => op.k === "vdiv",
    tagsOf: (op) => (op.k === "vdiv" ? BB.expandVdiv(op.spec).ops.map((o) => o.tag) : [op.tag || op.k]),
    allTagsOf: (op) => BB.expandVdiv(Object.assign({}, op.spec, { only: null })).ops.map((o) => o.tag),
    checkWork: (where, op) => {
      const m = BB.vdiv.divModel(op.spec.a, op.spec.b, op.spec);
      const label = op.spec.a + "÷" + op.spec.b;
      if (m.exact) {
        /* 除得尽的题：商乘回去必须等于被除数 */
        check(where + " 除法竖式自洽（" + label + "＝" + m.value + "）",
          Math.abs(Number(m.value) * Number(op.spec.b) - Number(op.spec.a)) < 1e-6,
          "商 " + m.value + " 乘 " + op.spec.b + " 对不上 " + op.spec.a);
      } else {
        /* 除不尽的题（循环小数 / 求近似数）：商的每一位都要经得起验算 */
        check(where + " 除法竖式的每一步都算对（" + label + "）",
          m.kept.every((s) => s.q * Number(m.divisor) + s.rem === s.remBefore * 10 + s.digit),
          "有一步的「商×除数＋余数」对不上");
        check(where + " 除不尽的题要说明保留到哪一位（" + label + "）",
          op.spec.stopAfter != null || !!m.cycle,
          "既没写 stopAfter，又不是循环小数，会一直算下去");
      }
      /* 商的每一位都得在 0~9 之间 */
      check(where + " 商的每一位都在 0~9（" + label + "）",
        m.kept.every((s) => s.q >= 0 && s.q <= 9));

      /* 「保留 N 位」的结果必须真的是四舍五入过的 ——
         拿算出来的那几位（stopAfter）配「≈」直接写出去，等于教错：
         19.4÷12 板上会写 ≈1.617，而正确答案是 ≈1.62。
         这里不信板面给了什么，自己按真值重算一遍。 */
      if (op.spec.roundTo != null) {
        const full = Object.assign({}, op.spec, { only: null, roundTo: null, stopAfter: null });
        let truth;
        try { truth = BB.vdiv.divModel(op.spec.a, op.spec.b, full); } catch (e) { truth = null; }
        const grade = op.spec.size || 46;
        check(where + " 保留 " + op.spec.roundTo + " 位的结果是四舍五入过的（" + label + "）",
          !!truth && !truth.exact,
          "给了 roundTo 但这道题除得尽，roundTo 没意义");
        if (truth && !truth.exact) {
          const n = Number(op.spec.roundTo);
          const want = BB.roundTo(truth.value, n);
          const shown = BB.vdiv.expandVdiv(Object.assign({}, op.spec, { only: null })).resText;
          check(where + " 板面结果「" + shown + "」与四舍五入值一致（" + label + "）",
            shown === (truth.exact ? "= " : "≈ ") + want,
            "应该是 ≈ " + want + "，板面写的是 " + shown);
          /* 真正的独立复核：和真值的差不能超过末位半个单位 */
          const diff = Math.abs(Number(shown.replace(/^[=≈]\s*/, "")) - Number(truth.value));
          check(where + " 结果没有截断误差（" + label + "）",
            diff <= 0.5 * Math.pow(10, -n) + 1e-9,
            "结果与真值差 " + diff + "，超过了半个末位（末位 = " + Math.pow(10, -n) + "）");
        }
      }

      /* 板上的商位数要和 stopAfter 对得上：说保留两位，就得除到千分位 */
      if (op.spec.stopAfter != null && !m.exact) {
        const fracDigits = m.kept.filter((s) => s.col > m.dotAt).length;
        check(where + " 除的位数与 stopAfter 一致（" + label + "）",
          fracDigits === op.spec.stopAfter,
          "要求除到 " + op.spec.stopAfter + " 位小数，实际算了 " + fracDigits + " 位");
      }
    },
  },
];

PACKS.forEach((pack) => {
  const levels = pack.levels;
  const say = (s) => "[" + pack.name + "] " + s;

  /* ---------------- 1. 关卡基本契约 ---------------- */
  check(say("一共 8 关"), levels.length === 8, "实际 " + levels.length);
  check(say("关卡编号连续"), levels.every((l, i) => l.no === i + 1));
  check(say("每关都有单元标注"), levels.every((l) => pack.unit.test(l.unit)));

  /* ---------------- 2. 数字答案重算 ---------------- */
  let numericBlanks = 0;
  let nonNumeric = 0;
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
        check(
          where + " 答案与算式一致（" + blank.expr + " → " + got + "）",
          same(got, blank.answer),
          "写的是 " + blank.answer
        );
      });
    });
  });
  pack.numericBlanks = numericBlanks;
  pack.nonNumeric = nonNumeric;

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
  levels.forEach((level) => {
    level.steps.forEach((step, si) => {
      const where = level.id + " 第" + (si + 1) + "步";
      check(where + " 有讲解文案", typeof step.text === "string" && step.text.length >= 6, step.text);
      check(where + " 有板书", Array.isArray(step.ops) && step.ops.length > 0);
      let draws = 0;
      step.ops.forEach((op) => {
        const tags = pack.tagsOf(op);
        if (pack.isWork(op)) {
          const all = pack.allTagsOf(op);
          if (op.spec && op.spec.only) {
            /* only 里的每个标签要么本身存在，要么是 head / st1 这类简写 */
            const unknown = op.spec.only.filter((t) => {
              if (all.indexOf(t) >= 0) return false;
              if (t === "head") return false;
              if (/^st\d+$/.test(t)) return !all.some((x) => x.indexOf(t + "-") === 0);
              return true;
            });
            check(where + " only 里的标签都存在", unknown.length === 0, "不存在的标签：" + unknown.join(", "));
          }
          draws += tags.length;
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
  const hasWork = (step) => step.ops.some(pack.isWork);
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

  /* ---------------- 4.6 分段讲解不能漏笔画 ----------------
   * 同一道题在好几步里各画一部分，拼起来必须正好是整块板书：
   * 少了某一步就永远看不见那几个笔画。 */
  const byProblem = {};
  levels.forEach((level) => {
    level.steps.forEach((step, si) => {
      step.ops.forEach((op) => {
        if (!pack.isWork(op) || !op.spec.only) return;
        const key = [level.id, op.k, op.spec.a, op.spec.b, op.spec.y, op.spec.rightX,
          op.spec.size, op.spec.stopAfter, op.spec.pointJump ? 1 : 0].join("|");
        const bucket = byProblem[key] || (byProblem[key] = { op: op, parts: [] });
        bucket.parts.push({ step: si + 1, only: op.spec.only });
      });
    });
  });
  Object.keys(byProblem).forEach((key) => {
    const bucket = byProblem[key];
    if (bucket.parts.length < 2) return;
    /* 拿这条竖式自身声明出来的全部标签，去比对分步讲解有没有漏掉哪一笔 */
    const allTags = pack.allTagsOf(bucket.op);
    const seen = [];
    bucket.parts.forEach((p) => {
      p.only.forEach((t) => {
        if (allTags.indexOf(t) >= 0) seen.push(t);
        else if (/^st\d+$/.test(t)) allTags.forEach((x) => { if (x.indexOf(t + "-") === 0) seen.push(x); });
        else if (t === "head") ["bracket", "divisor", "dividend"].forEach((x) => seen.push(x));
      });
    });
    const missing = allTags.filter((t) => seen.indexOf(t) < 0);
    check(key.split("|").slice(0, 4).join(" ") + " 分段讲解不漏笔画",
      missing.length === 0, "一直没写出来的笔画：" + missing.join(", "));
  });

  /* ---------------- 5. 竖式展开的数学自洽 ---------------- */
  const specs = [];
  levels.forEach((level) => {
    level.steps.forEach((step, si) => {
      step.ops.forEach((op) => {
        if (pack.isWork(op)) specs.push([level.id + " 第" + (si + 1) + "步", op]);
      });
    });
  });
  check(say("板书里用了竖式"), specs.length > 0);
  specs.forEach(([where, op]) => pack.checkWork(where, op));

  pack.specCount = specs.length;

  /* ---------------- 5.5 讲解文字里的算式也要重算 ----------------
   * 竖式是引擎算出来的，一定对；但**讲解里那句「20÷12＝1 余 8」是人手写的**，
   * 引擎对了它照样能错 —— 实际就抓到过 D5 把 80÷12＝6 余 8 写成了 86÷12＝7 余 2，
   * 连带「商到千分位是 1.617」也跟着错（真值 1.616）。
   * 这类错的危害比竖式错还大：学生抄的是那句话。
   *
   * 讲解是人写的白话，所以门禁得看懂这几种写法，否则全是误报：
   *   ① 加法连式      「220＋0＋22000＝22220」——左边一整条链要一起算
   *   ② 等价改写      「4.7×0.58 ＝ 0.47×58」——两边都是算式，不是等式，跳过
   *   ③ 带余除法      「7 ÷ 6 ＝ 1 余 1」/「10 ÷ 3 ＝ 3，余数还是 1」——
   *                    关系是 被除数 ＝ 除数 × 商 ＋ 余数，不是直接除
   *   ④ 无限小数      「1 ÷ 3 ＝ 0.333…」——写出来的是截断前缀，不能按相等比
   *   ⑤ 先乘除后加减  「错：8×12.5－0.8 ＝ 99.2」——这句算术本身是对的
   *                    （错的是方法，忘了给 0.8 也乘 12.5），别误报
   * 真要故意写错算式，给那一关加 `proseCheck: false`。 */
  const eqFails = [];
  const eqCount = { exact: 0, approx: 0 };

  function proseTexts(level) {
    const out = [];
    level.steps.forEach((step, si) => {
      const at = level.id + " 第" + (si + 1) + "步";
      if (step.text) out.push([at + " 字幕", step.text]);
      if (step.tip) out.push([at + " 提示", step.tip]);
      step.ops.forEach((op) => {
        if ((op.k === "cn" || op.k === "num") && op.text) out.push([at + " 板书文字", op.text]);
      });
    });
    return out;
  }

  const NUM = "(\\d+(?:\\.\\d+)?)";
  const OPS = "[÷×\\u2212\\-+－＋]";
  /* 左边一整条算式（含连式）；右边那个数后面不能紧跟数字、小数点或运算符 ——
     否则「4.7×0.58 ＝ 0.47×58」会被截成 ＝0，「1.5÷0.25 ＝ 150÷25」截成 ＝15。 */
  const EXPR = "(\\d+(?:\\.\\d+)?(?:\\s*" + OPS + "\\s*\\d+(?:\\.\\d+)?)*)";
  const TAIL = "(?![\\d.\\s]*[÷×\\u2212\\-+－＋/=])";
  /* 余数有几种白话写法： 「余 1」「，余数还是 1」 */
  const REM = "(?:\\s*(?:余|[，,]\\s*(?:余数?|剩下)\\s*(?:还是|是|为)?)\\s*" + NUM + ")?";
  const DOTS = "(?:\\s*(\\.{3}|…))?";
  /* 1=左边算式 2=右边的数 3=余数 4=省略号 */
  const RE_EXACT = new RegExp(EXPR + "\\s*[＝=]\\s*" + NUM + REM + DOTS + TAIL, "g");
  /* 「左边算式 …≈ 近似值」：中间允许夹几个非数字字符（「保留两位」这种） */
  const RE_APPROX = new RegExp(EXPR + "\\s*[^0-9÷×＝=]{0,8}?≈\\s*" + NUM + TAIL, "g");

  function normOp(ch) {
    if (ch === "÷") return "÷";
    if (ch === "×") return "×";
    if (ch === "+" || ch === "＋") return "+";
    return "-";                       /* 减号的几种写法都归到减 */
  }
  /** 先乘除后加减，从左往右 —— 白话里的算式就是这个规矩 */
  function evalExpr(text) {
    const tk = text.replace(/\s/g, "").match(/\d+(?:\.\d+)?|[÷×\u2212\-+－＋]/g) || [];
    if (!tk.length) return NaN;
    let acc = Number(tk[0]);
    const terms = [];
    for (let k = 1; k + 1 < tk.length; k += 2) {
      const op = normOp(tk[k]);
      const v = Number(tk[k + 1]);
      if (op === "×") acc *= v;
      else if (op === "÷") acc /= v;
      else { terms.push(acc, op); acc = v; }
    }
    terms.push(acc);
    let total = terms[0];
    for (let k = 1; k + 1 < terms.length; k += 2) {
      total = terms[k] === "+" ? total + terms[k + 1] : total - terms[k + 1];
    }
    return total;
  }
  /** 直接截断（不进位），用来核「0.333…」这种写不完的数 */
  function truncateTo(text, places) {
    const s = String(text);
    const dot = s.indexOf(".");
    if (dot < 0) return places <= 0 ? s : s + "." + "0".repeat(places);
    const frac = s.slice(dot + 1);
    if (frac.length < places) return s + "0".repeat(places - frac.length);
    return places === 0 ? s.slice(0, dot) : s.slice(0, dot) + "." + frac.slice(0, places);
  }
  const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

  /**
   * 判一段文字里的所有算式。
   * @returns {number} 匹配到的算式个数；不合格的推进 sink
   */
  function judgeProse(at, s, sink, counter) {
    let m;
    let hits = 0;
    const reE = new RegExp(RE_EXACT.source, "g");
    while ((m = reE.exec(s))) {
      const shown = m[2];
      const got = Number(shown);
      /* 左边得真的是算式（「= 3.2」这种没有运算符的不算） */
      if (!/[×÷\u2212\-－＋+]/.test(m[1])) continue;
      hits += 1;
      if (counter) counter.exact += 1;
      if (m[4] != null) {
        /* 「…」：写出来的是截断前缀，核「是不是把真值往后写了几位」 */
        const truth = evalExpr(m[1]);
        const places = (shown.split(".")[1] || "").length;
        if (truncateTo(String(truth), places) !== shown) {
          sink.push(at + "「" + m[0] + "」截断不对：真值 " + truth +
            "，写 " + places + " 位应该是 " + truncateTo(String(truth), places));
        }
        continue;
      }
      if (m[3] != null) {
        /* 带余除法：被除数 ＝ 除数 × 商 ＋ 余数，且余数必须比除数小 */
        const simple = /^(\d+(?:\.\d+)?)÷(\d+(?:\.\d+)?)$/.exec(m[1].replace(/\s/g, ""));
        if (!simple) continue;                     /* 白话里写法太活，认不出来就不判 */
        const A = Number(simple[1]), B = Number(simple[2]), R = Number(m[3]);
        if (!close(B * got + R, A) || R >= B || R < 0) {
          sink.push(at + "「" + m[0] + "」算错了：" + B + "×" + got + "＋" + R +
            "＝" + (B * got + R) + "，不等于被除数 " + A);
        }
        continue;
      }
      const c = evalExpr(m[1]);
      if (!close(c, got)) {
        sink.push(at + "「" + m[0] + "」算错了：应该等于 " + Number(c.toFixed(10)));
      }
    }
    const reA = new RegExp(RE_APPROX.source, "g");
    while ((m = reA.exec(s))) {
      const c = evalExpr(m[1]);
      const got = Number(m[2]);
      const dp = (m[2].split(".")[1] || "").length;      /* 看写了几位小数，就用半位容差 */
      const tol = 0.5 * Math.pow(10, -dp) + 1e-9;
      hits += 1;
      if (counter) counter.approx += 1;
      if (Math.abs(c - got) > tol) {
        sink.push(at + "「" + m[0] + "」四舍五入不对：真值 " + Number(c.toFixed(dp + 2)) +
          "，保留 " + dp + " 位应是 " + BB.roundTo(String(c), dp));
      }
    }
    return hits;
  }

  levels.forEach((level) => {
    if (level.proseCheck === false) return;
    proseTexts(level).forEach(([at, s]) => judgeProse(at, s, eqFails, eqCount));
  });

  check(say("讲解文字里的算式都重算过（" + eqCount.exact + " 个等式 + " +
    eqCount.approx + " 个近似式）"), eqFails.length === 0, eqFails.slice(0, 8).join("\n      → "));
  check(say("讲解文字里确实写了不少算式，这条门禁不是空转"),
    eqCount.exact + eqCount.approx >= 10, "只找到 " + (eqCount.exact + eqCount.approx) + " 个");

  /* 这条门禁最容易变成「一对都没匹配到却全绿」，所以拿已知写法自测一遍：
     真错的必须报错、白话写法必须不报错、等价改写必须不判。 */
  const SELF = [
    ["1 ÷ 3 ＝ 0.333", "bad"],
    ["1 ÷ 3 ＝ 0.333…", "ok"],
    ["7 ÷ 6 ＝ 1 余 1", "ok"],
    ["7 ÷ 6 ＝ 2 余 5", "bad"],
    ["10 ÷ 3 ＝ 3，余数还是 1", "ok"],
    ["10 ÷ 3 ＝ 4，余数还是 1", "bad"],
    ["220＋0＋22000＝22220", "ok"],
    ["220＋0＋22000＝22200", "bad"],
    ["4.7×0.58 ＝ 0.47×58", "skip"],           /* 等价改写：不判 */
    ["1.5÷0.25 ＝ 150÷25", "skip"],
    ["8×12.5－0.8 ＝ 99.2", "ok"],              /* 先乘除后加减，别误报 */
    ["19.4 ÷ 12 ≈ 1.62", "ok"],
    ["19.4 ÷ 12 ≈ 1.617", "ok"],                /* 保留三位，本来就是 1.617 */
    ["19.4 ÷ 12 ≈ 1.61", "bad"],                /* 少进了一位，真该报 */
    ["1 ÷ 3 ≈ 0.34", "bad"],
  ];
  const selfBad = [];
  SELF.forEach(([s, want]) => {
    const sink = [];
    const hits = judgeProse("自测", s, sink, null);
    if (want === "skip") {
      if (hits) selfBad.push("「" + s + "」是等价改写，不该判（判了 " + hits + " 处）");
    } else if (want === "ok") {
      if (!hits) selfBad.push("「" + s + "」没匹配到（门禁漏了这种写法）");
      else if (sink.length) selfBad.push("「" + s + "」是对的却报了错：" + sink[0]);
    } else {
      if (!hits) selfBad.push("「" + s + "」是错的，却根本没匹配到");
      else if (!sink.length) selfBad.push("「" + s + "」明明算错了，门禁却没报");
    }
  });
  check(say("算式门禁自测：该抓的抓得住、白话写法不误报"),
    selfBad.length === 0, selfBad.join(" | "));
});

/* ---------------- 6. 边界与结构（bb-core 的体检） ---------------- */
PACKS.forEach((pack) => {
  const bad = BB.validateLevels(pack.levels);
  check("[" + pack.name + "] 板书全部在黑板范围内、数据完整", bad.length === 0,
    bad.slice(0, 12).join("\n      → "));
});

/* ---------------- 输出 ---------------- */
const LINE = "─".repeat(54);
console.log("粉笔小闯关 · 内容自检");
console.log(LINE);
if (fails.length) {
  fails.forEach((f) => console.log("✗ " + f));
  console.log(LINE);
}
PACKS.forEach((pack) => {
  console.log("[" + pack.name + "] 重算过的数字答案 " + pack.numericBlanks +
    " 个；文字答案 " + pack.nonNumeric + " 个；板书竖式 " + pack.specCount + " 处");
});
console.log((fails.length ? "❌ " : "✅ ") + "通过 " + pass + " 项，失败 " + fails.length + " 项");
process.exit(fails.length ? 1 : 0);
