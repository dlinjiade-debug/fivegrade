/* ===== 单元三 · 小数除法 ===== */
Math5.initUnitPage("unit3", "单元三 · 小数除法");

/* ---------- 跟我学：竖式分步演示 ---------- */
const DEMOS = [
  { a: "22.4", b: "4", label: "例1：除数是整数 22.4 ÷ 4", note: "商的小数点和被除数对齐" },
  { a: "7.65", b: "0.85", label: "例2：除数是小数 7.65 ÷ 0.85", note: "先转化成 765 ÷ 85" },
  { a: "3.8", b: "0.5", label: "例3：要添 0 继续除 3.8 ÷ 0.5", note: "余数不为 0 时末尾添 0" },
  { a: "10", b: "3", label: "例4：除不尽怎么办？10 ÷ 3", note: "认识循环小数" },
  { a: "12.6", b: "0.28", label: "例5：点错就全错！12.6 ÷ 0.28", note: "转化时被除数要点不出错：1260 ÷ 28" },
  { a: "16", b: "5", label: "例6：整数除整数 16 ÷ 5", note: "整数部分除完先点小数点，再添 0" },
];

let stepper = null;
const stage = document.getElementById("demoStage");
const exBtns = document.getElementById("exampleBtns");

function loadDemo(d) {
  stepper = Stepper(buildDivSteps(d.a, d.b), stage);
}
DEMOS.forEach(d => {
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

/* ---------- 亲手练：小数点搬家 ---------- */
const P_BANK = [
  { q: "5.98 ÷ 0.23", opts: ["598 ÷ 23", "59.8 ÷ 23", "5.98 ÷ 23"], ans: 0, why: "除数 0.23→23 右移 2 位，被除数 5.98→598 也要右移 2 位" },
  { q: "12.6 ÷ 0.28", opts: ["126 ÷ 28", "12.6 ÷ 28", "1260 ÷ 28"], ans: 2, why: "0.28→28 右移 2 位；12.6 右移 2 位要点不出错：126.0 = 1260" },
  { q: "0.756 ÷ 0.18", opts: ["75.6 ÷ 18", "756 ÷ 18", "0.756 ÷ 18"], ans: 0, why: "0.18→18 右移 2 位，0.756→75.6 同样右移 2 位" },
  { q: "51.3 ÷ 0.27", opts: ["513 ÷ 27", "51.3 ÷ 27", "5130 ÷ 27"], ans: 2, why: "同时右移 2 位：51.3→5130，0.27→27" },
  { q: "7.2 ÷ 0.24", opts: ["72 ÷ 24", "720 ÷ 24", "7.2 ÷ 24"], ans: 1, why: "同时右移 2 位：7.2→720（要点不出），0.24→24" },
  { q: "0.9 ÷ 0.045", opts: ["90 ÷ 45", "9 ÷ 45", "900 ÷ 45"], ans: 2, why: "同时右移 3 位：0.9→900，0.045→45" },
  { q: "1.44 ÷ 1.2", opts: ["144 ÷ 12", "14.4 ÷ 12", "1.44 ÷ 12"], ans: 1, why: "同时右移 1 位：1.44→14.4，1.2→12" },
  { q: "62.4 ÷ 2.6", opts: ["624 ÷ 26", "62.4 ÷ 26", "624 ÷ 260"], ans: 0, why: "同时右移 1 位：62.4→624，2.6→26" },
];
let pIdx = 0;

function pLoad() {
  document.getElementById("pRound").textContent = pIdx + 1;
  const q = P_BANK[pIdx];
  document.getElementById("pQuestion").textContent = q.q + " = ?";
  const fb = document.getElementById("pFeedback");
  fb.textContent = ""; fb.className = "feedback";
  document.getElementById("pNextQ").style.display = "none";
  const box = document.getElementById("pOptions");
  box.innerHTML = "";
  q.opts.forEach((opt, oi) => {
    const b = document.createElement("button");
    b.className = "btn-opt";
    b.textContent = opt;
    b.onclick = () => {
      if (oi === q.ans) {
        b.classList.add("correct");
        fb.className = "feedback ok";
        fb.textContent = "✅ 答对了！ " + q.why;
        if (Math5.addStar("unit3", "practice" + pIdx)) fb.textContent += " 线索已确认！";
        document.getElementById("pNextQ").style.display = "";
      } else {
        b.classList.add("wrong");
        fb.className = "feedback no";
        Math5.addWrong("unit3", q);
        fb.textContent = "❌ 想想口诀：「你移几位，我也移几位」。提示：" + q.why.slice(0, q.why.length);
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
    document.getElementById("pQuestion").textContent = "🎉 转化练习全部完成！去闯关挑战试试吧！";
    document.getElementById("pOptions").innerHTML = "";
    document.getElementById("pNextQ").style.display = "none";
  }
};
pLoad();

/* ---------- 闯关挑战 ---------- */
const G_BANK = [
  { q: "商的小数点要和（　）的小数点对齐", opts: ["除数", "被除数", "随便哪个"], ans: 1, why: "商的小数点和被除数的小数点对齐，因为是一位一位按顺序除的" },
  { q: "4.8 ÷ 0.6 = ?", opts: ["0.8", "8", "80"], ans: 1, why: "转化：48 ÷ 6 = 8" },
  { q: "7.5 ÷ 0.25 = ?", opts: ["3", "30", "300"], ans: 1, why: "转化：750 ÷ 25 = 30。除以比 1 小的数，商比被除数还大！" },
  { q: "3.6 ÷ 0.9 的商和 3.6 相比（　）", opts: ["商更大", "商更小", "相等"], ans: 0, why: "除以小于 1 的数（0 除外），商比被除数大：转化后 36 ÷ 9 = 4 > 3.6" },
  { q: "0.32 ÷ 0.05 的商和 0.32 相比（　）", opts: ["大于", "小于", "等于"], ans: 0, why: "除以小于 1 的数（0除外），商比被除数大：32 ÷ 5 = 6.4 > 0.32" },
  { q: "5.6 ÷ 7 = ?", opts: ["0.8", "8", "0.08"], ans: 0, why: "56÷7=8，商的小数点和被除数的小数点对齐 → 0.8" },
  { q: "1.69 ÷ 0.26 = ?", opts: ["6.5", "0.65", "65"], ans: 0, why: "转化：169 ÷ 26 = 6.5" },
  { q: "一个数（0除外）÷ 0.01，商和这个数相比（　）", opts: ["商更大", "商更小", "相等"], ans: 0, why: "除以 0.01 相当于 ×100，所以商更大" },
  { q: "0.75 ÷ 0.15 = ?", opts: ["5", "0.5", "50"], ans: 0, why: "转化：75 ÷ 15 = 5" },
  { q: "一个数（0除外）÷ 1.01，商比原来的数（　）", opts: ["大一些", "小一些", "不变"], ans: 1, why: "除以比 1 大的数，商变小；除以比 1 小的数（0除外），商变大" },
  { q: "计算 12.6 ÷ 0.28 时，转化正确的是（　）", opts: ["1260 ÷ 28", "126 ÷ 28", "12.6 ÷ 28"], ans: 0, why: "小数点同时右移 2 位：0.28→28，12.6→126.0，也就是 1260" },
  { q: "2.4 ÷ 0.12 = 20，验算时应该用（　）", opts: ["20 × 0.12，看是否等于 2.4", "2.4 × 0.12", "20 ÷ 2.4"], ans: 0, why: "除法验算：商 × 除数 = 被除数" },
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
        Math5.addWrong("unit3", q);
        fb.textContent = "❌ 再想想哦！";
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
    if (Math5.addStar("unit3", "game")) el.innerHTML = "案卷完成，已盖完成印章。";
    else el.innerHTML = "这份案卷已经盖过完成印章，继续保持！";
  } else {
    el.innerHTML = "答对 " + gScore + " / " + G_BANK.length + " 题，再复习一下「算理揭秘」来挑战吧！";
  }
}
document.getElementById("gNext").onclick = () => { if (gIdx >= G_BANK.length - 1) return; gIdx++; gLoad(); };
gLoad();
