/* ===== 单元二 · 小数乘法 ===== */
Math5.initUnitPage("unit2", "单元二 · 小数乘法");

/* ---------- 跟我学：竖式分步演示 ---------- */
const DEMOS = [
  { a: "3.6", b: "5", label: "例1：小数乘整数 3.6 × 5", note: "最简单的情况：只有 1 位小数" },
  { a: "2.35", b: "1.5", label: "例2：小数乘小数 2.35 × 1.5", note: "两个因数都有小数（经典例题）" },
  { a: "0.72", b: "0.06", label: "例3：位数不够用 0 补 0.72 × 0.06", note: "积的位数不够，要用 0 补足！" },
  { a: "1.25", b: "0.8", label: "例4：积末尾有 0 要化简 1.25 × 0.8", note: "1.000 → 1，先点小数点再去 0" },
  { a: "24", b: "0.5", label: "例5：整数乘小数 24 × 0.5", note: "先当 24 × 5 算，再点 1 位小数" },
  { a: "0.056", b: "0.05", label: "例6：综合挑战 0.056 × 0.05", note: "补 0 + 化简一次全考！0.0028" },
];

let stepper = null;
const stage = document.getElementById("demoStage");
const exBtns = document.getElementById("exampleBtns");

function loadDemo(d) {
  const steps = buildMultSteps(d.a, d.b);
  stepper = Stepper(steps, stage);
  document.getElementById("btnNext").disabled = false;
}
DEMOS.forEach((d, i) => {
  const btn = document.createElement("button");
  btn.className = "btn green";
  btn.textContent = d.label;
  btn.title = d.note;
  btn.onclick = () => {
    exBtns.querySelectorAll("button").forEach(b => (b.style.outline = ""));
    btn.style.outline = "3px solid #e8943a";
    loadDemo(d);
  };
  exBtns.appendChild(btn);
});
document.getElementById("btnNext").onclick = () => stepper && stepper.next();
document.getElementById("btnPrev").onclick = () => stepper && stepper.prev();
document.getElementById("btnReset").onclick = () => stepper && stepper.reset();

/* ---------- 算理揭秘：面积模型 ---------- */
(function drawAreaModel() {
  const N = 10, S = 26, W = N * S + 40, H = N * S + 20;
  const svg = ['<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '">'];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      const overlap = c < 3 && r < 2;
      const fill = overlap ? "#6fb894" : c < 3 ? "#cfe3d8" : r < 2 ? "#f2c9d8" : "#ffffff";
      svg.push('<rect x="' + (30 + c * S) + '" y="' + (10 + r * S) + '" width="' + (S - 2) + '" height="' + (S - 2) +
        '" fill="' + fill + '" stroke="#dfe6ea"/>');
      if (overlap)
        svg.push('<text x="' + (30 + c * S + S / 2 - 2) + '" y="' + (10 + r * S + S / 2 + 5) +
          '" font-size="13" fill="#1b5e20" text-anchor="middle">0.01</text>');
    }
  svg.push('<text x="' + (30 + 1.5 * S) + '" y="' + (H - 2) + '" font-size="14" fill="#2f7d5f" text-anchor="middle">宽 0.3（3格）</text>');
  svg.push('<text x="14" y="' + (10 + S) + '" font-size="14" fill="#a03060" text-anchor="middle" transform="rotate(-90 14 ' + (10 + S) + ')">高 0.2</text>');
  svg.push("</svg>");
  document.getElementById("areaModel").innerHTML = svg.join("");
})();

/* ---------- 亲手练：给积点小数点 ---------- */
const P_BANK = [
  { a: "2.35", b: "1.5" }, { a: "5.24", b: "1.3" },
  { a: "1.37", b: "2.8" }, { a: "6.13", b: "2.5" },
  { a: "1.25", b: "0.8" }, { a: "24", b: "0.5" },
  { a: "3.84", b: "2.6" }, { a: "6.5", b: "1.04" },
];
let pIdx = 0, pDone = false;

function pLoad() {
  pDone = false;
  const q = P_BANK[pIdx];
  const intProd = (BigInt(vStripPoint(q.a)) * BigInt(vStripPoint(q.b))).toString();
  const decTotal = vDecimalsOf(q.a) + vDecimalsOf(q.b);
  const correctPos = intProd.length - decTotal; // 小数点插在第 correctPos 个数字后

  document.getElementById("pRound").textContent = pIdx + 1;
  document.getElementById("pQuestion").textContent = q.a + " × " + q.b + " = ?";
  document.getElementById("pIntProduct").textContent = intProd;
  document.getElementById("pDecTotal").textContent = decTotal;
  const fb = document.getElementById("pFeedback");
  fb.textContent = ""; fb.className = "feedback";
  document.getElementById("pNextQ").style.display = "none";

  const row = document.getElementById("pDigitRow");
  row.innerHTML = "";
  intProd.split("").forEach((ch, i) => {
    if (i > 0) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "把小数点放在第 " + i + " 个数字后");
      dot.className = "clickable-digit";
      dot.textContent = "·";
      dot.style.color = "#d9483f";
      dot.style.fontSize = "40px";
      dot.onclick = () => {
        if (pDone) return;
        if (i === correctPos) {
          pDone = true;
          dot.classList.add("picked-good");
          fb.className = "feedback ok";
          fb.textContent = "✅ 太棒了！因数共 " + decTotal + " 位小数，从右往左数 " + decTotal + " 位，点在这里！" +
            "答案是 " + vPlaceDecimal(intProd, decTotal);
          if (Math5.addStar("unit2", "practice" + pIdx)) fb.textContent += " 线索已确认！";
          document.getElementById("pNextQ").style.display = "";
        } else {
          dot.classList.add("picked-bad");
          fb.className = "feedback no";
          fb.textContent = "❌ 再想想：要从积的<b>最右边</b>往左数 " + decTotal + " 位哦。";
          setTimeout(() => dot.classList.remove("picked-bad"), 900);
        }
      };
      row.appendChild(dot);
    }
    const d = document.createElement("span");
    d.textContent = ch;
    row.appendChild(d);
  });
}
document.getElementById("pNextQ").onclick = () => {
  pIdx++;
  if (pIdx < P_BANK.length) pLoad();
  else {
    document.getElementById("pQuestion").textContent = "🎉 亲手练全部完成！去闯关挑战试试吧！";
    document.getElementById("pDigitRow").innerHTML = "";
    document.getElementById("pNextQ").style.display = "none";
  }
};
pLoad();

/* ---------- 闯关挑战：选择题 ---------- */
const G_BANK = [
  { q: "1.8 × 0.3 = ?", opts: ["5.4", "0.54", "54"], ans: 1, why: "18×3=54，因数共 2 位小数 → 0.54" },
  { q: "2.6 × 1.5 = ?", opts: ["3.9", "39", "0.39"], ans: 0, why: "26×15=390，共 2 位小数 → 3.9" },
  { q: "0.37 × 0.4 = ?", opts: ["1.48", "0.148", "0.0148"], ans: 1, why: "37×4=148，共 3 位小数 → 0.148" },
  { q: "4.5 × 0.6 = ?", opts: ["2.7", "0.27", "27"], ans: 0, why: "45×6=270，共 2 位小数 → 2.70，末尾 0 化简 → 2.7" },
  { q: "一个数（0除外）乘 0.99，积比原来的数（　）", opts: ["大一些", "小一些", "不变"], ans: 1, why: "乘比 1 小的数，越乘越小！乘 1.01 才变大" },
  { q: "0.72 × 0.06 = ?", opts: ["0.0432", "0.432", "4.32"], ans: 0, why: "72×6=432，共 4 位小数，位数不够前面补 0 → 0.0432" },
  { q: "1.25 × 0.8 = ?", opts: ["1", "10", "0.01"], ans: 0, why: "125×8=1000，共 3 位小数 → 1.000，化简 → 1" },
  { q: "一个数（0除外）乘 1.01，积比原来的数（　）", opts: ["大一些", "小一些", "不变"], ans: 0, why: "乘比 1 大的数，越乘越大" },
  { q: "一个因数扩大到原来的 10 倍，另一个因数不变，积（　）", opts: ["不变", "扩大到原来的 10 倍", "扩大到原来的 100 倍"], ans: 1, why: "积随因数等倍变化：一个因数 ×10，积也 ×10" },
  { q: "3.5 × 0.98 的积比 3.5（　）", opts: ["大一些", "小一些", "相等"], ans: 1, why: "0.98 < 1，乘比 1 小的数越乘越小，所以积比 3.5 小" },
  { q: "13 × 0.2 = ?", opts: ["2.6", "0.26", "26"], ans: 0, why: "13×2=26，共 1 位小数 → 2.6" },
  { q: "0.56 × 0.04 = ?", opts: ["0.0224", "0.224", "2.24"], ans: 0, why: "56×4=224，共 4 位小数，位数不够补 0 → 0.0224" },
];
let gIdx = 0, gScore = 0;

function gLoad() {
  document.getElementById("gRound").textContent = gIdx + 1;
  document.getElementById("gFeedback").textContent = "";
  document.getElementById("gFeedback").className = "feedback";
  document.getElementById("gNext").style.display = "none";
  const q = G_BANK[gIdx];
  let answered = false;
  document.getElementById("gQuestion").textContent = q.q;
  const box = document.getElementById("gOptions");
  box.innerHTML = "";
  q.opts.forEach((opt, oi) => {
    const b = document.createElement("button");
    b.className = "btn-opt";
    b.textContent = opt;
    b.onclick = () => {
      if (answered) return;
      const fb = document.getElementById("gFeedback");
      if (oi === q.ans) {
        answered = true;
        b.classList.add("correct");
        gScore++;
        document.getElementById("gScore").textContent = gScore;
        fb.className = "feedback ok";
        fb.textContent = "✅ 答对了！ " + q.why;
        if (gIdx === G_BANK.length - 1) gFinish();
        else document.getElementById("gNext").style.display = "";
      } else {
        b.classList.add("wrong");
        fb.className = "feedback no";
        Math5.addWrong("unit2", q);
        fb.textContent = "❌ 再想想哦：" + q.why;
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
    if (Math5.addStar("unit2", "game")) el.innerHTML = "案卷完成，已盖完成印章。";
    else el.innerHTML = "这份案卷已经盖过完成印章，继续保持！";
  } else {
    el.innerHTML = "答对 " + gScore + " / " + G_BANK.length + " 题，差一点点！点击「重新演示」复习后再来挑战吧！";
  }
}
document.getElementById("gNext").onclick = () => { if (gIdx >= G_BANK.length - 1) return; gIdx++; gLoad(); };
gLoad();
