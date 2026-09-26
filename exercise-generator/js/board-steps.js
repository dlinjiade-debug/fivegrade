(function (root) {
  "use strict";

  const BB = root.BB;
  if (!BB || !root.Chalk) return;
  if (root.HW && BB.setGlyphEngine) BB.setGlyphEngine(root.HW);

  // 普通文字会随下一步擦掉；逐行算式作为板书本体保留。
  BB.registerExpander("workline", function (spec) {
    return { ops: [{ k: "num", text: spec.text, x: spec.x, y: spec.y, size: spec.size, tone: spec.tone || "chalk", tag: "line" }] };
  });
  BB.registerExpander("workhan", function (spec) {
    return { ops: [{ k: "cn", text: spec.text, x: spec.x, y: spec.y, size: spec.size, tone: spec.tone || "good", tag: "answer" }] };
  });

  function captionOp(text) {
    const narrow = root.matchMedia && root.matchMedia("(max-width: 760px)").matches;
    return { k: "cn", text: narrow ? "" : text, x: 72, y: 130, size: 27, tone: "accent", tag: "cue" };
  }

  function makeMul(question) {
    const data = question.board;
    const math = BB.verticalMul(data.a, data.b);
    const spec = { a: data.a, b: data.b, y: 115, rightX: 800, size: 43, pointJump: true };
    const steps = [];
    function add(label, tags) {
      steps.push({ keep: steps.length > 0, text: label, ops: [captionOp(label), { k: "vcalc", spec: Object.assign({}, spec, { only: tags }) }] });
    }
    add(data.lead || "先摆竖式", ["a", "mulSign", "b", "bar1"]);
    if (!math.single) {
      math.rows.forEach(function (row, i) {
        add("写第 " + (i + 1) + " 行部分积", ["partial-" + i]);
      });
      add("部分积相加", ["bar2", "sum"]);
    } else {
      add("算出整数积", ["sum"]);
    }
    if (math.dpSum > 0) {
      if (math.prodText.length <= math.dpSum) add("位数不足先补 0", ["pj-pad"]);
      add("数 " + math.dpSum + " 位，点小数点", ["pj-dot"]);
    }
    if (math.trailingZeros > 0) {
      const tags = [];
      for (let i = 0; i < math.trailingZeros; i += 1) tags.push("pj-tick-" + i);
      add(math.value.indexOf(".") < 0 ? "去掉末尾的 0 和小数点" : "去掉末尾的 0", tags);
      add("写最简结果", ["pj-result"]);
    }
    if (data.roundedAnswer) {
      steps.push({ keep: true, text: "看千分位，四舍五入", ops: [
        captionOp("看千分位，四舍五入"),
        { k: "workline", spec: { text: "≈ " + data.roundedAnswer, x: 300, y: 565, size: 48, tone: "good" } }
      ] });
    }
    if (data.finalLine) {
      steps.push({ keep: true, text: "付款减去总价", ops: [
        captionOp("付款减去总价"),
        { k: "workline", spec: { text: data.finalLine, x: 300, y: 565, size: 38, tone: "good" } }
      ] });
      steps.push({ keep: true, text: "写出带单位的答案", ops: [
        captionOp("写出带单位的答案"),
        { k: "workhan", spec: { text: "答：" + data.finalAnswer, x: 300, y: 625, size: 32, tone: "good" } }
      ] });
    }
    return steps;
  }

  function makeDiv(question) {
    const data = question.board;
    const options = { stopAfter: data.stopAfter, roundTo: data.roundTo };
    const model = BB.divModel(data.a, data.b, options);
    const spec = Object.assign({ a: data.a, b: data.b, y: 52, rightX: 830, size: 36, rowGap: 0.18 }, options);
    const steps = [];
    function add(label, tags) {
      steps.push({ keep: steps.length > 0, text: label, ops: [captionOp(label), { k: "vdiv", spec: Object.assign({}, spec, { only: tags }) }] });
    }
    add(model.shift ? "两数一起移小数点" : "列除法竖式", ["head"]);
    let dotWritten = false;
    model.kept.forEach(function (part, i) {
      if (!dotWritten && part.col > model.dotAt && model.hasPoint) {
        add("点上商的小数点", ["qdot"]);
        dotWritten = true;
      }
      add(part.q === 0 ? "不够除，商写 0" : "试商、乘、减、落", ["st" + i]);
    });
    if (model.cycle) add("余数重复，商循环", ["repeat"]);
    add(data.roundTo == null ? "写出商" : "多看一位，四舍五入", ["res"]);
    if (data.check) {
      steps.push({ keep: true, text: "乘回去验算", ops: [
        captionOp("乘回去验算"),
        { k: "workline", spec: { text: data.check, x: 300, y: 585, size: 36, tone: "good" } }
      ] });
    }
    if (data.finalAnswer) {
      steps.push({ keep: true, text: data.finalNote, ops: [
        captionOp(data.finalNote),
        { k: "workhan", spec: { text: "答：" + data.finalAnswer, x: 300, y: 570, size: 35, tone: "good" } }
      ] });
    }
    return steps;
  }

  function makeLines(question) {
    const data = question.board;
    return data.lines.map(function (line, i) {
      const label = (data.captions || [])[i] || "写下一步";
      return {
        keep: i > 0,
        text: label,
        ops: [
          captionOp(label),
          { k: "workline", spec: { text: line, x: 245, y: 82 + i * 109, size: line.length > 31 ? 38 : 44, tone: i === data.lines.length - 1 ? "good" : "chalk" } }
        ]
      };
    });
  }

  root.ExerciseBoardSteps = function (question) {
    if (!question || !question.board) return [];
    if (question.board.kind === "mul") return makeMul(question);
    if (question.board.kind === "div") return makeDiv(question);
    if (question.board.kind === "lines") return makeLines(question);
    return [];
  };
})(typeof window !== "undefined" ? window : globalThis);
