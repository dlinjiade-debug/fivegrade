(function (root) {
  "use strict";

  function createQuestion(template, tools) {
    const values = tools.pickCase(template);
    const a = values[0];
    const b = values[1];
    const answer = values[2];
    const divisorPlaces = (b.split(".")[1] || "").length;
    const movePoint = function (value) {
      const parsed = tools.parseDecimal(value);
      const extraZeros = Math.max(0, divisorPlaces - parsed.scale);
      return tools.formatScaled(parsed.integer * Math.pow(10, extraZeros), Math.max(0, parsed.scale - divisorPlaces));
    };
    const shiftedA = movePoint(a);
    const shiftedB = movePoint(b);
    const transform = divisorPlaces
      ? "两数同时扩大 " + Math.pow(10, divisorPlaces) + " 倍：" + a + " ÷ " + b + " = " + shiftedA + " ÷ " + shiftedB + "。"
      : "先按除法竖式逐位试商，商的小数点与被除数对齐。";

    if (template.generator === "exact") {
      return {
        prompt: "列竖式计算：" + a + " ÷ " + b + " = ?",
        answer: answer,
        board: { kind: "div", a: a, b: b, check: answer + " × " + b + " = " + a },
        analysis: [transform, "有余数时在被除数末尾添 0 继续除；这一题可除尽。", "商是 " + answer + "。验算：" + answer + " × " + b + " = " + a + "。"],
        hint: divisorPlaces ? "先让除数变成整数；被除数也要同倍变化。" : "逐位试商，不够除的数位用 0 占位。"
      };
    }

    if (template.generator === "round") {
      return {
        prompt: "列竖式计算，商保留两位小数：" + a + " ÷ " + b + " ≈ ?",
        answer: answer,
        board: { kind: "div", a: a, b: b, stopAfter: 3, roundTo: 2 },
        analysis: [transform, "除到千分位，观察第三位小数。", "按四舍五入，商约为 " + answer + "。"],
        hint: "保留两位小数，要多除到千分位。"
      };
    }

    if (template.generator === "repeat") {
      const cycle = values[3];
      return {
        prompt: "观察循环小数，商保留两位小数：" + a + " ÷ " + b + " ≈ ?",
        answer: answer,
        board: { kind: "div", a: a, b: b, stopAfter: 4, roundTo: 2 },
        analysis: ["逐位除下去，余数重复出现，商的循环节是 " + cycle + "。", "循环小数写不完，不能把有限的几位商写成精确等式。", "保留两位小数约为 " + answer + "。"],
        hint: "留意余数何时重复，再看第三位小数取近似数。"
      };
    }

    if (template.generator === "compare") {
      const relation = values[2];
      return {
        prompt: "不计算精确商，判断 " + a + " ÷ " + b + " 与 " + a + " 相比是“大于”还是“小于”？",
        answer: relation,
        acceptedAnswers: [relation, relation === "大于" ? "更大" : "更小"],
        board: { kind: "lines", lines: [a + " ÷ " + b, b + (Number(b) < 1 ? " < 1" : " > 1"), a + " ÷ " + b + (relation === "大于" ? " > " : " < ") + a], captions: ["观察除数", "比较除数和 1", "判断商的范围"] },
        analysis: ["除数 " + b + (Number(b) < 1 ? " 小于 1。" : " 大于 1。"), "被除数是正数；除以小于 1 的正数，商变大；除以大于 1 的数，商变小。", "所以商" + relation + "原数 " + a + "。"],
        hint: "先比较除数与 1。"
      };
    }

    if (template.generator === "context") {
      const mode = values[5];
      const prompt = a + " " + values[3] + " " + b + " " + values[4];
      const quotient = tools.divideDecimalsExact(a, b);
      return {
        prompt: prompt,
        answer: answer,
        board: { kind: "div", a: a, b: b, finalNote: mode === "进一" ? "有剩余，再加 1 个" : "不足一条，不计入", finalAnswer: answer + (mode === "进一" ? " 个瓶子" : " 条丝带") },
        analysis: ["先列式：" + a + " ÷ " + b + " = " + quotient + "。", mode === "进一" ? "剩余部分也需要一个容器，所以进一。" : "剩余部分不够做完整一条，所以去尾。", "答：" + answer + (mode === "进一" ? " 个瓶子。" : " 条丝带。")],
        hint: mode === "进一" ? "剩下一点也要装，用进一法。" : "不够完整一条就舍去。"
      };
    }

    throw new Error("未登记的小数除法题型：" + template.generator);
  }

  root.ExerciseUnits = root.ExerciseUnits || {};
  root.ExerciseUnits["decimal-division"] = {
    id: "decimal-division",
    title: "小数除法",
    shortTitle: "小数除法",
    unitNumber: "02",
    description: "同倍转化 · 逐位试商 · 看余数",
    generate: createQuestion
  };
})(typeof window !== "undefined" ? window : globalThis);
