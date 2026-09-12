const test = require("node:test");
const assert = require("node:assert/strict");

const Lab = require("../js/labs-geometry.js");

test("五章定义包含一题一屏和低阅读提示", () => {
  for (const id of ["unit1", "unit4", "unit7", "unit8", "unit9"]) {
    const definition = Lab.getDefinition(id);
    assert.equal(definition.id, id);
    assert.ok(definition.title);
    assert.ok(definition.question);
    assert.ok(Array.isArray(definition.hints));
    assert.ok(definition.hints.length <= 2);
    assert.ok(definition.render);
  }
  assert.equal(Lab.getDefinition("unit2"), null);
});

test("unit1 纯函数由三视图反推可见高度并支持隐藏方块", () => {
  assert.deepEqual(
    Lab.geometry.reconstructHidden([[1, 0, 1], [0, 1, 2]], { front: [2, 1], left: [1, 2], top: [[1, 1], [1, 1]] }),
    { candidates: [[1, 1, 1]], certain: false }
  );
  assert.equal(Lab.geometry.viewName("front"), "正视图");
});

test("unit1 三个按钮绘制与同一组立方体一致且彼此不同的正投影", () => {
  const voxels = [
    { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 1 },
    { x: 0, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
  ];
  assert.equal(typeof Lab.geometry.orthographicProjection, "function");
  assert.deepEqual(Lab.geometry.orthographicProjection(voxels, "front").cells.map(({ u, v }) => [u, v]), [[0, 0], [1, 0], [1, 1], [2, 0]]);
  assert.deepEqual(Lab.geometry.orthographicProjection(voxels, "top").cells.map(({ u, v, height }) => [u, v, height]), [[0, 0, 1], [1, 0, 2], [0, 1, 1], [2, 1, 1]]);
  assert.deepEqual(Lab.geometry.orthographicProjection(voxels, "left").cells.map(({ u, v }) => [u, v]), [[0, 0], [0, 1], [1, 0]]);

  const controller = Lab.mount("unit1", fakeContainer(), { onInteract: () => {} });
  const visual = findDescendant(controller.root, (node) => node.tagName === "SVG");
  const buttons = descendants(controller.root).filter((node) => node.tagName === "BUTTON");
  const signatures = [];
  for (const label of ["正视图", "俯视图", "左视图"]) {
    buttons.find((node) => node.textContent === label).dispatchEvent({ type: "click" });
    signatures.push(descendants(visual)
      .filter((node) => node.getAttribute && node.getAttribute("data-projection-cell") === "true")
      .map((node) => [node.getAttribute("x"), node.getAttribute("y"), node.getAttribute("data-height")]).join("|"));
  }
  assert.equal(new Set(signatures).size, 3, "三个视图必须真正重绘成不同的格形，而非只改 data-view");
});

test("unit4 纯函数能算旋转、平移和轴对称后的点", () => {
  assert.deepEqual(Lab.geometry.rotatePoint({ x: 2, y: 1 }, { x: 1, y: 1 }, 90), { x: 1, y: 2 });
  assert.deepEqual(Lab.geometry.translatePoint({ x: 2, y: 1 }, -1, 3), { x: 1, y: 4 });
  assert.deepEqual(Lab.geometry.reflectPoint({ x: 4, y: 2 }, "x", 1), { x: -2, y: 2 });

  const rotationCenter = { x: 2.5, y: 3.5 };
  assert.deepEqual(
    [[2, 2], [4, 2], [2, 3]].map(([x, y]) => {
      const point = Lab.geometry.rotatePoint({ x, y }, rotationCenter, 90);
      return [point.x, point.y];
    }),
    [[4, 3], [4, 5], [3, 3]]
  );
  assert.deepEqual(
    [[5, 1], [7, 1], [5, 3]].map(([x, y]) => {
      const point = Lab.geometry.reflectPoint({ x, y }, "x", 4);
      return [point.x, point.y];
    }),
    [[3, 1], [1, 1], [3, 3]]
  );
  assert.deepEqual(
    [[1, 3], [3, 3], [1, 5]].map(([x, y]) => {
      const point = Lab.geometry.reflectPoint({ x, y }, "y", 3);
      return [point.x, point.y];
    }),
    [[1, 3], [3, 3], [1, 1]]
  );
});

test("unit4 签名实验的旋转中心和对称轴真正参与 SVG 变换", () => {
  const leftCenter = Lab.geometry.movementTransform("旋转", 25, 0);
  const rightCenter = Lab.geometry.movementTransform("旋转", 25, 4);
  assert.notEqual(leftCenter.transform, rightCenter.transform);
  assert.match(leftCenter.transform, new RegExp(" " + leftCenter.pivotX + " 100\\)$"));
  assert.equal(Lab.geometry.movementTransform("轴对称", 0, 2).transform, "translate(340 0) scale(-1 1)");
});

test("unit7 切割拼合面积不变并生成公式", () => {
  assert.equal(Lab.geometry.areaAfterCut({ area: 18, pieces: 3 }), 18);
  assert.equal(Lab.geometry.formulaFor("triangle", { base: 8, height: 5 }), "8 × 5 ÷ 2 = 20");
});

test("unit7 用两块刚体旋转和平移拼成等面积正方形", () => {
  assert.equal(typeof Lab.geometry.triangleReassembly, "function");
  const cut = Lab.geometry.triangleReassembly("cut");
  const joined = Lab.geometry.triangleReassembly("join");
  assert.equal(cut.pieces.length, 2);
  assert.equal(cut.totalArea, 10000);
  assert.equal(joined.totalArea, 10000);
  assert.deepEqual(joined.pieces[1].transformedPoints, [[80, 40], [180, 40], [80, 140]]);
  assert.match(joined.pieces[1].transform, /rotate\(90/);
  assert.match(joined.pieces[1].transform, /translate\(-100 -100\)/);
  assert.doesNotMatch(joined.pieces.map((piece) => piece.transform).join(" "), /scale/i);

  const controller = Lab.mount("unit7", fakeContainer(), { onInteract: () => {} });
  const pieces = descendants(controller.root).filter((node) => node.getAttribute && node.getAttribute("data-piece"));
  assert.equal(pieces.length, 2);
  descendants(controller.root).find((node) => node.tagName === "BUTTON" && node.textContent === "拼合").dispatchEvent({ type: "click" });
  assert.match(pieces[1].getAttribute("transform"), /rotate\(90/);
  assert.doesNotMatch(pieces.map((piece) => piece.getAttribute("transform") || "").join(" "), /scale/i);
});

test("unit7 不保留会拉伸面积分片的旧样式", () => {
  const css = require("node:fs").readFileSync(require.resolve("../css/mystery.css"), "utf8");
  assert.doesNotMatch(css, /\.mlab-piece\.mlab-phase-join\s*\{[^}]*scale/i);
});

test("unit8 根据端点开关计算间隔数和棵数", () => {
  assert.deepEqual(Lab.geometry.plantingCount(20, 5, true, true), { intervals: 4, trees: 5 });
  assert.deepEqual(Lab.geometry.plantingCount(20, 5, false, false), { intervals: 4, trees: 3 });
  assert.deepEqual(Lab.geometry.plantingCount(20, 5, true, false), { intervals: 4, trees: 4 });
  assert.deepEqual(Lab.geometry.plantingLayout(100, 5, true, true).ticks, Array.from({ length: 21 }, (_, i) => i));
  assert.deepEqual(Lab.geometry.plantingLayout(100, 5, false, false).ticks, Array.from({ length: 19 }, (_, i) => i + 1));
});

test("unit9 用顶点角判断是否无缝密铺", () => {
  assert.equal(Lab.geometry.tilingResult([90, 90, 90, 90]).fits, true);
  assert.equal(Lab.geometry.tilingResult([108, 108, 108]).reason, "有缝");
  assert.deepEqual(Lab.geometry.vertexTiling("正方形", 90), { copies: 4, sum: 360, fits: true, reason: "无缝", difference: 0 });
  assert.deepEqual(Lab.geometry.vertexTiling("正五边形", 108), { copies: 3, sum: 324, fits: false, reason: "有缝", difference: 36 });
});

test("unit9 正方形和正五边形始终使用各自固定内角", () => {
  assert.deepEqual(Lab.geometry.vertexTiling("正方形", 108), { copies: 4, sum: 360, fits: true, reason: "无缝", difference: 0 });
  assert.deepEqual(Lab.geometry.vertexTiling("正五边形", 90), { copies: 3, sum: 324, fits: false, reason: "有缝", difference: 36 });

  const controller = Lab.mount("unit9", fakeContainer(), { onInteract: () => {} });
  const angle = controller.controls.find((node) => node.tagName === "INPUT" && node.getAttribute("aria-label") === "顶点角（由形状决定）");
  const toggle = controller.controls.find((node) => node.tagName === "BUTTON" && node.textContent === "切换形状");
  assert.equal(angle.disabled, true);
  assert.equal(Number(angle.value), 90);
  controller.randomize();
  assert.equal(Number(angle.value), 90, "随机操作也不能篡改固定内角");
  toggle.dispatchEvent({ type: "click" });
  assert.equal(Number(angle.value), 108);
  angle.value = 90;
  angle.dispatchEvent({ type: "input" });
  const readout = descendants(controller.root).find((node) => node.className === "mlab-readout");
  assert.match(readout.textContent, /324°/);
  assert.doesNotMatch(readout.textContent, /270°/);
});

test("mount 使用 mlab 前缀、可重复调用且不需要全局依赖", () => {
  const container = fakeContainer();
  const first = Lab.mount("unit8", container, { onInteract: () => {} });
  const second = Lab.mount("unit8", container, { onInteract: () => {} });
  assert.equal(first, second);
  assert.equal(container.children.length, 1);
  assert.match(container.children[0].className, /^mlab-/);
  assert.ok(first.root);
  assert.equal(typeof first.randomize, "function");
  assert.ok(first.controls.length >= 2);
});

test("五章 mount 都提供招牌操作控件并把操作反馈给家教", () => {
  for (const id of ["unit1", "unit4", "unit7", "unit8", "unit9"]) {
    const container = fakeContainer();
    const feedback = [];
    const controller = Lab.mount(id, container, { onInteract: (message) => feedback.push(message) });
    assert.ok(controller.controls.length >= 2, id);
    controller.controls[0].dispatchEvent({ type: "input", target: controller.controls[0] });
    controller.randomize();
    assert.ok(feedback.length >= 1, id);
    assert.match(controller.root.textContent, /./, id);
  }
});

test("几何实验台使用中文可见标签和视觉证据，而不是英文操作串", () => {
  const cases = [
    ["unit1", ["旋转", "爆炸", "透视", "正视图"]],
    ["unit4", ["描图纸", "旋转中心", "平移", "旋转", "轴对称"]],
    ["unit7", ["切割", "旋转", "拼合"]],
    ["unit8", ["道路长度", "起点", "终点", "间隔", "棵数"]],
    ["unit9", ["形状", "顶点角", "重复铺排"]],
  ];
  for (const [id, words] of cases) {
    const c = fakeContainer();
    const controller = Lab.mount(id, c, { onInteract: () => {} });
    for (const word of words) assert.match(controller.root.textContent, new RegExp(word), id + " " + word);
    assert.doesNotMatch(controller.root.textContent, /rotate|explode|perspective|three-views|trace-paper|live-count/i);
    assert.ok(controller.root.children.some((node) => node.tagName === "SVG"), id);
  }
});

test("浏览器中的 SVG 使用正确命名空间创建", () => {
  const source = require("node:fs").readFileSync(require.resolve("../js/labs-geometry.js"), "utf8");
  assert.match(source, /createElementNS\(/);
});

test("真实 SVG 的只读 className 不会阻断实验挂载", () => {
  const container = fakeContainer();
  container.ownerDocument.createElementNS = function (_namespace, tag) {
    const attributes = {};
    const node = {
      tagName: tag.toUpperCase(), ownerDocument: container.ownerDocument, children: [], textContent: "", style: {},
      appendChild(child) { this.children.push(child); return child; },
      setAttribute(name, value) { attributes[name] = String(value); },
      getAttribute(name) { return attributes[name] || null; },
      addEventListener() {},
      classList: { add() {}, remove() {} },
    };
    Object.defineProperty(node, "className", { get() { return { baseVal: attributes.class || "" }; } });
    return node;
  };
  assert.doesNotThrow(() => Lab.mount("unit1", container, { onInteract: () => {} }));
  const svg = container.children[0].children.find((node) => node.tagName === "SVG");
  assert.equal(svg.getAttribute("class"), "mlab-visual");
});

function fakeContainer() {
  function createNode(tag) {
    const attributes = {};
    const classes = new Set();
    return {
      tagName: tag.toUpperCase(), ownerDocument: doc, children: [], className: "", textContent: "", innerHTML: "",
      value: "", checked: false, disabled: false, listeners: {}, style: {},
      appendChild(node) { this.children.push(node); this.textContent = this.children.map((child) => child.textContent || "").join(""); return node; },
      replaceChildren(...nodes) { this.children = nodes; this.textContent = nodes.map((child) => child.textContent || "").join(""); },
      setAttribute(name, value) { attributes[name] = String(value); if (name === "class") this.className = String(value); },
      getAttribute(name) { return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null; },
      addEventListener(type, fn) { (this.listeners[type] || (this.listeners[type] = [])).push(fn); },
      dispatchEvent(event) { (this.listeners[event.type] || []).forEach((fn) => fn(event)); },
      classList: {
        add(...names) { names.forEach((name) => classes.add(name)); },
        remove(...names) { names.forEach((name) => classes.delete(name)); },
      },
    };
  }
  const doc = {
    createElement: createNode,
    createElementNS(_namespace, tag) { return createNode(tag); },
  };
  return {
    children: [],
    appendChild(node) { this.children.push(node); this.textContent = this.children.map((child) => child.textContent || "").join(""); return node; },
    querySelector(selector) {
      if (selector === "button") return this.children[0] && this.children[0].children.find((child) => child.tagName === "BUTTON");
      return null;
    },
    ownerDocument: doc,
  };
}

function descendants(root) {
  const found = [];
  (function visit(node) {
    for (const child of node.children || []) { found.push(child); visit(child); }
  }(root));
  return found;
}

function findDescendant(root, predicate) {
  return descendants(root).find(predicate);
}
