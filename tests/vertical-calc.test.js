const test = require("node:test");
const assert = require("node:assert/strict");

const Vertical = require("../js/vertical-calc.js");

test("小数位数与去点工具保持教材竖式需要的数位关系", () => {
  assert.equal(Vertical.vDecimalsOf("3.60"), 2);
  assert.equal(Vertical.vStripPoint("3.60"), "360");
  assert.equal(Vertical.vPlaceDecimal("864", 2), "8.64");
  assert.equal(Vertical.vPlaceDecimal("6", 2), "0.06");
});

test("小数点右移按除数转整数规则补零", () => {
  assert.equal(Vertical.vShiftPointRight("0.36", 1), "3.6");
  assert.equal(Vertical.vShiftPointRight("4", 2), "400");
});

test("多位乘数的部分积讲解包含十进位位值", () => {
  const sumStep = Vertical.buildMultSteps("2.35", "1.5")
    .find((step) => step.explain.includes("把部分积加起来"));

  assert.ok(sumStep, "应生成部分积相加步骤");
  assert.match(sumStep.explain, /1175 \+ 2350 = <b>3525<\/b>/);
  assert.doesNotMatch(sumStep.explain, /1175 \+ 235 =/);
});

test("有限小数会继续除尽，不能把 1÷8 误判为循环小数", () => {
  const steps = Vertical.buildDivSteps("1", "8");
  const allText = steps.map((step) => step.explain).join("\n");
  assert.match(steps.at(-1).explain, /1 ÷ 8 = [\s\S]*0\.125/);
  assert.doesNotMatch(allText, /循环小数/);
});

test("无限循环小数用下一位四舍五入到两位", () => {
  const steps = Vertical.buildDivSteps("1", "6");
  const final = steps.at(-1).explain;
  assert.match(final, /大约[\s\S]*0\.17/);
  assert.match(final, /保留两位小数/);
  assert.doesNotMatch(final, /color:#2e7d32'>0\.16<\/b>/);
});

test("小数乘除竖式为逐笔书写和阅读预留课堂慢速时间", () => {
  for (const steps of [
    Vertical.buildMultSteps("2.35", "1.5"),
    Vertical.buildDivSteps("7.65", "0.85"),
  ]) {
    assert.ok(steps.length > 4);
    for (const step of steps) {
      assert.ok(Number.isFinite(step.autoDelayMs), "每一步都应声明自动播放停留时间");
      assert.ok(step.autoDelayMs >= 6500, "自动播放不能在孩子看清前推进");
    }
    assert.ok(steps.some((step) => step.animatedItemCount >= 4), "列式必须逐笔出现，不能整张瞬间显示");
  }
});

test("除法写商、乘积、横线和余数按人类列式顺序标记", () => {
  const phases = Vertical.buildDivSteps("22.4", "4")
    .flatMap((step) => step.writePhases || []);
  const quotient = phases.indexOf("写商");
  const product = phases.indexOf("写乘积");
  const bar = phases.indexOf("画横线");
  const remainder = phases.indexOf("写余数");
  assert.ok(quotient >= 0);
  assert.ok(quotient < product && product < bar && bar < remainder);
});

test("静态竖式 SVG 属性保持合法，浏览器不会把草稿纸解析成零尺寸", () => {
  const originalDocument = global.document;
  global.document = {
    createElement() { return {}; },
  };

  try {
    const sheet = new Vertical.Sheet();
    sheet.put(0, 0, "3", "");
    sheet.dot(0, 0, "decpt");
    sheet.bar(1, 0, 1, "");
    sheet.ldiv(2, 0, 2, "");
    const html = sheet.toDOM().innerHTML;

    assert.doesNotMatch(html, /class="[^"]*""/);
    assert.match(html, /class="vs-ink" transform=/);
    assert.match(html, /class="vp decpt" cx=/);
    assert.match(html, /class="vs-ink" x1=/);
    assert.match(html, /class="vs-ink" d=/);
  } finally {
    global.document = originalDocument;
  }
});
