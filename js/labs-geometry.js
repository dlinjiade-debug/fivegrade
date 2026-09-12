(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root && typeof module === "undefined") {
    var packs = root.MysteryLabPacks || (root.MysteryLabPacks = {});
    packs.geometry = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function round(n) { return Math.round(n * 1000000) / 1000000; }
  function rotatePoint(point, center, degrees) {
    var r = degrees * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    var x = point.x - center.x, y = point.y - center.y;
    return { x: round(center.x + x * c - y * s), y: round(center.y + x * s + y * c) };
  }
  function translatePoint(point, dx, dy) { return { x: point.x + dx, y: point.y + dy }; }
  function reflectPoint(point, axis, value) {
    return axis === "x" ? { x: round(2 * value - point.x), y: point.y } : { x: point.x, y: round(2 * value - point.y) };
  }
  function reconstructHidden(cells, views) {
    views = views || {};
    var top = views.top || [], occupied = {};
    (cells || []).forEach(function (c) { occupied[c[0] + "," + c[1]] = true; });
    var candidates = [];
    for (var y = 0; y < top.length; y++) for (var x = 0; x < (top[y] || []).length; x++) {
      if (!top[y][x] || occupied[x + "," + y]) continue;
      var fx = views.front && views.front[x], ly = views.left && views.left[y];
      if (fx && ly) candidates.push([x, y, Math.max(1, Math.min(fx, ly))]);
    }
    candidates.sort(function (a, b) { return (b[0] + b[1]) - (a[0] + a[1]); });
    return { candidates: candidates.slice(0, 1), certain: candidates.length === 1 };
  }
  function viewName(view) { return ({ front: "正视图", top: "俯视图", left: "左视图" })[view] || "视图"; }
  var UNIT1_VOXELS = [
    { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 1 },
    { x: 0, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
  ];
  function orthographicProjection(voxels, view) {
    var cells = [], byPosition = {};
    (voxels || []).forEach(function (voxel) {
      var u = view === "left" ? voxel.y : voxel.x;
      var v = view === "top" ? voxel.y : voxel.z;
      var key = u + "," + v;
      var evidence = view === "top" ? voxel.z + 1 : 1;
      if (!byPosition[key]) {
        byPosition[key] = { u: u, v: v, height: evidence };
        cells.push(byPosition[key]);
      } else {
        byPosition[key].height = Math.max(byPosition[key].height, evidence);
      }
    });
    return {
      view: view,
      cells: cells,
      maxHeight: (voxels || []).reduce(function (highest, voxel) { return Math.max(highest, voxel.z + 1); }, 0),
    };
  }
  function areaAfterCut(shape) { return Number(shape && shape.area) || 0; }
  function polygonArea(points) {
    var twiceArea = 0;
    for (var i = 0; i < points.length; i++) {
      var current = points[i], next = points[(i + 1) % points.length];
      twiceArea += current[0] * next[1] - next[0] * current[1];
    }
    return Math.abs(twiceArea) / 2;
  }
  function triangleReassembly(phase) {
    var fixed = [[80, 140], [180, 40], [180, 140]];
    var moving = [[180, 140], [180, 40], [280, 140]];
    var rotated = moving.map(function (point) {
      var result = rotatePoint({ x: point[0], y: point[1] }, { x: 180, y: 140 }, 90);
      return [result.x, result.y];
    });
    var transformed = phase === "cut" ? moving : rotated;
    var transform = phase === "cut" ? "" : "rotate(90 180 140)";
    if (phase === "join") {
      transformed = rotated.map(function (point) { return [point[0] - 100, point[1] - 100]; });
      transform = "translate(-100 -100) rotate(90 180 140)";
    }
    return {
      phase: phase,
      totalArea: polygonArea(fixed) + polygonArea(moving),
      pieces: [
        { id: "fixed", points: fixed, transformedPoints: fixed, transform: "" },
        { id: "moving", points: moving, transformedPoints: transformed, transform: transform },
      ],
    };
  }
  function formulaFor(kind, values) {
    values = values || {};
    var b = values.base || 0, h = values.height || 0;
    if (kind === "triangle") return b + " × " + h + " ÷ 2 = " + (b * h / 2);
    if (kind === "trapezoid") { var t = values.top || 0; return "(" + t + " + " + b + ") × " + h + " ÷ 2 = " + ((t + b) * h / 2); }
    return b + " × " + h + " = " + (b * h);
  }
  function plantingCount(length, step, start, end) {
    var intervals = step > 0 ? length / step : 0;
    var trees = intervals + (start ? 1 : 0) + (end ? 1 : 0) - 1;
    if (start && end) trees = intervals + 1;
    else if (start || end) trees = intervals;
    else trees = Math.max(0, intervals - 1);
    return { intervals: intervals, trees: trees };
  }
  function tilingResult(angles) {
    var sum = (angles || []).reduce(function (a, b) { return a + Number(b || 0); }, 0);
    return { fits: sum === 360, reason: sum === 360 ? "无缝" : (sum < 360 ? "有缝" : "重叠") };
  }
  function movementTransform(mode, amount, centerIndex) {
    var t = Math.max(0, Math.min(100, Number(amount) || 0));
    var index = Math.max(0, Math.min(4, Number(centerIndex) || 0));
    var pivotX = 140 + index * 15;
    if (mode === "旋转") return { transform: "rotate(" + (t * 3.6) + " " + pivotX + " 100)", pivotX: pivotX };
    if (mode === "轴对称") return { transform: "translate(" + (2 * pivotX) + " 0) scale(-1 1)", pivotX: pivotX };
    return { transform: "translate(" + (t * 1.2) + " 0)", pivotX: pivotX };
  }
  function plantingLayout(length, step, start, end) {
    var result = plantingCount(length, step, start, end);
    var last = Math.max(0, Math.floor(result.intervals));
    var ticks = [];
    for (var i = 0; i <= last; i++) {
      if ((i === 0 && !start) || (i === last && !end)) continue;
      ticks.push(i);
    }
    return { intervals: result.intervals, trees: result.trees, ticks: ticks };
  }
  function fixedInteriorAngle(shapeName) { return shapeName === "正五边形" ? 108 : 90; }
  function vertexTiling(shapeName) {
    var copies = shapeName === "正五边形" ? 3 : 4;
    var angle = fixedInteriorAngle(shapeName);
    var sum = copies * angle;
    var result = tilingResult(Array(copies).fill(angle));
    return { copies: copies, sum: sum, fits: result.fits, reason: result.reason, difference: 360 - sum };
  }

  var DEFINITIONS = {
    unit1: { id: "unit1", title: "空间证物：从三面找到方块", question: "哪个方块被挡住了？", interactions: ["旋转", "爆炸分解", "透视", "三视图"], hints: ["先看三个方向的轮廓。", "转一转，再对照最高层。"], render: function (el) { panel(el, this, "旋转 / 爆炸 / 透视"); } },
    unit4: { id: "unit4", title: "轨迹重建：让图形回到原位", question: "它是平移、旋转，还是照镜子？", interactions: ["描图纸", "旋转中心", "平移", "轴对称"], hints: ["盯住一个顶点。", "看它绕谁转、离轴几格。"], render: function (el) { panel(el, this, "拖动描图纸"); } },
    unit7: { id: "unit7", title: "面积侦探：剪开就能算", question: "怎样剪拼，公式才会出现？", interactions: ["切割", "旋转", "拼合", "推导公式"], hints: ["剪下的部分可以搬家。", "形状变了，面积没变。"], render: function (el) { panel(el, this, "切割 / 旋转 / 拼合"); } },
    unit8: { id: "unit8", title: "间隔谜案：树和间隔谁多？", question: "这条路要摆几棵树？", interactions: ["拉伸道路", "切换端点", "摆树", "实时计数"], hints: ["先数间隔。", "再看看两端有没有树。"], render: function (el) { panel(el, this, "拖路牌和树"); } },
    unit9: { id: "unit9", title: "密铺工坊：角能不能凑一圈？", question: "拼接点会有缝吗？", interactions: ["拖动", "旋转", "顶点角", "缝隙反馈"], hints: ["看同一个顶点。", "角加起来正好 360° 才严丝合缝。"], render: function (el) { panel(el, this, "拖动旋转拼图"); } },
  };
  function panel(el, definition, action, context) {
    el.className = "mlab-" + definition.id;
    var doc = el.ownerDocument || (typeof document !== "undefined" ? document : null);
    if (!doc) return { root: el, controls: [], randomize: function () {} };
    var controls = [], state = { rotation: 0, explode: 0, xray: false, mode: "平移", phase: "cut", length: 20, start: true, end: true, angle: 90, shape: "正方形" };
    var feedback = context && typeof context.onInteract === "function" ? context.onInteract : function () {};
    function add(node) { el.appendChild(node); controls.push(node); return node; }
    function text(className, value) { var n = doc.createElement("p"); n.className = className; n.textContent = value; el.appendChild(n); return n; }
    function input(type, value, label) {
      var tag = doc.createElement("label"); tag.className = "mlab-label"; tag.textContent = label || "操作"; el.appendChild(tag);
      var n = doc.createElement("input"); n.type = type; if (value !== undefined) n.value = value;
      if (type === "checkbox") n.checked = !!value;
      n.className = "mlab-control"; n.setAttribute && n.setAttribute("aria-label", label || "操作"); add(n); return n;
    }
    function button(label) { var n = doc.createElement("button"); n.type = "button"; n.className = "mlab-control mlab-button"; n.textContent = label; add(n); return n; }
    var title = doc.createElement("h3"); title.className = "mlab-title"; title.textContent = definition.title;
    var q = doc.createElement("p"); q.className = "mlab-question"; q.textContent = definition.question;
    el.appendChild(title); el.appendChild(q);
    var readout = text("mlab-readout", action);
    var SVG_NS = "http://www.w3.org/2000/svg";
    function svg(className) { var s = doc.createElementNS ? doc.createElementNS(SVG_NS, "svg") : doc.createElement("svg"); if (s.setAttribute) s.setAttribute("class", className); else s.className = className; s.setAttribute && s.setAttribute("viewBox", "0 0 360 180"); s.setAttribute && s.setAttribute("aria-label", "数学操作图"); el.appendChild(s); return s; }
    function shape(tag, attrs, parent) { var n = doc.createElementNS ? doc.createElementNS(SVG_NS, tag) : doc.createElement(tag); Object.keys(attrs).forEach(function (key) { if (n.setAttribute) n.setAttribute(key, attrs[key]); }); (parent || el).appendChild(n); return n; }
    function pointsValue(points) { return points.map(function (point) { return point[0] + "," + point[1]; }).join(" "); }
    function clearNode(node) { if (node.replaceChildren) node.replaceChildren(); else while (node.firstChild) node.removeChild(node.firstChild); }
    var visual = svg("mlab-visual");
    function interact(message) { readout.textContent = message; feedback(message); }
    if (definition.id === "unit1") {
      var rot = input("range", 0, "旋转"); rot.min = -180; rot.max = 180;
      var exp = input("range", 0, "爆炸"); exp.min = 0; exp.max = 100;
      var xr = input("checkbox", false, "透视");
      var voxelGroup = shape("g", { "class": "mlab-voxel-scene", visibility: "visible" }, visual);
      var projectionGroup = shape("g", { "class": "mlab-projection", visibility: "hidden" }, visual);
      var cubeNodes = [];
      UNIT1_VOXELS.forEach(function (voxel, index) {
        var sx = 152 + (voxel.x - voxel.y) * 36;
        var sy = 83 + (voxel.x + voxel.y) * 18 - voxel.z * 36;
        var group = shape("g", { transform: "translate(" + sx + " " + sy + ")", "data-cube": index }, voxelGroup);
        shape("polygon", { points: "0,11 18,0 36,11 18,22", "class": "mlab-cube-top" }, group);
        shape("polygon", { points: "0,11 18,22 18,44 0,33", "class": "mlab-cube-left" }, group);
        shape("polygon", { points: "18,22 36,11 36,33 18,44", "class": "mlab-cube-right" }, group);
        cubeNodes.push({ node: group, sx: sx, sy: sy, voxel: voxel });
      });
      function showVoxel() {
        state.view = "3d";
        if (voxelGroup.setAttribute) voxelGroup.setAttribute("visibility", "visible");
        if (projectionGroup.setAttribute) projectionGroup.setAttribute("visibility", "hidden");
        if (visual.setAttribute) visual.setAttribute("data-view", "立体证物");
      }
      function drawVoxel() {
        var distance = state.explode / 9;
        showVoxel();
        cubeNodes.forEach(function (entry, index) {
          var xDirection = entry.voxel.x - entry.voxel.y >= 0 ? 1 : -1;
          var yDirection = entry.voxel.x + entry.voxel.y > 1 ? 1 : -1;
          if (entry.node.setAttribute) entry.node.setAttribute("transform", "translate(" + (entry.sx + xDirection * distance) + " " + (entry.sy + yDirection * distance) + ")");
          if (entry.node.style) entry.node.style.opacity = state.xray && index === 0 ? "0.3" : "1";
        });
        if (voxelGroup.setAttribute) voxelGroup.setAttribute("transform", "rotate(" + state.rotation + " 180 92)");
      }
      function drawProjection(view) {
        var projection = orthographicProjection(UNIT1_VOXELS, view);
        clearNode(projectionGroup);
        if (voxelGroup.setAttribute) voxelGroup.setAttribute("visibility", "hidden");
        if (projectionGroup.setAttribute) projectionGroup.setAttribute("visibility", "visible");
        if (visual.setAttribute) visual.setAttribute("data-view", viewName(view));
        var columns = projection.cells.reduce(function (max, cell) { return Math.max(max, cell.u + 1); }, 1);
        var startX = 180 - columns * 17;
        var heading = shape("text", { x: 18, y: 25, "class": "mlab-projection-title" }, projectionGroup);
        heading.textContent = viewName(view) + " · 最高 " + projection.maxHeight + " 层";
        projection.cells.forEach(function (cell) {
          var x = startX + cell.u * 34;
          var y = view === "top" ? 48 + cell.v * 34 : 144 - (cell.v + 1) * 34;
          shape("rect", { x: x, y: y, width: 32, height: 32, rx: 3, "class": "mlab-projection-cell", "data-projection-cell": "true", "data-height": cell.height }, projectionGroup);
          if (view === "top") {
            var heightLabel = shape("text", { x: x + 16, y: y + 21, "class": "mlab-height-label", "text-anchor": "middle" }, projectionGroup);
            heightLabel.textContent = cell.height;
          }
        });
        interact(viewName(view) + "有 " + projection.cells.length + " 个投影格；数字是叠放高度，最高 " + projection.maxHeight + " 层");
      }
      [rot, exp, xr].forEach(function (n) { n.addEventListener("input", function () { state.rotation = Number(rot.value) || 0; state.explode = Number(exp.value) || 0; state.xray = !!xr.checked; drawVoxel(); interact("旋转 " + state.rotation + " 度，爆炸 " + state.explode + "%，" + (state.xray ? "已打开透视" : "透视关闭")); }); });
      [["正视图", "front"], ["俯视图", "top"], ["左视图", "left"]].forEach(function (entry) { var b = button(entry[0]); b.addEventListener("click", function () { drawProjection(entry[1]); }); });
    } else if (definition.id === "unit4") {
      var trace = input("range", 0, "描图纸拖动"); trace.min = 0; trace.max = 100;
      var center = input("range", 0, "旋转中心"); center.min = 0; center.max = 4;
      for (var gx = 0; gx < 8; gx++) shape("path", { d: "M" + (20 + gx * 40) + " 10V170M10 " + (20 + gx * 20) + "H350", "class": "mlab-grid-line" }, visual);
      var tracing = shape("polygon", { points: "120,45 180,45 205,100 180,145 120,145 95,100", "class": "mlab-trace", opacity: "0.45" }, visual);
      var pivot = shape("circle", { cx: 140, cy: 100, r: 6, "class": "mlab-pivot", visibility: "hidden" }, visual);
      var axisGuide = shape("line", { x1: 140, y1: 15, x2: 140, y2: 165, "class": "mlab-axis", visibility: "hidden" }, visual);
      ["平移", "旋转", "轴对称"].forEach(function (mode) { var b = button(mode); b.addEventListener("click", function () { state.mode = mode; drawTrace(); interact("模式：" + mode + " · 旋转中心 " + center.value); }); });
      function drawTrace() { var model = movementTransform(state.mode, trace.value, center.value); if (tracing.setAttribute) tracing.setAttribute("transform", model.transform); if (pivot.setAttribute) { pivot.setAttribute("cx", model.pivotX); pivot.setAttribute("visibility", state.mode === "旋转" ? "visible" : "hidden"); } if (axisGuide.setAttribute) { axisGuide.setAttribute("x1", model.pivotX); axisGuide.setAttribute("x2", model.pivotX); axisGuide.setAttribute("visibility", state.mode === "轴对称" ? "visible" : "hidden"); } }
      trace.addEventListener("input", function () { drawTrace(); interact("描图纸移动 " + (trace.value || 0) + "% · " + state.mode); });
      center.addEventListener("input", function () { drawTrace(); interact("旋转中心第 " + (Number(center.value) + 1) + " 格"); });
    } else if (definition.id === "unit7") {
      if (visual.setAttribute) visual.setAttribute("viewBox", "0 0 360 240");
      var targetOutline = shape("rect", { x: 80, y: 40, width: 100, height: 100, rx: 2, "class": "mlab-area-outline", visibility: "hidden" }, visual);
      var initialPieces = triangleReassembly("cut").pieces;
      var fixedPiece = shape("polygon", { points: pointsValue(initialPieces[0].points), "class": "mlab-piece mlab-piece-fixed", "data-piece": "fixed" }, visual);
      var movingPiece = shape("polygon", { points: pointsValue(initialPieces[1].points), "class": "mlab-piece mlab-piece-moving", "data-piece": "moving" }, visual);
      var cutLine = shape("line", { x1: 180, y1: 40, x2: 180, y2: 140, "class": "mlab-cut-line" }, visual);
      function drawReassembly(phase) {
        var model = triangleReassembly(phase);
        if (fixedPiece.setAttribute) fixedPiece.setAttribute("transform", model.pieces[0].transform);
        if (movingPiece.setAttribute) movingPiece.setAttribute("transform", model.pieces[1].transform);
        if (movingPiece.setAttribute) movingPiece.setAttribute("data-motion", phase === "cut" ? "切开" : (phase === "rotate" ? "旋转90度" : "旋转90度并平移"));
        if (cutLine.setAttribute) cutLine.setAttribute("visibility", phase === "cut" ? "visible" : "hidden");
        if (targetOutline.setAttribute) targetOutline.setAttribute("visibility", phase === "join" ? "visible" : "hidden");
      }
      ["cut", "rotate", "join"].forEach(function (phase) { var label = { cut: "切割", rotate: "旋转", join: "拼合" }[phase]; var b = button(label); b.addEventListener("click", function () { state.phase = phase; drawReassembly(phase); var message = phase === "cut" ? "沿高切成两块：面积合计仍是 10000" : (phase === "rotate" ? "右半块绕切点旋转 90°，边长没有改变" : "旋转后平移，两块拼成 100 × 100 正方形；面积仍是 10000，所以底 × 高 ÷ 2"); interact(message); }); });
    } else if (definition.id === "unit8") {
      var road = input("range", 20, "道路长度"); road.min = 5; road.max = 100; road.step = 5;
      var start = input("checkbox", true, "起点"); var end = input("checkbox", true, "终点");
      var roadLine = shape("path", { d: "M30 95H330", class: "mlab-road" }, visual);
      var treeNodes = [];
      for (var ti = 0; ti < 21; ti++) treeNodes.push(shape("circle", { cx: 30, cy: 95, r: 5, class: "mlab-tree" }, visual));
      function updateRoad(announce) { state.length = Number(road.value) || 20; state.start = !!start.checked; state.end = !!end.checked; var layout = plantingLayout(state.length, 5, state.start, state.end); var roadEnd = 30 + state.length * 3; if (roadLine.setAttribute) roadLine.setAttribute("d", "M30 95H" + roadEnd); treeNodes.forEach(function (tree, index) { var tick = layout.ticks[index]; if (tree.style) tree.style.display = tick === undefined ? "none" : ""; if (tick !== undefined && tree.setAttribute) tree.setAttribute("cx", 30 + tick * 15); }); var message = "道路 " + state.length + " 米 · 间隔 " + layout.intervals + " 个 · 棵数 " + layout.trees + " 棵"; readout.textContent = message; if (announce) feedback(message); }
      [road, start, end].forEach(function (n) { n.addEventListener("input", function () { updateRoad(true); }); }); updateRoad(false);
    } else if (definition.id === "unit9") {
      var angle = input("range", 90, "顶点角（由形状决定）"); angle.min = 30; angle.max = 180; angle.step = 1; angle.disabled = true;
      var shapeButton = button("切换形状"); shapeButton.addEventListener("click", function () { state.shape = state.shape === "正方形" ? "正五边形" : "正方形"; state.angle = state.shape === "正方形" ? 90 : 108; angle.value = state.angle; updateTile(true); });
      var repeat = button("重复铺排"); repeat.addEventListener("click", function () { updateTile(true); });
      var pattern = shape("g", { class: "mlab-tiles" }, visual);
      shape("circle", { cx: 180, cy: 90, r: 5, class: "mlab-vertex" }, visual);
      function updateTile(announce) { state.angle = fixedInteriorAngle(state.shape); angle.value = state.angle; var model = vertexTiling(state.shape); if (pattern.replaceChildren) pattern.replaceChildren(); else if (pattern.children) pattern.children.length = 0; var points = state.shape === "正方形" ? "0,0 50,0 50,50 0,50" : "0,0 45,0 58.9,42.8 22.5,69.3 -13.9,42.8"; for (var pi = 0; pi < model.copies; pi++) shape("polygon", { points: points, transform: "translate(180 90) rotate(" + (pi * state.angle) + ")", class: "mlab-tile", "data-shape": state.shape }, pattern); if (visual.classList) { visual.classList.remove("mlab-gap", "mlab-seamless", "mlab-overlap"); visual.classList.add(model.fits ? "mlab-seamless" : (model.difference > 0 ? "mlab-gap" : "mlab-overlap")); } var detail = model.difference === 0 ? "正好 360°" : (model.difference > 0 ? "还差 " + model.difference + "°" : "超过 " + Math.abs(model.difference) + "°"); var message = state.shape + " · " + model.copies + " 个顶点角：" + model.sum + "°（" + detail + "）· " + model.reason; readout.textContent = message; if (announce) feedback(message); }
      angle.addEventListener("input", function () { updateTile(true); }); updateTile(false);
    }
    var controller = { root: el, controls: controls, randomize: function () { controls.forEach(function (n) { if (n.type === "range" && !n.disabled) n.value = Number(n.value || 0) + 1; }); interact("试试看：换一个操作"); } };
    return controller;
  }
  function getDefinition(unitId) { return DEFINITIONS[unitId] || null; }
  var ACTION_LABELS = {
    unit1: "旋转、爆炸、透视与三视图判断",
    unit4: "描图纸、旋转中心与图形运动",
    unit7: "切割、旋转、拼合并看公式",
    unit8: "拉伸道路、切换端点、实时显示间隔与棵数",
    unit9: "选择形状、旋转并重复铺排",
  };
  function mount(unitId, container, context) {
    if (!container || !getDefinition(unitId)) return null;
    if (container.__mlabGeometryMount) return container.__mlabGeometryMount;
    var host = (container.ownerDocument || (typeof document !== "undefined" ? document : null)).createElement("section");
    var controller = panel(host, getDefinition(unitId), ACTION_LABELS[unitId], context || {});
    container.appendChild(host);
    container.__mlabGeometryMount = controller;
    return controller;
  }

  return { getDefinition: getDefinition, mount: mount, geometry: {
    rotatePoint: rotatePoint, translatePoint: translatePoint, reflectPoint: reflectPoint,
    reconstructHidden: reconstructHidden, viewName: viewName, orthographicProjection: orthographicProjection,
    areaAfterCut: areaAfterCut, triangleReassembly: triangleReassembly,
    formulaFor: formulaFor, plantingCount: plantingCount, tilingResult: tilingResult,
    movementTransform: movementTransform, plantingLayout: plantingLayout, vertexTiling: vertexTiling,
  } };
});
