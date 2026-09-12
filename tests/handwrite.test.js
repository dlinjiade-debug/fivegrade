const test = require("node:test");
const assert = require("node:assert/strict");

const HW = require("../js/handwrite.js");

test("手写公式的数字笔画完整落在 SVG 高度内，不裁掉下半截", () => {
  const rendered = HW.html([{ text: "5", color: "ink" }], { size: 44 });
  const transform = rendered.html.match(
    /transform="translate\([^,]+,([\d.]+)\) scale\(([\d.]+)\)"/
  );

  assert.ok(transform, "应生成带平移和缩放的数字笔画");

  const translateY = Number(transform[1]);
  const scale = Number(transform[2]);
  const glyphBottom = 43; // 数字 5 的手写路径最下端，来自字形坐标系的人工校验值。
  const halfStrokeWidth = 2;
  const renderedBottom = translateY + glyphBottom * scale + halfStrokeWidth;

  assert.ok(
    renderedBottom <= rendered.h,
    `笔画底部 ${renderedBottom.toFixed(2)}px 超出 SVG 高度 ${rendered.h}px`
  );
});
