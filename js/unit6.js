/* ===== 单元六 · 可能性 ===== */
Math5.initUnitPage("unit6", "单元六 · 可能性");

/* ---------- 跟我学 ---------- */
let stepper = null;
const stage = document.getElementById("demoStage");
const demoBtns = document.getElementById("demoBtns");

/* 通用：双色对比条 */
function tallyBar(a, b, colA, colB) {
  const t = Math.max(a + b, 1);
  return '<div style="display:flex;justify-content:center;height:20px;margin:10px auto 4px;width:80%;max-width:420px;border-radius:10px;overflow:hidden;background:#eceff1">' +
    '<div style="width:' + (a / t * 100) + '%;background:' + colA + ';transition:width .3s"></div>' +
    '<div style="width:' + (b / t * 100) + '%;background:' + colB + ';transition:width .3s"></div></div>';
}

/* ---------- 演示 1：抛硬币 ---------- */
function coinFace(kind) {
  if (kind === null) return '<div style="width:96px;height:96px;border-radius:50%;background:#f1f3f4;border:2px dashed #c3ccd2;display:flex;align-items:center;justify-content:center;font-size:40px;margin:0 auto">🪙</div>';
  const isH = kind === "H";
  return '<div style="width:96px;height:96px;border-radius:50%;background:' + (isH ? "#fbe3b6" : "#eceff1") +
    ';border:3px solid ' + (isH ? "#d9a54a" : "#b0bec5") +
    ';display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:bold;color:' +
    (isH ? "#8a5f16" : "#546e7a") + ';margin:0 auto;box-shadow:0 3px 10px rgba(31,45,61,.12)">' +
    (isH ? "正面" : "反面") + "</div>";
}
function coinView(kind, h, t, n) {
  return '<div style="text-align:center">' + coinFace(kind) +
    '<div style="display:flex;justify-content:center;gap:44px;margin-top:14px;font-size:19px">' +
    '<div>正面 <b style="color:#b9791d">' + h + "</b> 次</div>" +
    '<div>反面 <b style="color:#546e7a">' + t + "</b> 次</div></div>" +
    tallyBar(h, t, "#e8b75f", "#90a4ae") +
    '<div style="color:#90a4ae;font-size:17px">一共抛了 ' + n + " 次</div></div>";
}
/* ---- 手写算式辅助 ---- */
function F(text, color) { return { text: text, color: color || "ink", anim: true }; }
function hwLines(lines, size) {
  const card = document.createElement("div");
  card.className = "hw-card";
  lines.forEach(l => HW.write(card, l, { size: size || 42 }));
  return card;
}

function demoCoin() {
  const steps = [{
    explain: "<b>抛硬币！</b>硬币只有两面：正面、反面。抛之前能不能确定哪面朝上？——<b>不能</b>。但两面朝上的可能性<b>一样大</b>。我们来抛 12 次。",
    render(el) { el.innerHTML = coinView(null, 0, 0, 0); },
  }];
  let h = 0, t = 0;
  for (let i = 0; i < 12; i++) {
    const flip = Math.random() < 0.5 ? "H" : "T";
    if (flip === "H") h++; else t++;
    const n = i + 1;
    const heads = h, tails = t;
    const tip = n >= 8 ? " 当前正面 " + heads + " 次、反面 " + tails + " 次，继续观察频率。" : "";
    steps.push({
      explain: "<b>第 " + n + " 次：</b>" + (flip === "H" ? "正面！" : "反面！") + tip,
      render(el) { el.innerHTML = coinView(flip, heads, tails, n); },
    });
  }
  steps.push({
    explain: "<b>规律：</b>试验次数增多时，正面<b>频率</b>通常会在 <b>1/2</b> 附近波动得更稳定；但下一次仍可能是任意一面。",
    render(el) {
      el.innerHTML = coinView(null, h, t, 12);
      el.appendChild(hwLines([
        [F("正", "red"), F(" = ", "op"), F("反", "blue"), F("　　", "ink"), F("可能性相等", "green")],
      ]));
    },
  });
  return steps;
}

/* ---------- 演示 2：摸球 ---------- */
function bagSVG(balls) {
  const W = 100 + 36 * balls.length;
  let s = '<svg width="' + W + '" height="130" viewBox="0 0 ' + W + ' 130">';
  s += '<path d="M 26 44 Q 26 24 52 24 L ' + (W - 52) + " 24 Q " + (W - 26) + " 24 " + (W - 26) +
    " 44 L " + (W - 18) + " 106 Q " + (W - 18) + " 120 " + (W - 36) + " 120 L 36 120 Q 18 120 18 106 Z" +
    '" fill="#f6ecd6" stroke="#cdb083" stroke-width="2"/>';
  balls.forEach((b, i) => {
    const cx = 58 + i * 36, cy = 76;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="15" fill="' + (b === "R" ? "#e05c4b" : "#fdfdfd") +
      '" stroke="' + (b === "R" ? "#b3402f" : "#c3ccd2") + '" stroke-width="2"/>';
  });
  s += '<text x="' + (W / 2) + '" y="18" font-size="15" fill="#7d8b96" text-anchor="middle">袋子里的球</text>';
  return s + "</svg>";
}
function bagView(drawn, r, w, n) {
  const ball = drawn
    ? '<div style="font-size:19px">摸出：<b style="color:' + (drawn === "R" ? "#d9483f" : "#607d8b") + '">' +
      (drawn === "R" ? "🔴 红球" : "⚪ 白球") + "</b></div>"
    : '<div style="font-size:19px;color:#90a4ae">准备摸球……</div>';
  return '<div style="text-align:center">' + bagSVG(["R", "R", "R", "R", "W"]) +
    '<div style="margin-top:6px">' + ball + "</div>" +
    '<div style="display:flex;justify-content:center;gap:38px;margin-top:6px;font-size:19px">' +
    "<div>红球 <b style=\"color:#d9483f\">" + r + "</b> 次</div>" +
    "<div>白球 <b style=\"color:#607d8b\">" + w + "</b> 次</div></div>" +
    tallyBar(r, w, "#e05c4b", "#cfd8dc") +
    '<div style="color:#90a4ae;font-size:17px">一共摸了 ' + n + " 次（摸完放回去）</div></div>";
}
function demoBag() {
  const box = ["R", "R", "R", "R", "W"];
  const steps = [{
    explain: "<b>摸球游戏！</b>袋子里有 <b>4 个红球</b>和 <b>1 个白球</b>，随便摸一个——摸到什么颜色的可能性大？我们摸 10 次（每次摸完放回去）。",
    render(el) { el.innerHTML = bagView(null, 0, 0, 0); },
  }];
  let r = 0, w = 0;
  for (let i = 0; i < 10; i++) {
    const d = box[Math.floor(Math.random() * 5)];
    if (d === "R") r++; else w++;
    const n = i + 1;
    const red = r, white = w;
    const tip = n >= 7 ? " 继续观察累计频率，再和袋中红、白球的数量对照。" : "";
    steps.push({
      explain: "<b>第 " + n + " 次：</b>摸到" + (d === "R" ? "红球！" : "白球。") + tip,
      render(el) { el.innerHTML = bagView(d, red, white, n); },
    });
  }
  steps.push({
    explain: "<b>规律：</b>数量<b>多</b>的那种球，摸到的可能性<b>大</b>；数量<b>少</b>的可能性<b>小</b>（但不是不可能！）。",
    render(el) {
      el.innerHTML = bagView(null, r, w, 10);
      el.appendChild(hwLines([
        [F("红 4", "red"), F(" > ", "op"), F("白 1", "ink")],
        [F("数量多", "blue"), F(" → ", "op"), F("可能性大", "green")],
      ]));
    },
  });
  return steps;
}

/* ---------- 演示 3：转盘公平吗 ---------- */
function wheelSVG(cols) {
  const cx = 110, cy = 112, r = 92, n = cols.length;
  let s = '<svg width="220" height="216" viewBox="0 0 220 224">';
  s += '<circle cx="110" cy="112" r="97" fill="#f5f7f8" stroke="#cfd8dc" stroke-width="2"/>';
  for (let i = 0; i < n; i++) {
    const a0 = (-90 + i * 360 / n) * Math.PI / 180;
    const a1 = (-90 + (i + 1) * 360 / n) * Math.PI / 180;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    s += '<path d="M ' + cx + " " + cy + " L " + x0.toFixed(1) + " " + y0.toFixed(1) +
      " A " + r + " " + r + " 0 0 1 " + x1.toFixed(1) + " " + y1.toFixed(1) + ' Z" fill="' + cols[i] +
      '" stroke="#fff" stroke-width="2.5"/>';
  }
  s += '<path d="M 110 92 L 119 116 L 101 116 Z" fill="#37474f"/>';
  s += '<circle cx="110" cy="112" r="7" fill="#37474f"/>';
  return s + "</svg>";
}
function wheelView(cols, caption, sub) {
  return '<div style="display:inline-block;padding:6px 26px 2px">' + wheelSVG(cols) +
    '<div style="font-size:19px;font-weight:bold;color:#26313d;margin-top:2px">' + caption + "</div>" +
    '<div style="font-size:17px;color:#7d8b96">' + sub + "</div></div>";
}
function demoWheel() {
  const fair = ["#e05c4b", "#2f6fb0", "#e05c4b", "#2f6fb0", "#e05c4b", "#2f6fb0"];
  const unfair = ["#e05c4b", "#2f6fb0", "#2f6fb0", "#e05c4b", "#2f6fb0", "#2f6fb0"];
  return [
    {
      explain: "<b>转盘游戏公平吗？</b>指针会停在哪个格子？——<b>每个格子都有可能</b>。可能性大小看什么？看它<b>占了几格</b>！",
      render(el) { el.innerHTML = wheelView(fair, "甲转盘：红 3 格 · 蓝 3 格", "红、蓝各占一半"); },
    },
    {
      explain: "<b>甲转盘：</b>红色 <b>3 格</b>、蓝色 <b>3 格</b>，格数<b>同样多</b> → 停在红、蓝的可能性<b>一样大</b>，游戏<b>公平</b>。",
      render(el) {
        el.innerHTML = wheelView(fair, "甲转盘", "✅ 公平：红蓝可能性相等");
        el.appendChild(hwLines([
          [F("红 3", "red"), F(" = ", "op"), F("蓝 3", "blue"), F("　　", "ink"), F("公平", "green")],
        ]));
      },
    },
    {
      explain: "<b>乙转盘：</b>红色 <b>2 格</b>、蓝色 <b>4 格</b>，蓝色<b>占得多</b> → 停在蓝色的可能性<b>更大</b>，<b>不公平</b>！",
      render(el) {
        el.innerHTML = wheelView(unfair, "乙转盘：红 2 格 · 蓝 4 格", "❌ 不公平：蓝色更容易停");
        el.appendChild(hwLines([
          [F("红 2", "red"), F(" < ", "op"), F("蓝 4", "blue"), F("　　", "ink"), F("不公平", "amber")],
        ]));
      },
    },
    {
      explain: "<b>总结：</b>判断公平不公平，就看<b>每种情况占的格数（数量）是不是一样多</b>。一样多 = 可能性相等 = 公平。",
      render(el) {
        el.innerHTML = wheelView(fair, "甲：3 红 3 蓝", "公平") + wheelView(unfair, "乙：2 红 4 蓝", "不公平");
      },
    },
  ];
}

/* ---------- 演示 4：一定 / 可能 / 不可能 ---------- */
function boxSVG(balls) {
  const W = Math.max(260, 90 + 40 * balls.length);
  let s = '<svg width="' + W + '" height="118" viewBox="0 0 ' + W + ' 118">';
  s += '<rect x="22" y="34" width="' + (W - 44) + '" height="76" rx="10" fill="#eef3f6" stroke="#b9c6cf" stroke-width="2"/>';
  s += '<rect x="30" y="20" width="' + (W - 60) + '" height="16" rx="6" fill="#dfe6ea" stroke="#b9c6cf" stroke-width="2"/>';
  balls.forEach((b, i) => {
    const cx = 62 + i * 40, cy = 74;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="16" fill="' + (b === "R" ? "#e05c4b" : "#fdfdfd") +
      '" stroke="' + (b === "R" ? "#b3402f" : "#c3ccd2") + '" stroke-width="2"/>';
  });
  return s + "</svg>";
}
function boxView(balls, title, verdict, color) {
  return '<div style="display:inline-block">' + boxSVG(balls) +
    '<div style="font-size:19px;font-weight:bold;margin-top:4px">' + title + "</div>" +
    '<div style="font-size:21px;font-weight:bold;color:' + color + '">摸出红球：' + verdict + "</div></div>";
}
function demoBoxes() {
  const data = [
    { title: "①号盒（全是红球）", balls: ["R", "R", "R", "R"], verdict: "一定", color: "#2f7d5f",
      why: "盒子里<b>只有红球</b>，随便摸一个<b>一定</b>是红球。" },
    { title: "②号盒（红球、白球都有）", balls: ["R", "W", "R", "W"], verdict: "可能", color: "#b9791d",
      why: "有红球也有白球，摸出红球<b>可能</b>，摸出白球也<b>可能</b>。" },
    { title: "③号盒（全是白球）", balls: ["W", "W", "W", "W"], verdict: "不可能", color: "#d9483f",
      why: "一个红球都没有，摸出红球<b>不可能</b>。" },
  ];
  const steps = [{
    explain: "<b>三个盒子，摸出红球是什么情况？</b>看盒子里<b>装了什么</b>就能判断，不用真的去摸！",
    render(el) { el.innerHTML = '<div style="color:#90a4ae;padding:30px 0;font-size:19px">①号盒 · ②号盒 · ③号盒 —— 一个一个来看</div>'; },
  }];
  data.forEach(d => {
    steps.push({
      explain: d.why,
      render(el) { el.innerHTML = boxView(d.balls, d.title, d.verdict, d.color); },
    });
  });
  steps.push({
    explain: "<b>记住三句话：</b>全都是 → <b>一定</b>；有一部分 → <b>可能</b>；一个都没有 → <b>不可能</b>。",
    render(el) {
      el.innerHTML = data.map(d => boxView(d.balls, d.title, d.verdict, d.color)).join("");
    },
  });
  return steps;
}

const DEMOS = [
  { label: "🪙 抛硬币", build: demoCoin },
  { label: "🎒 摸球游戏", build: demoBag },
  { label: "🎡 转盘公平吗", build: demoWheel },
  { label: "📦 一定/可能/不可能", build: demoBoxes },
];
DEMOS.forEach(d => {
  const btn = document.createElement("button");
  btn.className = "btn green";
  btn.textContent = d.label;
  btn.onclick = () => {
    demoBtns.querySelectorAll("button").forEach(b => (b.style.outline = ""));
    btn.style.outline = "3px solid " + "#e8943a";
    stepper = Stepper(d.build(), stage);
  };
  demoBtns.appendChild(btn);
});
document.getElementById("btnNext").onclick = () => stepper && stepper.next();
document.getElementById("btnPrev").onclick = () => stepper && stepper.prev();
document.getElementById("btnReset").onclick = () => stepper && stepper.reset();

/* ---------- 亲手练：一定 / 可能 / 不可能 ---------- */
const P_BANK = [
  { q: "太阳明天从东方升起", ans: "一定", why: "地球自转的方向不会变，天天如此。" },
  { q: "掷一枚硬币，正面朝上", ans: "可能", why: "正面反面都有可能，可能性相等。" },
  { q: "袋子里全是蓝球，摸出红球", ans: "不可能", why: "一个红球都没有，怎么摸也摸不出。" },
  { q: "掷一枚骰子，掷出的点数大于 6", ans: "不可能", why: "骰子最大是 6 点。" },
  { q: "袋子里有 8 个白球和 1 个红球，摸出白球", ans: "可能", why: "有白球就可能摸到（而且可能性大）。" },
  { q: "打开电视，正在播动画片", ans: "可能", why: "可能是动画片，也可能是别的节目。" },
  { q: "人不用潜水设备就能在水里呼吸", ans: "不可能", why: "人靠肺呼吸，不能像鱼一样用鳃。" },
  { q: "今天星期一，明天是星期二", ans: "一定", why: "星期的顺序是固定的。" },
];
const VERDICTS = ["一定", "可能", "不可能"];
let pIdx = 0;
document.getElementById("pTotal").textContent = P_BANK.length;

function pLoad() {
  document.getElementById("pRound").textContent = pIdx + 1;
  const q = P_BANK[pIdx];
  document.getElementById("pQuestion").innerHTML = "这件事是：<b>“" + q.q + "”</b>";
  const fb = document.getElementById("pFeedback");
  fb.textContent = ""; fb.className = "feedback";
  document.getElementById("pNextQ").style.display = "none";
  const box = document.getElementById("pOptions");
  box.innerHTML = "";
  VERDICTS.forEach(v => {
    const b = document.createElement("button");
    b.className = "btn-opt";
    b.textContent = v;
    b.onclick = () => {
      if (v === q.ans) {
        b.classList.add("correct");
        fb.className = "feedback ok";
        fb.textContent = "✅ 答对了！" + q.why;
        if (Math5.addStar("unit6", "practice" + pIdx)) fb.textContent += " 线索已确认！";
        document.getElementById("pNextQ").style.display = "";
      } else {
        b.classList.add("wrong");
        fb.className = "feedback no";
        Math5.addWrong("unit6", q);
        fb.textContent = "❌ 再想想：这种情况是「全部如此」「有一部分」，还是「根本没有」？";
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
  { q: "袋子里有 5 个红球、1 个白球，摸一次，摸到哪种球的可能性大？", opts: ["红球", "白球", "一样大"], ans: 0, why: "红球数量多，可能性大。" },
  { q: "盒子里红球和白球数量相同，摸到红球和白球的可能性（　）", opts: ["红球大", "白球大", "一样大"], ans: 2, why: "数量一样多，可能性就相等。" },
  { q: "转盘上红色 4 格、黄色 4 格，这个转盘（　）", opts: ["公平", "偏向红色", "偏向黄色"], ans: 0, why: "格数相同 → 可能性相等 → 公平。" },
  { q: "转盘上红色 2 格、蓝色 6 格，指针停在（　）的可能性大", opts: ["红色", "蓝色", "无法比较"], ans: 1, why: "蓝色占的格数多，可能性大。" },
  { q: "盒子里只有 3 个黄球，摸出黄球是（　）", opts: ["一定", "可能", "不可能"], ans: 0, why: "全是黄球，摸出黄球一定发生。" },
  { q: "盒子里有 2 个黄球、2 个绿球，摸出红球是（　）", opts: ["一定", "可能", "不可能"], ans: 2, why: "没有红球，不可能摸到。" },
  { q: "抛一枚硬币 10 次，下面说法正确的是（　）", opts: ["一定 5 次正面", "一定 10 次正面", "正面次数可能是 6 次"], ans: 2, why: "可能性相等不等于次数一定相等，6 次完全可能。" },
  { q: "袋子里红球最多、白球最少，摸一次（　）", opts: ["一定摸到红球", "摸到红球的可能性大", "不可能摸到白球"], ans: 1, why: "可能性大 ≠ 一定；可能性小 ≠ 不可能。" },
  { q: "掷一枚骰子，掷出单数点数的可能性与双数相比（　）", opts: ["单数大", "双数大", "一样大"], ans: 2, why: "单数 1、3、5，双数 2、4、6，各 3 种，一样大。" },
  { q: "袋中有红、白球，每次摸完放回。前三次都是红球，第 4 次（　）", opts: ["一定是红球", "不可能是红球", "可能是红球"], ans: 2, why: "每次放回，袋中组成不变；第 4 次仍可能是红球（也可能不是）。" },
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
    b.textContent = o;
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
        Math5.addWrong("unit6", q);
        fb.textContent = "❌ 想想数量的多少，或者有没有这种情况。";
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
    if (Math5.addStar("unit6", "game")) el.innerHTML = "案卷完成，已盖完成印章。";
    else el.innerHTML = "这份案卷已经盖过完成印章，继续保持！";
  } else {
    el.innerHTML = "答对 " + gScore + " / " + G_BANK.length + " 题。记住：数量多→可能性大；全都是→一定；一个都没有→不可能。";
  }
}
document.getElementById("gNext").onclick = () => { if (gIdx >= G_BANK.length - 1) return; gIdx++; gLoad(); };
gLoad();
