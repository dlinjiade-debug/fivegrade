/* ===== 单元九 · 有趣的密铺 ===== */
Math5.initUnitPage("unit9", "单元九 · 有趣的密铺");

/* ---------- 画图工具 ---------- */
function svg(w, h, inner) {
  return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h +
    '" style="max-width:100%;background:#fbfcfd;border:1px solid #e3e9ec;border-radius:14px">' + inner + "</svg>";
}
function poly(pts, fill, stroke, op) {
  const s = pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  return '<polygon points="' + s + '" fill="' + fill + '" opacity="' + (op || 1) +
    '" stroke="' + (stroke || "#ffffff") + '" stroke-width="2"/>';
}
function label(x, y, t, color, size) {
  return '<text x="' + x + '" y="' + y + '" font-size="' + (size || 15) +
    '" fill="' + color + '" font-weight="bold" text-anchor="middle">' + t + "</text>";
}

/* ---------- 跟我学 ---------- */
let stepper = null;
const stage = document.getElementById("demoStage");
const demoBtns = document.getElementById("demoBtns");

/* ---- 手写算式辅助 ---- */
function F(text, color) { return { text: text, color: color || "ink", anim: true }; }
function hwLines(lines, size) {
  const card = document.createElement("div");
  card.className = "hw-card";
  lines.forEach(l => HW.write(card, l, { size: size || 42 }));
  return card;
}

/* 演示 1：正方形铺地面 */
function demoSquare() {
  const s = 46, cols = 7, rows = 4, ox = 26, oy = 26;
  const W = cols * s + ox * 2, H = rows * s + oy * 2;
  function tile(r, c) {
    const x = ox + c * s, y = oy + r * s;
    const colors = ["#6fa8dc", "#8fbde5"];
    return poly([[x, y], [x + s, y], [x + s, y + s], [x, y + s]], colors[(r + c) % 2], "#ffffff");
  }
  function frame(rowsDone) {
    let inner = "";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r < rowsDone) inner += tile(r, c);
        else inner += poly([[ox + c * s, oy + r * s], [ox + (c + 1) * s, oy + r * s],
          [ox + (c + 1) * s, oy + (r + 1) * s], [ox + c * s, oy + (r + 1) * s]], "none", "#e3e9ec");
      }
    }
    return svg(W, H, inner);
  }
  const steps = [{
    explain: "<b>正方形能铺满地面吗？</b>我们一块一块往上铺，看看会不会留下缝。",
    render(el) { el.innerHTML = frame(0); },
  }];
  for (let r = 1; r <= rows; r++) {
    steps.push({
      explain: "<b>铺第 " + r + " 行……</b>一块挨着一块，边和边<b>完全对齐</b>。",
      render(el) { el.innerHTML = frame(r); },
    });
  }
  steps.push({
    explain: "<b>铺满了！不留空隙、不重叠 ✓</b><br>" +
      "秘密在拼接点：正方形每个角 <b>90°</b>，4 个角拼在一起正好 <b>90° × 4 = 360°</b>。",
    render(el) {
      let inner = "";
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) inner += tile(r, c);
      const px = ox + 3 * s, py = oy + 2 * s;
      inner += '<circle cx="' + px + '" cy="' + py + '" r="16" fill="#fff" stroke="#d9483f" stroke-width="3"/>';
      el.innerHTML = svg(W, H, inner);
      el.appendChild(hwLines([
        [F("90°", "red"), F(" × ", "op"), F("4", "ink"), F(" = ", "op"), F("360°", "green")],
      ]));
    },
  });
  return steps;
}

/* 演示 2：正六边形蜂巢 */
function demoHex() {
  const s = 32, cols = 5, rows = 4, RT3 = Math.sqrt(3);
  const W = 340, H = 320;
  function hexAt(cx, cy, r, c) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i);
      pts.push([cx + s * Math.cos(a), cy + s * Math.sin(a)]);
    }
    const colors = ["#7fc4a0", "#9ad4b6", "#66b28d"];
    return poly(pts, colors[(r + c) % 3], "#ffffff");
  }
  function center(r, c) {
    return [52 + 1.5 * s * c, 62 + RT3 * s * (r + (c % 2 ? 0.5 : 0))];
  }
  function frame(colsDone) {
    let inner = "";
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const p = center(r, c);
        if (c < colsDone) inner += hexAt(p[0], p[1], r, c);
      }
    }
    return svg(W, H, inner);
  }
  const steps = [{
    explain: "<b>正六边形也能密铺！</b>蜜蜂的蜂巢就是六边形的，我们一列一列铺。",
    render(el) { el.innerHTML = frame(0); },
  }];
  for (let c = 1; c <= cols; c++) {
    steps.push({
      explain: "<b>铺第 " + c + " 列……</b>六边形要<b>错开半格</b>嵌进去。",
      render(el) { el.innerHTML = frame(c); },
    });
  }
  steps.push({
    explain: "<b>严丝合缝 ✓</b>正六边形每个内角 <b>120°</b>，3 个角拼在一个点上：<b>120° × 3 = 360°</b>。",
    render(el) {
      let inner = "";
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
        const p = center(r, c);
        inner += hexAt(p[0], p[1], r, c);
      }
      const p0 = center(1, 2);
      inner += '<circle cx="' + (p0[0] + s) + '" cy="' + (p0[1] + RT3 * s / 2) + '" r="15" fill="#fff" stroke="#d9483f" stroke-width="3"/>';
      el.innerHTML = svg(W, H, inner);
      el.appendChild(hwLines([
        [F("120°", "red"), F(" × ", "op"), F("3", "ink"), F(" = ", "op"), F("360°", "green")],
      ]));
    },
  });
  return steps;
}

/* 演示 3：正五边形不行 */
function demoPent() {
  const W = 400, H = 330, O = [200, 168], side = 96;
  const R = side / (2 * Math.sin(Math.PI / 180 * 36));
  function pent(uDeg) {
    const u = (uDeg * Math.PI) / 180;
    const cx = O[0] + R * Math.cos(u), cy = O[1] + R * Math.sin(u);
    const base = (uDeg + 180) * Math.PI / 180;
    const pts = [];
    for (let k = 0; k < 5; k++) {
      const a = base + (Math.PI / 180) * 72 * k;
      pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
    }
    return pts;
  }
  const cols = ["#6fa8dc", "#7fc4a0", "#e8b75f"];
  const us = [-108, 0, 108];
  function frame(n) {
    let inner = "";
    us.slice(0, n).forEach((u, i) => {
      inner += poly(pent(u), cols[i], "#ffffff", 0.92);
    });
    if (n >= 3) {
      // 缺口扇形
      const a0 = 162 * Math.PI / 180, a1 = 198 * Math.PI / 180, r = 76;
      inner += '<path d="M ' + O[0] + " " + O[1] + " L " + (O[0] + r * Math.cos(a0)) + " " + (O[1] + r * Math.sin(a0)) +
        " A " + r + " " + r + " 0 0 1 " + (O[0] + r * Math.cos(a1)) + " " + (O[1] + r * Math.sin(a1)) +
        ' Z" fill="#d9483f" opacity="0.35"/>';
      inner += label(O[0] - 52, O[1] + 6, "还差 36°", "#d9483f", 15);
      inner += '<circle cx="' + O[0] + '" cy="' + O[1] + '" r="5" fill="#d9483f"/>';
    }
    return svg(W, H, inner);
  }
  return [
    {
      explain: "<b>正五边形能密铺吗？</b>先把 3 个正五边形拼到一个点上试试。<br>" +
        "正五边形每个内角是 <b>108°</b>。",
      render(el) { el.innerHTML = frame(0); },
    },
    {
      explain: "<b>第 1 个：</b>顶点都对准中间这个点。",
      render(el) { el.innerHTML = frame(1); },
    },
    {
      explain: "<b>第 2 个：</b>108° + 108° = <b>216°</b>，还不到 360°。",
      render(el) { el.innerHTML = frame(2); },
    },
    {
      explain: "<b>第 3 个：</b>108° × 3 = <b>324°</b>，离 360° 还差 <b>36°</b>——红色这块<b>缝</b>补不上了！",
      render(el) { el.innerHTML = frame(3); },
    },
    {
      explain: "<b>那放 4 个呢？</b>108° × 4 = <b>432°</b> > 360°，会<b>重叠</b>起来。<br>" +
        "3 个有缝、4 个重叠，怎么都凑不成 360° —— 所以<b>正五边形不能单独密铺</b>。",
      render(el) {
        const p4 = pent(180);
        el.innerHTML = svg(W, H, frame(3).replace("</svg>",
          poly(p4, "#d9483f", "#ffffff", 0.55) + "</svg>"));
        el.appendChild(hwLines([
          [F("108° × 3", "ink"), F(" = ", "op"), F("324°", "red"), F(" < ", "op"), F("360°", "ink"), F("，有缝", "amber")],
          [F("108° × 4", "ink"), F(" = ", "op"), F("432°", "red"), F(" > ", "op"), F("360°", "ink"), F("，重叠", "amber")],
        ], 40));
      },
    },
  ];
}

/* 演示 4：任意四边形都能密铺 */
function demoQuad() {
  const Q = [[0, 0], [60, 0], [48, 40], [5, 36]]; // A B C D
  const M = [(Q[0][0] + Q[1][0]) / 2, (Q[0][1] + Q[1][1]) / 2];
  const Q2 = Q.map(p => [2 * M[0] - p[0], 2 * M[1] - p[1]]); // 绕 AB 中点转 180°
  // 密铺平移向量（中心对称六边形 U = Q ∪ Q2 的晶格）
  const v1 = [Q[1][0] - Q[3][0], Q[1][1] - Q[3][1]];
  const v2 = [Q2[3][0] - Q[2][0], Q2[3][1] - Q[2][1]];
  const W = 620, H = 400, OX = 300, OY = 210;
  function patch() {
    let inner = "";
    for (let i = -3; i <= 3; i++) {
      for (let j = -2; j <= 2; j++) {
        const dx = OX + i * v1[0] + j * v2[0], dy = OY + i * v1[1] + j * v2[1];
        const shade = (i + j) % 2 === 0;
        inner += poly(Q.map(p => [p[0] + dx, p[1] + dy]), shade ? "#6fa8dc" : "#8fbde5", "#ffffff");
        inner += poly(Q2.map(p => [p[0] + dx, p[1] + dy]), shade ? "#7fc4a0" : "#a3d8bd", "#ffffff");
      }
    }
    return svg(W, H, inner);
  }
  function single() {
    return svg(W, H,
      poly(Q.map(p => [p[0] + OX, p[1] + OY]), "#6fa8dc", "#1b4a7a") +
      label(OX + 30, OY - 14, "一个任意四边形（4 个内角和为 360°）", "#1b4a7a", 15));
  }
  function twoPieces() {
    return svg(W, H,
      poly(Q.map(p => [p[0] + OX, p[1] + OY]), "#6fa8dc", "#ffffff") +
      poly(Q2.map(p => [p[0] + OX, p[1] + OY]), "#7fc4a0", "#ffffff") +
      label(OX + 30, OY - 66, "绕这条边的中点转 180°，得到第二块", "#1b4a7a", 15));
  }
  return [
    { explain: "<b>任意四边形居然都能密铺！</b>先看这一个歪歪的四边形，它的 4 个内角加起来正好 <b>360°</b>。", render(el) { el.innerHTML = single(); } },
    { explain: "<b>绕一条边的中点旋转 180°</b>，得到第二块——两块共用这条边，严丝合缝。", render(el) { el.innerHTML = twoPieces(); } },
    { explain: "<b>照这个规律一直转、一直拼</b>，就能铺满整个平面——<b>不留空隙、不重叠 ✓</b>", render(el) { el.innerHTML = patch(); } },
    {
      explain: "<b>秘密：</b>拼接点周围正好围着四边形的 <b>4 个不同的角</b>，它们的和 = 四边形内角和 = <b>360°</b>。<br>" +
        "所以<b>任意三角形、任意四边形都能密铺</b>（三角形是 6 个角凑 360°）。",
      render(el) {
        el.innerHTML = patch();
        el.appendChild(hwLines([
          [F("内角和", "blue"), F(" = ", "op"), F("360°", "green")],
          [F("角 1 + 角 2 + 角 3 + 角 4", "ink"), F(" = ", "op"), F("360°", "green")],
        ], 40));
      },
    },
  ];
}

const DEMOS = [
  { label: "▢ 正方形", build: demoSquare },
  { label: "⬡ 正六边形", build: demoHex },
  { label: "⬟ 正五边形（不行）", build: demoPent },
  { label: "🔷 任意四边形", build: demoQuad },
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
  { q: "正三角形（每个角 60°）能单独密铺吗？", opts: ["能", "不能"], ans: 0, why: "60° × 6 = 360°，6 个角正好拼满一圈。" },
  { q: "正五边形（每个角 108°）能单独密铺吗？", opts: ["能", "不能"], ans: 1, why: "3 个差 36°，4 个超 72°，凑不成 360°。" },
  { q: "正八边形（每个角 135°）能单独密铺吗？", opts: ["能", "不能"], ans: 1, why: "2 个 270°（有缝），3 个 405°（重叠）。" },
  { q: "任意一个四边形都能密铺吗？", opts: ["能", "不能"], ans: 0, why: "4 个内角和为 360°，拼接点正好放下 4 个不同的角。" },
];
let pIdx = 0;
document.getElementById("pTotal").textContent = P_BANK.length;

function pLoad() {
  document.getElementById("pRound").textContent = pIdx + 1;
  const q = P_BANK[pIdx];
  document.getElementById("pQuestion").innerHTML = q.q;
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
        if (Math5.addStar("unit9", "practice" + pIdx)) fb.textContent += " 线索已确认！";
        document.getElementById("pNextQ").style.display = "";
      } else {
        b.classList.add("wrong");
        fb.className = "feedback no";
        Math5.addWrong("unit9", q);
        fb.textContent = "❌ 算一算：几个角拼起来能凑成 360°？";
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
  { q: "密铺的要求是（　）", opts: ["不留空隙、不重叠", "不留空隙就行", "不重叠就行"], ans: 0, why: "两个条件缺一不可。" },
  { q: "判断能不能密铺，关键看（　）", opts: ["边的长短", "拼接点周围角的和是不是 360°", "图形好不好看"], ans: 1, why: "角凑成一周 360° 才能铺严实。" },
  { q: "正六边形每个内角 120°，拼接点周围有（　）个角", opts: ["2 个", "3 个", "4 个"], ans: 1, why: "120° × 3 = 360°。" },
  { q: "下面能单独密铺的图形是（　）", opts: ["正五边形", "正六边形", "正八边形"], ans: 1, why: "正多边形里只有正三角形、正方形、正六边形能单独密铺。" },
  { q: "3 个正五边形拼在一起，角度和是 324°，结果（　）", opts: ["正好铺满", "留下 36° 的缝", "重叠了"], ans: 1, why: "360° − 324° = 36°，补不上了。" },
  { q: "正方形每个角 90°，拼接点周围需要（　）个正方形", opts: ["3 个", "4 个", "6 个"], ans: 1, why: "90° × 4 = 360°。" },
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
        Math5.addWrong("unit9", q);
        fb.textContent = "❌ 算一算拼接点周围的角度和。";
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
    if (Math5.addStar("unit9", "game")) el.innerHTML = "案卷完成，已盖完成印章。";
    else el.innerHTML = "这份案卷已经盖过完成印章，继续保持！";
  } else {
    el.innerHTML = "答对 " + gScore + " / " + G_BANK.length + " 题。记住：拼接点的角凑成 360° 才能密铺！";
  }
}
document.getElementById("gNext").onclick = () => { if (gIdx >= G_BANK.length - 1) return; gIdx++; gLoad(); };
gLoad();
