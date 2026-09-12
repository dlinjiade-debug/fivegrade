const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("小数除法挑战把 7.5÷0.25 的正确答案锁定为 30", () => {
  const source = read("js/unit3.js");
  assert.match(source, /7\.5 ÷ 0\.25 = \?"[^\n]+opts: \["3", "30", "300"\], ans: 1/);
});

test("小数除法转化题同步移动相同位数并排除零的边界", () => {
  const source = read("js/unit3.js");
  assert.match(source, /51\.3 ÷ 0\.27"[^\n]+opts: \["513 ÷ 27", "51\.3 ÷ 27", "5130 ÷ 27"\], ans: 2/);
  assert.match(source, /一个数（0除外）÷ 0\.01/);
});

test("小数除法转化练习不把等值算式同时列为对错选项", () => {
  const source = read("js/unit3.js");
  assert.match(source, /62\.4 ÷ 2\.6"[^\n]+opts: \["624 ÷ 26", "62\.4 ÷ 26", "624 ÷ 260"\], ans: 0/);
  assert.doesNotMatch(source, /62\.4 ÷ 2\.6"[^\n]+6240 ÷ 260/);
});

test("全局换题只触发当前可见可用的题目按钮", () => {
  const source = read("js/common.js");
  assert.match(source, /!button\.disabled/);
  assert.match(source, /button\.getClientRects\(\)\.length/);
  assert.match(source, /style\.display !== "none"/);
});

test("只有通过独立破案才显示整份案卷完成", () => {
  const common = read("js/common.js");
  const home = read("js/home.js");
  assert.match(common, /isUnitComplete\(unitId\)/);
  assert.match(common, /levels\["case-complete"\] \|\| levels\.game/);
  assert.match(home, /Math5\.isUnitComplete\(item\.id\)/);
  assert.doesNotMatch(home, /unitStars\(item\.id\) > 0/);
  assert.match(common, /if \(!Math5\.hasStar\(unitId, "game"\)\)/);
});

test("九章挑战的下一题都有题库边界保护", () => {
  for (let unit = 1; unit <= 9; unit += 1) {
    const source = read(`js/unit${unit}.js`);
    assert.match(source, /gIdx >= G_BANK\.length - 1\) return/, `unit${unit}`);
  }
});

test("九章选择题答对后锁定本题，不能重复累计分数", () => {
  for (let unit = 1; unit <= 9; unit += 1) {
    const source = read(`js/unit${unit}.js`);
    assert.match(source, /let answered = false/, `unit${unit}`);
    assert.match(source, /if \(answered\) return/, `unit${unit}`);
    assert.match(source, /answered = true/, `unit${unit}`);
  }
});

test("图形运动挑战的旋转中心与两条对称轴和坐标映射一致", () => {
  const source = read("js/unit4.js");
  assert.match(source, /const G_ROTATE_CENTER = \[2\.5, 3\.5\]/);
  assert.match(source, /const G_AXIS_X = 4, G_AXIS_Y = 3/);
  assert.match(source, /polys: \[triAt\(\[\[3, 1\], \[1, 1\], \[3, 3\]\]\)\]/);
  assert.match(source, /polys: \[triAt\(\[\[1, 3\], \[3, 3\], \[1, 1\]\]\)\]/);
  assert.match(source, /x1="' \+ G_AXIS_X \* CELL/);
  assert.match(source, /y1="' \+ G_AXIS_Y \* CELL/);
  assert.doesNotMatch(source, /x1="128"|y1="105"/);
});

test("旋转中心对比的文字与红点实际位置一致", () => {
  const source = read("js/unit4.js");
  assert.match(source, /绕左上角的点 O 逆时针旋转 90°/);
  assert.match(source, /绕斜边中点 O 逆时针旋转 90°/);
  assert.doesNotMatch(source, /绕左下角的点 O|图形右边的点 O|图形外的点 O/);
});

test("概率逐步演示为每一步保存当时的累计次数", () => {
  const source = read("js/unit6.js");
  assert.match(source, /const heads = h, tails = t/);
  assert.match(source, /coinView\(flip, heads, tails, n\)/);
  assert.match(source, /const red = r, white = w/);
  assert.match(source, /bagView\(d, red, white, n\)/);
});

test("导演分步演示会显示每一步的讲解文字且避免重复气泡", () => {
  const source = read("js/common.js");
  assert.match(source, /steps\[idx\]\.explain/);
  assert.match(source, /querySelector\("\.explain-bubble"\)/);
  assert.match(source, /className = "explain-bubble"/);
});

test("速度时间示例统一使用分钟单位", () => {
  const source = read("js/unit5.js");
  assert.match(source, /行驶时间 \/ 分/);
  assert.doesNotMatch(source, /行驶时间 \/ 时/);
});

test("公平硬币实验描述频率趋近而非次数差单调缩小", () => {
  const source = read("js/unit6.js");
  assert.match(source, /频率[^。]*1\/2/);
  assert.doesNotMatch(source, /越来越接近|次数越多[^。]*次数[^。]*接近/);
});

test("摸球逐步提示不把随机样本误说成红球必然更多", () => {
  const source = read("js/unit6.js");
  assert.doesNotMatch(source, /n >= 7 \? " 红球明显更多/);
  assert.match(source, /继续观察累计频率/);
});

test("连续摸球题明确采用放回抽样，保证每次条件不变", () => {
  const source = read("js/unit6.js");
  assert.match(source, /每次摸完放回。前三次都是红球/);
  assert.match(source, /每次放回，袋中组成不变/);
});

test("闯关模式的规律页提供一次明确操作，完成后才能进入独立破案", () => {
  const source = read("js/common.js");
  assert.match(source, /data-conclusion-confirm/);
  assert.match(source, /我说出了规律/);
  assert.match(source, /state\.interacted\.conclusion = true/);
});

test("闯关门槛识别数字间小数点、画布和表单等真实操作", () => {
  const source = read("js/common.js");
  assert.match(source, /\.clickable-digit/);
  assert.match(source, /canvas/);
  assert.match(source, /select/);
});

test("组合体投影保留悬空位置，不把桥洞补成实心列", () => {
  const source = read("js/unit1.js");
  assert.match(source, /levels: \{\}/);
  assert.match(source, /map\[k\]\.levels\[v\] = true/);
  assert.match(source, /if \(!map\[k\]\.levels\[z\]\) continue/);
  assert.match(source, /每一竖列投影有/);
  const html = read("unit1.html");
  assert.match(html, /遇到桥洞不能把空位补成方格/);
  assert.doesNotMatch(html, /下面一定有支撑/);
});

test("斜角模型统计使用俯视占地和叠放数，不冒充可见与遮挡", () => {
  const source = read("js/unit1.js");
  assert.match(source, /俯视占地/);
  assert.match(source, /上方叠放/);
  assert.doesNotMatch(source, /看见 [^\n]+挡住/);
});

test("小数乘法百分格把每小格标为 0.01 而非把总面积写进每格", () => {
  const source = read("js/unit2.js");
  assert.match(source, /text-anchor="middle">0\.01<\/text>/);
  assert.doesNotMatch(source, /text-anchor="middle">0\.06<\/text>/);
});

test("图形与小数点选择项使用原生按钮，键盘可完成动手验证", () => {
  const unit1 = read("js/unit1.js");
  const unit2 = read("js/unit2.js");
  const unit4 = read("js/unit4.js");
  assert.match(unit1, /const wrap = document\.createElement\("button"\)/);
  assert.match(unit2, /const dot = document\.createElement\("button"\)/);
  assert.match(unit4, /const wrap = document\.createElement\("button"\)/);
  assert.match(unit1, /列高依次为/);
  assert.match(unit1, /占地格坐标为/);
  assert.match(unit1, /aria-label", pViewOptionLabel\(q\.dir, o\.v, optionIndex\)/);
  assert.match(unit4, /平移后顶点坐标依次为/);
  assert.match(unit4, /aria-label", pPositionOptionLabel\(o\.pts, optionIndex\)/);
});

test("九章练习与挑战反馈都是可播报的状态消息", () => {
  for (let unit = 1; unit <= 9; unit += 1) {
    const html = read(`unit${unit}.html`);
    assert.match(html, /id="pFeedback"[^>]+role="status"[^>]+aria-live="polite"/, `unit${unit} practice`);
    assert.match(html, /id="gFeedback"[^>]+role="status"[^>]+aria-live="polite"/, `unit${unit} challenge`);
  }
});

test("图形运动与简易方程的题数和盖章门槛由题库动态同步", () => {
  const unit4Html = read("unit4.html");
  const unit4Js = read("js/unit4.js");
  const unit5Html = read("unit5.html");
  const unit5Js = read("js/unit5.js");

  assert.match(unit4Html, /id="pTotal">5</);
  assert.match(unit4Html, /id="gTotal">8</);
  assert.match(unit4Html, /id="gStarHint">答对 6 题/);
  assert.match(unit4Js, /pTotal"\)\.textContent = P_BANK\.length/);
  assert.match(unit4Js, /gTotal"\)\.textContent = G_BANK\.length/);
  assert.match(unit4Js, /gStarHint"\)\.textContent = "答对 " \+ Math\.ceil\(G_BANK\.length \* 0\.75\)/);

  assert.match(unit5Html, /id="gStarHint">答对 14 题/);
  assert.match(unit5Js, /gTotal"\)\.textContent = G_BANK\.length/);
  assert.match(unit5Js, /gStarHint"\)\.textContent = "答对 " \+ Math\.ceil\(G_BANK\.length \* 0\.75\)/);
});

test("斜向平移的 8 格高画板完整容纳向下移动后的三角形", () => {
  const source = read("js/unit4.js");
  const demo = source.match(/function demoTranslateDiag\(\)[\s\S]*?(?=\/\* 旋转中心对比)/)[0];
  assert.match(demo, /gridSVG\(\{ w: 8, h: 8/g);
  assert.doesNotMatch(demo, /gridSVG\(\{ w: 8, h: 6/);
});

test("梯形副本绕公共腰中点旋转并拼成底为 12 的非重叠平行四边形", () => {
  const source = read("js/unit7.js");
  assert.match(source, /const trap = \[\[3, 4\], \[7, 4\], \[9, 7\], \[1, 7\]\]/);
  assert.match(source, /const c = \[8, 5\.5\]/);
  assert.match(source, /board\(17, 9/);
  assert.match(source, /dimH\(3, 15, 3\.7, "4 \+ 8 = 12"/);

  const trap = [[3, 4], [7, 4], [9, 7], [1, 7]];
  const rotated = trap.map(([x, y]) => [16 - x, 11 - y]);
  assert.deepEqual(rotated, [[13, 7], [9, 7], [7, 4], [15, 4]]);
});
