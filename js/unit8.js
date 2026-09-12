/* ===== 单元八 · 数学广角（植树问题） ===== */
Math5.initUnitPage("unit8", "单元八 · 数学广角（植树问题）");

/* ---------- 画图工具 ---------- */
function tree(x, y) {
  return '<g><rect x="' + (x - 3) + '" y="' + (y - 24) + '" width="6" height="20" rx="2" fill="#8d6e63"/>' +
    '<circle cx="' + x + '" cy="' + (y - 32) + '" r="13" fill="#4f9d7f" stroke="#2f7d6b" stroke-width="2"/>' +
    '<circle cx="' + (x - 8) + '" cy="' + (y - 26) + '" r="8" fill="#5fb08f" stroke="#2f7d6b" stroke-width="2"/>' +
    '<circle cx="' + (x + 8) + '" cy="' + (y - 26) + '" r="8" fill="#5fb08f" stroke="#2f7d6b" stroke-width="2"/></g>';
}
function roadSVG(o) {
  const W = 660, H = 168, x0 = 48, x1 = W - 48, y = 104;
  const u = (x1 - x0) / o.total;
  let s = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" style="max-width:100%">';
  s += '<text x="' + (W / 2) + '" y="24" font-size="17" fill="#37474f" text-anchor="middle" font-weight="bold">' + (o.title || "") + "</text>";
  s += '<rect x="' + x0 + '" y="' + (y - 6) + '" width="' + (x1 - x0) + '" height="12" rx="6" fill="#dfe6ea"/>';
  for (let p = 0; p <= o.total; p += o.gap) {
    const x = x0 + p * u;
    s += '<line x1="' + x.toFixed(1) + '" y1="' + (y + 8) + '" x2="' + x.toFixed(1) + '" y2="' + (y + 18) + '" stroke="#a8b4bb" stroke-width="2"/>';
    s += '<text x="' + x.toFixed(1) + '" y="' + (y + 38) + '" font-size="14" fill="#7d8b96" text-anchor="middle">' + p + "m</text>";
  }
  if (o.left) s += '<text x="' + (x0 - 12) + '" y="' + (y + 4) + '" font-size="26" text-anchor="end">' + o.left + "</text>";
  if (o.right) s += '<text x="' + (x1 + 12) + '" y="' + (y + 4) + '" font-size="26">' + o.right + "</text>";
  (o.trees || []).forEach(p => { s += tree(x0 + p * u, y); });
  if (o.note) s += '<text x="' + (W / 2) + '" y="' + (H - 6) + '" font-size="16" fill="#1b4a7a" text-anchor="middle" font-weight="bold">' + o.note + "</text>";
  return s + "</svg>";
}
function pondSVG(n, title, note) {
  const S = 320, cx = 160, cy = 172, r = 104;
  let s = '<svg viewBox="0 0 ' + S + " " + S + '" width="' + S + '" height="' + S + '" style="max-width:100%">';
  s += '<text x="160" y="22" font-size="17" fill="#37474f" text-anchor="middle" font-weight="bold">' + title + "</text>";
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#e3f1f6" stroke="#90a4ae" stroke-width="2" stroke-dasharray="8 6"/>';
  for (let i = 0; i < n; i++) {
    const a = (-90 + i * 360 / n) * Math.PI / 180;
    s += tree(cx + r * Math.cos(a), cy + r * Math.sin(a) + 4);
  }
  if (note) s += '<text x="160" y="308" font-size="16" fill="#1b4a7a" text-anchor="middle" font-weight="bold">' + note + "</text>";
  return s + "</svg>";
}

/* ---------- 跟我学 ---------- */
let stepper = null;
const stage = document.getElementById("demoStage");
const demoBtns = document.getElementById("demoBtns");

/* ---- 手写公式辅助 ---- */
function F(text, color) { return { text: text, color: color || "ink", anim: true }; }
function hwLines(lines, size) {
  const card = document.createElement("div");
  card.className = "hw-card";
  lines.forEach(l => HW.write(card, l, { size: size || 40 }));
  return card;
}

/* 情况 1：两端都栽 */
function demoBoth() {
  const total = 20, gap = 5, pos = [0, 5, 10, 15, 20];
  const cfg = n => ({ total: total, gap: gap, trees: pos.slice(0, n), title: "20 米的小路，每 5 米栽一棵（两端都栽）" });
  const steps = [{
    explain: "<b>两端都栽：</b>一条 20 米的小路，从头到尾每隔 5 米栽一棵树。<br>" +
      "先算<b>间隔数</b>：20 ÷ 5 = <b>4</b> 个间隔。",
    render(el) { el.innerHTML = roadSVG(cfg(0)); },
  }];
  pos.forEach((p, i) => {
    steps.push({
      explain: "<b>栽第 " + (i + 1) + " 棵树</b>（在 " + p + " 米处）" +
        (i === 0 ? "—— 开头这一棵别忘啦！" : i === pos.length - 1 ? "—— 结尾这一棵也别忘啦！" : ""),
      render(el) { el.innerHTML = roadSVG(cfg(i + 1)); },
    });
  });
  steps.push({
    explain: "<b>数一数：</b>间隔 <b>4</b> 个，树 <b>5</b> 棵 → <b>棵数 = 间隔数 + 1</b>。<br>" +
      "口诀：<b>两端都栽，棵数比间隔多 1</b>。",
    render(el) {
      el.innerHTML = roadSVG({
        total: total, gap: gap, trees: pos,
        title: "间隔 4 个 · 树 5 棵",
      });
      el.appendChild(hwLines([
        [F("棵数", "blue"), F(" = ", "op"), F("间隔数", "green"), F(" + 1", "red")],
        [F("20 ÷ 5 + 1", "ink"), F(" = ", "op"), F("4 + 1", "ink"), F(" = ", "op"), F("5", "green")],
      ]));
    },
  });
  return steps;
}

/* 情况 2：只栽一端 */
function demoOne() {
  const total = 15, gap = 3, pos = [0, 3, 6, 9, 12];
  const cfg = n => ({
    total: total, gap: gap, trees: pos.slice(0, n), right: "🌊",
    title: "15 米的小路，每 3 米栽一棵（右端是河，不栽）",
  });
  const steps = [{
    explain: "<b>只栽一端：</b>15 米的小路每隔 3 米栽一棵，可是<b>右端是条河</b>，那里栽不了。<br>" +
      "间隔数：15 ÷ 3 = <b>5</b> 个。",
    render(el) { el.innerHTML = roadSVG(cfg(0)); },
  }];
  pos.forEach((p, i) => {
    steps.push({
      explain: "<b>栽第 " + (i + 1) + " 棵树</b>（在 " + p + " 米处）",
      render(el) { el.innerHTML = roadSVG(cfg(i + 1)); },
    });
  });
  steps.push({
    explain: "<b>数一数：</b>间隔 <b>5</b> 个，树 <b>5</b> 棵 → <b>棵数 = 间隔数</b>。<br>" +
      "因为最后那个间隔的<b>末端没有树</b>，正好一一对应。",
    render(el) {
      el.innerHTML = roadSVG({
        total: total, gap: gap, trees: pos, right: "🌊",
        title: "间隔 5 个 · 树 5 棵",
      });
      el.appendChild(hwLines([
        [F("棵数", "blue"), F(" = ", "op"), F("间隔数", "green")],
        [F("15 ÷ 3", "ink"), F(" = ", "op"), F("5", "green")],
      ]));
    },
  });
  return steps;
}

/* 情况 3：两端都不栽 */
function demoNone() {
  const total = 18, gap = 6, pos = [6, 12];
  const cfg = n => ({
    total: total, gap: gap, trees: pos.slice(0, n), left: "🏠", right: "🏠",
    title: "18 米的小路，每 6 米栽一棵（两端都是房子）",
  });
  const steps = [{
    explain: "<b>两端都不栽：</b>18 米的小路，两端都是房子，只能在中间栽。<br>" +
      "间隔数：18 ÷ 6 = <b>3</b> 个。",
    render(el) { el.innerHTML = roadSVG(cfg(0)); },
  }];
  pos.forEach((p, i) => {
    steps.push({
      explain: "<b>栽第 " + (i + 1) + " 棵树</b>（在 " + p + " 米处）——只能栽在中间，两端靠房子不能栽。",
      render(el) { el.innerHTML = roadSVG(cfg(i + 1)); },
    });
  });
  steps.push({
    explain: "<b>数一数：</b>间隔 <b>3</b> 个，树 <b>2</b> 棵 → <b>棵数 = 间隔数 − 1</b>。<br>" +
      "锯木头、爬楼梯都属于这一类：<b>次数 = 段数 − 1</b>。",
    render(el) {
      el.innerHTML = roadSVG({
        total: total, gap: gap, trees: pos, left: "🏠", right: "🏠",
        title: "间隔 3 个 · 树 2 棵",
      });
      el.appendChild(hwLines([
        [F("棵数", "blue"), F(" = ", "op"), F("间隔数", "green"), F(" − 1", "red")],
        [F("18 ÷ 6 − 1", "ink"), F(" = ", "op"), F("3 − 1", "ink"), F(" = ", "op"), F("2", "green")],
      ]));
    },
  });
  return steps;
}

/* 情况 4：封闭图形 */
function demoCircle() {
  const n = 6;
  const steps = [{
    explain: "<b>封闭图形：</b>圆形池塘一圈长 24 米，每 4 米栽一棵。<br>" +
      "间隔数：24 ÷ 4 = <b>6</b> 个。",
    render(el) { el.innerHTML = pondSVG(0, "圆形池塘：周长 24 米，每 4 米栽一棵"); },
  }];
  for (let i = 1; i <= n; i++) {
    steps.push({
      explain: "<b>栽第 " + i + " 棵树……</b>" + (i === n ? "最后一棵正好接到第一棵前面！" : ""),
      render(el) { el.innerHTML = pondSVG(i, "圆形池塘：周长 24 米，每 4 米栽一棵"); },
    });
  }
  steps.push({
    explain: "<b>数一数：</b>间隔 <b>6</b> 个，树 <b>6</b> 棵 → <b>棵数 = 间隔数</b>。<br>" +
      "因为首尾相接，<b>没有端点</b>，间隔和树一一对应。",
    render(el) {
      el.innerHTML = pondSVG(n, "间隔 6 个 · 树 6 棵");
      el.appendChild(hwLines([
        [F("棵数", "blue"), F(" = ", "op"), F("间隔数", "green")],
        [F("24 ÷ 4", "ink"), F(" = ", "op"), F("6", "green")],
      ]));
    },
  });
  return steps;
}

const DEMOS = [
  { label: "🌳 两端都栽", build: demoBoth },
  { label: "🌊 只栽一端", build: demoOne },
  { label: "🏠 两端都不栽", build: demoNone },
  { label: "⭕ 封闭图形", build: demoCircle },
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
  { q: "20 米的小路，每 5 米栽一棵（两端都栽），一共几棵？", opts: ["4 棵", "5 棵", "6 棵"], ans: 1, why: "间隔 20÷5=4，两端都栽：4+1=5 棵。" },
  { q: "100 米的小路，每 5 米栽一棵（两端都栽），一共几棵？", opts: ["20 棵", "21 棵", "19 棵"], ans: 1, why: "间隔 100÷5=20，棵数 20+1=21。" },
  { q: "圆形池塘周长 60 米，每 6 米栽一棵，一共几棵？", opts: ["10 棵", "11 棵", "9 棵"], ans: 0, why: "封闭图形：棵数 = 间隔数 = 60÷6 = 10。" },
  { q: "两栋楼之间相距 30 米，每 5 米栽一棵（两端是楼，都不栽），几棵？", opts: ["6 棵", "7 棵", "5 棵"], ans: 2, why: "间隔 30÷5=6，两端都不栽：6−1=5 棵。" },
  { q: "一根木头锯成 5 段，一共要锯几次？", opts: ["5 次", "4 次", "6 次"], ans: 1, why: "相当于「两端都不栽」：次数 = 段数 − 1 = 4。" },
  { q: "从 1 楼走到 5 楼，一共要走几层楼梯？", opts: ["5 层", "4 层", "6 层"], ans: 1, why: "楼层是「点」，楼梯是「间隔」：5−1=4 层。" },
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
        if (Math5.addStar("unit8", "practice" + pIdx)) fb.textContent += " 线索已确认！";
        document.getElementById("pNextQ").style.display = "";
      } else {
        b.classList.add("wrong");
        fb.className = "feedback no";
        Math5.addWrong("unit8", q);
        fb.textContent = "❌ 先算间隔数，再想两端栽不栽。";
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
  { q: "40 米的路，每 8 米栽一棵，两端都栽，一共（　）", opts: ["5 棵", "6 棵", "4 棵"], ans: 1, why: "间隔 40÷8=5，5+1=6 棵。" },
  { q: "还是这条路（40 米、每 8 米），只栽一端，一共（　）", opts: ["5 棵", "6 棵", "4 棵"], ans: 0, why: "只栽一端：棵数 = 间隔数 = 5。" },
  { q: "这条路如果两端都不栽，一共（　）", opts: ["4 棵", "5 棵", "6 棵"], ans: 0, why: "两端都不栽：5−1=4 棵。" },
  { q: "圆形花坛周长 30 米，每 5 米摆一盆花，一共（　）", opts: ["6 盆", "7 盆", "5 盆"], ans: 0, why: "封闭图形：30÷5=6 盆。" },
  { q: "一根钢管锯成 4 段，需要锯（　）", opts: ["4 次", "3 次", "5 次"], ans: 1, why: "次数 = 段数 − 1 = 3。" },
  { q: "每锯一次要 3 分钟，锯成 4 段一共要（　）", opts: ["12 分钟", "9 分钟", "6 分钟"], ans: 1, why: "锯 3 次 × 3 分钟 = 9 分钟。" },
  { q: "一条路有 12 个间隔，两端都栽，一共（　）", opts: ["12 棵", "13 棵", "11 棵"], ans: 1, why: "两端都栽：12+1=13 棵。" },
  { q: "马路一边栽了 21 棵树（两端都栽），一共有（　）个间隔", opts: ["20 个", "21 个", "22 个"], ans: 0, why: "间隔数 = 棵数 − 1 = 20。" },
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
        Math5.addWrong("unit8", q);
        fb.textContent = "❌ 先算间隔数，再看两端的情况。";
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
    if (Math5.addStar("unit8", "game")) el.innerHTML = "案卷完成，已盖完成印章。";
    else el.innerHTML = "这份案卷已经盖过完成印章，继续保持！";
  } else {
    el.innerHTML = "答对 " + gScore + " / " + G_BANK.length + " 题。口诀：两端都栽 +1，只栽一端不加，两端不栽 −1，封闭图形相等。";
  }
}
document.getElementById("gNext").onclick = () => { if (gIdx >= G_BANK.length - 1) return; gIdx++; gLoad(); };
gLoad();
