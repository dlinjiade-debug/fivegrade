const test = require("node:test");
const assert = require("node:assert/strict");

const Labs = require("../js/labs-arithmetic.js");

test("四个招牌实验都提供定义，且每屏只有一个关键问题和不超过两句提示", () => {
  for (const unitId of ["unit2", "unit3", "unit5", "unit6"]) {
    const definition = Labs.getDefinition(unitId);
    assert.equal(definition.id, unitId);
    assert.ok(definition.question);
    assert.ok(Array.isArray(definition.hints));
    assert.ok(definition.hints.length <= 2);
  }
});

test("unit2 把整数积按小数位放点，并给出面积证据", () => {
  assert.equal(Labs.placeProductDecimal("6", 2), "0.06");
  assert.equal(Labs.placeProductDecimal("3525", 3), "3.525");
  assert.deepEqual(Labs.areaEvidence(0.3, 0.2), { area: 0.06, cells: 6 });
});

test("unit3 被除数和除数同步右移，商不变", () => {
  assert.deepEqual(Labs.shiftDivisionDecimals("7.65", "0.85"), {
    dividend: "765", divisor: "85", places: 2,
  });
  assert.deepEqual(Labs.divideWithRemainder(17, 5), { quotient: 3, remainder: 2 });
});

test("unit5 天平操作必须作用于两边并同步更新算式", () => {
  assert.deepEqual(Labs.applyBalanceOperation(7, 7, { type: "subtract", value: 2 }), {
    left: 5, right: 5, operation: "- 2",
  });
  assert.throws(() => Labs.applyBalanceOperation(7, 6, { type: "subtract", value: 2 }), /balance/);
});

test("unit6 连续实验返回频数、频率和低阅读负担反馈", () => {
  const result = Labs.simulateFrequency(["red", "blue"], ["red", "red", "blue", "red"]);
  assert.deepEqual(result.counts, { red: 3, blue: 1 });
  assert.deepEqual(result.frequencies, { red: 0.75, blue: 0.25 });
  assert.match(Labs.frequencyFeedback(result), /红|red/);
});

test("unit6 的十次实验逐次随机抽样，不把理论比例直接取整成固定结果", () => {
  const draws = [0.1, 0.7, 0.2, 0.8, 0.3, 0.9, 0.4, 0.95, 0.5, 0.99];
  const result = Labs.sampleWeightedCounts(3, 2, 10, () => draws.shift());
  assert.deepEqual(result, { red: 5, blue: 5, total: 10 });
  assert.deepEqual(Labs.sampleWeightedCounts(3, 2, 4, () => 0.99), { red: 0, blue: 4, total: 4 });

  const source = require("fs").readFileSync(require.resolve("../js/labs-arithmetic.js"), "utf8");
  assert.match(source, /sampleWeightedCounts\(controller\.state\.red, controller\.state\.blue, 10, Math\.random\)/);
  assert.doesNotMatch(source, /Math\.round\(10 \* controller\.state\.red/);
});

test("mount 可重复调用且只写入传入容器", () => {
  const container = { innerHTML: "" };
  const first = Labs.mount("unit2", container, { mode: "teacher" });
  const second = Labs.mount("unit2", container, { mode: "teacher" });
  assert.equal(first, second);
  assert.match(container.innerHTML, /mlab-/);
  assert.equal(globalThis.MysteryLabPacks, undefined);
});

test("浏览器命名空间保留 arithmetic 包名", () => {
  const source = require("fs").readFileSync(require.resolve("../js/labs-arithmetic.js"), "utf8");
  assert.match(source, /packs\.arithmetic\s*=\s*api/);
});

test("四章挂载都提供可点击的真实轻量操作和 randomize", () => {
  const feedback = [];
  for (const unitId of ["unit2", "unit3", "unit5", "unit6"]) {
    const container = domContainer();
    const controller = Labs.mount(unitId, container, { onInteract: (message) => feedback.push(message) });
    assert.equal(typeof controller.randomize, "function");
    assert.ok(container.querySelector("button"));
    controller.randomize();
  }
  assert.equal(feedback.length, 0);
});

test("挂载 HTML 含四章招牌操作的可见证据", () => {
  for (const [unitId, markers] of Object.entries({
    unit2: ["3.6", "36×24", "mlab-dot"], unit3: ["7.56", "0.6", "mlab-quotient"],
    unit5: ["−6", "÷2", "mlab-balance"], unit6: ["红", "蓝", "频率"],
  })) {
    const container = { innerHTML: "" };
    Labs.mount(unitId, container, {});
    markers.forEach((marker) => assert.match(container.innerHTML, new RegExp(marker.replace(/[×÷−]/g, "\\$&"))));
  }
});

test("unit2 百分格证据与竖式行严格对应 3.6×2.4=8.64", () => {
  assert.deepEqual(Labs.gridEvidence(36, 24), { rows: 36, columns: 24, cells: 864 });
  const container = { innerHTML: "" };
  Labs.mount("unit2", container, {});
  assert.match(container.innerHTML, /3\.6/);
  assert.match(container.innerHTML, /×\s*2\.4/);
  assert.match(container.innerHTML, /144/);
  assert.match(container.innerHTML, /72/);
  assert.match(container.innerHTML, /864/);
  assert.match(container.innerHTML, /36×24=864/);
  assert.doesNotMatch(container.innerHTML, /6×4=24/);
});

test("unit3 右移一位展示 75.6÷6，并保留商小数点和落数", () => {
  assert.deepEqual(Labs.shiftDivisionDecimals("7.56", "0.6"), { dividend: "75.6", divisor: "6", places: 1 });
  const container = { innerHTML: "" };
  Labs.mount("unit3", container, {});
  assert.match(container.innerHTML, /75\.6/);
  assert.match(container.innerHTML, /75\.6\s*÷\s*6/);
  assert.match(container.innerHTML, /商小数点/);
  assert.match(container.innerHTML, /落数/);
  assert.doesNotMatch(container.innerHTML, /756 · 除数 60/);
});

test("unit5 两步方程从等式两边同步操作到解", () => {
  const container = { innerHTML: "" };
  Labs.mount("unit5", container, {});
  assert.match(container.innerHTML, /mlab-left-pan">2x \+ 6/);
  assert.match(container.innerHTML, /mlab-right-pan">18/);
  assert.match(container.innerHTML, /两边/);
  assert.match(container.innerHTML, /−6/);
  assert.match(container.innerHTML, /÷2/);
});

test("unit6 频率条有红蓝两段且 randomize 可重置状态", () => {
  const container = { innerHTML: "" };
  const controller = Labs.mount("unit6", container, {});
  assert.match(container.innerHTML, /mlab-bar-red/);
  assert.match(container.innerHTML, /mlab-bar-blue/);
  assert.match(container.innerHTML, /频率/);
  assert.equal(controller.randomize(), true);
  assert.equal(controller.state.trials, 0);
});

test("unit6 结果节点不与实验外层重名，更新频数不会清空控件", () => {
  const container = { innerHTML: "" };
  Labs.mount("unit6", container, {});
  assert.match(container.innerHTML, /<section class=\"mlab-screen mlab-frequency\"/);
  assert.doesNotMatch(container.innerHTML, /<p class=\"mlab-frequency\">/);
  assert.match(container.innerHTML, /class=\"mlab-frequency-readout\"/);
});

test("算术操作台没有重复空按钮，面积分解与两步方程保持数学连贯", () => {
  const decimal = { innerHTML: "" };
  Labs.mount("unit2", decimal, {});
  assert.equal((decimal.innerHTML.match(/开始演示/g) || []).length, 0);
  assert.equal((decimal.innerHTML.match(/逐笔写竖式/g) || []).length, 1);
  assert.match(decimal.innerHTML, /6\s*\+\s*1\.2\s*\+\s*1\.2\s*\+\s*0\.24\s*=\s*8\.64/);

  const equation = { innerHTML: "" };
  Labs.mount("unit5", equation, {});
  assert.match(equation.innerHTML, /2x\s*\+\s*6\s*=\s*18/);
  assert.match(equation.innerHTML, /2x\s*=\s*12/);
  assert.match(equation.innerHTML, /x\s*=\s*6/);
  assert.doesNotMatch(equation.innerHTML, /4\.5/);
});

function domContainer() {
  const make = (tag) => ({
    tagName: tag.toUpperCase(), children: [], className: "", textContent: "", value: "",
    appendChild(node) { this.children.push(node); return node; },
    addEventListener(type, fn) { this["on" + type] = fn; },
    click() { if (this.onclick) this.onclick({ target: this }); if (this.onchange) this.onchange({ target: this }); },
  });
  const root = make("div");
  root.ownerDocument = { createElement: make };
  root.querySelector = (selector) => selector === "button" ? find(root, (node) => node.tagName === "BUTTON") : null;
  return root;
}
function find(node, predicate) {
  for (const child of node.children) { if (predicate(child)) return child; const hit = find(child, predicate); if (hit) return hit; }
  return null;
}
