(function (root) {
  "use strict";

  function createQuestion(template, tools) {
    const config = template.config;
    const rng = tools.random;
    const pick = tools.pick;

    if (template.generator === "letter-expression") {
      const values = tools.pickCase(template);
      const count = values.first + values.second;
      const answer = count + "x+" + values.fee;
      return {
        prompt: "每" + values.unit + values.item + " x 元，两次分别买 " + values.first + " " + values.unit + "和 " + values.second + " " + values.unit + "，另付 " + values.fee + " 元" + values.feeName + "。用含 x 的式子表示总费用。",
        answer: answer,
        acceptedAnswers: [answer, values.fee + "+" + count + "x", count + "×x+" + values.fee, count + "*x+" + values.fee],
        board: { kind: "lines", lines: [values.first + "x + " + values.second + "x + " + values.fee, "(" + values.first + " + " + values.second + ")x + " + values.fee, "= " + count + "x + " + values.fee], captions: ["分别写出两次费用", "合并同价数量", "写成最简式"] },
        analysis: ["两次购买分别是 " + values.first + "x 元和 " + values.second + "x 元，另有 " + values.fee + " 元" + values.feeName + "。", "合并同类项：" + values.first + "x + " + values.second + "x + " + values.fee + " = " + count + "x + " + values.fee + "（元）。"],
        hint: "先把两次购买各写成含 x 的式子，再合并 x 项。"
      };
    }

    if (template.generator === "decimal-one-step") {
      const values = tools.pickCase(template);
      const kind = values[0], a = values[1], b = values[2];
      const neat = function (value) { return tools.formatNumber(Number(value.toFixed(6))); };
      let equation, answer, inverse, check;
      if (kind === "add") {
        answer = b;
        const total = neat(Number(a) + Number(b));
        equation = a + " + x = " + total;
        inverse = "x = " + total + " − " + a;
        check = a + " + " + answer + " = " + total;
      } else if (kind === "subtract") {
        answer = a;
        const difference = neat(Number(a) - Number(b));
        equation = "x − " + b + " = " + difference;
        inverse = "x = " + difference + " + " + b;
        check = answer + " − " + b + " = " + difference;
      } else if (kind === "multiply") {
        answer = b;
        const total = tools.multiplyDecimals(a, b).answer;
        equation = a + "x = " + total;
        inverse = "x = " + total + " ÷ " + a;
        check = a + " × " + answer + " = " + total;
      } else {
        answer = a;
        const quotient = neat(Number(a) / Number(b));
        equation = "x ÷ " + b + " = " + quotient;
        inverse = "x = " + quotient + " × " + b;
        check = answer + " ÷ " + b + " = " + quotient;
      }
      return {
        prompt: "解方程：" + equation + "。",
        answer: answer,
        board: { kind: "lines", lines: [equation, inverse, "x = " + answer, check], captions: ["认清 x 的位置", "两边同步逆运算", "写出解", "代入验算"] },
        analysis: ["原方程：" + equation + "。", "按等式性质变形：" + inverse + " = " + answer + "。", "代入原式：" + check + "。"],
        hint: "看清 x 在哪一项，再用逆运算。"
      };
    }

    if (template.generator === "combine") {
      const values = tools.pickCase(template);
      const a = values[0], b = values[1], addend = values[2], x = values[3];
      const coefficient = a + b;
      const total = coefficient * x + addend;
      const equation = a + "x + " + b + "x + " + addend + " = " + total;
      return {
        prompt: "先合并同类项，再解方程：" + equation + "。",
        answer: String(x),
        board: { kind: "lines", lines: [equation, coefficient + "x + " + addend + " = " + total, coefficient + "x = " + (total - addend), "x = " + (total - addend) + " ÷ " + coefficient, "x = " + x, a + " × " + x + " + " + b + " × " + x + " + " + addend + " = " + total], captions: ["观察同类项", "合并 x 项", "两边减同一个数", "两边除以系数", "写出解", "代入验算"] },
        analysis: [a + "x + " + b + "x = " + coefficient + "x，所以整理成 " + coefficient + "x + " + addend + " = " + total + "。", "两边减去 " + addend + "，再除以 " + coefficient + "，得 x = " + x + "。", "把 x = " + x + " 代回原方程，等号两边都等于 " + total + "。"],
        hint: "先把含 x 的同类项合并。"
      };
    }

    if (template.generator === "two-step-plus") {
      const coefficient = pick(config.coefficient, rng);
      const x = pick(config.solution, rng);
      const addend = pick(config.addend, rng);
      const total = coefficient * x + addend;
      return {
        prompt: "解方程：" + coefficient + "x + " + addend + " = " + total + "。",
        answer: String(x),
        board: { kind: "lines", lines: [coefficient + "x + " + addend + " = " + total, coefficient + "x = " + (total - addend), "x = " + (total - addend) + " ÷ " + coefficient, "x = " + x, coefficient + " × " + x + " + " + addend + " = " + total], captions: ["原方程", "两边减同一个数", "两边除同一个数", "写出解", "代入验算"] },
        analysis: [
          "两边同时减去 " + addend + "：" + coefficient + "x = " + (total - addend) + "。",
          "两边再同时除以 " + coefficient + "：x = " + (total - addend) + " ÷ " + coefficient + " = " + x + "。",
          "验算：" + coefficient + " × " + x + " + " + addend + " = " + total + "。"
        ],
        hint: "按与运算相反的顺序解：先去掉加数，再处理 x 前面的乘数。"
      };
    }

    if (template.generator === "two-step-minus") {
      const coefficient = pick(config.coefficient, rng);
      const x = pick(config.solution, rng);
      const possibleSubtrahends = config.subtrahend.filter(function (value) { return value < coefficient * x; });
      const subtrahend = possibleSubtrahends.length
        ? pick(possibleSubtrahends, rng)
        : Math.max(1, Math.floor(coefficient * x / 2));
      const difference = coefficient * x - subtrahend;
      return {
        prompt: "解方程：" + coefficient + "x − " + subtrahend + " = " + difference + "。",
        answer: String(x),
        board: { kind: "lines", lines: [coefficient + "x − " + subtrahend + " = " + difference, coefficient + "x = " + (difference + subtrahend), "x = " + (difference + subtrahend) + " ÷ " + coefficient, "x = " + x, coefficient + " × " + x + " − " + subtrahend + " = " + difference], captions: ["原方程", "两边加同一个数", "两边除同一个数", "写出解", "代入验算"] },
        analysis: [
          "两边同时加上 " + subtrahend + "：" + coefficient + "x = " + (difference + subtrahend) + "。",
          "两边再同时除以 " + coefficient + "：x = " + (difference + subtrahend) + " ÷ " + coefficient + " = " + x + "。",
          "把 x = " + x + " 代回原式，左边等于 " + difference + "，方程成立。"
        ],
        hint: "先撤销减去的数，再撤销乘在 x 前面的数。"
      };
    }

    if (template.generator === "unknown-subtrahend") {
      const values = tools.pickCase(template);
      const minuend = values[0];
      const difference = values[1];
      const x = minuend - difference;
      return {
        prompt: "解方程：" + minuend + " − x = " + difference + "。",
        answer: String(x),
        board: { kind: "lines", lines: [minuend + " − x = " + difference, "x = " + minuend + " − " + difference, "x = " + x, minuend + " − " + x + " = " + difference], captions: ["认清未知减数", "被减数减去差", "写出解", "代入验算"] },
        analysis: [
          "这里 x 是减数。减数 = 被减数 − 差。",
          "所以 x = " + minuend + " − " + difference + " = " + x + "。",
          "验算：" + minuend + " − " + x + " = " + difference + "。"
        ],
        hint: "未知数在减号后面，先辨清它是减数。"
      };
    }

    if (template.generator === "quotient-plus") {
      const divisor = pick(config.divisor, rng);
      const quotient = pick(config.quotient, rng);
      const addend = pick(config.addend, rng);
      const total = quotient + addend;
      const x = quotient * divisor;
      return {
        prompt: "解方程：x ÷ " + divisor + " + " + addend + " = " + total + "。",
        answer: String(x),
        board: { kind: "lines", lines: ["x ÷ " + divisor + " + " + addend + " = " + total, "x ÷ " + divisor + " = " + quotient, "x = " + quotient + " × " + divisor, "x = " + x, x + " ÷ " + divisor + " + " + addend + " = " + total], captions: ["原方程", "两边减同一个数", "两边乘同一个数", "写出解", "代入验算"] },
        analysis: [
          "两边同时减去 " + addend + "：x ÷ " + divisor + " = " + quotient + "。",
          "两边同时乘 " + divisor + "：x = " + quotient + " × " + divisor + " = " + x + "。",
          "验算：" + x + " ÷ " + divisor + " + " + addend + " = " + total + "。"
        ],
        hint: "先处理加法，再用除法的逆运算求 x。"
      };
    }

    if (template.generator === "word-cost") {
      const quantity = pick(config.quantity, rng);
      const unitPrice = pick(config.unitPrice, rng);
      const extra = pick(config.extra, rng);
      const total = quantity * unitPrice + extra;
      return {
        prompt: "买 " + quantity + " 本同价练习册，另付 " + extra + " 元装订费，一共付 " + total + " 元。设每本练习册 x 元，求 x。",
        answer: String(unitPrice),
        board: { kind: "lines", lines: [quantity + "x + " + extra + " = " + total, quantity + "x = " + (total - extra), "x = " + (total - extra) + " ÷ " + quantity, "x = " + unitPrice, quantity + " × " + unitPrice + " + " + extra + " = " + total], captions: ["列出等量关系", "去掉装订费", "求每本价格", "写出解", "代入验算"] },
        analysis: [
          "先找等量关系：练习册总价 + 装订费 = 付款总数。",
          "列方程：" + quantity + "x + " + extra + " = " + total + "。两边同时减去 " + extra + "，再同时除以 " + quantity + "。",
          "x = " + unitPrice + " 元。验算：" + quantity + " × " + unitPrice + " + " + extra + " = " + total + "。"
        ],
        hint: "把每本的价格设为 x，先算练习册总价，再加装订费。"
      };
    }

    if (template.generator === "consecutive-sum") {
      const middle = pick(config.middle, rng);
      const total = middle * 3;
      return {
        prompt: "三个连续自然数的和是 " + total + "，中间一个数设为 x。中间数是多少？",
        answer: String(middle),
        board: { kind: "lines", lines: ["(x − 1) + x + (x + 1) = " + total, "3x = " + total, "x = " + total + " ÷ 3", "x = " + middle, (middle - 1) + " + " + middle + " + " + (middle + 1) + " = " + total], captions: ["列连续数方程", "合并同类项", "两边除以 3", "写出解", "代入原式验算"] },
        analysis: [
          "三个连续自然数可表示为 x − 1、x、x + 1。",
          "列方程：(x − 1) + x + (x + 1) = " + total + "，合并后得到 3x = " + total + "。",
          "两边同时除以 3，x = " + total + " ÷ 3 = " + middle + "。"
        ],
        hint: "用 x 表示中间数，前一个和后一个分别相差 1。"
      };
    }

    if (template.generator === "distance") {
      const speed = tools.formatNumber(pick(config.speed, rng));
      const time = pick(config.time, rng);
      const product = tools.multiplyDecimals(speed, String(time));
      const distance = product.answer;
      return {
        prompt: "一辆车每小时行 " + speed + " 千米，共行 " + distance + " 千米。设行驶 x 小时，列方程并求 x。",
        answer: String(time),
        board: { kind: "lines", lines: [speed + "x = " + distance, "x = " + distance + " ÷ " + speed, "x = " + time, speed + " × " + time + " = " + distance], captions: ["速度 × 时间 = 路程", "两边除以速度", "写出解", "代入验算"] },
        analysis: [
          "速度 × 时间 = 路程，列方程：" + speed + "x = " + distance + "。",
          "两边同时除以速度：x = " + distance + " ÷ " + speed + " = " + time + "（小时）。",
          "验算：" + speed + " × " + time + " = " + distance + " 千米。"
        ],
        hint: "先写出“速度 × 时间 = 路程”，再解关于 x 的方程。"
      };
    }

    if (template.generator === "check") {
      const coefficient = pick(config.coefficient, rng);
      const x = pick(config.solution, rng);
      const addend = pick(config.addend, rng);
      const total = coefficient * x + addend;
      return {
        prompt: "方程 " + coefficient + "x + " + addend + " = " + total + " 的解是 x = ?",
        answer: String(x),
        board: { kind: "lines", lines: [coefficient + "x + " + addend + " = " + total, coefficient + "x = " + (total - addend), "x = " + (total - addend) + " ÷ " + coefficient, "x = " + x, coefficient + " × " + x + " + " + addend + " = " + total], captions: ["原方程", "两边同时减", "两边同时除", "写出解", "代入原式验算"] },
        analysis: [
          "两边同时减去 " + addend + "：" + coefficient + "x = " + (total - addend) + "。",
          "两边同时除以 " + coefficient + "，得到 x = " + x + "。",
          "代入原方程检查：" + coefficient + " × " + x + " + " + addend + " = " + total + "，左边等于右边。"
        ],
        hint: "先解出 x，再代回原方程，分别计算等号两边。"
      };
    }

    throw new Error("未登记的简易方程题型：" + template.generator);
  }

  root.ExerciseUnits = root.ExerciseUnits || {};
  root.ExerciseUnits["simple-equations"] = {
    id: "simple-equations",
    title: "简易方程",
    shortTitle: "简易方程",
    unitNumber: "03",
    description: "找等量关系 · 两边同步变形 · 验算",
    generate: createQuestion
  };
})(typeof window !== "undefined" ? window : globalThis);
