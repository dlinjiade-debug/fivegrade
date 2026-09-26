(function (root) {
  "use strict";

  const bank = root.ExerciseQuestionBank || {};
  const units = root.ExerciseUnits || {};
  const points = root.ExerciseKnowledgePoints || {};
  const decks = Object.create(null);
  const caseDecks = Object.create(null);
  const seenPrompts = Object.create(null);
  const lastTemplate = Object.create(null);
  const questionsPerRound = 3;

  function random() { return Math.random(); }

  function pick(values, rng) {
    if (!Array.isArray(values) || values.length === 0) throw new Error("题库参数不能为空");
    const source = rng || random;
    return values[Math.floor(source() * values.length)];
  }

  function randomInt(min, max, rng) {
    const source = rng || random;
    return Math.floor(source() * (max - min + 1)) + min;
  }

  function formatScaled(value, scale) {
    const sign = value < 0 ? "-" : "";
    let digits = String(Math.abs(Math.trunc(value)));
    if (scale <= 0) return sign + digits;
    digits = digits.padStart(scale + 1, "0");
    const split = digits.length - scale;
    const whole = digits.slice(0, split);
    const fraction = digits.slice(split).replace(/0+$/, "");
    return sign + whole + (fraction ? "." + fraction : "");
  }

  function parseDecimal(value) {
    const text = String(value).trim().replace(/,/g, "");
    const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(text);
    if (!match) throw new Error("不是有效的小数：" + text);
    const fraction = match[3] || "";
    const integer = Number(match[1] + match[2] + fraction);
    return {
      integer: integer,
      scale: fraction.length,
      digits: (match[2] + fraction).replace(/^0+(?=\d)/, "")
    };
  }

  function multiplyDecimals(a, b) {
    const left = parseDecimal(a);
    const right = parseDecimal(b);
    const rawProduct = left.integer * right.integer;
    const scale = left.scale + right.scale;
    return {
      rawProduct: rawProduct,
      scale: scale,
      leftDigits: left.digits,
      rightDigits: right.digits,
      answer: formatScaled(rawProduct, scale)
    };
  }

  function subtractDecimals(a, b) {
    const left = parseDecimal(a);
    const right = parseDecimal(b);
    const scale = Math.max(left.scale, right.scale);
    return formatScaled(
      left.integer * Math.pow(10, scale - left.scale) - right.integer * Math.pow(10, scale - right.scale),
      scale
    );
  }

  function divideDecimalsExact(a, b) {
    const left = parseDecimal(a);
    const right = parseDecimal(b);
    const dividend = left.integer * Math.pow(10, right.scale);
    const divisor = right.integer * Math.pow(10, left.scale);
    if (divisor === 0) throw new Error("除数不能为 0");
    const whole = Math.floor(dividend / divisor);
    let remainder = dividend % divisor;
    const fraction = [];
    while (remainder !== 0 && fraction.length < 12) {
      remainder *= 10;
      fraction.push(Math.floor(remainder / divisor));
      remainder %= divisor;
    }
    if (remainder !== 0) throw new Error("该题需要用近似商，不能写成精确等式");
    return String(whole) + (fraction.length ? "." + fraction.join("") : "");
  }

  function roundDecimal(value, places) {
    const parsed = parseDecimal(value);
    const digitsToRemove = parsed.scale - places;
    const magnitude = Math.abs(parsed.integer);
    const rounded = digitsToRemove > 0
      ? Math.floor(magnitude / Math.pow(10, digitsToRemove) + 0.5)
      : magnitude * Math.pow(10, -digitsToRemove);
    const digits = String(rounded).padStart(places + 1, "0");
    const sign = parsed.integer < 0 ? "-" : "";
    return places ? sign + digits.slice(0, -places) + "." + digits.slice(-places) : sign + digits;
  }

  function shuffled(values, rng) {
    const result = values.slice();
    const source = rng || random;
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(source() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function nextTemplate(unitId) {
    const templates = bank[unitId] || [];
    if (!templates.length) throw new Error("单元题库为空：" + unitId);
    if (!decks[unitId] || decks[unitId].length === 0) {
      // 每类题型出三次；层级按 1 → 2 → 3 递进，同层分三遍洗牌。
      caseDecks[unitId] = Object.create(null);
      seenPrompts[unitId] = Object.create(null);
      decks[unitId] = [1, 2, 3].reduce(function (list, tier) {
        const group = templates.filter(function (item) { return item.tier === tier; });
        for (let pass = 0; pass < questionsPerRound; pass += 1) list = list.concat(shuffled(group));
        return list;
      }, []);
      if (decks[unitId].length !== templates.length * questionsPerRound) throw new Error("题型缺少有效的难度层级：" + unitId);
      if (decks[unitId].length > 1 && decks[unitId][0].id === lastTemplate[unitId]) {
        const swap = decks[unitId][0];
        decks[unitId][0] = decks[unitId][1];
        decks[unitId][1] = swap;
      }
    }
    const next = decks[unitId].shift();
    lastTemplate[unitId] = next.id;
    return next;
  }

  function generateQuestion(unitId, sequence) {
    const unit = units[unitId];
    if (!unit) throw new Error("找不到单元模块：" + unitId);
    const template = nextTemplate(unitId);
    const pickCase = function (sourceTemplate) {
      const choices = sourceTemplate.config && sourceTemplate.config.cases;
      if (!Array.isArray(choices) || choices.length === 0) throw new Error("题型缺少固定例题：" + sourceTemplate.id);
      const pool = caseDecks[unitId];
      if (!pool[sourceTemplate.id] || pool[sourceTemplate.id].length === 0) {
        pool[sourceTemplate.id] = shuffled(choices);
      }
      return pool[sourceTemplate.id].shift();
    };
    const tools = {
      random: random,
      pick: pick,
      pickCase: pickCase,
      randomInt: randomInt,
      formatScaled: formatScaled,
      formatNumber: function (value) {
        return String(value).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
      },
      parseDecimal: parseDecimal,
      multiplyDecimals: multiplyDecimals,
      subtractDecimals: subtractDecimals,
      divideDecimalsExact: divideDecimalsExact,
      roundDecimal: roundDecimal
    };
    let generated = unit.generate(template, tools);
    const used = seenPrompts[unitId][template.id] || (seenPrompts[unitId][template.id] = new Set());
    let attempts = 0;
    while (used.has(generated.prompt) && attempts < 12) {
      generated = unit.generate(template, tools);
      attempts += 1;
    }
    used.add(generated.prompt);
    if (!points[template.pointId]) throw new Error("题型缺少知识点说明：" + template.id);
    if (!generated || typeof generated.prompt !== "string" || typeof generated.answer !== "string"
      || !Array.isArray(generated.analysis) || generated.analysis.length === 0 || !generated.board) {
      throw new Error("题型缺少题目、答案、解析或板书：" + template.id);
    }
    return Object.assign({
      id: template.id + "-" + sequence,
      unitId: unitId,
      templateId: template.id,
      templateName: template.label,
      pointId: template.pointId,
      tier: template.tier,
      difficulty: "进阶 " + template.tier + "/3",
      sequence: sequence
    }, generated);
  }

  function toHalfWidth(text) {
    return String(text).replace(/[０-９．－＋]/g, function (char) {
      const code = char.charCodeAt(0);
      if (code >= 0xff10 && code <= 0xff19) return String.fromCharCode(code - 0xfee0);
      if (char === "．") return ".";
      if (char === "－") return "-";
      if (char === "＋") return "+";
      return char;
    });
  }

  function checkAnswer(question, input) {
    const response = toHalfWidth(input).trim().replace(/[，,。\s]/g, "");
    if (!response) return false;
    const accepted = (question.acceptedAnswers || [question.answer]).map(function (value) {
      return toHalfWidth(value).trim().replace(/[，,。\s]/g, "");
    });
    const responseNumber = Number(response);
    if (Number.isFinite(responseNumber)) {
      return accepted.some(function (value) {
        const answerNumber = Number(value);
        return Number.isFinite(answerNumber) && Math.abs(responseNumber - answerNumber) < 0.0000001;
      });
    }
    return accepted.some(function (value) { return response === value; });
  }

  function pointFor(id) { return points[id] || null; }

  root.ExerciseGeneratorCore = {
    unitOrder: ["decimal-multiplication", "decimal-division", "simple-equations"],
    questionsPerRound: questionsPerRound,
    units: units,
    questionBank: bank,
    pointFor: pointFor,
    generateQuestion: generateQuestion,
    checkAnswer: checkAnswer,
    _helpers: {
      parseDecimal: parseDecimal,
      formatScaled: formatScaled,
      multiplyDecimals: multiplyDecimals,
      subtractDecimals: subtractDecimals,
      divideDecimalsExact: divideDecimalsExact,
      roundDecimal: roundDecimal
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
