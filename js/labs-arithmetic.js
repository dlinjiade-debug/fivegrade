(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root && typeof module === "undefined") {
    var packs = root.MysteryLabPacks || (root.MysteryLabPacks = {});
    packs.arithmetic = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var DEFINITIONS = {
    unit2: {
      id: "unit2", title: "小数乘法", question: "积的小数点该落在哪里？",
      hints: ["先按整数相乘，再从右边数小数位。", "面积上的重叠格子也能验证答案。"],
      action: "place-dot", teacher: "老师演示：点一下积中间的位置。",
    },
    unit3: {
      id: "unit3", title: "小数除法", question: "怎样让除数先变成整数？",
      hints: ["除数移动几位，被除数也移动几位。", "再看商、余数和落下的数字。"],
      action: "shift-divisor", teacher: "老师演示：两条数轴一起移动。",
    },
    unit5: {
      id: "unit5", title: "简易方程", question: "怎样操作还能保持两边平衡？",
      hints: ["天平两边必须做相同操作。", "每次操作都写成算式。"],
      action: "balance", teacher: "老师演示：两边同步拿走或增加筹码。",
    },
    unit6: {
      id: "unit6", title: "可能性", question: "连续实验后，哪种结果更常见？",
      hints: ["先调红蓝数量，再连续实验。", "次数越多，频率越能说明趋势。"],
      action: "frequency", teacher: "老师演示：调整比例，马上做一轮实验。",
    },
  };

  function getDefinition(unitId) {
    var definition = DEFINITIONS[unitId];
    return definition ? {
      id: definition.id, title: definition.title, question: definition.question,
      hints: definition.hints.slice(), action: definition.action, teacher: definition.teacher,
    } : null;
  }

  function placeProductDecimal(integerProduct, decimalPlaces) {
    var digits = String(integerProduct).replace(/\D/g, "") || "0";
    var places = Math.max(0, Math.floor(Number(decimalPlaces) || 0));
    if (!places) return digits;
    while (digits.length <= places) digits = "0" + digits;
    var point = digits.length - places;
    return digits.slice(0, point) + "." + digits.slice(point);
  }

  function areaEvidence(width, height) {
    var area = Number((Number(width) * Number(height)).toFixed(10));
    return { area: area, cells: Math.round(area * 100) };
  }

  function gridEvidence(rows, columns) {
    rows = Math.max(0, Math.floor(Number(rows) || 0));
    columns = Math.max(0, Math.floor(Number(columns) || 0));
    return { rows: rows, columns: columns, cells: rows * columns };
  }

  function shiftRight(value, places) {
    var text = String(value);
    var number = Number(text);
    var shifted = number * Math.pow(10, places);
    return String(Number.isInteger(shifted) ? shifted : shifted.toFixed(10).replace(/0+$/, "").replace(/\.$/, ""));
  }

  function shiftDivisionDecimals(dividend, divisor) {
    var text = String(divisor);
    var match = text.match(/\.(\d+)/);
    var places = match ? match[1].length : 0;
    return { dividend: shiftRight(dividend, places), divisor: shiftRight(divisor, places), places: places };
  }

  function divideWithRemainder(dividend, divisor) {
    var a = Number(dividend), b = Number(divisor);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) throw new RangeError("divisor");
    var quotient = Math.trunc(a / b);
    return { quotient: quotient, remainder: a - quotient * b };
  }

  function applyBalanceOperation(left, right, operation) {
    if (Number(left) !== Number(right)) throw new Error("balance must start balanced");
    operation = operation || {};
    var value = Number(operation.value);
    if (!Number.isFinite(value)) throw new TypeError("operation value");
    var type = operation.type === "add" ? "add" : operation.type === "subtract" ? "subtract" : null;
    if (!type) throw new TypeError("operation type");
    var amount = type === "add" ? value : -value;
    return { left: Number(left) + amount, right: Number(right) + amount, operation: (type === "add" ? "+ " : "- ") + value };
  }

  function simulateFrequency(outcomes, draws) {
    var allowed = Array.isArray(outcomes) ? outcomes.slice() : [];
    var counts = {};
    allowed.forEach(function (item) { counts[item] = 0; });
    (Array.isArray(draws) ? draws : []).forEach(function (item) {
      if (Object.prototype.hasOwnProperty.call(counts, item)) counts[item] += 1;
    });
    var total = Object.keys(counts).reduce(function (sum, key) { return sum + counts[key]; }, 0);
    var frequencies = {};
    Object.keys(counts).forEach(function (key) { frequencies[key] = total ? counts[key] / total : 0; });
    return { counts: counts, frequencies: frequencies, total: total };
  }

  function frequencyFeedback(result) {
    var keys = Object.keys(result.counts || {});
    if (!keys.length || !result.total) return "先做几次实验，再看频率。";
    keys.sort(function (a, b) { return result.counts[b] - result.counts[a]; });
    return keys[0] + "出现最多：" + result.counts[keys[0]] + "/" + result.total + "次。再多做几次看看。";
  }

  function sampleWeightedCounts(redWeight, blueWeight, trials, random) {
    var red = Math.max(0, Number(redWeight) || 0), blue = Math.max(0, Number(blueWeight) || 0);
    var totalWeight = red + blue, total = Math.max(0, Math.floor(Number(trials) || 0));
    var next = typeof random === "function" ? random : Math.random;
    var result = { red: 0, blue: 0, total: total };
    if (!totalWeight) return result;
    for (var i = 0; i < total; i++) {
      if (next() < red / totalWeight) result.red += 1;
      else result.blue += 1;
    }
    return result;
  }

  function mount(unitId, container, context) {
    var definition = getDefinition(unitId);
    if (!definition || !container) return null;
    if (container.__mysteryLabArithmetic) return container.__mysteryLabArithmetic;
    context = context || {};
    var controller = { unitId: unitId, definition: definition, context: context, state: { trials: 0, red: 3, blue: 2 }, destroy: function () {} };
    var resetView = function () {};
    function notify(message) {
      var local = typeof container.querySelector === "function" ? container.querySelector(".mlab-feedback") : null;
      if (local) local.textContent = message;
      if (typeof context.onInteract === "function") context.onInteract(message);
    }
    function markup() {
      if (unitId === "unit2") return "<p class=\"mlab-prompt\">3.6 × 2.4 = ?</p><div class=\"mlab-vertical\"><span>3.6</span><span>× 2.4</span><span class=\"mlab-rule\"></span><span class=\"mlab-step-1\" hidden>144</span><span class=\"mlab-step-2\" hidden>72</span><span class=\"mlab-rule mlab-rule-final\" hidden></span><span class=\"mlab-step-3\" hidden>864□</span></div><button type=\"button\" class=\"mlab-control mlab-start\">逐笔写竖式</button><div class=\"mlab-dots\" hidden><span>把小数点放进方框：</span><button type=\"button\" class=\"mlab-dot\">8·64</button><button type=\"button\" class=\"mlab-dot\">86·4</button><button type=\"button\" class=\"mlab-dot\">864·</button></div><div class=\"mlab-area-model\" aria-label=\"面积拆分证据\"><span>6</span><span>1.2</span><span>1.2</span><span>0.24</span></div><p class=\"mlab-area\">面积证据：6 + 1.2 + 1.2 + 0.24 = 8.64；百分格 36×24=864 格。</p>";
      if (unitId === "unit3") return "<p class=\"mlab-prompt\">7.56 ÷ 0.6</p><label class=\"mlab-range-label\">同步移动小数点 <input class=\"mlab-shift\" type=\"range\" min=\"0\" max=\"1\" value=\"0\"></label><div class=\"mlab-shift-board\"><span>7.56 ÷ 0.6</span><b>→</b><span class=\"mlab-shifted\">75.6 ÷ 6</span></div><p class=\"mlab-quotient\">先让除数变成整数；移动后核对商小数点、落数和余数。</p>";
      if (unitId === "unit5") return "<p class=\"mlab-prompt\">2x + 6 = 18</p><div class=\"mlab-balance-stage\"><span class=\"mlab-left-pan\">2x + 6</span><i></i><span class=\"mlab-right-pan\">18</span></div><p class=\"mlab-equation\">2x + 6 = 18</p><button type=\"button\" class=\"mlab-balance mlab-subtract\">两边 −6</button><button type=\"button\" class=\"mlab-balance mlab-divide\" disabled>两边 ÷2</button><p class=\"mlab-balance-goal\">目标：先变成 2x = 12，再锁定 x = 6。</p>";
      return "<p class=\"mlab-prompt\">调节红蓝数量，连续实验</p><label class=\"mlab-red\">红 <input type=\"range\" min=\"1\" max=\"5\" value=\"3\"></label><label class=\"mlab-blue\">蓝 <input type=\"range\" min=\"1\" max=\"5\" value=\"2\"></label><div class=\"mlab-bar\"><span class=\"mlab-bar-red\" style=\"width:60%\">红 60%</span><span class=\"mlab-bar-blue\" style=\"width:40%\">蓝 40%</span></div><button class=\"mlab-run\">实验 10 次</button><p class=\"mlab-frequency-readout\">频数：红 0，蓝 0；频率：红 0%，蓝 0%</p>";
    }
    function bind(rootNode) {
      if (!rootNode || typeof rootNode.querySelector !== "function") return;
      var dots = rootNode.querySelectorAll ? rootNode.querySelectorAll(".mlab-dot") : [];
      for (var i = 0; i < dots.length; i++) dots[i].onclick = function () {
        var correct = this.textContent.indexOf("8·64") >= 0;
        var finalLine = rootNode.querySelector(".mlab-step-3");
        if (correct && finalLine) {
          finalLine.textContent = "8.64";
          finalLine.classList.add("is-correct");
        }
        notify(correct ? "小数点正确，面积证据也是 8.64。" : "再从右边数两位");
      };
      var start = rootNode.querySelector(".mlab-start");
      if (start) {
        var step = 0;
        start.onclick = function () {
          step = Math.min(3, step + 1);
          var line = rootNode.querySelector(".mlab-step-" + step);
          if (line) line.hidden = false;
          var finalRule = rootNode.querySelector(".mlab-rule-final");
          if (finalRule && step >= 2) finalRule.hidden = false;
          if (step >= 3) {
            var dotsBox = rootNode.querySelector(".mlab-dots");
            if (dotsBox) dotsBox.hidden = false;
            start.textContent = "竖式已写完";
            start.disabled = true;
          }
          notify("演示第 " + step + " 步");
        };
        resetView = function () {
          step = 0;
          [1, 2, 3].forEach(function (index) { var line = rootNode.querySelector(".mlab-step-" + index); if (line) { line.hidden = true; line.classList.remove("is-correct"); if (index === 3) line.textContent = "864□"; } });
          var dotsBox = rootNode.querySelector(".mlab-dots"); if (dotsBox) dotsBox.hidden = true;
          var finalRule = rootNode.querySelector(".mlab-rule-final"); if (finalRule) finalRule.hidden = true;
          start.textContent = "逐笔写竖式"; start.disabled = false;
        };
      }
      var shift = rootNode.querySelector(".mlab-shift");
      if (shift) {
        shift.oninput = function () { var moved = Number(this.value); rootNode.querySelector(".mlab-shifted").classList.toggle("is-active", !!moved); rootNode.querySelector(".mlab-quotient").textContent = moved ? "75.6 ÷ 6 = 12.6；商的小数点与被除数对齐，最后落下 6，余数 0。" : "先让除数变成整数；两数必须同步移动。"; notify(moved ? "两数同步右移一位，商不变。" : "回到原式。"); };
        resetView = function () { shift.value = 0; rootNode.querySelector(".mlab-shifted").classList.remove("is-active"); rootNode.querySelector(".mlab-quotient").textContent = "先让除数变成整数；移动后核对商小数点、落数和余数。"; };
      }
      var subtract = rootNode.querySelector(".mlab-subtract"), divide = rootNode.querySelector(".mlab-divide");
      if (subtract && divide) {
        var equation = rootNode.querySelector(".mlab-equation"), leftPan = rootNode.querySelector(".mlab-left-pan"), rightPan = rootNode.querySelector(".mlab-right-pan");
        subtract.onclick = function () { equation.textContent = "2x = 12"; leftPan.textContent = "2x"; rightPan.textContent = "12"; subtract.disabled = true; divide.disabled = false; notify("两边同时减 6，天平仍平衡。"); };
        divide.onclick = function () { equation.textContent = "x = 6"; leftPan.textContent = "x"; rightPan.textContent = "6"; divide.disabled = true; notify("两边同时除以 2，锁定 x = 6。"); };
        resetView = function () { equation.textContent = "2x + 6 = 18"; leftPan.textContent = "2x + 6"; rightPan.textContent = "18"; subtract.disabled = false; divide.disabled = true; };
      }
      var red = rootNode.querySelector(".mlab-red input"), blue = rootNode.querySelector(".mlab-blue input");
      function updateProbability() {
        if (!red || !blue) return;
        var redValue = Number(red.value), blueValue = Number(blue.value), total = redValue + blueValue;
        var redPercent = Math.round(redValue / total * 100), bluePercent = 100 - redPercent;
        var redBar = rootNode.querySelector(".mlab-bar-red"), blueBar = rootNode.querySelector(".mlab-bar-blue");
        redBar.style.width = redPercent + "%"; redBar.textContent = "红 " + redPercent + "%";
        blueBar.style.width = bluePercent + "%"; blueBar.textContent = "蓝 " + bluePercent + "%";
        controller.state.red = redValue; controller.state.blue = blueValue;
      }
      if (red && blue) { red.oninput = blue.oninput = function () { updateProbability(); notify("比例已改变，先猜再实验。"); }; updateProbability(); }
      var run = rootNode.querySelector(".mlab-run");
      if (run) {
        run.onclick = function () { var result = sampleWeightedCounts(controller.state.red, controller.state.blue, 10, Math.random); var redPercent = result.total ? Math.round(result.red / result.total * 100) : 0; var bluePercent = 100 - redPercent; controller.state.trials = result.total; rootNode.querySelector(".mlab-frequency-readout").textContent = "本轮：红 " + result.red + " 次（" + redPercent + "%），蓝 " + result.blue + " 次（" + bluePercent + "%）。再做一轮比较。"; notify("实验完成，用频率核对刚才的猜想。"); };
        resetView = function () { red.value = 3; blue.value = 2; controller.state.trials = 0; updateProbability(); rootNode.querySelector(".mlab-frequency-readout").textContent = "频数：红 0，蓝 0；频率：红 0%，蓝 0%"; };
      }
    }
    if (typeof container.innerHTML === "string") {
      container.innerHTML = "<section class=\"mlab-screen mlab-" + definition.action + "\" data-unit=\"" + unitId + "\">" +
        "<h2 class=\"mlab-title\">" + definition.title + "</h2>" +
        "<p class=\"mlab-question\">" + definition.question + "</p>" +
        "<p class=\"mlab-teacher\">" + definition.teacher + "</p>" +
        "<div class=\"mlab-workspace\" aria-label=\"数学操作区\">" + markup() + "</div>" +
        "<p class=\"mlab-feedback\" aria-live=\"polite\"></p></section>";
      if (typeof container.querySelector === "function") bind(container);
    } else if (container.ownerDocument && typeof container.ownerDocument.createElement === "function") {
      var screen = container.ownerDocument.createElement("section");
      screen.className = "mlab-screen mlab-" + definition.action;
      var title = container.ownerDocument.createElement("h2");
      title.className = "mlab-title";
      title.textContent = definition.title;
      var question = container.ownerDocument.createElement("p");
      question.className = "mlab-question";
      question.textContent = definition.question;
      var button = container.ownerDocument.createElement("button");
      button.className = "mlab-control";
      button.textContent = "开始演示";
      screen.appendChild(title);
      screen.appendChild(question);
      screen.appendChild(button);
      container.appendChild(screen);
    }
    controller.randomize = function () {
      controller.state.trials = 0;
      controller.state.red = 3;
      controller.state.blue = 2;
      resetView();
      return true;
    };
    container.__mysteryLabArithmetic = controller;
    return controller;
  }

  return {
    getDefinition: getDefinition, mount: mount,
    placeProductDecimal: placeProductDecimal, areaEvidence: areaEvidence, gridEvidence: gridEvidence,
    shiftDivisionDecimals: shiftDivisionDecimals, divideWithRemainder: divideWithRemainder,
    applyBalanceOperation: applyBalanceOperation,
    simulateFrequency: simulateFrequency, frequencyFeedback: frequencyFeedback,
    sampleWeightedCounts: sampleWeightedCounts,
  };
});
