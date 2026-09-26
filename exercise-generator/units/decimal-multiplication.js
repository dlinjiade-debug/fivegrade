(function (root) {
  "use strict";

  function createQuestion(template, tools) {
    const config = template.config;
    const rng = tools.random;
    const pick = tools.pick;
    const format = tools.formatScaled;
    const product = tools.multiplyDecimals;

    if (template.generator === "product") {
      const scaleA = pick(config.scaleA, rng);
      const scaleB = pick(config.scaleB, rng);
      let aRaw = tools.randomInt(config.minA, config.maxA, rng);
      let bRaw = tools.randomInt(config.minB, config.maxB, rng);
      if (template.id === "mul-small-product") {
        if (aRaw % 10 === 0) aRaw += 1;
        if (bRaw % 10 === 0) bRaw += 1;
      }
      const a = format(aRaw, scaleA);
      const b = format(bRaw, scaleB);
      const result = product(a, b);
      return {
        prompt: "列竖式计算：" + a + " × " + b + " = ?",
        answer: result.answer,
        board: { kind: "mul", a: a, b: b },
        analysis: [
          "先暂时遮住小数点，按整数乘法计算：" + result.leftDigits + " × " + result.rightDigits + " = " + result.rawProduct + "。",
          "两个因数一共有 " + (scaleA + scaleB) + " 位小数，从积的右边起数 " + (scaleA + scaleB) + " 位，点上小数点。",
          a + " × " + b + " = " + result.answer + "。回看积的数量级，确认小数点没有错位。"
        ],
        hint: scaleB === 0 ? "先按整数乘法算，再按小数因数的位数定位。" : "先估算积的范围，再暂时遮住小数点。"
      };
    }

    if (template.generator === "trailing-zero") {
      const values = tools.pickCase(template);
      const result = product(values[0], values[1]);
      const places = result.scale;
      let fixedDigits = String(Math.abs(result.rawProduct)).padStart(places + 1, "0");
      const fixedSplit = fixedDigits.length - places;
      const untrimmed = fixedDigits.slice(0, fixedSplit) + "." + fixedDigits.slice(fixedSplit);
      return {
        prompt: "计算并把结果化成最简小数：" + values[0] + " × " + values[1] + " = ?",
        answer: result.answer,
        board: { kind: "mul", a: values[0], b: values[1] },
        analysis: [
          "按整数乘法先算出 " + result.leftDigits + " × " + result.rightDigits + " = " + result.rawProduct + "。",
          "两个因数共有 " + places + " 位小数，所以先点成 " + untrimmed + "。",
          "小数末尾的 0 去掉后数值不变，因此最简写法是 " + result.answer + "。"
        ],
        hint: "小数点先按位数点好，再检查积末尾的 0。"
      };
    }

    if (template.generator === "missing-factor") {
      const values = tools.pickCase(template);
      const known = values[0];
      const factor = values[1];
      const result = product(known, factor);
      return {
        prompt: "已知 □ × " + known + " = " + result.answer + "，求 □。",
        answer: factor,
        board: { kind: "lines", lines: ["□ × " + known + " = " + result.answer, "□ = " + result.answer + " ÷ " + known, "□ = " + factor, factor + " × " + known + " = " + result.answer], captions: ["找未知因数", "用除法反求", "写出结果", "代回验算"] },
        analysis: [
          "把乘法关系反过来：未知因数 = 积 ÷ 已知因数。",
          result.answer + " ÷ " + known + " = " + factor + "。",
          "验算：" + factor + " × " + known + " = " + result.answer + "，与题目中的积相同。"
        ],
        hint: "想一想：积、因数和另一个因数之间可以怎样互相转化？"
      };
    }

    if (template.generator === "distributive") {
      const values = tools.pickCase(template);
      const a = values[0];
      const b = values[1];
      const split = values[2];
      const result = product(a, b);
      const pieces = split.split(" + ");
      const firstPart = product(a, pieces[0]).answer;
      const secondPart = product(a, pieces[1]).answer;
      return {
        prompt: "用拆分因数的方法巧算：" + a + " × " + b + " = ?",
        answer: result.answer,
        board: { kind: "lines", lines: [a + " × " + b, a + " × (" + split + ")", a + " × " + pieces[0] + " + " + a + " × " + pieces[1], firstPart + " + " + secondPart + " = " + result.answer], captions: ["观察因数", "拆分因数", "分别相乘", "合并积"] },
        analysis: [
          "把 " + b + " 拆成 " + split + "，原式变成 " + a + " × (" + split + ")。",
          "分别相乘再相加：" + a + " × " + pieces[0] + " + " + a + " × " + pieces[1] + " = " + firstPart + " + " + secondPart + " = " + result.answer + "。",
          "验算：按整数乘法计算并按 " + (tools.parseDecimal(a).scale + tools.parseDecimal(b).scale) + " 位小数定位，结果也是 " + result.answer + "。"
        ],
        hint: "找一个能拆成整数与简单小数之和的因数。"
      };
    }

    if (template.generator === "associative") {
      const values = tools.pickCase(template);
      const a = values[0], b = values[1], c = values[2], d = values[3];
      const firstPair = product(a, b).answer;
      const secondPair = product(c, d).answer;
      const answer = product(firstPair, secondPair).answer;
      return {
        prompt: "用乘法结合律巧算：" + a + " × " + b + " × " + c + " × " + d + " = ?",
        answer: answer,
        board: { kind: "lines", lines: [a + " × " + b + " × " + c + " × " + d, "(" + a + " × " + b + ") × (" + c + " × " + d + ")", firstPair + " × " + secondPair, "= " + answer], captions: ["找两对可凑整因数", "改变分组", "分别算出两组", "写出积"] },
        analysis: ["先配对：" + a + " × " + b + " = " + firstPair + "，" + c + " × " + d + " = " + secondPair + "。", "再算 " + firstPair + " × " + secondPair + " = " + answer + "。"],
        hint: "先找能凑成整数的两对因数，再改变分组。"
      };
    }

    if (template.generator === "rounded-product") {
      const values = tools.pickCase(template);
      const a = values[0], b = values[1];
      const exact = product(a, b).answer;
      const rounded = tools.roundDecimal(exact, 2);
      return {
        prompt: "列竖式计算，积保留两位小数：" + a + " × " + b + " ≈ ?",
        answer: rounded,
        board: { kind: "mul", a: a, b: b, roundedAnswer: rounded },
        analysis: ["先算准确积：" + a + " × " + b + " = " + exact + "。", "看千分位，按四舍五入保留两位小数：约为 " + rounded + "。"],
        hint: "先算准确积，再看第三位小数。"
      };
    }

    if (template.generator === "compare") {
      const a = pick(config.factors, rng);
      const candidates = ["0.875", "0.96", "0.995", "1.005", "1.08", "1.125"];
      const b = pick(candidates, rng);
      const relation = Number(b) > 1 ? "大于" : "小于";
      return {
        prompt: "不计算精确积，判断 " + a + " × " + b + " 的积与 " + a + " 相比是“大于”还是“小于”？",
        answer: relation,
        board: { kind: "lines", lines: [a + " × " + b, b + (Number(b) > 1 ? " > 1" : " < 1"), a + " × " + b + (Number(b) > 1 ? " > " : " < ") + a], captions: ["观察第二个因数", "先比较它与 1", "判断积的范围"] },
        acceptedAnswers: [relation, relation === "大于" ? "更大" : "更小"],
        analysis: [
          "先看第二个因数：" + b + (Number(b) > 1 ? " 大于 1。" : " 小于 1 但大于 0。"),
          Number(b) > 1 ? "正数乘大于 1 的数，积比原数大。" : "正数乘 0 到 1 之间的数，积比原数小。",
          "所以积与 " + a + " 相比是“" + relation + "”。"
        ],
        hint: "先比较第二个因数和 1 的大小，不必展开竖式。"
      };
    }

    if (template.generator === "area") {
      const values = tools.pickCase(template);
      const result = product(values[0], values[1]);
      return {
        prompt: "一块长方形地毯长 " + values[0] + " 米、宽 " + values[1] + " 米，面积是多少平方米？",
        answer: result.answer,
        board: { kind: "mul", a: values[0], b: values[1], lead: "面积 = 长 × 宽" },
        analysis: [
          "长方形面积 = 长 × 宽，所以列式：" + values[0] + " × " + values[1] + "。",
          "按整数乘法先算 " + result.leftDigits + " × " + result.rightDigits + " = " + result.rawProduct + "，再数 " + result.scale + " 位小数。",
          "面积是 " + result.answer + " 平方米。"
        ],
        hint: "面积要把两条边长相乘，结果单位是平方米。"
      };
    }

    if (template.generator === "unit-price") {
      const values = tools.pickCase(template);
      const result = product(values[0], values[1]);
      const change = tools.subtractDecimals("100", result.answer);
      return {
        prompt: "每千克水果 " + values[0] + " 元，买 " + values[1] + " 千克，付 100 元应找回多少元？",
        answer: change,
        board: { kind: "mul", a: values[0], b: values[1], lead: "先算总价", finalLine: "100 − " + result.answer + " = " + change, finalAnswer: change + " 元" },
        analysis: [
          "总价 = 单价 × 数量，列式：" + values[0] + " × " + values[1] + "。",
          "先算整数积 " + result.leftDigits + " × " + result.rightDigits + " = " + result.rawProduct + "，再按共 " + result.scale + " 位小数定位。",
          "水果共 " + result.answer + " 元；100 − " + result.answer + " = " + change + "（元），应找回 " + change + " 元。"
        ],
        hint: "先用“单价 × 数量”求总价，再用付款数减去总价。"
      };
    }

    throw new Error("未登记的小数乘法题型：" + template.generator);
  }

  root.ExerciseUnits = root.ExerciseUnits || {};
  root.ExerciseUnits["decimal-multiplication"] = {
    id: "decimal-multiplication",
    title: "小数乘法",
    shortTitle: "小数乘法",
    unitNumber: "01",
    description: "列竖式 · 点小数点 · 验算",
    generate: createQuestion
  };
})(typeof window !== "undefined" ? window : globalThis);
