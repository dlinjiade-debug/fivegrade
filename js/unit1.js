/* ===== 单元一 · 观察简单组合体（3D 版） ===== */
Math5.initUnitPage("unit1", "单元一 · 观察简单组合体");

/* ---------- 2D 视图工具 ---------- */
/** 统计某方向视图：front/left 保留每个投影高度；top 保留占地形状 */
function viewGrid(cubes, dir) {
  const map = {};
  cubes.forEach(c => {
    let k, v;
    if (dir === "front") { k = c.x; v = c.z; }
    else if (dir === "top") { k = c.x + "," + c.y; v = 0; }
    else { k = c.y; v = c.z; }
    if (!map[k]) map[k] = { has: false, max: -1, levels: {} };
    map[k].has = true;
    map[k].levels[v] = true;
    if (v > map[k].max) map[k].max = v;
  });
  return map;
}
/** 画 2D 视图小方格图 */
function drawView(cubes, dir, size) {
  size = size || 34;
  const map = viewGrid(cubes, dir);
  if (dir === "top") {
    const pts = Object.keys(map).map(k => k.split(",").map(Number));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const w = maxx - minx + 1, h = maxy - miny + 1;
    let s = '<svg width="' + (w * size + 4) + '" height="' + (h * size + 4) + '" viewBox="0 0 ' + (w * size + 4) + " " + (h * size + 4) + '">';
    pts.forEach(p => {
      // 俯视图：上 = 后（y 大）
      s += '<rect x="' + (2 + (p[0] - minx) * size) + '" y="' + (2 + (maxy - p[1]) * size) +
        '" width="' + (size - 3) + '" height="' + (size - 3) +
        '" fill="#a9d3f0" stroke="#2f6fb0" stroke-width="1.5" rx="3"/>';
    });
    return s + "</svg>";
  }
  // front: 列按 x 升序（图左 = x 小）；left: 列按 y 降序（图左 = 后）
  const keys = Object.keys(map).map(Number).sort((a, b) => dir === "left" ? b - a : a - b);
  const maxH = Math.max(...keys.map(k => map[k].max)) + 1;
  const w = keys.length;
  let s = '<svg width="' + (w * size + 4) + '" height="' + (maxH * size + 4) + '" viewBox="0 0 ' + (w * size + 4) + " " + (maxH * size + 4) + '">';
  keys.forEach((k, ci) => {
    for (let z = 0; z <= map[k].max; z++) {
      if (!map[k].levels[z]) continue;
      const px = 2 + ci * size, py = 2 + (maxH - 1 - z) * size;
      s += '<rect x="' + px + '" y="' + py + '" width="' + (size - 3) + '" height="' + (size - 3) +
        '" fill="#a9d3f0" stroke="#2f6fb0" stroke-width="1.5" rx="3"/>';
    }
  });
  return s + "</svg>";
}
/** 根据每列层数画视图 */
function drawMaxesSVG(maxes, size) {
  size = size || 36;
  const maxH = Math.max(...maxes);
  let s = '<svg width="' + (maxes.length * size + 4) + '" height="' + (maxH * size + 4) + '" viewBox="0 0 ' + (maxes.length * size + 4) + " " + (maxH * size + 4) + '">';
  maxes.forEach((m, ci) => {
    for (let z = 0; z < m; z++) {
      s += '<rect x="' + (2 + ci * size) + '" y="' + (2 + (maxH - 1 - z) * size) + '" width="' + (size - 3) +
        '" height="' + (size - 3) + '" fill="#a9d3f0" stroke="#2f6fb0" stroke-width="1.5" rx="3"/>';
    }
  });
  return s + "</svg>";
}
/** 俯视形状选项 */
function drawShapeSVG(pts, size) {
  size = size || 36;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  let s = '<svg width="' + ((maxx - minx + 1) * size + 4) + '" height="' + ((maxy - miny + 1) * size + 4) +
    '" viewBox="0 0 ' + ((maxx - minx + 1) * size + 4) + " " + ((maxy - miny + 1) * size + 4) + '">';
  pts.forEach(p => {
    s += '<rect x="' + (2 + (p[0] - minx) * size) + '" y="' + (2 + (maxy - p[1]) * size) +
      '" width="' + (size - 3) + '" height="' + (size - 3) +
      '" fill="#a9d3f0" stroke="#2f6fb0" stroke-width="1.5" rx="3"/>';
  });
  return s + "</svg>";
}

/* ---------- 组合体库（7 个，覆盖教材全部题型） ---------- */
const STRUCTS = {
  demo1:   [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }],
  twoCol:  [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }],
  mountain:[{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 1 }, { x: 2, y: 0, z: 0 }],
  tallBase:[{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }],
  bridge:  [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }, { x: 2, y: 0, z: 1 }, { x: 2, y: 0, z: 0 }],
  stairs:  [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 1 }, { x: 1, y: 0, z: 2 }, { x: 1, y: 1, z: 0 }],
  tower:   [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 1, y: 1, z: 1 }],
};
const STRUCT_NAMES = {
  demo1: "组合体①", twoCol: "组合体②", mountain: "组合体③", tallBase: "组合体④",
  bridge: "组合体⑤", stairs: "组合体⑥", tower: "组合体⑦",
};

/* ---------- 视角表 ---------- */
const VIEWS = {
  front: { yaw: 0, pitch: 0, label: "正面" },
  back:  { yaw: Math.PI, pitch: 0, label: "背面" },
  left:  { yaw: Math.PI / 2, pitch: 0, label: "左面" },
  right: { yaw: -Math.PI / 2, pitch: 0, label: "右面" },
  top:   { yaw: 0.0001, pitch: Math.PI / 2 - 0.035, label: "上面" },
  iso:   { yaw: 0.46, pitch: 0.36, label: "斜角" },
};

/* ================================================================
 * ① 3D 观察台
 * ================================================================ */
const obs3d = new Voxel3D(document.getElementById("obsCanvas"), { unit: 64 });
obs3d.setCells(STRUCTS.demo1);

const obsBtns = document.getElementById("obsBtns");
const OBS_STRUCTS = ["demo1", "twoCol", "mountain", "tallBase", "bridge", "stairs", "tower"];
OBS_STRUCTS.forEach(k => {
  const b = document.createElement("button");
  b.className = "v3d-btn";
  b.textContent = STRUCT_NAMES[k];
  b.onclick = () => {
    obs3d.setCells(STRUCTS[k]);
    obs3d.setExplode(0);
    document.getElementById("explodeSlider").value = 0;
    obs3d.setView(VIEWS.iso.yaw, VIEWS.iso.pitch, true);
  };
  obsBtns.appendChild(b);
});
const sep = document.createElement("span");
sep.style.cssText = "border-left:2px solid #e3e9ec;margin:0 6px";
obsBtns.appendChild(sep);
Object.keys(VIEWS).forEach(vk => {
  const b = document.createElement("button");
  b.className = "v3d-btn";
  b.textContent = "👁 " + VIEWS[vk].label;
  b.onclick = () => {
    obs3d.autoRot = false;
    autoBtn.classList.remove("on");
    obs3d.setView(VIEWS[vk].yaw, VIEWS[vk].pitch, true);
  };
  obsBtns.appendChild(b);
});
const autoBtn = document.createElement("button");
autoBtn.className = "v3d-btn";
autoBtn.textContent = "🔄 自动旋转";
autoBtn.onclick = () => {
  obs3d.autoRot = !obs3d.autoRot;
  autoBtn.classList.toggle("on", obs3d.autoRot);
};
obsBtns.appendChild(autoBtn);

document.getElementById("explodeSlider").oninput = function () {
  obs3d.setExplode(this.value / 100);
};
document.getElementById("xrayToggle").onchange = function () {
  obs3d.setXray(this.checked);
};

/* ================================================================
 * ② 跟我学 · 三视图（3D 模型自动转向 + 2D 视图对照）
 * ================================================================ */
const demo3d = new Voxel3D(document.createElement("canvas"));
demo3d.canvas.width = 420; demo3d.canvas.height = 320;
demo3d.canvas.style.cssText = "background:linear-gradient(#fbfcfd,#eef4f7);border:2px solid #dfe6ea;border-radius:14px;cursor:grab;max-width:100%";

const stage = document.getElementById("demoStage");
const demoBtns = document.getElementById("demoBtns");
let stepper = null;

function viewPairHTML(struct, dir, cap) {
  return '<div style="text-align:center"><div style="color:#2f6fb0;font-weight:bold;margin-bottom:6px">' +
    cap + '</div><div style="background:#fff;border:2px solid #a9d3f0;border-radius:12px;padding:10px;display:inline-block">' +
    drawView(struct, dir) + "</div></div>";
}
function mountDemo(el, struct, viewKey, extraHTML) {
  el.innerHTML = '<div style="display:flex;gap:24px;justify-content:center;align-items:center;flex-wrap:wrap">' +
    '<div class="d3d-slot"></div>' + (extraHTML || "") + "</div>";
  el.querySelector(".d3d-slot").appendChild(demo3d.canvas);
  demo3d.setCells(struct);
  const v = VIEWS[viewKey];
  demo3d.autoRot = false;
  demo3d.setView(v.yaw, v.pitch, true);
}

function buildDemoSteps(key) {
  const struct = STRUCTS[key];
  const steps = [];
  /* 手写口诀辅助 */
  const F = (text, color) => ({ text: text, color: color || "ink", anim: true });
  const hwLines = (lines, size) => {
    const card = document.createElement("div");
    card.className = "hw-card";
    lines.forEach(l => HW.write(card, l, { size: size || 42 }));
    return card;
  };
  const footprintCount = new Set(struct.map(c => c.x + "," + c.y)).size;
  const stackedCount = struct.length - footprintCount;
  steps.push({
    explain: "这是<b>" + STRUCT_NAMES[key] + "</b>，由 <b>" + struct.length + "</b> 个小正方体搭成。" +
      "这个 3D 模型可以<b>拖动旋转</b>——先转一转，从各个方向看看它长什么样！",
    render(el) {
      mountDemo(el, struct, "iso");
      el.appendChild(hwLines([
        [F("俯视占地 ", "ink"), F(String(footprintCount), "blue"), F(" 处 + 上方叠放 ", "ink"), F(String(stackedCount), "red"), F(" 个", "ink")],
        [F(footprintCount + " + " + stackedCount, "ink"), F(" = ", "op"), F(String(struct.length), "green"), F(" 个", "ink")],
      ]));
    },
  });
  const frontGrid = viewGrid(struct, "front");
  const frontCounts = Object.keys(frontGrid).sort((a, b) => a - b)
    .map(k => Object.keys(frontGrid[k].levels).length);
  steps.push({
    explain: "<b>从正面看：</b>3D 模型已经转到正面啦。每一竖列投影有 <b>" +
      frontCounts.join("、") + " 个格</b>，方格仍要放在原来的高度；前后重合只画一个。",
    render(el) { mountDemo(el, struct, "front", viewPairHTML(struct, "front", "正面视图")); },
  });
  steps.push({
    explain: "<b>从上面看：</b>现在像小鸟一样俯视！看到的是它的<b>占地形状</b>——" +
      "不管多高，只看哪里有方块。把每个方块的「脚印」画下来就是上面视图。",
    render(el) { mountDemo(el, struct, "top", viewPairHTML(struct, "top", "上面视图（俯视）")); },
  });
  steps.push({
    explain: "<b>从左面看：</b>模型转到左边了！还是「列 + 层」，但这次列是<b>前后方向</b>——" +
      "图上右边是<b>前面</b>，左边是<b>后面</b>。",
    render(el) { mountDemo(el, struct, "left", viewPairHTML(struct, "left", "左面视图")); },
  });
  steps.push({
    explain: "<b>小结：</b>三个方向的视图都找到了！回到斜角再看一眼整体，" +
      "想想：<b>从哪个方向看，看到的方块个数最少？</b>（去观察台转一转验证吧）",
    render(el) { mountDemo(el, struct, "iso"); },
  });
  return steps;
}
["demo1", "twoCol", "mountain", "tallBase", "bridge", "stairs", "tower"].forEach(k => {
  const btn = document.createElement("button");
  btn.className = "btn green";
  btn.textContent = STRUCT_NAMES[k];
  btn.onclick = () => {
    demoBtns.querySelectorAll("button").forEach(b => (b.style.outline = ""));
    btn.style.outline = "3px solid #e8943a";
    stepper = Stepper(buildDemoSteps(k), stage);
  };
  demoBtns.appendChild(btn);
});
document.getElementById("btnNext").onclick = () => stepper && stepper.next();
document.getElementById("btnPrev").onclick = () => stepper && stepper.prev();
document.getElementById("btnReset").onclick = () => stepper && stepper.reset();

/* ================================================================
 * ③ 亲手练 · 选出正确的视图（混合方向，可拖动 3D 求证）
 * ================================================================ */
const P_BANK = [
  { cells: "twoCol", dir: "front", correct: [2, 1], wrongs: [[1, 1], [1, 2]], why: "左列（x小）最高 2 层、右列 1 层；后排的方块被挡住，不增加格子" },
  { cells: "twoCol", dir: "left", correct: [1, 2], wrongs: [[2, 1], [1, 1]], why: "左面看：图右是前面（2 层），图左是后面（1 层）" },
  { cells: "tallBase", dir: "top", correct: [[0, 0], [1, 0], [0, 1], [1, 1]], wrongs: [[[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [2, 0]]], why: "俯视只看「脚印」：2×2 的正方形底座，跟高度无关" },
  { cells: "stairs", dir: "front", correct: [2, 3], wrongs: [[3, 2], [2, 2]], why: "左列最高 2 层、右列是阶梯到 3 层；后面藏的 1 块被挡住" },
  { cells: "tower", dir: "front", correct: [2, 2], wrongs: [[2, 1], [1, 2]], why: "左右两列都是 2 层（右列的上面那块在后排，但最高还是 2 层）" },
];
const DIR_LABEL = { front: "从正面看", left: "从左面看", top: "从上面看" };
let pIdx = 0;
const p3d = new Voxel3D(document.getElementById("pCanvas"), { unit: 56 });

function pOptionHTML(q) {
  return q.dir === "top"
    ? drawShapeSVG(q.correct, 40)
    : drawMaxesSVG(q.correct, 40);
}
function pViewOptionLabel(dir, value, optionIndex) {
  const prefix = "视图选项 " + (optionIndex + 1) + "：";
  if (dir === "top") {
    return prefix + "占地格坐标为" + value
      .map(p => "（" + p[0] + "，" + p[1] + "）")
      .join("、");
  }
  return prefix + "从左到右列高依次为 " + value.join("、");
}
function pLoad() {
  const q = P_BANK[pIdx];
  p3d.setCells(STRUCTS[q.cells]);
  p3d.setView(VIEWS.iso.yaw, VIEWS.iso.pitch, false);
  document.getElementById("pRound").textContent = pIdx + 1;
  document.getElementById("pDirQ").textContent = DIR_LABEL[q.dir];
  const fb = document.getElementById("pFeedback");
  fb.textContent = ""; fb.className = "feedback";
  document.getElementById("pNextQ").style.display = "none";
  const box = document.getElementById("pOptions");
  box.innerHTML = "";
  const opts = [{ v: q.correct, ok: true }]
    .concat(q.wrongs.map(w => ({ v: w, ok: false })))
    .sort(() => Math.random() - 0.5);
  opts.forEach((o, optionIndex) => {
    const wrap = document.createElement("button");
    wrap.type = "button";
    wrap.setAttribute("aria-label", pViewOptionLabel(q.dir, o.v, optionIndex));
    wrap.style.cssText = "text-align:center;background:#fbfcfd;border:3px solid #dfe6ea;border-radius:12px;padding:10px;cursor:pointer;transition:all .15s";
    wrap.innerHTML = q.dir === "top" ? drawShapeSVG(o.v, 40) : drawMaxesSVG(o.v, 40);
    wrap.onmouseenter = () => (wrap.style.borderColor = "#3a7cb8");
    wrap.onmouseleave = () => (wrap.style.borderColor = "#dfe6ea");
    wrap.onclick = () => {
      const fb = document.getElementById("pFeedback");
      if (o.ok) {
        wrap.style.borderColor = "#2f7d5f"; wrap.style.background = "#d7eae0";
        fb.className = "feedback ok";
        fb.textContent = "✅ 答对了！" + q.why;
        if (Math5.addStar("unit1", "practice" + pIdx)) fb.textContent += " 线索已确认！";
        document.getElementById("pNextQ").style.display = "";
      } else {
        wrap.style.borderColor = "#d9483f"; wrap.style.background = "#f6cfcb";
        fb.className = "feedback no";
        fb.textContent = "❌ 不对哦。可以拖动 3D 模型转到「" + DIR_LABEL[q.dir].slice(1) + "」方向亲眼看一看！";
        setTimeout(() => { wrap.style.borderColor = "#dfe6ea"; wrap.style.background = "#fbfcfd"; }, 1200);
      }
    };
    box.appendChild(wrap);
  });
}
document.getElementById("pHint").onclick = () => {
  const q = P_BANK[pIdx];
  const v = VIEWS[q.dir];
  p3d.setView(v.yaw, v.pitch, true);
};
document.getElementById("pNextQ").onclick = () => {
  pIdx++;
  if (pIdx < P_BANK.length) pLoad();
  else {
    document.getElementById("pFeedback").className = "feedback ok";
    document.getElementById("pFeedback").textContent = "🎉 亲手练全部完成！去闯关挑战试试吧！";
    document.getElementById("pOptions").innerHTML = "";
    document.getElementById("pNextQ").style.display = "none";
  }
};
pLoad();

/* ================================================================
 * ④ 闯关挑战 · 小侦探数方块
 * ================================================================ */
const G_BANK = [
  { key: "demo1", ans: 4, hint: "前面看得见 3 个？后面和上面还有吗？", why: "看得见 3 个 + 后面藏着 1 个支撑 = 4 个" },
  { key: "twoCol", ans: 4, hint: "右边那列为什么立得稳？想想下面！", why: "看得见 3 个，右列后排还藏着 1 个 = 4 个" },
  { key: "tallBase", ans: 5, hint: "2×2 的底座有几块？上面还有 1 块！", why: "2×2 底座 4 个 + 左前上方 1 个 = 5 个" },
  { key: "stairs", ans: 6, hint: "最高的柱子有 3 层，底层一定有方块托着！", why: "阶梯 5 个 + 后排藏着 1 个 = 6 个" },
  { key: "tower", ans: 6, hint: "上层有 2 块，每块下面都要有支撑！", why: "2×2 底座 4 个 + 上面 2 个 = 6 个" },
];
let gIdx = 0, gScore = 0, gUsedXray = false;
const g3d = new Voxel3D(document.getElementById("gCanvas"), { unit: 56 });

function gLoad() {
  document.getElementById("gRound").textContent = gIdx + 1;
  const q = G_BANK[gIdx];
  let answered = false;
  gUsedXray = false;
  g3d.setCells(STRUCTS[q.key]);
  g3d.setXray(false);
  g3d.setView(VIEWS.iso.yaw, VIEWS.iso.pitch, false);
  const xb = document.getElementById("gXray");
  xb.textContent = "👓 使用透视眼（诚实小侦探尽量不靠它哦）";
  xb.classList.remove("on");
  document.getElementById("gQuestion").textContent = "🕵️ 这个组合体一共用了几个小正方体？（小心被挡住的！）";
  const fb = document.getElementById("gFeedback");
  fb.textContent = ""; fb.className = "feedback";
  document.getElementById("gNext").style.display = "none";
  const box = document.getElementById("gOptions");
  box.innerHTML = "";
  const opts = [q.ans, q.ans - 1, q.ans + 1].sort(() => Math.random() - 0.5);
  opts.forEach(o => {
    const b = document.createElement("button");
    b.className = "btn-opt";
    b.textContent = o + " 个";
    b.onclick = () => {
      if (answered) return;
      if (o === q.ans) {
        answered = true;
        b.classList.add("correct");
        gScore++;
        document.getElementById("gScore").textContent = gScore;
        fb.className = "feedback ok";
        fb.textContent = "✅ 好眼力！" + q.why + (gUsedXray ? "（用了透视眼也很棒，下次试试先想一想！）" : "");
        if (gIdx === G_BANK.length - 1) gFinish();
        else document.getElementById("gNext").style.display = "";
      } else {
        b.classList.add("wrong");
        fb.className = "feedback no";
        Math5.addWrong("unit1", q);
        fb.textContent = "❌ " + q.hint;
        setTimeout(() => b.classList.remove("wrong"), 1200);
      }
    };
    box.appendChild(b);
  });
}
function gFinish() {
  const el = document.getElementById("gFinal");
  el.style.display = "";
  if (gScore >= 4) {
    if (Math5.addStar("unit1", "game")) el.innerHTML = "小侦探破案成功，案卷已盖完成印章。";
    else el.innerHTML = "这份案卷已经盖过完成印章，继续保持！";
  } else {
    el.innerHTML = "答对 " + gScore + " / 5 题，记住口诀「看不见 ≠ 没有」，再来一次！";
  }
}
document.getElementById("gXray").onclick = function () {
  gUsedXray = true;
  g3d.setXray(!g3d.xray);
  this.classList.toggle("on", g3d.xray);
  this.textContent = g3d.xray ? "👓 透视眼开启中（红色 = 被挡住的方块）" : "👓 使用透视眼（诚实小侦探尽量不靠它哦）";
};
document.getElementById("gNext").onclick = () => { if (gIdx >= G_BANK.length - 1) return; gIdx++; gLoad(); };
gLoad();
