/* ===== 单元五 · 简易方程（用字母表示数 + 解简易方程） ===== */
Math5.initUnitPage("unit5", "单元五 · 简易方程");

/* ---------- 跟我学 ---------- */
let stepper = null;
const stage = document.getElementById("demoStage");

/* ---- 手写式子辅助：把一段式子像板书一样一笔一划写出来 ---- */
function F(text, color, anim) { return { text: text, color: color || "ink", anim: anim !== false }; }
/** 手写卡片步骤：cardBuilder(card) 往卡片里塞内容，式子自动手写 */
function hwStep(explain, buildFn) {
  return {
    explain: explain,
    render(el) {
      const card = document.createElement("div");
      card.className = "hw-card";
      el.appendChild(card);
      buildFn(card);
    },
  };
}

/* 天平图：tilt 0=平衡，正数=左沉，负数=右沉 */
function balanceSVG(lLabel, rLabel, tilt, cap) {
  const W = 560, H = 252, cx = 280, cy = 92;
  const a = tilt * 7 * Math.PI / 180, arm = 185;
  const lx = cx - arm * Math.cos(a), ly = cy + arm * Math.sin(a);
  const rx = cx + arm * Math.cos(a), ry = cy - arm * Math.sin(a);
  function pan(x, y, label) {
    let s = '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + (y + 34).toFixed(1) + '" stroke="#8d6e63" stroke-width="3"/>';
    s += '<path d="M ' + (x - 62).toFixed(1) + " " + (y + 34).toFixed(1) + " A 62 42 0 0 0 " + (x + 62).toFixed(1) + " " + (y + 34).toFixed(1) + ' Z" fill="#eef2f4" stroke="#90a4ae" stroke-width="2.5"/>';
    if (label) s += '<text x="' + x.toFixed(1) + '" y="' + (y + 22).toFixed(1) + '" font-size="21" font-weight="bold" fill="#26313d" text-anchor="middle">' + label + "</text>";
    return s;
  }
  let s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" style="max-width:100%">';
  s += '<polygon points="' + cx + ',232 ' + (cx - 26) + ',190 ' + (cx + 26) + ',190" fill="#a1887f"/>';
  s += '<rect x="' + (cx - 5) + '" y="112" width="10" height="82" fill="#bcaaa4"/>';
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="#6d4c41"/>';
  s += '<line x1="' + lx.toFixed(1) + '" y1="' + ly.toFixed(1) + '" x2="' + rx.toFixed(1) + '" y2="' + ry.toFixed(1) + '" stroke="#795548" stroke-width="7" stroke-linecap="round"/>';
  s += pan(lx, ly, lLabel) + pan(rx, ry, rLabel);
  if (cap) s += '<text x="' + (W / 2) + '" y="26" font-size="17" fill="#37474f" font-weight="bold" text-anchor="middle">' + cap + "</text>";
  return s + "</svg>";
}

function classifyHTML() {
  const rows = [
    { t: "30 + 40 = 70", cls: "eq", tag: "等式 · 不是方程", why: "没有未知数", c: "#7d8b96" },
    { t: "x + 6 = 20", cls: "eq", tag: "✅ 方程", why: "有未知数 + 是等式", c: "#2f7d5f" },
    { t: "5x = 60", cls: "eq", tag: "✅ 方程", why: "有未知数 + 是等式", c: "#2f7d5f" },
    { t: "x − 14 > 40", cls: "ne", tag: "✗ 不是方程", why: "是不等式，不是等式", c: "#d9483f" },
    { t: "x = 30", cls: "eq", tag: "✅ 方程", why: "x = 30 也是方程！", c: "#2f7d5f" },
  ];
  let s = '<div style="display:flex;flex-direction:column;gap:9px;max-width:520px;margin:0 auto">';
  rows.forEach(r => {
    s += '<div style="display:flex;align-items:center;gap:14px;background:#fffef9;border:1px solid #e9e4d7;border-radius:12px;padding:8px 18px">' +
      '<span style="font-size:23px;font-weight:bold;min-width:150px;color:#26313d">' + r.t + "</span>" +
      '<span style="font-size:19px;font-weight:bold;color:' + r.c + '">' + r.tag + "</span>" +
      '<span style="font-size:17px;color:#90a4ae">' + r.why + "</span></div>";
  });
  return s + "</div>";
}

function buildEquationDefSteps() {
  const steps = [];
  steps.push({
    explain: "认识<b>天平</b>：天平平衡，说明左右两边<b>一样重</b>——这正是一个<b>等式</b>！",
    render(el) { el.innerHTML = balanceSVG("100 克", "100 克", 0, "天平平衡 → 左边 = 右边"); },
  });
  steps.push({
    explain: "现在左边放一个<b>不知道多重</b>的墨水瓶（重 x 克）和一个 20 克砝码，右边放 100 克。天平还是平衡的！我们把这个关系<b>写下来</b>：",
    render(el) {
      el.innerHTML = balanceSVG("x + 20", "100", 0, "左边 = 右边，而且含有未知数 x");
      el.appendChild(hwStepCard([[F("x", "blue"), F(" + 20", "op"), F(" = ", "op"), F("100", "ink")]]));
    },
  });
  steps.push({
    explain: "<b>x + 20 = 100</b> 就是一个<b style='color:#2f6fb0'>方程</b>！判断标准只有两条：<b>① 是等式；② 含有未知数</b>。下面的式子，哪些是方程？",
    render(el) { el.innerHTML = classifyHTML(); },
  });
  steps.push(hwStep(
    "<b>小心：</b>x = 30 也是方程哦！只要含未知数、又是等式就行。反过来，<b>等式不一定是方程</b>（比如 30 + 40 = 70），<b>方程一定是等式</b>。",
    (card) => {
      HW.write(card, [
        F("方程", "blue"), F(" = ", "op"), F("等式", "green"), F(" + ", "op"), F("未知数", "red"),
      ], { size: 46 });
      const n = document.createElement("div");
      n.style.cssText = "text-align:center;color:#7d8b96;font-size:18px";
      n.textContent = "两个条件缺一不可";
      card.appendChild(n);
    }
  ));
  return steps;
}

function buildBalancePropSteps() {
  const steps = [];
  steps.push({
    explain: "<b>等式的性质①：</b>天平左边 x 克、右边 30 克，平衡（x = 30）。<br>两边<b>同时加 10 克</b>呢？还是平衡！",
    render(el) { el.innerHTML = balanceSVG("x", "30", 0, "x = 30（平衡）"); },
  });
  steps.push({
    explain: "左边 x + 10，右边 30 + 10 = 40，<b>仍然平衡</b>。反过来两边<b>同时减</b>也一样。所以：<b>等式两边加上或减去同一个数，左右两边仍然相等</b>。",
    render(el) {
      el.innerHTML = balanceSVG("x + 10", "40", 0, "两边同时 +10，还是平衡");
      el.appendChild(hwStepCard([
        [F("x + 10", "ink"), F(" = ", "op"), F("30 + 10", "ink"), F(" = ", "op"), F("40", "green")],
      ]));
    },
  });
  steps.push({
    explain: "<b>等式的性质②：</b>这次天平左边 x、右边 10，平衡。两边<b>同时乘 2</b>（或者同时除以同一个不为 0 的数）呢？",
    render(el) { el.innerHTML = balanceSVG("x", "10", 0, "x = 10（平衡）"); },
  });
  steps.push({
    explain: "左边 2x，右边 20——还是平衡！<b>等式两边乘同一个数，或除以同一个不为 0 的数，左右两边仍然相等</b>。这两条性质就是解方程的全部法宝！",
    render(el) {
      el.innerHTML = balanceSVG("2x", "20", 0, "两边同时 ×2，还是平衡");
      el.appendChild(hwStepCard([
        [F("两边", "blue"), F(" ± ", "op"), F("同一个数", "green"), F("，仍相等", "ink")],
        [F("两边", "blue"), F(" × ÷ ", "op"), F("同一个数", "green"), F("，仍相等", "ink")],
      ], 40));
    },
  });
  return steps;
}

function buildSolveAddSteps() {
  const steps = [];
  steps.push({
    explain: "<b>学解方程啦！</b>题目：x + 3 = 9。天平左边放 x 和 3，右边放 9，正好平衡。<br><b>解方程</b>就是求：x 是几时，等式才成立？",
    render(el) { el.innerHTML = balanceSVG("x + 3", "9", 0, "x + 3 = 9"); },
  });
  steps.push({
    explain: "<b>用等式的性质①：</b>想让左边只剩下 x，就把两边<b>同时减去 3</b>——天平两边一起拿走 3 克，还是平衡的。",
    render(el) {
      el.innerHTML = balanceSVG("x", "6", 0, "两边同时 −3，仍平衡");
      el.appendChild(hwStepCard([
        [F("解：", "blue"), F("x", "blue"), F(" + 3 − 3", "op"), F(" = ", "op"), F("9 − 3", "ink")],
      ], 44));
    },
  });
  steps.push(hwStep(
    "<b>解出来啦：x = 6。</b>但别着急下结论——数学老师都会<b>验算</b>：把 x = 6 代回原方程，看左右两边是否相等。",
    (card) => {
      HW.write(card, [F("x", "blue"), F(" = ", "op"), F("6", "green")], { size: 50, center: false });
      HW.write(card, [F("验：", "amber"), F("左边", "ink"), F(" = ", "op"), F("6 + 3", "ink"), F(" = ", "op"), F("9", "green"), F(" = 右边", "ink"), F(" ✓", "green")], { size: 40, center: false });
    }
  ));
  return steps;
}

function buildSolveMulSteps() {
  const steps = [];
  steps.push({
    explain: "<b>再来一题：3x = 18。</b>3x 就是 3 个 x（比如 3 盒笔，每盒 x 支，一共 18 支）。天平左边 3x，右边 18。",
    render(el) { el.innerHTML = balanceSVG("3x", "18", 0, "3x = 18"); },
  });
  steps.push({
    explain: "<b>这次用等式的性质②：</b>想让 3x 变成 1 个 x，就把两边<b>同时除以 3</b>（把 3 份平均分回去）。",
    render(el) {
      el.innerHTML = balanceSVG("x", "6", 0, "两边同时 ÷3，仍平衡");
      el.appendChild(hwStepCard([
        [F("解：", "blue"), F("3x ÷ 3", "op"), F(" = ", "op"), F("18 ÷ 3", "ink")],
        [F("x", "blue"), F(" = ", "op"), F("6", "green")],
      ], 44));
    },
  });
  steps.push(hwStep(
    "<b>验算：</b>x = 6 代回去，3 × 6 = 18 ✓。<b>书写三规矩：</b>① 先写「解：」；② 等号上下对齐；③ 最后别忘检验！",
    (card) => {
      HW.write(card, [F("验：", "amber"), F("左边", "ink"), F(" = ", "op"), F("3 × 6", "ink"), F(" = ", "op"), F("18", "green"), F(" = 右边", "ink"), F(" ✓", "green")], { size: 42, center: false });
    }
  ));
  return steps;
}

function buildEquationAppSteps() {
  const steps = [];
  steps.push({
    explain: "<b>用方程解决实际问题！</b>小明买 <b>3 支钢笔</b>，付出 <b>50 元</b>，找回 <b>8 元</b>，每支钢笔多少元？<br>第一步：<b>设未知数</b>——设每支钢笔 x 元。",
    render(el) {
      el.appendChild(hwStepCard([[F("设：", "blue"), F("每支钢笔", "ink"), F(" x ", "blue"), F("元", "ink")]], 44));
    },
  });
  steps.push({
    explain: "第二步：<b>找等量关系、列方程</b>。花掉的钱 + 找回的钱 = 付出的钱。3 支钢笔花 3x 元，所以——",
    render(el) {
      el.appendChild(hwStepCard([
        [F("3", "ink"), F("x", "blue"), F(" + 8", "op"), F(" = ", "op"), F("50", "ink")],
      ], 48));
    },
  });
  steps.push({
    explain: "第三步：<b>解方程</b>。两边同时减 8，把 3x 先算出来；再两边同时除以 3——",
    render(el) {
      el.appendChild(hwStepCard([
        [F("解：", "blue"), F("3x + 8 − 8", "op"), F(" = ", "op"), F("50 − 8", "ink")],
        [F("3x", "ink"), F(" = ", "op"), F("42", "green")],
        [F("x", "blue"), F(" = ", "op"), F("14", "green")],
      ], 44));
    },
  });
  steps.push(hwStep(
    "<b>第四步：检验、作答。</b>3 × 14 + 8 = 42 + 8 = 50 ✓，正好等于付出的 50 元。应用题最后一定要写「答」哦！",
    (card) => {
      HW.write(card, [F("验：", "amber"), F("3 × 14 + 8", "ink"), F(" = ", "op"), F("50", "green"), F(" ✓", "green")], { size: 42, center: false });
      HW.write(card, [F("答：", "blue"), F("每支钢笔 14 元。", "ink")], { size: 42, center: false });
    }
  ));
  return steps;
}

/* 手写卡片快捷构造（不经过 Stepper 的 hwStep，供演示步骤内部拼装） */
function hwStepCard(linesArr, size) {
  const card = document.createElement("div");
  card.className = "hw-card";
  linesArr.forEach(l => HW.write(card, l, { size: size || 46, center: false }));
  return card;
}

function tableHTML(rows, highlightRow, lastCol) {  let s = '<table style="margin:0 auto;border-collapse:collapse;font-size:21px">';
  s += '<tr style="background:#d7eae0"><th style="border:2px solid #6fb894;padding:8px 22px">小红的年龄 / 岁</th>' +
    '<th style="border:2px solid #6fb894;padding:8px 22px">爸爸的年龄 / 岁</th></tr>';
  rows.forEach((r, i) => {
    const hl = i === highlightRow;
    s += '<tr style="' + (hl ? "background:#fdf3d3" : "") + '">' +
      '<td style="border:2px solid #d5e8b8;padding:6px 22px;text-align:center">' + r[0] + "</td>" +
      '<td style="border:2px solid #d5e8b8;padding:6px 22px;text-align:center;font-weight:' + (hl ? "bold" : "normal") + '">' + r[1] + "</td></tr>";
  });
  s += "</table>";
  return s;
}

function buildAgeSteps() {
  const rows = [["1", "1 + 30 = 31"], ["2", "2 + 30 = 32"], ["3", "3 + 30 = 33"]];
  const steps = [];
  steps.push({
    explain: "生活里有个规律：<b>爸爸总是比小红大 30 岁</b>。我们一年一年列算式……",
    render(el) { el.innerHTML = tableHTML(rows.slice(0, 1), 0); },
  });
  steps.push({
    explain: "小红 2 岁、3 岁……每一年都要写一个新算式，<b>写得完吗？</b>",
    render(el) { el.innerHTML = tableHTML(rows.slice(0, 3), 2); },
  });
  steps.push({
    explain: "<b>……到 100 岁都要写 100 个式子！</b>太麻烦了。你发现了吗？所有式子长得都一样：<b>年龄 + 30</b>。",
    render(el) {
      el.innerHTML = tableHTML(rows, -1) +
        '<div style="margin-top:10px;color:#d9483f;font-size:22px;font-weight:bold">……(还有 97 行没写完！)</div>';
    },
  });
  steps.push(hwStep(
    "用一个字母 <b style='color:#2f6fb0'>a</b> 表示小红的年龄（a 可以是 1、2、3……任何合法的岁数）。那么爸爸的年龄就是 —— 看，老师把它写出来：",
    (card) => {
      HW.write(card, [F("a", "blue"), F(" + 30", "op")], { size: 60 });
      const note = document.createElement("div");
      note.style.cssText = "text-align:center;color:#7d8b96;font-size:18px;margin-top:2px";
      note.textContent = "a 表示小红的年龄";
      card.appendChild(note);
    }
  ));
  steps.push(hwStep(
    "<b>代入验证：</b>当 a = 6 时，把 6 写到 a 的位置——字母一「上岗」，" +
      "<b>一个式子就说完了一万种情况</b>，这就是用字母表示数的威力！",
    (card) => {
      HW.write(card, [F("a", "blue"), F(" + 30", "op"), F(" = ", "op"), F("6 + 30", "ink"), F(" = ", "op"), F("36", "green")], { size: 56 });
    }
  ));
  return steps;
}
stepper = Stepper(buildAgeSteps(), stage);
const demoBtns = document.getElementById("demoBtns");

/* 演示2：乘号简写规则（配图形实例） */
function buildShorthandSteps() {
  /* 图形辅助：n 个小方块，每块装一个字母 —— 直观展示「几个 a」 */
  const boxes = (n, letter, color) => {
    let s = '<svg width="' + (n * 46 + 10) + '" height="52" style="vertical-align:middle">';
    for (let i = 0; i < n; i++) {
      s += '<rect x="' + (6 + i * 46) + '" y="6" width="40" height="40" rx="8" fill="' + (color || "#e8f1f8") + '" stroke="#2f6fb0" stroke-width="2"/>' +
        '<text x="' + (26 + i * 46) + '" y="34" font-size="24" font-weight="bold" fill="#1b4a7a" text-anchor="middle">' + letter + "</text>";
    }
    return s + "</svg>";
  };
  const both = (items, svg, note) => (card) => {
    if (svg) { const d = document.createElement("div"); d.style.textAlign = "center"; d.innerHTML = svg; card.appendChild(d); }
    HW.write(card, items, { size: 54 });
    if (note) { const n = document.createElement("div"); n.style.cssText = "text-align:center;color:#7d8b96;font-size:18px"; n.innerHTML = note; card.appendChild(n); }
  };
  return [
    hwStep("<b>规则①：</b>字母和数字相乘，乘号省略，<b>数字写在字母前面</b>。看图：3 盘苹果，每盘 a 个——",
      both([F("a", "blue"), F(" × 3", "op"), F(" = ", "op"), F("3", "green"), F("a", "green")],
        boxes(3, "a"), "3 个 a 摆在一起，写作 3a（不是 a3！）")),
    hwStep("<b>规则②：</b>字母和字母相乘，乘号直接省略。每行 a 个、摆 b 行——一共 a × b 个，写作 ab。",
      both([F("a", "blue"), F(" × ", "op"), F("b", "purple"), F(" = ", "op"), F("a", "green"), F("b", "green")],
        '<svg width="210" height="110">' +
        [0, 1].map(r => [0, 1, 2].map(c =>
          '<rect x="' + (10 + c * 46) + '" y="' + (8 + r * 50) + '" width="40" height="40" rx="8" fill="#f4ecfa" stroke="#7a5ea8" stroke-width="2"/>' +
          '<text x="' + (30 + c * 46) + '" y="' + (36 + r * 50) + '" font-size="22" font-weight="bold" fill="#5a4480" text-anchor="middle">' + (r === 0 ? "a" : "a") + "</text>").join("")).join("") +
        '<text x="172" y="105" font-size="17" fill="#7a5ea8">……共 b 行</text></svg>',
        "读作「a b」")),
    hwStep("<b>规则③：</b>1 和字母相乘，1 直接省略——1 个 a 就是 a 嘛。",
      both([F("1", "op"), F(" × ", "op"), F("b", "purple"), F(" = ", "op"), F("b", "green")],
        boxes(1, "b", "#fdf3d3"), "1 藏起来了")),
    hwStep("<b>规则④（很重要）：</b>加号、减号、除号<b>都不能省略</b>！只有乘号有这个特权。",
      (card) => {
        HW.write(card, [F("a + 3　a − 3　a ÷ 3", "ink")], { size: 50 });
        const n = document.createElement("div"); n.style.cssText = "text-align:center;color:#d9483f;font-size:18px;font-weight:bold";
        n.textContent = "都必须老老实实写！"; card.appendChild(n);
      }),
    hwStep("<b>动手试：</b>a + a 和 a × a 分别简写——记住它们<b>完全不同</b>！2 盘 a 摆一起 vs 边长 a 的正方形。",
      (card) => {
        const cmp = document.createElement("div");
        cmp.className = "compare";
        cmp.innerHTML =
          '<div class="cmp-box right"><h4>加法（2 个 a 相加）</h4>' +
          '<div style="margin:6px 0">' + boxes(2, "a") + "</div>" +
          '<svg width="150" height="56" viewBox="0 0 150 56"></svg></div>' +
          '<div class="cmp-box right"><h4>乘法（a 乘 a）</h4>' +
          '<svg width="66" height="66" style="margin:4px 0"><rect x="8" y="8" width="50" height="50" rx="8" fill="#e8f1f8" stroke="#2f6fb0" stroke-width="2"/>' +
          '<text x="33" y="41" font-size="26" font-weight="bold" fill="#1b4a7a" text-anchor="middle">a</text>' +
          '<text x="33" y="52" font-size="11" fill="#2f6fb0" text-anchor="middle">×a</text></svg></div>';
        card.appendChild(cmp);
        const l = document.createElement("div"); l.style.textAlign = "center"; card.appendChild(l);
        HW.write(l, [F("a + a = 2a", "ink"), F("　　", "ink"), F("a × a = a", "green"), F("²", "green")], { size: 46 });
      }),
  ];
}

/* 演示3：速度×时间 用字母表示数量关系 */
function buildVtSteps() {
  const rows = [["3", "70 × 3 = 210"], ["5", "70 × 5 = 350"], ["8", "70 × 8 = 560"]];
  const table = () => {
    let s = '<table style="margin:0 auto;border-collapse:collapse;font-size:21px">';
    s += '<tr style="background:#d7eae0"><th style="border:2px solid #6fb894;padding:8px 22px">行驶时间 / 分</th>' +
      '<th style="border:2px solid #6fb894;padding:8px 22px">行驶路程 / 米</th></tr>';
    rows.forEach(r => {
      s += '<tr><td style="border:2px solid #d5e8b8;padding:6px 22px;text-align:center">' + r[0] + "</td>" +
        '<td style="border:2px solid #d5e8b8;padding:6px 22px;text-align:center">' + r[1] + "</td></tr>";
    });
    return s + "</table>";
  };
  return [
    {
      explain: "小汽车<b>每分钟行驶 70 米</b>（这叫<b>速度</b>）。行驶 3 分钟，路程是多少？",
      render(el) { el.innerHTML = table(); },
    },
    {
      explain: "3 分钟、5 分钟、8 分钟……又要写一堆式子！发现规律了吗：<b>70 × 时间 = 路程</b>。",
      render(el) { el.innerHTML = table() + '<div style="margin-top:10px;color:#d9483f;font-size:21px;font-weight:bold">能不能也用一个式子搞定？</div>'; },
    },
    hwStep(
      "用 <b style='color:#2f6fb0'>t</b> 表示时间（t 分钟），路程就是——老师写在黑板上：",
      (card) => {
        HW.write(card, [F("70", "ink"), F(" × ", "op"), F("t", "blue"), F(" = ", "op"), F("70", "green"), F("t", "green")], { size: 58 });
        const n = document.createElement("div"); n.style.cssText = "text-align:center;color:#7d8b96;font-size:18px";
        n.textContent = "t 表示行驶的时间（分）"; card.appendChild(n);
      }),
    hwStep(
      "<b>代入验证：</b>当 t = 6 时，70t = 70 × 6 = 420 米 ✓。速度 × 时间 = 路程，用字母一写，全世界通用！",
      (card) => {
        HW.write(card, [F("70t", "blue"), F(" = ", "op"), F("70 × 6", "ink"), F(" = ", "op"), F("420", "green")], { size: 56 });
      }),
  ];
}

/* 演示4：用字母表示运算定律 */
function buildLawSteps() {
  const law = (items, note) => hwStep("", (card) => {
    HW.write(card, items, { size: 54 });
    if (note) { const n = document.createElement("div"); n.style.cssText = "text-align:center;color:#7d8b96;font-size:18px"; n.innerHTML = note; card.appendChild(n); }
  });
  const set = (arr, explain, note) => { const s = law(arr, note); s.explain = explain; return s; };
  return [
    set([F("a", "blue"), F(" + ", "op"), F("b", "purple"), F(" = ", "op"), F("b", "purple"), F(" + ", "op"), F("a", "blue")],
      "其实你早就用过字母表示数了！<b>加法交换律</b>：交换两个数的位置，和不变。",
      "字母表示，简洁又清楚"),
    set([F("a", "blue"), F(" × ", "op"), F("b", "purple"), F(" = ", "op"), F("b", "purple"), F(" × ", "op"), F("a", "blue"), F(" = ", "op"), F("ab", "green")],
      "<b>乘法交换律</b>：交换位置，积不变。用字母写出来一行就够，还附带省略乘号。",
      "乘号省略了！"),
    set([F("(a + b) + c", "ink"), F(" = ", "op"), F("a + (b + c)", "green")],
      "<b>加法结合律</b>：三个数相加，先加哪两个都行。"),
    set([F("(a × b) × c", "ink"), F(" = ", "op"), F("a × (b × c)", "green")],
      "<b>乘法结合律</b>：三个数相乘，先乘哪两个都行。"),
    set([F("(a + b) × c", "ink"), F(" = ", "op"), F("a × c + b × c", "green")],
      "<b>乘法分配律——最厉害的一个！</b>两个数的和乘一个数，可以分别相乘再相加。",
      "简写：(a+b)c = ac + bc"),
    set([F("(2 + 3) × 4", "ink"), F(" = ", "op"), F("20", "green"), F("　　", "ink"), F("2 × 4 + 3 × 4", "ink"), F(" = ", "op"), F("20", "green")],
      "<b>验证一下：</b>当 a = 2、b = 3、c = 4 时——两边都是 20 ✓ 永远相等！"),
  ];
}

/* 演示5：用字母表示公式（周长与面积，图形 + 手写公式） */
function buildFormulaSteps() {
  const sq = (side) => {
    const w = Math.min(150, side * 18);
    return '<svg width="190" height="170" style="vertical-align:middle">' +
      '<rect x="18" y="10" width="' + w + '" height="' + w + '" fill="#d7eae0" stroke="#2f7d5f" stroke-width="2.5" rx="3"/>' +
      '<text x="' + (18 + w / 2) + '" y="' + (w / 2 + 16) + '" font-size="22" font-weight="bold" fill="#2f7d5f" text-anchor="middle">a</text>' +
      '<text x="' + (18 + w / 2) + '" y="' + (w + 32) + '" font-size="18" fill="#2f7d5f" text-anchor="middle">边长 a</text></svg>';
  };
  /* 图 + 手写公式 组合渲染 */
  const withFormula = (svg, items, note) => hwStep("", (card) => {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;justify-content:center;gap:26px;flex-wrap:wrap";
    const g = document.createElement("div"); g.innerHTML = svg; row.appendChild(g);
    const f = document.createElement("div"); row.appendChild(f);
    card.appendChild(row);
    HW.write(f, items, { size: 54, center: false });
    if (note) { const n = document.createElement("div"); n.style.cssText = "text-align:center;color:#7d8b96;font-size:18px"; n.innerHTML = note; card.appendChild(n); }
  });
  const set = (svg, items, explain, note) => { const s = withFormula(svg, items, note); s.explain = explain; return s; };

  return [
    set(sq(7), [F("C", "blue"), F(" = ", "op"), F("4", "green"), F("a", "green")],
      "一个正方形，<b>边长是 a</b>（用字母表示任意边长）。它的周长怎么用字母表示？——周长就是 4 条边，写出来：",
      "C 表示周长"),
    set(sq(7), [F("S", "blue"), F(" = ", "op"), F("a", "green"), F(" × ", "op"), F("a", "green"), F(" = ", "op"), F("a", "green"), F("²", "green")],
      "面积 = a × a，就是 <b>a 乘 a</b>，简写作 a²（读作「a 的平方」）。注意：a² 和 2a 完全不同！",
      "S 表示面积"),
    set('<svg width="220" height="150" style="vertical-align:middle">' +
      '<rect x="18" y="10" width="170" height="105" fill="#fdf3d3" stroke="#c07d1e" stroke-width="2.5" rx="3"/>' +
      '<text x="103" y="68" font-size="22" font-weight="bold" fill="#b96f1d" text-anchor="middle">a</text>' +
      '<text x="30" y="30" font-size="18" fill="#b96f1d">b</text></svg>',
      [F("C", "blue"), F(" = ", "op"), F("2(a + b)", "green"), F("　", "ink"), F("S", "blue"), F(" = ", "op"), F("ab", "green")],
      "长方形也有公式：<b>长 a、宽 b</b>——周长 = (长 + 宽) × 2，面积 = 长 × 宽。"),
    set('<svg width="200" height="160" style="vertical-align:middle">' +
      '<polygon points="20,130 170,130 95,25" fill="#e8f1f8" stroke="#2f6fb0" stroke-width="2.5" rx="3"/>' +
      '<text x="95" y="150" font-size="18" fill="#1b4a7a" text-anchor="middle">边长 a</text>' +
      '<text x="80" y="85" font-size="18" fill="#1b4a7a">a</text><text x="108" y="85" font-size="18" fill="#1b4a7a">a</text>' +
      '<text x="88" y="122" font-size="18" fill="#1b4a7a">a</text></svg>',
      [F("C", "blue"), F(" = ", "op"), F("3", "green"), F("a", "green")],
      "<b>再来一个图形实例：</b>等边三角形，三条边都是 a——周长就是 3 个 a 相加，C = a + a + a = 3a。"),
    hwStep(
      "<b>代入公式试试：</b>当 a = 6 时——周长 C = 4a = 4 × 6 = 24；面积 S = a² = 6 × 6 = 36。" +
      "<br><b style='color:#d9483f'>注意：a² = a × a = 36，不是 2a = 12！</b>",
      (card) => {
        HW.write(card, [F("C = 4 × 6", "ink"), F(" = ", "op"), F("24", "green"), F("　　", "ink"),
          F("S = 6 × 6", "ink"), F(" = ", "op"), F("36", "green")], { size: 48 });
      }),
  ];
}

/* 演示6：化简含字母的式子（图形水果 + 手写式子） */
function buildSimplifySteps() {
  const apples = (n, color) => {
    let s = "";
    for (let i = 0; i < n; i++) s += '<span style="font-size:34px">' + (color ? "🍏" : "🍎") + "</span> ";
    return s;
  };
  /* 水果图 + 手写式子 */
  const fruit = (items, fruitHTML, note) => hwStep("", (card) => {
    if (fruitHTML) { const f = document.createElement("div"); f.style.cssText = "font-size:28px;margin:6px 0;text-align:center"; f.innerHTML = fruitHTML; card.appendChild(f); }
    HW.write(card, items, { size: 54 });
    if (note) { const n = document.createElement("div"); n.style.cssText = "text-align:center;color:#7d8b96;font-size:18px"; n.innerHTML = note; card.appendChild(n); }
  });
  const set = (items, explain, fruitHTML, note) => { const s = fruit(items, fruitHTML, note); s.explain = explain; return s; };

  return [
    set([F("3", "ink"), F("a", "blue"), F(" + ", "op"), F("2", "ink"), F("a", "blue"), F(" = ", "op"), F("5", "green"), F("a", "green")],
      "3a + 2a = ?  别急，想成水果：<b>3 个苹果 + 2 个苹果 = 5 个苹果</b>。那 3 个 a + 2 个 a = 5 个 a！",
      apples(3, 1) + "＋" + apples(2), "「a」就是那个水果，数一数有几个"),
    set([F("8", "ink"), F("b", "purple"), F(" − ", "op"), F("3", "ink"), F("b", "purple"), F(" = ", "op"), F("5", "green"), F("b", "green")],
      "<b>减法也一样：</b>8 个 b 减掉 3 个 b，还剩 5 个 b。", "", "8 个 − 3 个 = 5 个"),
    set([F("4", "ink"), F("x", "amber"), F(" − ", "op"), F("x", "amber"), F(" = ", "op"), F("3", "green"), F("x", "green")],
      "<b>注意 x 前面藏着一个 1：</b>4x − x，其实是 4 个 x 减 1 个 x。", "", "x 就是 1x"),
    set([F("a + 4a + 2", "ink"), F(" = ", "op"), F("5", "green"), F("a", "green"), F(" + ", "op"), F("2", "ink")],
      "<b>数字要单独放：</b>a + 4a + 2 里，只有带 a 的能合并——5 个 a 和一个 2。", "", "5a 和 2 不能再合了！"),
    hwStep(
      "<b>⚠️ 大陷阱：</b>不同字母<b>不能合并</b>！3 个苹果 + 4 个梨，不能说 7 个苹果梨。",
      (card) => {
        const cmp = document.createElement("div");
        cmp.className = "compare";
        cmp.innerHTML =
          '<div class="cmp-box wrongbox"><h4>❌</h4>3a + 4b = 7ab ？<br>苹果和梨不能混在一起数！</div>' +
          '<div class="cmp-box right"><h4>✅</h4>3a + 4b <b>就到这了</b>，<br>不同字母各写各的。</div>';
        card.appendChild(cmp);
      }),
    hwStep(
      "<b>化简有什么用？</b>先化简再代入，又快又不容易错：当 x = 4 时，5x + 3x = 8x = 32（而不是 20 + 12 再加一遍）。",
      (card) => {
        HW.write(card, [F("5x + 3x", "ink"), F(" = ", "op"), F("8x", "green"), F(" = ", "op"), F("8 × 4", "ink"), F(" = ", "op"), F("32", "green")], { size: 52 });
      }),
  ];
}

const DEMOS = [
  { label: "🧒 例1：年龄问题", build: buildAgeSteps },
  { label: "✖️ 例2：乘号简写", build: buildShorthandSteps },
  { label: "🚗 例3：速度×时间", build: buildVtSteps },
  { label: "⚖️ 例4：运算定律", build: buildLawSteps },
  { label: "📐 例5：图形公式", build: buildFormulaSteps },
  { label: "🧮 例6：化简式子", build: buildSimplifySteps },
  { label: "⚖️ 例7：方程的意义", build: buildEquationDefSteps },
  { label: "🟰 例8：等式的性质", build: buildBalancePropSteps },
  { label: "✏️ 例9：解方程 x+3=9", build: buildSolveAddSteps },
  { label: "✏️ 例10：解方程 3x=18", build: buildSolveMulSteps },
  { label: "📝 例11：列方程解应用题", build: buildEquationAppSteps },
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

/* ---------- 通用选择题加载器 ---------- */
function loadChoice(cfg) {
  document.getElementById(cfg.roundEl).textContent = cfg.index + 1;
  const fb = document.getElementById(cfg.fbEl);
  fb.textContent = ""; fb.className = "feedback";
  document.getElementById(cfg.nextEl).style.display = "none";
  const q = cfg.bank[cfg.index];
  let answered = false;
  document.getElementById(cfg.qEl).innerHTML = q.q;
  const box = document.getElementById(cfg.optEl);
  box.innerHTML = "";
  q.opts.forEach((opt, oi) => {
    const b = document.createElement("button");
    b.className = "btn-opt";
    b.style.margin = "8px";
    b.textContent = opt;
    b.onclick = () => {
      if (answered) return;
      if (oi === q.ans) {
        answered = true;
        b.classList.add("correct");
        cfg.onCorrect(q, fb);
        if (cfg.index === cfg.bank.length - 1) cfg.onFinish(fb);
        else document.getElementById(cfg.nextEl).style.display = "";
      } else {
        b.classList.add("wrong");
        fb.className = "feedback no";
        Math5.addWrong("unit5", q);
        fb.textContent = "❌ 再想想哦！提示：" + q.why;
        setTimeout(() => b.classList.remove("wrong"), 1500);
      }
    };
    box.appendChild(b);
  });
}

/* ---------- 亲手练：代入求值 ---------- */
const P_BANK = [
  { q: "爸爸的年龄：当 a = 9 时，a + 30 = ?", opts: ["309", "39", "21"], ans: 1, why: "把 a 换成 9：9 + 30 = 39（不是拼在一起变成 309！）" },
  { q: "每支笔 x 元，买 4 支要多少钱？当 x = 2 时，4x = ?", opts: ["42", "6", "8"], ans: 2, why: "4x = 4 × x = 4 × 2 = 8 元。4x 是「4 乘 x」，不是数字 42！" },
  { q: "一箱苹果重 b 千克，吃掉 5 千克后剩多少？当 b = 12 时，b − 5 = ?", opts: ["7", "125", "17"], ans: 0, why: "b − 5 = 12 − 5 = 7 千克" },
  { q: "一本故事书 m 页，看了 8 页，还剩多少页？当 m = 45 时，m − 8 = ?", opts: ["53", "458", "37"], ans: 2, why: "m − 8 = 45 − 8 = 37 页" },
  { q: "汽车每小时行 v 千米，行 3 小时共行多少千米？当 v = 80 时，3v = ?", opts: ["83", "240", "830"], ans: 1, why: "3v = 3 × 80 = 240 千米" },
  { q: "食堂每天用煤 c 千克，10 天用煤多少千克？当 c = 15 时，10c = ?", opts: ["150", "105", "1510"], ans: 0, why: "10c = 10 × 15 = 150 千克" },
  { q: "当 x = 4 时，5x − 3 = ?", opts: ["57", "17", "23"], ans: 1, why: "5x = 5 × 4 = 20，20 − 3 = 17（先乘后减！）" },
  { q: "铅笔每支 a 元，橡皮每块 b 元，买 2 支铅笔和 1 块橡皮共（　）元", opts: ["2a + b", "a + 2b", "2ab"], ans: 0, why: "2 支铅笔 2a 元，1 块橡皮 b 元，合起来 2a + b" },
  { q: "正方形的边长是 a 厘米，它的周长是（　）厘米", opts: ["4a", "a⁴", "a + 4"], ans: 0, why: "4 条边都是 a：a+a+a+a = 4a（C = 4a）" },
  { q: "当 a = 5 时，a² = ?", opts: ["10", "25", "52"], ans: 1, why: "a² = a × a = 5 × 5 = 25。别选 10，那是 2a！不是拼成 52！" },
  { q: "一本书 80 页，每天看 x 页，看了 6 天，还剩（　）页", opts: ["80 − 6x", "80 + 6x", "6x − 80"], ans: 0, why: "6 天看了 6x 页，剩下的 = 总页数 − 看过的 = 80 − 6x" },
  { q: "5x + 3x 化简后是（　）", opts: ["8x", "15x", "8x²"], ans: 0, why: "5 个 x 加 3 个 x 是 8 个 x：8x（不是相乘的 15x）" },
  { q: "三个连续自然数，中间一个是 n，另外两个是（　）", opts: ["n−1 和 n+1", "n−n 和 n+n", "2n 和 3n"], ans: 0, why: "相邻自然数差 1：前面是 n−1，后面是 n+1" },
  { q: "下面的式子中，是方程的是（　）", opts: ["x + 5", "36 + 4 = 40", "2x = 10"], ans: 2, why: "方程 = 含未知数的等式：x+5 没有等号，36+4=40 没有未知数" },
  { q: "x + 6 = 14，x = ?", opts: ["20", "8", "14"], ans: 1, why: "两边同时减 6：x = 14 − 6 = 8" },
  { q: "3x = 12，x = ?", opts: ["4", "36", "9"], ans: 0, why: "两边同时除以 3：x = 12 ÷ 3 = 4" },
  { q: "x − 8 = 5，x = ?", opts: ["3", "40", "13"], ans: 2, why: "两边同时加 8：x = 5 + 8 = 13" },
  { q: "20 − x = 11，x = ?", opts: ["31", "9", "11"], ans: 1, why: "减数 = 被减数 − 差：x = 20 − 11 = 9" },
];
document.getElementById("pTotal").textContent = P_BANK.length;
let pIdx = 0;

function pLoad() {
  loadChoice({
    bank: P_BANK, index: pIdx,
    qEl: "pQuestion", optEl: "pOptions", fbEl: "pFeedback", nextEl: "pNextQ", roundEl: "pRound",
    onCorrect(q, fb) {
      fb.className = "feedback ok";
      fb.textContent = "✅ 答对了！" + q.why;
      if (Math5.addStar("unit5", "practice" + pIdx)) fb.textContent += " 线索已确认！";
    },
    onFinish(fb) {
      fb.className = "feedback ok";
      fb.textContent = "🎉 亲手练全部完成！去闯关挑战试试吧！";
      document.getElementById("pNextQ").style.display = "none";
      pIdx = P_BANK.length - 1;
    },
  });
}
document.getElementById("pNextQ").onclick = () => { pIdx++; pLoad(); };
pLoad();

/* ---------- 闯关挑战：字母魔术师 ---------- */
const G_BANK = [
  { q: "省略乘号：a × 3 写作（　）", opts: ["a3", "3a", "a+3"], ans: 1, why: "数字要写在字母前面：3a" },
  { q: "1 × b = ?", opts: ["1b", "b", "2b"], ans: 1, why: "1 个 b 就是 b，1 省略不写" },
  { q: "a + a = ?", opts: ["2a", "a2", "a²"], ans: 0, why: "2 个 a 相加是 2a；a² 是 a×a，别搞混" },
  { q: "小明每分钟走 v 米，走了 t 分钟，一共走（　）米", opts: ["v + t", "v − t", "vt"], ans: 2, why: "速度 × 时间 = 路程：v × t = vt" },
  { q: "当 x = 5 时，3x + 1 = ?", opts: ["351", "16", "9"], ans: 1, why: "3x = 3×5 = 15，15 + 1 = 16（先乘后加！）" },
  { q: "b × b 简写作（　）", opts: ["2b", "b²", "b2"], ans: 1, why: "b×b = b²（b 的平方），2b 是 b+b，两回事" },
  { q: "a × 5 − a × 3 = ?", opts: ["2a", "8a", "15a"], ans: 0, why: "5 个 a 减 3 个 a 剩 2 个 a：2a" },
  { q: "比 x 的 4 倍多 6 的数是（　）", opts: ["4x + 6", "4(x + 6)", "x4 + 6"], ans: 0, why: "先「x 的 4 倍」= 4x，再加 6：4x + 6" },
  { q: "当 a = 2、b = 3 时，a + b = ?", opts: ["23", "5", "6"], ans: 1, why: "2 + 3 = 5（加法不能拼数字！）" },
  { q: "妈妈买了 3 千克苹果，每千克 m 元，付出 50 元，应找回（　）元", opts: ["50 − 3m", "50 + 3m", "3m − 50"], ans: 0, why: "花掉 3m 元，付出 50 元，找回 = 付出 − 花掉 = 50 − 3m" },
  { q: "正方形的面积公式用字母表示是（　）", opts: ["S = a²", "S = 4a", "S = a + a"], ans: 0, why: "面积 = 边长 × 边长 = a × a = a²；4a 是周长！" },
  { q: "3a + 4b 等于（　）", opts: ["7ab", "3a + 4b", "7(a + b)"], ans: 1, why: "字母不同不能合并！3a + 4b 就是最简形式" },
  { q: "当 a = 4 时，a² 和 2a 分别等于（　）", opts: ["8 和 16", "16 和 8", "16 和 16"], ans: 1, why: "a² = 4×4 = 16，2a = 2×4 = 8，两个完全不同！" },
  { q: "三个连续自然数的和是 3m，中间那个是（　）", opts: ["m", "3m", "m + 1"], ans: 0, why: "三个连续自然数：m−1、m、m+1，合起来正好是 3m" },
  { q: "下面的说法，正确的是（　）", opts: ["方程一定是等式", "等式一定是方程", "方程和等式没关系"], ans: 0, why: "方程一定是等式；但等式不一定含未知数，所以等式不一定是方程" },
  { q: "x = 7 是下面哪个方程的解？", opts: ["x − 2 = 9", "x + 3 = 10", "14 ÷ x = 7"], ans: 1, why: "代入检验：7 + 3 = 10 ✓；x − 2 = 9 要 x = 11，14 ÷ x = 7 要 x = 2，都不对" },
  { q: "解方程 3x = 21 时，两边要同时（　）", opts: ["加 3", "乘 3", "除以 3"], ans: 2, why: "用等式的性质②：两边同时除以 3，x = 7" },
  { q: "一支笔 x 元，买 4 支付了 20 元，列方程是（　）", opts: ["4x = 20", "x + 4 = 20", "20 − x = 4"], ans: 0, why: "4 支一共 4x 元，正好 20 元：4x = 20" },
];
document.getElementById("gTotal").textContent = G_BANK.length;
document.getElementById("gStarHint").textContent = "答对 " + Math.ceil(G_BANK.length * 0.75) + " 题盖完成印章";
let gIdx = 0, gScore = 0;

function gLoad() {
  loadChoice({
    bank: G_BANK, index: gIdx,
    qEl: "gQuestion", optEl: "gOptions", fbEl: "gFeedback", nextEl: "gNext", roundEl: "gRound",
    onCorrect(q, fb) {
      gScore++;
      document.getElementById("gScore").textContent = gScore;
      fb.className = "feedback ok";
      fb.textContent = "✅ 答对了！" + q.why;
    },
    onFinish(fb) {
      const el = document.getElementById("gFinal");
      el.style.display = "";
      const pass = Math.ceil(G_BANK.length * 0.75);
      if (gScore >= pass) {
        if (Math5.addStar("unit5", "game")) el.innerHTML = "天平密码已破解，案卷已盖完成印章。";
        else el.innerHTML = "这份案卷已经盖过完成印章，继续保持！";
      } else {
        el.innerHTML = "答对 " + gScore + " / " + G_BANK.length + " 题，复习一下乘号简写规则再来！";
      }
    },
  });
}
document.getElementById("gNext").onclick = () => { if (gIdx >= G_BANK.length - 1) return; gIdx++; gLoad(); };
gLoad();
