/* ===== 单元四 · 图形的运动 ===== */
Math5.initUnitPage("unit4", "单元四 · 图形的运动");

/* ---------- SVG 网格绘制工具 ---------- */
const CELL = 30;
function gridSVG(opts) {
  const { w, h, polys = [], dots = [], labels = [], arrows = [] } = opts;
  const W = w * CELL, H = h * CELL;
  let s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" style="max-width:100%">';
  s += '<rect width="' + W + '" height="' + H + '" fill="#fbfcfd"/>';
  for (let i = 0; i <= w; i++) s += '<line x1="' + i * CELL + '" y1="0" x2="' + i * CELL + '" y2="' + H + '" stroke="#e3e9ec"/>';
  for (let j = 0; j <= h; j++) s += '<line x1="0" y1="' + j * CELL + '" x2="' + W + '" y2="' + j * CELL + '" stroke="#e3e9ec"/>';
  polys.forEach(p => {
    const pts = p.points.map(pt => (pt[0] * CELL) + "," + (pt[1] * CELL)).join(" ");
    s += '<polygon points="' + pts + '" fill="' + (p.fill || "#5b9bd5") + '" opacity="' + (p.opacity || 0.9) +
      '" stroke="' + (p.stroke || "#2f6fb0") + '" stroke-width="2"/>';
  });
  dots.forEach(d => {
    s += '<circle cx="' + d[0] * CELL + '" cy="' + d[1] * CELL + '" r="5" fill="#d9483f"/>';
  });
  labels.forEach(L => {
    s += '<text x="' + L[0] * CELL + '" y="' + L[1] * CELL + '" font-size="15" fill="#5b6c7a" font-weight="bold" text-anchor="middle">' + L[2] + "</text>";
  });
  arrows.forEach(a => {
    const x1 = a[0] * CELL, y1 = a[1] * CELL, x2 = a[2] * CELL, y2 = a[3] * CELL;
    s += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#e8943a" stroke-width="3" marker-end="url(#arr)" stroke-dasharray="6 4"/>';
  });
  s += '<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#e8943a"/></marker></defs>';
  return s + "</svg>";
}
function triAt(pts) { return { points: pts, fill: "#5b9bd5" }; }
function triGhost(pts) { return { points: pts, fill: "#dfe6ea", opacity: 0.45, stroke: "#7d8b96" }; }

/* ---------- 跟我学 ---------- */
let stepper = null;
const stage = document.getElementById("demoStage");
const demoBtns = document.getElementById("demoBtns");

/* ---- 手写口诀辅助 ---- */
function F(text, color) { return { text: text, color: color || "ink", anim: true }; }
function hwLines(lines, size) {
  const card = document.createElement("div");
  card.className = "hw-card";
  lines.forEach(l => HW.write(card, l, { size: size || 42 }));
  return card;
}

const BASE_TRI = [[1, 1], [3, 1], [1, 3]];

function demoTranslate() {
  const steps = [];
  steps.push({
    explain: "<b>平移开始！</b>蓝色三角形要从现在位置<b>向右平移 4 格</b>。记住：平移只挪位置，<b>不转身、不变样</b>。",
    render(el) { el.innerHTML = gridSVG({ w: 9, h: 5, polys: [triAt(BASE_TRI)] }); },
  });
  for (let i = 1; i <= 4; i++) {
    const moved = BASE_TRI.map(p => [p[0] + i, p[1]]);
    steps.push({
      explain: "<b>向右第 " + i + " 格……</b>跟着箭头一起走！" + (i === 4 ? "<b>到达！</b>看：形状、大小、朝向都没变，只是位置变了。" : ""),
      render(el) {
        el.innerHTML = gridSVG({
          w: 9, h: 5,
          polys: [triGhost(BASE_TRI), triAt(moved)],
          arrows: [[4, 4.5], [7.4, 4.5]],
          labels: [[4, 4.85, "向右平移4格"]],
        });
      },
    });
  }
  return steps;
}

function demoRotate() {
  const cx = 5, cy = 2.5;
  const rel = [[0, 0], [-2, 0], [-2, 1.4]]; // 相对旋转中心
  function rotated(deg) {
    const r = (deg * Math.PI) / 180;
    return rel.map(p => {
      const x = p[0] * Math.cos(r) - p[1] * Math.sin(r);
      const y = p[0] * Math.sin(r) + p[1] * Math.cos(r);
      return [cx + x, cy + y];
    });
  }
  const plan = [
    { deg: 30, txt: "绕红点（旋转中心）<b>顺时针转 30°……</b>" },
    { deg: 60, txt: "<b>60°……</b>注意：整个图形都在绕着红点转圈圈，每个点离中心的距离不变！" },
    { deg: 90, txt: "<b>90°，到达！</b>旋转三要素：绕<b>哪个点</b>、什么<b>方向</b>、转<b>多少度</b>。" },
  ];
  const steps = [{
    explain: "<b>旋转开始！</b>蓝色直角三角形要绕红点<b>顺时针旋转 90°</b>。",
    render(el) { el.innerHTML = gridSVG({ w: 9, h: 5, polys: [triAt(rotated(0))], dots: [[cx, cy]], labels: [[cx, cy + 0.55, "O"]] }); },
  }];
  plan.forEach(p => {
    steps.push({
      explain: "<b>" + p.txt + "</b>",
      render(el) {
        el.innerHTML = gridSVG({
          w: 9, h: 5,
          polys: [triGhost(rotated(0)), triAt(rotated(p.deg))],
          dots: [[cx, cy]], labels: [[cx, cy + 0.55, "O"]],
        });
      },
    });
  });
  return steps;
}

function demoReflect() {
  const axis = 5; // 对称轴 x=5
  const shape = [[6, 1], [8, 1], [6, 3]]; // 轴右侧的小旗
  const mirror = p => [2 * axis - p[0], p[1]];
  const mirrored = shape.map(mirror);  const steps = [{
    explain: "<b>轴对称（照镜子）！</b>红色虚线是<b>对称轴</b>。蓝色小旗要在轴左边照出一个一模一样的像。",
    render(el) {
      el.innerHTML = gridSVG({
        w: 10, h: 5,
        polys: [triAt(shape)],
        labels: [[axis, 0.7, "轴"]], lines: true,
      }).replace("</svg>", '<line x1="' + axis * CELL + '" y1="0" x2="' + axis * CELL + '" y2="' + 5 * CELL + '" stroke="#d9483f" stroke-width="2.5" stroke-dasharray="7 5"/></svg>');
    },
  }];
  shape.forEach((p, i) => {
    const shown = mirrored.slice(0, i + 1);
    steps.push({
      explain: "<b>找第 " + (i + 1) + " 个对应点：</b>这个点在轴<b>右边 " + (p[0] - axis) + " 格</b>，" +
        "那么它的像就在轴<b>左边 " + (p[0] - axis) + " 格</b>——距离相等！",
      render(el) {
        el.innerHTML = gridSVG({
          w: 10, h: 5,
          polys: [triAt(shape)],
          dots: shown,
          labels: [[axis, 0.7, "轴"]],
        }).replace("</svg>", '<line x1="' + axis * CELL + '" y1="0" x2="' + axis * CELL + '" y2="' + 5 * CELL + '" stroke="#d9483f" stroke-width="2.5" stroke-dasharray="7 5"/></svg>');
      },
    });
  });
  steps.push({
    explain: "<b>完成！</b>左边的紫色图形和右边完全对称。检查口诀：<b>对应点到轴的距离相等</b>。",
    render(el) {
      el.innerHTML = gridSVG({
        w: 10, h: 5,
        polys: [triAt(shape), { points: mirrored, fill: "#9a7bc2", opacity: 0.8, stroke: "#5a4480" }],
      }).replace("</svg>", '<line x1="' + axis * CELL + '" y1="0" x2="' + axis * CELL + '" y2="' + 5 * CELL + '" stroke="#d9483f" stroke-width="2.5" stroke-dasharray="7 5"/></svg>');
      el.appendChild(hwLines([
        [F("对应点", "blue"), F("到轴的距离", "ink"), F(" = ", "op"), F("相等", "green")],
      ]));
    },
  });
  return steps;
}

const DEMOS = [
  { label: "➡️ 平移", build: demoTranslate },
  { label: "🔄 旋转", build: demoRotate },
  { label: "🪞 轴对称", build: demoReflect },
  { label: "↘️ 斜着平移", build: demoTranslateDiag },
  { label: "🎯 旋转中心对比", build: demoRotateCenters },
  { label: "↔️ 横轴对称", build: demoReflectH },
];

/* 斜向平移：先右再下，走「楼梯」 */
function demoTranslateDiag() {
  const base = [[1, 3], [3, 3], [1, 5]];
  const steps = [{
    explain: "<b>平移可以斜着走！</b>蓝色三角形要<b>向右平移 3 格，再向下平移 2 格</b>。我们分两段走。",
    render(el) { el.innerHTML = gridSVG({ w: 8, h: 8, polys: [triAt(base)] }); },
  }];
  for (let i = 1; i <= 3; i++) {
    const p = base.map(q => [q[0] + i, q[1]]);
    steps.push({
      explain: "<b>第一段：向右第 " + i + " 格……</b>",
      render(el) { el.innerHTML = gridSVG({ w: 8, h: 8, polys: [triGhost(base), triAt(p)], arrows: [[2, 1.5], [4.6, 1.5]] }); },
    });
  }
  for (let i = 1; i <= 2; i++) {
    const p = base.map(q => [q[0] + 3, q[1] + i]);
    steps.push({
      explain: "<b>第二段：向下第 " + i + " 格……</b>" + (i === 2 ? "<b>到达！</b>注意两个关键点：①每对对应点都移动了相同的距离；②图形<b>一次都没有转身</b>。" : ""),
      render(el) { el.innerHTML = gridSVG({ w: 8, h: 8, polys: [triGhost(base), triAt(p)], arrows: [[4.6, 1.5], [4.6, 3.4]] }); },
    });
  }
  return steps;
}

/* 旋转中心对比：同一个图形绕不同点转 90°，落点完全不同 */
function demoRotateCenters() {
  const shape = [[3, 2], [5, 2], [3, 3]];
  function rot(p, c) { return [c[0] + (p[1] - c[1]), c[1] - (p[0] - c[0])]; }
  const aroundA = shape.map(p => rot(p, [3, 2])); // 绕左上角
  const aroundB = shape.map(p => rot(p, [4, 2.5])); // 绕斜边中点
  const mk = (c, after, extra) => gridSVG({
    w: 8, h: 6, polys: [triGhost(shape), triAt(after)], dots: [c], labels: [[c[0], c[1] + 0.55, "O"]],
  }) + '<div style="text-align:center;color:#7d8b96;margin-top:6px">' + extra + "</div>";
  return [
    {
      explain: "<b>旋转中心很重要！</b>同一个三角形，绕<b>不同的点</b>逆时针旋转 90°，会转到完全不同的地方。先绕左上角 A 转。",
      render(el) { el.innerHTML = mk([3, 2], aroundA, "绕左上角的点 O 逆时针旋转 90°"); },
    },
    {
      explain: "<b>再试一次：</b>同样的三角形，这次绕图形的<b>斜边中点 O</b> 逆时针旋转 90°——",
      render(el) { el.innerHTML = mk([4, 2.5], aroundB, "绕斜边中点 O 逆时针旋转 90°"); },
    },
    {
      explain: "<b>发现了吗？</b>两次都转了 90°，但落点不同！所以描述旋转必须说清三要素：<b>绕哪个点、什么方向、转多少度</b>，缺一个都不行。",
      render(el) {
        el.innerHTML = gridSVG({
          w: 8, h: 6, polys: [triGhost(shape), { points: aroundA, fill: "#6fb894", opacity: 0.85, stroke: "#2f7d5f" }, triAt(aroundB)],
          dots: [[3, 2], [4, 2.5]],
        });
        el.appendChild(hwLines([
          [F("中心", "blue"), F(" + ", "op"), F("方向", "green"), F(" + ", "op"), F("角度", "red")],
          [F("三要素缺一不可", "ink")],
        ]));
      },
    },
  ];
}

/* 水平对称轴：上下照镜子 */
function demoReflectH() {
  const axisY = 3;
  const shape = [[1, 1], [3, 1], [1, 2.5]];
  const mirror = p => [p[0], 2 * axisY - p[1]];
  const mirrored = shape.map(mirror);
  const draw = (polys, dots) => gridSVG({ w: 8, h: 6, polys, dots: dots || [] })
    .replace("</svg>", '<line x1="0" y1="' + axisY * CELL + '" x2="' + 8 * CELL + '" y2="' + axisY * CELL + '" stroke="#d9483f" stroke-width="2.5" stroke-dasharray="7 5"/></svg>');
  const steps = [{
    explain: "<b>对称轴也能是横着的！</b>这次蓝色小旗在红线<b>上方</b>，要在下方照镜子。",
    render(el) { el.innerHTML = draw([triAt(shape)]); },
  }];
  shape.forEach((p, i) => {
    steps.push({
      explain: "<b>找第 " + (i + 1) + " 个对应点：</b>这个点在轴<b>上方 " + (axisY - p[1]) + " 格</b>，它的像就在轴<b>下方 " + (axisY - p[1]) + " 格</b>。",
      render(el) { el.innerHTML = draw([triAt(shape)], mirrored.slice(0, i + 1)); },
    });
  });
  steps.push({
    explain: "<b>完成！</b>不管是竖轴还是横轴，口诀不变：<b>对应点到对称轴的距离相等</b>。",
    render(el) {
      el.innerHTML = draw([triAt(shape), { points: mirrored, fill: "#9a7bc2", opacity: 0.8, stroke: "#5a4480" }]);
      el.appendChild(hwLines([
        [F("到轴的距离", "blue"), F(" = ", "op"), F("相等", "green")],
      ]));
    },
  });
  return steps;
}
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

/* ---------- 亲手练：找平移后的图形 ---------- */
const P_BANK = [
  { base: [[1, 1], [3, 1], [1, 3]], dx: 4, dy: 0, txt: "把蓝色三角形<b>向右平移 4 格</b>，选出正确的图：" },
  { base: [[2, 1], [4, 1], [2, 3]], dx: 0, dy: 2, txt: "把蓝色三角形<b>向下平移 2 格</b>，选出正确的图：" },
  { base: [[1, 2], [3, 2], [1, 4]], dx: 3, dy: -1, txt: "把蓝色三角形<b>向右平移 3 格、向上平移 1 格</b>，选出正确的图：" },
  { base: [[3, 2], [5, 2], [3, 4]], dx: -3, dy: 0, txt: "把蓝色三角形<b>向左平移 3 格</b>，选出正确的图：" },
  { base: [[1, 1], [3, 1], [1, 3]], dx: 2, dy: 2, txt: "把蓝色三角形<b>向右平移 2 格、向下平移 2 格</b>，选出正确的图：" },
];
document.getElementById("pTotal").textContent = P_BANK.length;
let pIdx = 0;

function pPositionOptionLabel(points, optionIndex) {
  return "图形位置选项 " + (optionIndex + 1) + "：平移后顶点坐标依次为" + points
    .map(p => "（" + p[0] + "，" + p[1] + "）")
    .join("、");
}

function pLoad() {
  document.getElementById("pRound").textContent = pIdx + 1;
  const q = P_BANK[pIdx];
  document.getElementById("pQuestion").innerHTML = q.txt;
  const fb = document.getElementById("pFeedback");
  fb.textContent = ""; fb.className = "feedback";
  document.getElementById("pNextQ").style.display = "none";
  const correct = q.base.map(p => [p[0] + q.dx, p[1] + q.dy]);
  // 干扰项
  const wrongs = [
    q.base.map(p => [p[0] + q.dx + 1, p[1] + q.dy]),
    q.base.map(p => [p[0] + q.dx, p[1] + q.dy - (q.dy >= 0 ? 1 : -1)]),
    q.base.map(p => [p[0] + q.dx, p[1] + q.dy + (q.dy >= 0 ? 2 : -2)]),
  ];
  const opts = [{ pts: correct, ok: true }].concat(wrongs.map(w => ({ pts: w, ok: false })))
    .sort(() => Math.random() - 0.5);
  const box = document.getElementById("pOptions");
  box.innerHTML = "";
  opts.forEach((o, optionIndex) => {
    const wrap = document.createElement("button");
    wrap.type = "button";
    wrap.setAttribute("aria-label", pPositionOptionLabel(o.pts, optionIndex));
    wrap.style.cssText = "background:#fbfcfd;border:3px solid #dfe6ea;border-radius:12px;padding:6px;cursor:pointer;transition:all .15s";
    wrap.innerHTML = gridSVG({
      w: 8, h: 6,
      polys: [triGhost(q.base), triAt(o.pts)],
    });
    wrap.onclick = () => {
      if (o.ok) {
        wrap.style.borderColor = "#2f7d5f"; wrap.style.background = "#d7eae0";
        fb.className = "feedback ok";
        fb.textContent = "✅ 答对了！灰色是原来的位置，蓝色是平移后的位置——朝向完全没变！";
        if (Math5.addStar("unit4", "practice" + pIdx)) fb.textContent += " 线索已确认！";
        document.getElementById("pNextQ").style.display = "";
      } else {
        wrap.style.borderColor = "#d9483f";
        fb.className = "feedback no";
        fb.textContent = "❌ 数一数格子：对应点之间相差几格？";
        setTimeout(() => (wrap.style.borderColor = "#dfe6ea"), 1200);
      }
    };
    box.appendChild(wrap);
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

/* ---------- 闯关挑战：图形变形记 ---------- */
const G_TRI = [[2, 2], [4, 2], [2, 4]];
const G_ROTATE_CENTER = [2.5, 3.5];
const G_AXIS_X = 4, G_AXIS_Y = 3;
const G_BANK = [
  {
    type: "平移",
    before: gridSVG({ w: 7, h: 5, polys: [triAt(G_TRI)] }),
    after: gridSVG({ w: 7, h: 5, polys: [triGhost(G_TRI), triAt(G_TRI.map(p => [p[0] + 2, p[1]]))] }),
    why: "位置变了，但朝向、形状一点没变 —— 平移！",
  },
  {
    type: "旋转",
    before: gridSVG({ w: 7, h: 6, polys: [triAt([[2, 2], [4, 2], [2, 3]])], dots: [G_ROTATE_CENTER] }),
    after: gridSVG({ w: 7, h: 6, polys: [triAt([[4, 3], [4, 5], [3, 3]])], dots: [G_ROTATE_CENTER] }),
    why: "图形绕着红点转了 90°，各点到红点的距离不变 —— 旋转！",
  },
  {
    type: "轴对称",
    before: gridSVG({ w: 8, h: 5, polys: [triAt([[5, 1], [7, 1], [5, 3]])] }),
    after: gridSVG({
      w: 8, h: 5,
      polys: [triAt([[3, 1], [1, 1], [3, 3]])],
    }).replace("</svg>", '<line x1="' + G_AXIS_X * CELL + '" y1="0" x2="' + G_AXIS_X * CELL + '" y2="150" stroke="#d9483f" stroke-width="2.5" stroke-dasharray="7 5"/></svg>'),
    why: "像照镜子！两边到红色对称轴的距离相等 —— 轴对称！",
  },
  {
    type: "平移",
    before: gridSVG({ w: 8, h: 6, polys: [triAt([[1, 1], [3, 1], [1, 3]])] }),
    after: gridSVG({ w: 8, h: 6, polys: [triGhost([[1, 1], [3, 1], [1, 3]]), triAt([[4, 3], [6, 3], [4, 5]])] }),
    why: "向右 3 格又向下 2 格，还是直线走、没转身 —— 平移！",
  },
  {
    type: "旋转",
    before: gridSVG({ w: 7, h: 6, polys: [triAt([[3, 3], [3, 5], [5, 3]])], dots: [[3, 3]] }),
    after: gridSVG({ w: 7, h: 6, polys: [triAt([[3, 1], [3, 3], [5, 3]])], dots: [[3, 3]] }),
    why: "绕红点转了 90°（方向变了）—— 旋转！平移可不会改变朝向哦。",
  },
  {
    type: "旋转",
    before: gridSVG({ w: 7, h: 6, polys: [triAt([[2, 1], [4, 1], [2, 2]])], dots: [[3, 1.5]] }),
    after: gridSVG({ w: 7, h: 6, polys: [triAt([[4, 2], [2, 2], [4, 1]])], dots: [[3, 1.5]] }),
    why: "绕红点转了 180°，图形「倒了个」—— 还是旋转！",
  },
  {
    type: "轴对称",
    before: gridSVG({ w: 7, h: 7, polys: [triAt([[1, 3], [3, 3], [1, 5]])] }),
    after: gridSVG({ w: 7, h: 7, polys: [triAt([[1, 3], [3, 3], [1, 1]])] })
      .replace("</svg>", '<line x1="0" y1="' + G_AXIS_Y * CELL + '" x2="210" y2="' + G_AXIS_Y * CELL + '" stroke="#d9483f" stroke-width="2.5" stroke-dasharray="7 5"/></svg>'),
    why: "横着的对称轴也能照镜子：上下对应点到轴的距离相等 —— 轴对称！",
  },
  {
    type: "平移",
    before: gridSVG({ w: 8, h: 5, polys: [triAt([[4, 3], [6, 3], [4, 5]])] }),
    after: gridSVG({ w: 8, h: 5, polys: [triGhost([[4, 3], [6, 3], [4, 5]]), triAt([[2, 1], [4, 1], [2, 3]])] }),
    why: "向左 2 格又向上 2 格，朝向没变 —— 斜着走也是平移！",
  },
];
document.getElementById("gTotal").textContent = G_BANK.length;
document.getElementById("gStarHint").textContent = "答对 " + Math.ceil(G_BANK.length * 0.75) + " 题盖完成印章";
let gIdx = 0, gScore = 0;

function gLoad() {
  document.getElementById("gRound").textContent = gIdx + 1;
  document.getElementById("gQuestion").innerHTML = "左图经过什么运动变成右图？";
  const q = G_BANK[gIdx];
  let answered = false;
  document.getElementById("gBefore").innerHTML = q.before;
  document.getElementById("gAfter").innerHTML = q.after;
  const fb = document.getElementById("gFeedback");
  fb.textContent = ""; fb.className = "feedback";
  document.getElementById("gNext").style.display = "none";
  const box = document.getElementById("gOptions");
  box.innerHTML = "";
  ["平移", "旋转", "轴对称"].forEach(name => {
    const b = document.createElement("button");
    b.className = "btn-opt";
    b.textContent = name;
    b.onclick = () => {
      if (answered) return;
      if (name === q.type) {
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
        Math5.addWrong("unit4", q);
        fb.textContent = "❌ 看看图形的朝向有没有变、有没有对称轴或旋转点？";
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
    if (Math5.addStar("unit4", "game")) el.innerHTML = "案卷完成，已盖完成印章。";
    else el.innerHTML = "这份案卷已经盖过完成印章，继续保持！";
  } else {
    el.innerHTML = "答对 " + gScore + " / " + G_BANK.length + " 题。口诀：平移不转身、旋转绕点转、轴对称照镜子，再来！";
  }
}
document.getElementById("gNext").onclick = () => { if (gIdx >= G_BANK.length - 1) return; gIdx++; gLoad(); };
gLoad();
