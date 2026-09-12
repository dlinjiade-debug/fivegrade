/* ===== 单元七 · 多边形的面积 ===== */
Math5.initUnitPage("unit7", "单元七 · 多边形的面积");

/* ---------- 网格画板 ---------- */
const C = 34;
const BLUE = { fill: "#2f6fb0", stroke: "#1b4a7a" };
const GREEN = { fill: "#3f8f7a", stroke: "#2f7d6b" };
const CUT = { fill: "#e8943a", stroke: "#c07422" };
const GHOST = { fill: "#cfd8dd", stroke: "#a8b4bb", op: 0.55 };
const INK = "#37474f";

function P(pts, o) {
  const s = pts.map(p => (p[0] * C).toFixed(1) + "," + (p[1] * C).toFixed(1)).join(" ");
  return '<polygon points="' + s + '" fill="' + o.fill + '" opacity="' + (o.op || 0.9) +
    '" stroke="' + o.stroke + '" stroke-width="2"/>';
}
function board(w, h, inner) {
  const W = w * C, H = h * C;
  let s = '<svg width="' + (W * 1.45).toFixed(0) + '" height="' + (H * 1.45).toFixed(0) + '" viewBox="0 0 ' + W + " " + H + '" style="max-width:100%">';
  s += '<rect width="' + W + '" height="' + H + '" fill="#fbfcfd"/>';
  for (let i = 0; i <= w; i++) s += '<line x1="' + i * C + '" y1="0" x2="' + i * C + '" y2="' + H + '" stroke="#e9eef0"/>';
  for (let j = 0; j <= h; j++) s += '<line x1="0" y1="' + j * C + '" x2="' + W + '" y2="' + j * C + '" stroke="#e9eef0"/>';
  return s + (inner || "") + "</svg>";
}
function dash(pts, closed) {
  const d = pts.map(p => (p[0] * C).toFixed(1) + "," + (p[1] * C).toFixed(1)).join(" ") + (closed ? " Z" : "");
  return '<polyline points="' + d + '" fill="none" stroke="#d9483f" stroke-width="2.4" stroke-dasharray="7 5"/>';
}
function txt(x, y, t, color, size) {
  return '<text x="' + x * C + '" y="' + y * C + '" font-size="' + (size || 16) + '" fill="' + color +
    '" font-weight="bold" text-anchor="middle">' + t + "</text>";
}
function dimH(x1, x2, y, label, color) {
  const a = x1 * C, b = x2 * C, yy = y * C;
  color = color || INK;
  return '<line x1="' + a + '" y1="' + yy + '" x2="' + b + '" y2="' + yy + '" stroke="' + color + '" stroke-width="2"/>' +
    '<line x1="' + a + '" y1="' + (yy - 6) + '" x2="' + a + '" y2="' + (yy + 6) + '" stroke="' + color + '" stroke-width="2"/>' +
    '<line x1="' + b + '" y1="' + (yy - 6) + '" x2="' + b + '" y2="' + (yy + 6) + '" stroke="' + color + '" stroke-width="2"/>' +
    '<text x="' + ((a + b) / 2) + '" y="' + (yy - 9) + '" font-size="16" fill="' + color + '" font-weight="bold" text-anchor="middle">' + label + "</text>";
}
function dimV(y1, y2, x, label, color) {
  const a = y1 * C, b = y2 * C, xx = x * C;
  color = color || INK;
  return '<line x1="' + xx + '" y1="' + a + '" x2="' + xx + '" y2="' + b + '" stroke="' + color + '" stroke-width="2"/>' +
    '<line x1="' + (xx - 6) + '" y1="' + a + '" x2="' + (xx + 6) + '" y2="' + a + '" stroke="' + color + '" stroke-width="2"/>' +
    '<line x1="' + (xx - 6) + '" y1="' + b + '" x2="' + (xx + 6) + '" y2="' + b + '" stroke="' + color + '" stroke-width="2"/>' +
    '<text x="' + (xx + 10) + '" y="' + ((a + b) / 2 + 5) + '" font-size="16" fill="' + color + '" font-weight="bold">' + label + "</text>";
}
function rotPts(pts, c, deg) {
  const r = (deg * Math.PI) / 180;
  return pts.map(p => {
    const x = p[0] - c[0], y = p[1] - c[1];
    return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)];
  });
}

/* ---------- 跟我学 ---------- */
let stepper = null;
const stage = document.getElementById("demoStage");
const demoBtns = document.getElementById("demoBtns");

/* ---- 手写公式辅助 ---- */
function F(text, color) { return { text: text, color: color || "ink", anim: true }; }
function hwCard(items, size) {
  const card = document.createElement("div");
  card.className = "hw-card";
  HW.write(card, items, { size: size || 46 });
  return card;
}

/* 演示 1：平行四边形 → 割补成长方形 */
function demoPara() {
  const para = [[1, 2], [7, 2], [9, 5], [3, 5]];
  const cut = [[7, 2], [9, 5], [7, 5]];        // 右边剪下的三角形
  const rest = [[1, 2], [7, 2], [7, 5], [3, 5]]; // 剪掉后剩下的部分
  const steps = [{
    explain: "<b>平行四边形的面积怎么算？</b>先量一量：底是 <b>6 格</b>，高是 <b>3 格</b>（高要和底<b>垂直</b>）。",
    render(el) {
      el.innerHTML = board(11, 6, P(para, BLUE) + dash([[7, 2], [7, 5]]) + dimH(1, 7, 1.7, "底 6", "#1b4a7a") + dimV(2, 5, 9.6, "高 3", "#d9483f"));
    },
  }, {
    explain: "<b>沿这条高剪一刀！</b>把右边的三角形剪下来——它要搬到左边去。",
    render(el) {
      el.innerHTML = board(11, 6, P(para, BLUE) + P(cut, CUT) + dash([[7, 2], [7, 5]]));
    },
  }];
  [-2, -4, -6].forEach((dx, i) => {
    const moved = cut.map(p => [p[0] + dx, p[1]]);
    const last = dx === -6;
    steps.push({
      explain: last
        ? "<b>拼好了！</b>三角形搬到左边，正好拼成一个<b>长方形</b>。"
        : "<b>把三角形向左平移……</b>第 " + (i + 1) + " 步。",
      render(el) {
        el.innerHTML = board(11, 6, P(rest, BLUE) + P(moved, CUT) + dash([[7, 2], [7, 5]]));
      },
    });
  });
  steps.push({
    explain: "<b>看清楚对应关系：</b>长方形的<b>长 = 平行四边形的底（6）</b>，长方形的<b>宽 = 平行四边形的高（3）</b>。<br>" +
      "所以：平行四边形的面积 = <b>底 × 高</b>。公式像板书一样写出来：",
    render(el) {
      el.innerHTML = board(11, 6,
        P([[1, 2], [7, 2], [7, 5], [1, 5]], BLUE) +
        dimH(1, 7, 1.7, "长 6（=底）", "#1b4a7a") + dimV(2, 5, 7.6, "宽 3（=高）", "#d9483f"));
      el.appendChild(hwCard([
        F("S", "blue"), F(" = ", "op"), F("a", "green"), F(" × ", "op"), F("h", "purple"),
        F(" = ", "op"), F("6 × 3", "ink"), F(" = ", "op"), F("18", "green"),
      ]));
    },
  });
  steps.push({
    explain: "<b>数一数验证：</b>这个长方形正好占 <b>18 个小方格</b>，和算出来的 18 完全一样！<br>" +
      "公式记牢：<b>S = 底 × 高</b>（注意：不是底 × 斜边！）",
    render(el) {
      el.innerHTML = board(11, 7,
        P([[1, 2], [7, 2], [7, 5], [1, 5]], GREEN) + txt(4, 6.6, "18 个方格 = 18", "#2f7d6b", 17));
      el.appendChild(hwCard([F("S", "blue"), F(" = ", "op"), F("a", "green"), F(" × ", "op"), F("h", "purple")], 52));
    },
  });
  return steps;
}

/* 演示 2：两个完全一样的三角形拼成平行四边形 */
function demoTri() {
  const tri = [[1, 2], [7, 2], [1, 5]];
  const c = [4, 3.5];
  const steps = [{
    explain: "<b>三角形的面积怎么算？</b>拿两个<b>完全一样</b>的三角形来拼一拼。这个三角形：底 <b>6 格</b>，高 <b>3 格</b>。",
    render(el) {
      el.innerHTML = board(11, 6, P(tri, BLUE) + dimH(1, 7, 1.7, "底 6", "#1b4a7a") + dimV(2, 5, 0.7, "高 3", "#d9483f"));
    },
  }];
  [60, 120, 180].forEach(deg => {
    const cp = rotPts(tri, c, deg);
    steps.push({
      explain: deg === 180
        ? "<b>转了 180°，拼好了！</b>两个完全一样的三角形拼成一个<b>平行四边形</b>（这里正好是长方形）。"
        : "<b>把第二个三角形转 " + deg + "°……</b>绕着中心点旋转，边和边要完全对齐。",
      render(el) {
        el.innerHTML = board(11, 6, P(tri, BLUE) + P(cp, GREEN) + '<circle cx="' + c[0] * C + '" cy="' + c[1] * C + '" r="4" fill="#d9483f"/>');
      },
    });
  });
  steps.push({
    explain: "<b>拼成的长方形：</b>长 <b>6</b>（=三角形的底），宽 <b>3</b>（=三角形的高），面积 6 × 3 = 18。" +
      "它是两个三角形拼的，所以一个三角形要 <b>÷ 2</b>。公式写出来：",
    render(el) {
      el.innerHTML = board(11, 7,
        P(tri, BLUE) + P(rotPts(tri, c, 180), GREEN) +
        dimH(1, 7, 1.7, "6（=底）", "#1b4a7a") + dimV(2, 5, 7.6, "3（=高）", "#d9483f"));
      el.appendChild(hwCard([
        F("S", "blue"), F(" = ", "op"), F("a", "green"), F(" × ", "op"), F("h", "purple"), F(" ÷ 2", "red"),
        F(" = ", "op"), F("6 × 3 ÷ 2", "ink"), F(" = ", "op"), F("9", "green"),
      ]));
    },
  });
  return steps;
}

/* 演示 3：两个完全一样的梯形拼成平行四边形 */
function demoTrap() {
  const trap = [[3, 4], [7, 4], [9, 7], [1, 7]];
  const c = [8, 5.5]; // 右腰中点：副本旋转 180° 后与原图共边
  const steps = [{
    explain: "<b>梯形的面积怎么算？</b>还是老办法——拿两个<b>完全一样</b>的梯形来拼。<br>" +
      "这个梯形：上底 <b>4</b>，下底 <b>8</b>，高 <b>3</b>。",
    render(el) {
      el.innerHTML = board(17, 9, P(trap, BLUE) +
        dimH(3, 7, 3.7, "上底 4", "#1b4a7a") + dimH(1, 9, 7.7, "下底 8", "#1b4a7a") +
        dimV(4, 7, 0.7, "高 3", "#d9483f"));
    },
  }];
  [150, 165, 180].forEach(deg => {
    const cp = rotPts(trap, c, deg);
    steps.push({
      explain: deg === 180
        ? "<b>拼好了！</b>两个梯形拼成一个大<b>平行四边形</b>：底 = <b>上底 + 下底 = 4 + 8 = 12</b>，高还是 <b>3</b>。"
        : "<b>让第二个梯形绕右腰中点旋转 " + deg + "°……</b>",
      render(el) {
        el.innerHTML = board(17, 9, P(trap, BLUE) + P(cp, GREEN) + '<circle cx="' + c[0] * C + '" cy="' + c[1] * C + '" r="4" fill="#d9483f"/>');
      },
    });
  });
  steps.push({
    explain: "<b>大平行四边形面积：</b>（4 + 8）× 3 = 36；它是两个梯形拼的，所以一个梯形：36 ÷ 2 = 18。<br>" +
      "梯形公式最重要，一步步写出来：",
    render(el) {
      el.innerHTML = board(17, 9,
        P(trap, BLUE) + P(rotPts(trap, c, 180), GREEN) +
        dimH(3, 15, 3.7, "4 + 8 = 12", "#1b4a7a") + dimV(4, 7, 15.5, "高 3", "#d9483f"));
      el.appendChild(hwCard([
        F("S", "blue"), F(" = ", "op"), F("(a + b)", "green"), F(" × ", "op"), F("h", "purple"), F(" ÷ 2", "red"),
        F(" = ", "op"), F("(4 + 8) × 3 ÷ 2", "ink"), F(" = ", "op"), F("18", "green"),
      ], 42));
    },
  });
  return steps;
}

/* 演示 4：组合图形 —— 分成两块 */
function demoCombo() {
  const L = [[1, 1], [7, 1], [7, 3], [4, 3], [4, 5], [1, 5]];
  const A = [[1, 1], [7, 1], [7, 3], [1, 3]];
  const B = [[1, 3], [4, 3], [4, 5], [1, 5]];
  const outline = P(L, BLUE);
  return [
    {
      explain: "<b>组合图形怎么算？</b>这个「L 形」没法直接套公式——先把它<b>分成两个长方形</b>。",
      render(el) { el.innerHTML = board(9, 6, outline); },
    },
    {
      explain: "<b>画一条分割线。</b>沿着这条虚线，图形被分成上下两块。",
      render(el) { el.innerHTML = board(9, 6, outline + dash([[1, 3], [7, 3]])); },
    },
    {
      explain: "<b>上面一块：</b>长 <b>6</b>，宽 <b>2</b>，面积 = 6 × 2 = <b>12</b>。",
      render(el) {
        el.innerHTML = board(9, 6, P(L, GHOST) + P(A, BLUE) + dash([[1, 3], [7, 3]]) +
          dimH(1, 7, 0.7, "6", "#1b4a7a") + dimV(1, 3, 7.6, "2", "#1b4a7a") + txt(4, 2.4, "12", "#ffffff", 18));
      },
    },
    {
      explain: "<b>下面一块：</b>长 <b>3</b>，宽 <b>2</b>，面积 = 3 × 2 = <b>6</b>。",
      render(el) {
        el.innerHTML = board(9, 6, P(L, GHOST) + P(B, GREEN) + dash([[1, 3], [7, 3]]) +
          dimH(1, 4, 5.7, "3", "#2f7d6b") + dimV(3, 5, 0.7, "2", "#2f7d6b") + txt(2.5, 4.4, "6", "#ffffff", 18));
      },
    },
    {
      explain: "<b>合起来：</b>12 + 6 = <b style='color:#2f7d5f'>18</b>。组合图形的办法就是：<b>分割求和</b>。算式像板书一样写出来：",
      render(el) {
        el.innerHTML = board(9, 6, P(A, BLUE) + P(B, GREEN) + dash([[1, 3], [7, 3]]) +
          txt(4, 2.4, "12", "#ffffff", 18) + txt(2.5, 4.4, "6", "#ffffff", 18) +
          txt(6, 4.4, "12 + 6 = 18", "#1b4a7a", 17));
        el.appendChild(hwCard([
          F("6 × 2", "ink"), F(" + ", "op"), F("3 × 2", "ink"), F(" = ", "op"),
          F("12 + 6", "ink"), F(" = ", "op"), F("18", "green"),
        ], 44));
      },
    },
  ];
}

const DEMOS = [
  { label: "▭ 平行四边形", build: demoPara },
  { label: "🔺 三角形", build: demoTri },
  { label: "⬟ 梯形", build: demoTrap },
  { label: "🧩 组合图形", build: demoCombo },
];
DEMOS.forEach(d => {
  const btn = document.createElement("button");
  btn.className = "btn green";
  btn.textContent = d.label;
  btn.onclick = () => {
    demoBtns.querySelectorAll("button").forEach(b => (b.style.outline = ""));
    btn.style.outline = "3px solid #e8943a";
    stepper = Stepper(d.build(), stage);
  };
  demoBtns.appendChild(btn);
});
document.getElementById("btnNext").onclick = () => stepper && stepper.next();
document.getElementById("btnPrev").onclick = () => stepper && stepper.prev();
document.getElementById("btnReset").onclick = () => stepper && stepper.reset();

/* ---------- 亲手练 ---------- */
const P_BANK = [
  { q: "平行四边形：底 6 cm，高 4 cm", opts: ["24 cm²", "10 cm²", "12 cm²"], ans: 0, why: "S = 底 × 高 = 6 × 4 = 24" },
  { q: "三角形：底 8 cm，高 5 cm", opts: ["40 cm²", "20 cm²", "13 cm²"], ans: 1, why: "S = 底 × 高 ÷ 2 = 8 × 5 ÷ 2 = 20，别忘 ÷ 2！" },
  { q: "梯形：上底 3 cm，下底 7 cm，高 4 cm", opts: ["40 cm²", "14 cm²", "20 cm²"], ans: 2, why: "S =（3+7）× 4 ÷ 2 = 20" },
  { q: "平行四边形：底 2.5 dm，高 4 dm", opts: ["6.5 dm²", "10 dm²", "5 dm²"], ans: 1, why: "S = 2.5 × 4 = 10" },
  { q: "三角形：底 12 cm，高 2.5 cm", opts: ["30 cm²", "14.5 cm²", "15 cm²"], ans: 2, why: "S = 12 × 2.5 ÷ 2 = 15" },
  { q: "梯形：上底 2.4 m，下底 3.6 m，高 5 m", opts: ["30 m²", "15 m²", "12 m²"], ans: 1, why: "S =（2.4+3.6）× 5 ÷ 2 = 15" },
];
let pIdx = 0;
document.getElementById("pTotal").textContent = P_BANK.length;

function pLoad() {
  document.getElementById("pRound").textContent = pIdx + 1;
  const q = P_BANK[pIdx];
  document.getElementById("pQuestion").innerHTML = "求面积：" + q.q;
  const fb = document.getElementById("pFeedback");
  fb.textContent = ""; fb.className = "feedback";
  document.getElementById("pNextQ").style.display = "none";
  const box = document.getElementById("pOptions");
  box.innerHTML = "";
  q.opts.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "btn-opt";
    b.textContent = o;
    b.onclick = () => {
      if (i === q.ans) {
        b.classList.add("correct");
        fb.className = "feedback ok";
        fb.textContent = "✅ 答对了！" + q.why;
        if (Math5.addStar("unit7", "practice" + pIdx)) fb.textContent += " 线索已确认！";
        document.getElementById("pNextQ").style.display = "";
      } else {
        b.classList.add("wrong");
        fb.className = "feedback no";
        Math5.addWrong("unit7", q);
        fb.textContent = "❌ 检查一下：用对公式了吗？÷ 2 了吗？";
        setTimeout(() => b.classList.remove("wrong"), 1200);
      }
    };
    box.appendChild(b);
  });
}
document.getElementById("pNextQ").onclick = () => {
  pIdx++;
  if (pIdx < P_BANK.length) pLoad();
  else {
    document.getElementById("pQuestion").textContent = "🎉 亲手练完成！去闯关挑战试试吧！";
    document.getElementById("pOptions").innerHTML = "";
    document.getElementById("pNextQ").style.display = "none";
  }
};
pLoad();

/* ---------- 闯关挑战 ---------- */
const G_BANK = [
  { q: "平行四边形的面积公式是（　）", opts: ["底 × 高", "底 × 高 ÷ 2", "（上底+下底）× 高 ÷ 2"], ans: 0, why: "割补成长方形，长=底，宽=高。" },
  { q: "三角形的面积公式是（　）", opts: ["底 × 高", "底 × 高 ÷ 2", "底 × 高 × 2"], ans: 1, why: "两个一样的三角形拼成平行四边形，所以要 ÷ 2。" },
  { q: "梯形的面积公式是（　）", opts: ["（上底+下底）× 高", "（上底+下底）× 高 ÷ 2", "上底 × 高 ÷ 2"], ans: 1, why: "拼成的平行四边形底 = 上底+下底，还要 ÷ 2。" },
  { q: "平行四边形底 5 cm、高 4 cm，面积是（　）", opts: ["9 cm²", "20 cm²", "10 cm²"], ans: 1, why: "5 × 4 = 20" },
  { q: "与上面那个平行四边形<b>等底等高</b>的三角形，面积是（　）", opts: ["20 cm²", "10 cm²", "40 cm²"], ans: 1, why: "等底等高时，三角形是平行四边形的一半：20 ÷ 2 = 10。" },
  { q: "一个三角形面积 12 cm²，底 6 cm，它的高是（　）", opts: ["2 cm", "4 cm", "6 cm"], ans: 1, why: "高 = 面积 × 2 ÷ 底 = 12 × 2 ÷ 6 = 4。" },
  { q: "梯形上底 4、下底 6、高 3，面积是（　）", opts: ["15", "30", "13"], ans: 0, why: "（4+6）× 3 ÷ 2 = 15" },
  { q: "平行四边形底扩大到原来的 2 倍，高不变，面积（　）", opts: ["不变", "扩大到 2 倍", "扩大到 4 倍"], ans: 1, why: "S = 底 × 高，一个因数乘 2，积也乘 2。" },
];
let gIdx = 0, gScore = 0;
document.getElementById("gTotal").textContent = G_BANK.length;
document.getElementById("gStarHint").textContent = "答对 " + Math.ceil(G_BANK.length * 0.75) + " 题盖完成印章";

function gLoad() {
  document.getElementById("gRound").textContent = gIdx + 1;
  const q = G_BANK[gIdx];
  let answered = false;
  document.getElementById("gQuestion").innerHTML = q.q;
  const fb = document.getElementById("gFeedback");
  fb.textContent = ""; fb.className = "feedback";
  document.getElementById("gNext").style.display = "none";
  const box = document.getElementById("gOptions");
  box.innerHTML = "";
  q.opts.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "btn-opt";
    b.innerHTML = o;
    b.onclick = () => {
      if (answered) return;
      if (i === q.ans) {
        answered = true;
        b.classList.add("correct");
        gScore++;
        document.getElementById("gScore").textContent = gScore;
        fb.className = "feedback ok";
        fb.textContent = "✅ 答对了！" + q.why;
        if (gIdx === G_BANK.length - 1) gFinish();
        else document.getElementById("gNext").style.display = "";
      } else {
        b.classList.add("wrong");
        fb.className = "feedback no";
        Math5.addWrong("unit7", q);
        fb.textContent = "❌ 想想公式是怎么推出来的？";
        setTimeout(() => b.classList.remove("wrong"), 1200);
      }
    };
    box.appendChild(b);
  });
}
function gFinish() {
  const el = document.getElementById("gFinal");
  el.style.display = "";
  const pass = Math.ceil(G_BANK.length * 0.75);
  if (gScore >= pass) {
    if (Math5.addStar("unit7", "game")) el.innerHTML = "案卷完成，已盖完成印章。";
    else el.innerHTML = "这份案卷已经盖过完成印章，继续保持！";
  } else {
    el.innerHTML = "答对 " + gScore + " / " + G_BANK.length + " 题。记住：三角形和梯形都要 ÷ 2！";
  }
}
document.getElementById("gNext").onclick = () => { if (gIdx >= G_BANK.length - 1) return; gIdx++; gLoad(); };
gLoad();
