/* ==========================================================================
 *  bb-chalk.js —— 粉笔板书引擎
 *  ------------------------------------------------------------------
 *  目标：让一块黑板上的式子「像有人拿着粉笔一个笔画一个笔画写出来」。
 *
 *  能做到的事：
 *    · 数字 / 运算符：复用 handwrite 的真实笔画路径，逐笔书写（一笔一笔落下来）
 *    · 中文：粉笔逐字「刷」出来（每字一条逐渐变宽的遮罩 + 笔尖跟随）
 *    · 竖式：一行一行写，被乘数 → 乘号 → 乘数 → 横线 → 各个部分积 → 横线 → 和
 *    · 点小数点：整数积写完后，粉笔点从右端出发，一格一格往左跳，
 *      跳一格数一位，跳到哪儿哪儿就是小数点
 *    · 末尾的 0：用粉笔斜杠划掉，再在旁边写出化简后的答案
 *    · 一直有一只手握着粉笔在写，笔尖跟着笔画走，落下粉笔灰
 *
 *  用法：
 *    const board = new Chalk.Board(document.getElementById("bbSvg"));
 *    board.load(steps);        // steps: [{text, ops}]
 *    board.goto(2);            // 前两步瞬间写好，第三步开始逐笔书写
 * ========================================================================== */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Chalk = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const W = 1280;
  const H = 720;

  const TONE = {
    chalk: "#f4f0e6",
    accent: "#ffd166",
    good: "#9ce6b0",
    warn: "#ff9f8a",
    blue: "#9fd8ff",
    muted: "#8fa49b",
    dim: "#6d817a",
  };

  /* 书写节奏（秒） */
  const BEAT = {
    stroke: 0.058,      // 单笔
    glyphMin: 0.1,
    glyphMax: 0.4,
    glyphGap: 0.022,
    hanDur: 0.19,       // 一个汉字
    hanGap: 0.016,
    opGap: 0.34,        // 同一小步里两个元素之间的停顿
    lineDur: 0.36,
    dotStep: 0.28,
    dotPause: 0.13,
    tickDur: 0.24,
    tail: 0.42,
  };

  const FULLWIDTH = {
    "＝": "=", "－": "\u2212", "＋": "+", "．": ".", "（": "(", "）": ")",
    "／": "/", "＊": "×", "·": "×", "－ ": "\u2212",
  };

  function el(tag, attrs, cls) {
    const node = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (cls) node.setAttribute("class", cls);
    return node;
  }

  function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex));
    if (!m) return [255, 255, 255];
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* ------------------------------------------------------------------ *
   *  板书元素工厂
   * ------------------------------------------------------------------ */
  const Chalk = {};

  Chalk.Board = function Board(host, options) {
    this.host = host;
    this.opt = options || {};
    this.steps = [];
    this.index = -1;
    this.raf = null;
    this.listeners = {};
    this.reduceMotion = !!this.opt.reduceMotion;
    this._build();
  };

  Chalk.Board.prototype._build = function () {
    this.host.innerHTML = "";
    const svg = el("svg", {
      viewBox: "0 0 " + W + " " + H,
      class: "bb-svg",
      role: "img",
      "aria-label": "黑板板书：小数的乘法计算过程",
      preserveAspectRatio: "xMidYMid meet",
    });
    this.svg = svg;

    const defs = el("defs");
    /* 粉笔质感：让笔画边缘毛一点，像粉笔在磨砂板上蹭过 */
    const f = el("filter", { id: "bbChalk", x: "-8%", y: "-8%", width: "116%", height: "116%" });
    const turb = el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.9", numOctaves: "2", seed: "7", result: "n" });
    const disp = el("feDisplacementMap", {
      in: "SourceGraphic", in2: "n", scale: "1.5", xChannelSelector: "R", yChannelSelector: "G",
    });
    f.appendChild(turb);
    f.appendChild(disp);
    defs.appendChild(f);

    /* 板擦擦过的痕迹：几条淡淡的方向性污痕 */
    const g1 = el("linearGradient", { id: "bbSleeve", x1: "0", y1: "0", x2: "0", y2: "1" });
    g1.appendChild(el("stop", { offset: "0", "stop-color": "#5b8fc7", "stop-opacity": "0.98" }));
    g1.appendChild(el("stop", { offset: "0.62", "stop-color": "#4f7fb5", "stop-opacity": "0.9" }));
    g1.appendChild(el("stop", { offset: "1", "stop-color": "#4f7fb5", "stop-opacity": "0" }));
    defs.appendChild(g1);
    this.sleeveGradient = g1;
    Chalk.arrowMarker(defs);

    svg.appendChild(defs);
    this.defs = defs;

    this.paper = el("g", { class: "bb-chalk-layer" });
    svg.appendChild(this.paper);

    /* 写字的手：整组挂在笔尖坐标上，指尖即粉笔尖 */
    this.nib = this._buildNib();
    svg.appendChild(this.nib);

    this.dustLayer = el("g", { class: "bb-dust" });
    svg.appendChild(this.dustLayer);

    this.host.appendChild(svg);
    this._dust = [];
  };

  Chalk.Board.prototype._buildNib = function () {
    const g = el("g", { class: "bb-nib", opacity: "0" });
    /* 袖子 + 手掌：从笔尖往下右方延伸，末端渐隐（像手臂伸到画面外） */
    g.appendChild(el("path", {
      d: "M-15,-46 L15,-46 L78,196 L-14,196 Z",
      fill: "url(#bbSleeve)",
    }));
    g.appendChild(el("path", {
      d: "M-16,-48 Q0,-56 16,-48 L13,-24 Q0,-18 -13,-24 Z",
      fill: "#f6cda9",
    }));
    g.appendChild(el("path", {
      d: "M-11,-52 Q0,-62 11,-52 L9,-38 Q0,-33 -9,-38 Z",
      fill: "#e8b891",
    }));
    /* 粉笔本体：笔尖正好在原点 */
    g.appendChild(el("path", {
      d: "M-6,-34 L-3,-6 L0,2 L3,-6 L6,-34 Z",
      fill: "#fbf8f0", stroke: "#c9c2b2", "stroke-width": "0.9",
    }));
    const tip = el("circle", { cx: "0", cy: "0", r: "2.2", fill: "#fffdf6" });
    g.appendChild(tip);
    g.tip = tip;
    return g;
  };

  /* ------------------------------------------------------------------ *
   *  编译：把一步讲解里的声明展开成「一串按时间排好的书写单元」
   * ------------------------------------------------------------------ */
  /* 板书分两个「区」：
   *   work —— 竖式、点小数点、划零这些「算式本体」，会一直留在板上
   *   text —— 左边的讲解文字，讲到下一步时就擦掉重写
   * 这正是老师在黑板上的做法：例题留着，讲解写完就擦。 */
  const WORK_KINDS = { vcalc: 1, pointjump: 1 };

  Chalk.Board.prototype.load = function (steps) {
    const self = this;
    this.clear();
    this.steps = (steps || []).map(function (step) {
      const flat = [];
      (step.ops || []).forEach(function (op) {
        const work = !!WORK_KINDS[op.k];
        const inner = work
          ? (op.k === "vcalc" ? BB.expandVcalc(op.spec).ops : BB.expandPointJump(op.spec).ops)
          : [op];
        inner.forEach(function (o) {
          o.zone = work ? "work" : "text";
          flat.push(o);
        });
      });
      const built = self._compile(flat);
      built.forEach(function (b) { self.paper.appendChild(b.node); });
      return {
        text: step.text || "", tip: step.tip || "",
        clear: !!step.clear, keep: !!step.keep, ops: built,
      };
    });
    return this.steps.length;
  };

  Chalk.Board.prototype._compile = function (ops) {
    const self = this;
    const out = [];
    let t = 0;
    ops.forEach(function (op) {
      const built = Chalk.buildOp(op, t, self.defs);
      built.zone = op.zone || "text";
      if (!built.units.length) return;
      t = built.end + BEAT.opGap;
      out.push(built);
    });
    return out;
  };

  /* ------------------------------------------------------------------ *
   *  单个 op → DOM 节点 + 书写时间表
   * ------------------------------------------------------------------ */
  Chalk.buildOp = function (op, startAt, defs) {
    const size = op.size || 30;
    const tone = TONE[op.tone] || TONE.chalk;
    const scale = size / BB.GLYPH_BOX;
    /* 把 op 的标签留在 DOM 上：截图核位、自检报错、控制台排查都用得上 */
    const group = el("g", {
      class: "bb-op bb-op-" + op.k,
      "data-tag": op.tag || op.k,
      "data-text": op.text == null ? "" : String(op.text),
    });
    const units = [];
    const ctx = { group: group, size: size, tone: tone, scale: scale, start: startAt, units: units, defs: defs };

    if (op.k === "cn") {
      buildHan(ctx, op);
    } else if (op.k === "num" || op.k === "formula") {
      buildGlyphs(ctx, op);
    } else if (op.k === "line") {
      buildLine(ctx, op);
    } else if (op.k === "rect" || op.k === "box") {
      buildRect(ctx, op);
    } else if (op.k === "circle") {
      buildCircle(ctx, op);
    } else if (op.k === "arrow") {
      buildArrow(ctx, op);
    } else if (op.k === "dot") {
      buildDot(ctx, op);
    } else if (op.k === "tick") {
      buildTick(ctx, op);
    }

    let end = startAt;
    units.forEach(function (u) { end = Math.max(end, u.start + u.dur); });
    return { op: op, node: group, units: units, start: startAt, end: end };
  };

  function cellPositions(op) {
    if (op.layout && op.layout.length) return op.layout;
    if (op.rightX != null) {
      return BB.layoutRight(op.text, op.rightX, op.size || 30).map(function (c) {
        return { ch: c.ch, x: c.x, w: c.w };
      });
    }
    const scale = (op.size || 30) / BB.GLYPH_BOX;
    let x = op.x || 0;
    const out = [];
    Array.from(String(op.text)).forEach(function (ch) {
      const w = BB.advanceOf(ch) * scale;
      out.push({ ch: ch, x: x, w: w });
      x += w;
    });
    return out;
  }

  function buildGlyphs(ctx, op) {
    const text = String(op.text || "");
    const hw = BB.engine();
    const glyphs = hw ? hw.GLYPH : {};
    const cells = cellPositions(op);
    const blanks = op.blanks || [];
    let t = ctx.start;

    cells.forEach(function (cell, index) {
      if (blanks.indexOf(index) >= 0) {
        const box = el("rect", {
          x: (cell.x - 1).toFixed(1), y: (op.y + ctx.size * 0.08).toFixed(1),
          width: (Math.max(cell.w, ctx.size * 0.56) + 2).toFixed(1),
          height: (ctx.size * 0.92).toFixed(1), rx: "5",
          fill: "none", stroke: TONE.dim, "stroke-width": "1.6", "stroke-dasharray": "6 5",
        });
        box.style.opacity = "0";
        ctx.group.appendChild(box);
        ctx.units.push({ kind: "fade", node: box, start: t, dur: 0.26 });
        t += 0.26 + BEAT.glyphGap;
        return;
      }

      const ch = FULLWIDTH[cell.ch] || cell.ch;
      const strokes = glyphs[ch];
      if (!strokes) {
        /* 没收录的字形（生僻符号）退回文字，同样按笔画节奏淡入 */
        const node = el("text", {
          x: (cell.x + cell.w / 2).toFixed(1), y: (op.y + ctx.size * 0.78).toFixed(1),
          "text-anchor": "middle", "font-size": (ctx.size * 0.9).toFixed(1),
          "font-weight": "600", fill: ctx.tone,
        });
        node.textContent = ch;
        node.style.opacity = "0";
        ctx.group.appendChild(node);
        ctx.units.push({ kind: "fade", node: node, start: t, dur: 0.24 });
        t += 0.24 + BEAT.glyphGap;
        return;
      }

      const cellGroup = el("g", {
        transform: "translate(" + cell.x.toFixed(2) + "," + op.y.toFixed(2) + ") scale(" + ctx.scale.toFixed(4) + ")",
      });
      const strokesPer = strokes.length;
      const dur = Math.min(BEAT.glyphMax, Math.max(BEAT.glyphMin, strokesPer * BEAT.stroke));
      const each = dur / strokesPer;
      strokes.forEach(function (d, i) {
        const path = el("path", {
          d: d, fill: "none", stroke: ctx.tone,
          "stroke-width": "4.6", "stroke-linecap": "round", "stroke-linejoin": "round",
        });
        cellGroup.appendChild(path);
        ctx.units.push({
          kind: "stroke",
          node: path,
          start: t + i * each,
          dur: each * 1.35,
          origin: { x: cell.x, y: op.y, s: ctx.scale },
          needsLength: true,
        });
      });
      ctx.group.appendChild(cellGroup);
      t += dur + BEAT.glyphGap;
    });

    ctx.baseline = op.y + ctx.size * 0.72;
  }

  let ClipSeq0 = 0;
  function nextClipId() { ClipSeq0 += 1; return "bbclip-" + ClipSeq0; }

  /* 判断是不是「占一个全角格」的字符：汉字、全角标点、假名、谚文都算 */
  function isWideChar(ch) {
    const c = ch.codePointAt(0);
    return (c >= 0x1100 && c <= 0x115f)
      || (c >= 0x2e80 && c <= 0x303e)
      || (c >= 0x3041 && c <= 0x33ff)
      || (c >= 0x3400 && c <= 0x4dbf)
      || (c >= 0x4e00 && c <= 0x9fff)
      || (c >= 0xa000 && c <= 0xa4cf)
      || (c >= 0xac00 && c <= 0xd7a3)
      || (c >= 0xf900 && c <= 0xfaff)
      || (c >= 0xfe30 && c <= 0xfe6f)
      || (c >= 0xff00 && c <= 0xff60)
      || (c >= 0xffe0 && c <= 0xffe6);
  }

  /**
   * 粉笔写中文：一个字一个字「刷」出来。
   * 汉字占一个全角格；夹在里面的数字、小数点、运算符号按实际宽度排，
   * 否则「0.72 × 5 表示什么？」会被排成「0 . 7 2 × 5 …」，空格大得离谱。
   */
  function buildHan(ctx, op) {
    const size = ctx.size;
    let t = ctx.start;
    Array.from(String(op.text || "")).forEach(function (ch) {
      const x = ctx.cursor == null ? (op.x || 0) : ctx.cursor;
      if (ch === " ") { ctx.cursor = x + size * 0.34; t += size * 0.22; return; }

      const wide = isWideChar(ch);
      const adv = wide ? size : BB.advanceOf(ch) * size / BB.GLYPH_BOX;
      /* 遮罩比字宽留一点余量：英数字形可能比字宽表略宽，宁可多刷一点也不能切掉 */
      const pad = adv * 0.07;

      const clipId = nextClipId();
      const clip = el("clipPath", { id: clipId });
      const rect = el("rect", {
        x: (x - pad).toFixed(1), y: (op.y - size * 0.1).toFixed(1),
        width: "0", height: (size * 1.3).toFixed(1),
      });
      clip.appendChild(rect);
      if (ctx.defs) ctx.defs.appendChild(clip);
      const node = el("text", {
        x: x.toFixed(1), y: (op.y + size * 0.8).toFixed(1),
        "font-size": (wide ? size * 0.98 : size * 0.94).toFixed(1), fill: ctx.tone,
        "clip-path": "url(#" + clipId + ")",
      });
      node.textContent = ch;
      ctx.group.appendChild(node);
      ctx.units.push({
        kind: "wipe", node: node, clip: rect, start: t, dur: BEAT.hanDur,
        x: x - pad, w: adv + pad * 2, baseline: op.y + size * 0.8,
      });
      ctx.cursor = x + adv;
      t += BEAT.hanDur + BEAT.hanGap;
    });
    ctx.baseline = op.y + size * 0.8;
  }

  function buildLine(ctx, op) {
    const node = el("line", {
      x1: op.x1, y1: op.y, x2: op.x2, y2: op.y,
      stroke: ctx.tone, "stroke-width": op.weight || 3.2, "stroke-linecap": "round",
    });
    ctx.group.appendChild(node);
    ctx.units.push({ kind: "stroke", node: node, start: ctx.start, dur: BEAT.lineDur, needsLength: true });
    ctx.baseline = op.y;
  }

  function buildRect(ctx, op) {
    const node = el("rect", {
      x: op.x, y: op.y, width: op.w, height: op.h,
      rx: op.rx == null ? 8 : op.rx, fill: op.k === "box" ? "none" : (op.fill || "none"),
      stroke: ctx.tone, "stroke-width": op.weight || 2.6,
      "stroke-dasharray": op.k === "box" ? "9 7" : "none",
    });
    ctx.group.appendChild(node);
    ctx.units.push({ kind: "stroke", node: node, start: ctx.start, dur: 0.42, needsLength: true });
  }

  function buildCircle(ctx, op) {
    const node = el("ellipse", {
      cx: op.cx == null ? op.x : op.cx,
      cy: op.cy == null ? op.y : op.cy,
      rx: op.rx == null ? op.r : op.rx,
      ry: op.ry == null ? (op.r == null ? 20 : op.r) : op.ry,
      fill: "none", stroke: ctx.tone, "stroke-width": op.weight || 2.6,
    });
    ctx.group.appendChild(node);
    ctx.units.push({ kind: "stroke", node: node, start: ctx.start, dur: 0.5, needsLength: true });
  }

  function buildArrow(ctx, op) {
    const node = el("line", {
      x1: op.x1, y1: op.y1, x2: op.x2, y2: op.y2,
      stroke: ctx.tone, "stroke-width": op.weight || 2.6, "stroke-linecap": "round",
      "marker-end": "url(#bbArrowHead)",
    });
    ctx.group.appendChild(node);
    ctx.units.push({ kind: "stroke", node: node, start: ctx.start, dur: 0.3, needsLength: true });
  }

  function buildTick(ctx, op) {
    const size = op.size || 40;
    const node = el("line", {
      x1: (op.x - size * 0.08).toFixed(1), y1: (op.y + size * 0.94).toFixed(1),
      x2: (op.x + size * 0.7).toFixed(1), y2: (op.y + size * 0.04).toFixed(1),
      stroke: TONE.warn, "stroke-width": "3.4", "stroke-linecap": "round",
    });
    ctx.group.appendChild(node);
    ctx.units.push({ kind: "stroke", node: node, start: ctx.start, dur: BEAT.tickDur, needsLength: true });
  }

  function buildDot(ctx, op) {
    const r = Math.max(3.4, (op.size || 58) * 0.062);
    const node = el("circle", { cx: op.x0, cy: op.y, r: r, fill: TONE.accent });
    node.style.opacity = "0";
    ctx.group.appendChild(node);
    const label = el("text", {
      x: op.x0, y: op.y - r - 8, "text-anchor": "middle",
      "font-size": (r * 3.6).toFixed(1), fill: TONE.blue,
    });
    label.style.opacity = "0";
    ctx.group.appendChild(label);
    ctx.units.push({
      kind: "dot", node: node, label: label, cx: op.x0, cy: op.y, r: r,
      from: op.x0, to: op.x1, stops: Math.max(1, op.stops || 1),
      start: ctx.start, dur: (op.stops || 1) * (BEAT.dotStep + BEAT.dotPause) + 0.3,
    });
  }

  /* ------------------------------------------------------------------ *
   *  粉笔灰
   * ------------------------------------------------------------------ */
  Chalk.Board.prototype._spray = function (x, y, amount) {
    if (this.reduceMotion) return;
    for (let i = 0; i < amount; i += 1) {
      if (this._dust.length > 90) break;
      const p = el("circle", {
        cx: x.toFixed(1), cy: y.toFixed(1),
        r: (0.8 + Math.random() * 1.7).toFixed(2),
        fill: "#fdfbf3", opacity: (0.32 + Math.random() * 0.3).toFixed(2),
      });
      this.dustLayer.appendChild(p);
      const a = Math.random() * Math.PI * 2;
      const sp = 6 + Math.random() * 22;
      this._dust.push({
        node: p, x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 + 6,
        life: 0.5 + Math.random() * 0.45, age: 0,
      });
    }
  };

  Chalk.Board.prototype._ageDust = function (dt) {
    for (let i = this._dust.length - 1; i >= 0; i -= 1) {
      const d = this._dust[i];
      d.age += dt;
      if (d.age >= d.life) { d.node.remove(); this._dust.splice(i, 1); continue; }
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 34 * dt;
      d.node.setAttribute("cx", d.x.toFixed(1));
      d.node.setAttribute("cy", d.y.toFixed(1));
      d.node.setAttribute("opacity", String(0.5 * (1 - d.age / d.life)));
    }
  };

  /* ------------------------------------------------------------------ *
   *  播放
   * ------------------------------------------------------------------ */
  function applyStatic(unit) {
    if (unit.kind === "stroke") {
      unit.node.style.opacity = "1";
      unit.node.style.strokeDasharray = "none";
      unit.node.style.strokeDashoffset = "0";
    } else if (unit.kind === "fade") {
      unit.node.style.opacity = "1";
    } else if (unit.kind === "wipe") {
      unit.node.style.opacity = "1";
      unit.clip.setAttribute("width", unit.w.toFixed(1));
    } else if (unit.kind === "dot") {
      unit.node.style.opacity = "1";
      unit.node.setAttribute("cx", unit.to.toFixed(1));
      unit.label.style.opacity = "0";
    }
  }

  function prepareHidden(unit) {
    if (unit.kind === "stroke") {
      let L = 120;
      try { L = unit.node.getTotalLength(); } catch (e) { L = 120; }
      unit.L = L;
      unit.node.style.strokeDasharray = L + " " + L;
      unit.node.style.strokeDashoffset = L;
      unit.node.style.opacity = "1";
    } else if (unit.kind === "fade") {
      unit.node.style.opacity = "0";
    } else if (unit.kind === "wipe") {
      unit.node.style.opacity = "1";
      unit.clip.setAttribute("width", "0");
    } else if (unit.kind === "dot") {
      unit.node.style.opacity = "1";
      unit.node.setAttribute("cx", unit.from.toFixed(1));
      unit.label.style.opacity = "0";
    }
  }

  /**
   * 显示到第 index 步（含）；最后一步逐笔书写，之前的直接写好。
   *
   * 一屏的范围由 keep 决定：往回走，只要某一步标了 keep，它就和前一步同屏
   * （用来「接着上一屏的竖式继续写」）。同屏之内，比本步早的「左边文字」
   * 会被擦掉，只留算式本体 —— 和老师擦掉讲解、保住例题是一回事。
   */
  Chalk.Board.prototype.goto = function (index, opts) {
    const o = opts || {};
    this.cancel();
    index = Math.max(-1, Math.min(this.steps.length - 1, index));
    this.index = index;

    let from = index;
    while (from > 0 && this.steps[from].keep) from -= 1;
    if (index < 0) from = 0;

    const current = index >= 0 ? this.steps[index] : null;
    const curHasText = !!(current && current.ops.some(function (b) { return b.zone === "text"; }));

    /* 第一遍：先把显隐定下来。getTotalLength 需要元素真的参与布局，
       所以必须先让本步可见、再强制一次布局，第二遍才量长度。 */
    for (let s = 0; s < this.steps.length; s += 1) {
      const inScene = s >= from && s <= index;
      const isCurrent = s === index;
      this.steps[s].ops.forEach(function (built) {
        let show = inScene;
        if (show && !isCurrent && built.zone === "text" && curHasText) show = false;
        built.node.style.display = show ? "" : "none";
      });
    }
    void this.paper.getBoundingClientRect();

    /* 第二遍：已经写过的直接给终态，本步准备好待书写 */
    for (let s = Math.max(0, from); s <= index; s += 1) {
      const played = s < index;
      const active = s === index;
      this.steps[s].ops.forEach(function (built) {
        if (built.node.style.display === "none") return;
        built.units.forEach(function (unit) {
          if (played || (active && o.instant)) applyStatic(unit);
          else if (active) prepareHidden(unit);
        });
      });
    }

    this.emit("step", { index: index, step: this.steps[index], from: from });
    if (index < 0 || o.instant) {
      this.nib.setAttribute("opacity", "0");
      this.emit("done", { index: index });
      return 0;
    }
    return this._run(this.steps[index], o);
  };

  Chalk.Board.prototype._run = function (step, opts) {
    const self = this;
    step.ops.forEach(function (b) { b.node.style.display = ""; });
    const units = [];
    step.ops.forEach(function (b) { b.units.forEach(function (u) { units.push(u); }); });

    const reduced = this.reduceMotion || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (reduced) {
      units.forEach(applyStatic);
      const last = units.length ? units[units.length - 1] : null;
      this.nib.setAttribute("opacity", "0");
      setTimeout(function () { self.emit("done", { index: self.index }); }, 60);
      return last ? (last.start + last.dur) * 1000 : 0;
    }

    const total = units.reduce(function (m, u) { return Math.max(m, u.start + u.dur); }, 0) + BEAT.tail;
    const T0 = performance.now();
    let lastFrame = T0;
    const speed = opts && opts.speed ? opts.speed : 1;
    let dustAcc = 0;

    function frame(now) {
      const dt = Math.min(0.06, (now - lastFrame) / 1000);
      lastFrame = now;
      const t = ((now - T0) / 1000) * speed;
      let active = null;
      let activeP = 0;

      units.forEach(function (u) {
        const p = (t - u.start) / u.dur;
        if (u.kind === "fade") {
          u.node.style.opacity = String(clamp01(p));
          if (p > 0 && p < 1 && !active) { active = u; activeP = p; }
          return;
        }
        if (u.kind === "wipe") {
          u.clip.setAttribute("width", (clamp01(p) * u.w).toFixed(1));
          if (p > 0 && p < 1 && !active) { active = u; activeP = p; }
          return;
        }
        if (u.kind === "stroke") {
          if (p <= 0) { u.node.style.strokeDashoffset = String(u.L); return; }
          if (p >= 1) { u.node.style.strokeDashoffset = "0"; return; }
          u.node.style.strokeDashoffset = String(u.L * (1 - p));
          if (!active) { active = u; activeP = p; }
          return;
        }
        if (u.kind === "dot") {
          const span = u.stops;
          const one = 1 / (span + 0.55);
          if (p <= 0) { u.node.style.opacity = "0"; u.label.style.opacity = "0"; return; }
          if (p >= 1) {
            u.node.setAttribute("cx", u.to.toFixed(1));
            u.label.style.opacity = "0";
            return;
          }
          u.node.style.opacity = "1";
          const slot = Math.min(span, Math.floor(p / one));
          const local = Math.min(1, (p - slot * one) / one);
          const eased = easeOut(local);
          const x = u.from + (u.to - u.from) * ((slot + eased) / span);
          u.node.setAttribute("cx", x.toFixed(1));
          const pausing = local > 0.78 || slot === 0;
          u.label.setAttribute("x", (x - 12).toFixed(1));
          u.label.textContent = slot === 0 ? "" : String(slot);
          u.label.style.opacity = pausing && slot > 0 ? "1" : "0.35";
          if (!active) { active = u; activeP = local; }
        }
      });

      self._ageDust(dt);

      /* 笔尖与粉笔灰 */
      if (active) {
        let px = null, py = null;
        if (active.kind === "stroke" && active.origin) {
          try {
            const pt = active.node.getPointAtLength(active.L * activeP);
            px = active.origin.x + pt.x * active.origin.s;
            py = active.origin.y + pt.y * active.origin.s;
          } catch (e) { /* 个别浏览器在未渲染时取不到长度 */ }
        } else if (active.kind === "wipe") {
          px = active.x + activeP * active.w;
          py = active.baseline;
        } else if (active.kind === "dot") {
          px = parseFloat(active.node.getAttribute("cx"));
          py = active.cy;
        } else if (active.kind === "stroke") {
          try {
            const pt = active.node.getPointAtLength(active.L * activeP);
            px = pt.x; py = pt.y;
          } catch (e) { /* 同上 */ }
        }
        if (px != null) {
          self.nib.setAttribute("transform", "translate(" + px.toFixed(1) + "," + py.toFixed(1) + ")");
          self.nib.setAttribute("opacity", "1");
          dustAcc += dt;
          if (dustAcc > 0.045) { dustAcc = 0; self._spray(px, py, 2); }
        }
      } else {
        self.nib.setAttribute("opacity", "0");
      }

      if (t < total) self.raf = requestAnimationFrame(frame);
      else {
        self.nib.setAttribute("opacity", "0");
        self.raf = null;
        self.emit("done", { index: self.index });
      }
    }
    this.raf = requestAnimationFrame(frame);
    return total * 1000;
  };

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function easeOut(v) { return 1 - Math.pow(1 - v, 2.2); }

  Chalk.Board.prototype.cancel = function () {
    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
  };

  Chalk.Board.prototype.next = function () { return this.goto(this.index + 1); };
  Chalk.Board.prototype.prev = function () { return this.goto(Math.max(0, this.index - 1), { instant: true }); };
  Chalk.Board.prototype.first = function () { return this.goto(0); };
  Chalk.Board.prototype.replay = function () { return this.goto(this.index); };
  Chalk.Board.prototype.atEnd = function () { return this.index >= this.steps.length - 1; };

  Chalk.Board.prototype.clear = function () {
    this.cancel();
    while (this.paper.firstChild) this.paper.removeChild(this.paper.firstChild);
    while (this.dustLayer.firstChild) this.dustLayer.removeChild(this.dustLayer.firstChild);
    this._dust = [];
    this.steps = [];
    this.index = -1;
  };

  /** 不播放，直接静态画好一组 op（练习题的竖式背景用） */
  Chalk.Board.prototype.static = function (ops) {
    this.clear();
    const self = this;
    let t = 0;
    const built = [];
    (ops || []).forEach(function (op) {
      let list = [op];
      if (op.k === "vcalc") list = BB.expandVcalc(op.spec).ops;
      if (op.k === "pointjump") list = BB.expandPointJump(op.spec).ops;
      list.forEach(function (o) {
        const b = Chalk.buildOp(o, t, self.defs);
        t = b.end + BEAT.opGap;
        built.push(b);
      });
    });
    built.forEach(function (b) {
      self.paper.appendChild(b.node);
      b.units.forEach(applyStatic);
    });
    this.nib.setAttribute("opacity", "0");
    return built;
  };

  Chalk.Board.prototype.on = function (name, fn) {
    (this.listeners[name] = this.listeners[name] || []).push(fn);
    return this;
  };
  Chalk.Board.prototype.emit = function (name, payload) {
    (this.listeners[name] || []).forEach(function (fn) { fn(payload); });
  };

  /* 箭头标记由外部在实例上追加，这里补一个全局兜底 */
  Chalk.arrowMarker = function (defs) {
    const m = el("marker", {
      id: "bbArrowHead", viewBox: "0 0 10 10", refX: "8", refY: "5",
      markerWidth: "6", markerHeight: "6", orient: "auto-start-reverse",
    });
    m.appendChild(el("path", { d: "M0,1 L9,5 L0,9 z", fill: TONE.accent }));
    defs.appendChild(m);
    return m;
  };

  Chalk.TONE = TONE;
  Chalk.BEAT = BEAT;
  Chalk.W = W;
  Chalk.H = H;
  return Chalk;
});
