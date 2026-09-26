(function (root) {
  "use strict";

  /*
   * 题库只保存可审阅的题型定义与参数范围；具体数字、答案和解析由单元模块
   * 每次抽题时生成。重复出现的小数乘法已合并到同一个单元题库。
   */
  root.ExerciseQuestionBank = {
    "decimal-multiplication": [
      {
        id: "mul-multi-place", label: "多位小数竖式", pointId: "mul-place-count", tier: 2,
        generator: "product", config: { scaleA: [3], scaleB: [2], minA: 125, maxA: 896, minB: 125, maxB: 986 }
      },
      {
        id: "mul-integer-factor", label: "小数乘两位整数", pointId: "mul-integer-factor", tier: 1,
        generator: "product", config: { scaleA: [2, 3], scaleB: [0], minA: 1248, maxA: 9876, minB: 12, maxB: 36 }
      },
      {
        id: "mul-small-product", label: "小于 1 的因数", pointId: "mul-small-factor", tier: 1,
        generator: "product", config: { scaleA: [3], scaleB: [3], minA: 112, maxA: 986, minB: 112, maxB: 986 }
      },
      {
        id: "mul-trailing-zero", label: "积末尾有 0", pointId: "mul-trailing-zero", tier: 2,
        generator: "trailing-zero", config: { cases: [["1.875", "0.64"], ["0.625", "0.48"], ["2.375", "0.8"], ["3.125", "0.96"], ["0.375", "2.4"]] }
      },
      {
        id: "mul-missing-factor", label: "逆向求因数", pointId: "mul-inverse-factor", tier: 3,
        generator: "missing-factor", config: { cases: [["0.36", "3.7"], ["0.24", "4.5"], ["0.125", "6.4"], ["1.2", "2.75"], ["0.48", "3.25"]] }
      },
      {
        id: "mul-distributive", label: "拆分因数巧算", pointId: "mul-distributive", tier: 2,
        generator: "distributive", config: { cases: [["8.74", "12.5", "10 + 2.5"], ["4.86", "11.25", "10 + 1.25"], ["2.375", "4.5", "4 + 0.5"], ["6.48", "9.5", "9 + 0.5"], ["12.36", "4.5", "4 + 0.5"]] }
      },
      {
        id: "mul-associative", label: "结合律凑整", pointId: "mul-associative", tier: 3,
        generator: "associative", config: { cases: [["0.625", "1.6", "2.5", "0.4"], ["1.25", "0.8", "3.75", "0.4"], ["0.125", "8", "2.48", "2.5"]] }
      },
      {
        id: "mul-round", label: "积的近似数", pointId: "mul-round", tier: 2,
        generator: "rounded-product", config: { cases: [["1.875", "2.46"], ["3.245", "0.78"], ["2.875", "1.46"]] }
      },
      {
        id: "mul-factor-size", label: "积与因数比较", pointId: "mul-factor-size", tier: 1,
        generator: "compare", config: { factors: ["0.875", "1.36", "2.408", "0.925", "3.075", "1.625"] }
      },
      {
        id: "mul-area", label: "面积情境", pointId: "mul-area-model", tier: 2,
        generator: "area", config: { cases: [["2.375", "1.64"], ["3.125", "2.48"], ["4.875", "1.36"], ["2.625", "1.84"], ["1.875", "3.28"]] }
      },
      {
        id: "mul-unit-price", label: "单价与数量", pointId: "mul-context", tier: 3,
        generator: "unit-price", config: { cases: [["8.4", "3.6"], ["12.5", "2.4"], ["6.75", "4.8"], ["9.6", "2.5"], ["15.2", "1.25"]] }
      }
    ],
    "decimal-division": [
      {
        id: "div-integer", label: "小数除以整数", pointId: "div-integer", tier: 1,
        generator: "exact", config: { cases: [["23.76", "18", "1.32"], ["27.36", "16", "1.71"], ["32.04", "12", "2.67"]] }
      },
      {
        id: "div-zero-place", label: "商中间补 0", pointId: "div-zero-place", tier: 1,
        generator: "exact", config: { cases: [["6.12", "6", "1.02"], ["12.06", "6", "2.01"], ["24.08", "8", "3.01"]] }
      },
      {
        id: "div-add-zero", label: "余数后添 0", pointId: "div-add-zero", tier: 2,
        generator: "exact", config: { cases: [["7.05", "6", "1.175"], ["6.3", "8", "0.7875"], ["8.75", "8", "1.09375"]] }
      },
      {
        id: "div-decimal-divisor", label: "除数变整数", pointId: "div-shift", tier: 2,
        generator: "exact", config: { cases: [["7.875", "0.35", "22.5"], ["2.94", "0.28", "10.5"], ["0.864", "0.24", "3.6"]] }
      },
      {
        id: "div-round", label: "商保留两位", pointId: "div-round", tier: 3,
        generator: "round", config: { cases: [["26.75", "16", "1.67"], ["7.9", "0.35", "22.57"], ["5.83", "0.9", "6.48"]] }
      },
      {
        id: "div-repeat", label: "循环小数", pointId: "div-repeat", tier: 3,
        generator: "repeat", config: { cases: [["7", "12", "0.58", "3"], ["13", "22", "0.59", "90"], ["29", "36", "0.81", "5"]] }
      },
      {
        id: "div-compare", label: "判断商的大小", pointId: "div-compare", tier: 1,
        generator: "compare", config: { cases: [["2.375", "0.96", "大于"], ["4.68", "1.25", "小于"], ["0.84", "0.75", "大于"]] }
      },
      {
        id: "div-context", label: "实际取整", pointId: "div-context", tier: 3,
        generator: "context", config: { cases: [["4.8", "0.75", "7", "千克油，每个瓶子装", "千克，至少需要多少个瓶子？", "进一"], ["7.65", "0.75", "10", "米丝带，每条用", "米，最多能做多少条？", "去尾"], ["8.4", "1.25", "7", "千克油，每个瓶子装", "千克，至少需要多少个瓶子？", "进一"]] }
      }
    ],
    "simple-equations": [
      {
        id: "eq-letter-expression", label: "用字母列式", pointId: "eq-letter-expression", tier: 1,
        generator: "letter-expression", config: { cases: [
          { item: "练习册", unit: "本", first: 3, second: 2, fee: 7, feeName: "装订费" },
          { item: "铅笔", unit: "支", first: 4, second: 3, fee: 5, feeName: "包装费" },
          { item: "画纸", unit: "张", first: 6, second: 2, fee: 9, feeName: "配送费" }
        ] }
      },
      {
        id: "eq-decimal-one-step", label: "小数一步方程", pointId: "eq-one-step", tier: 1,
        generator: "decimal-one-step", config: { cases: [["add", "6.35", "6.45"], ["subtract", "7.35", "2.75"], ["multiply", "2.4", "7.5"], ["divide", "3.84", "0.4"]] }
      },
      {
        id: "eq-combine", label: "合并同类项再求解", pointId: "eq-combine", tier: 3,
        generator: "combine", config: { cases: [[3, 2, 9, 7], [4, 3, 11, 6], [5, 2, 13, 8]] }
      },
      {
        id: "eq-two-step-plus", label: "先减后除", pointId: "eq-two-step", tier: 2,
        generator: "two-step-plus", config: { coefficient: [2, 3, 4, 5, 6], solution: [4, 5, 6, 7, 8, 9, 12], addend: [5, 8, 12, 15, 18, 24] }
      },
      {
        id: "eq-two-step-minus", label: "先加后除", pointId: "eq-two-step", tier: 2,
        generator: "two-step-minus", config: { coefficient: [2, 3, 4, 5, 6], solution: [5, 6, 7, 8, 9, 11], subtrahend: [4, 7, 9, 12, 16, 21] }
      },
      {
        id: "eq-unknown-subtrahend", label: "未知减数", pointId: "eq-inverse-operation", tier: 1,
        generator: "unknown-subtrahend", config: { cases: [[56, 28], [83, 47], [92, 36], [105, 68], [74, 29], [126, 78]] }
      },
      {
        id: "eq-quotient-plus", label: "带除法的两步方程", pointId: "eq-two-step", tier: 2,
        generator: "quotient-plus", config: { divisor: [3, 4, 5, 6, 8], quotient: [4, 5, 6, 7, 8, 9], addend: [2, 3, 4, 5, 6] }
      },
      {
        id: "eq-word-cost", label: "总价建模", pointId: "eq-modeling", tier: 3,
        generator: "word-cost", config: { quantity: [3, 4, 5, 6], unitPrice: [6, 7, 8, 9, 12], extra: [2, 3, 4, 5, 6, 8] }
      },
      {
        id: "eq-consecutive-sum", label: "连续自然数建模", pointId: "eq-modeling", tier: 3,
        generator: "consecutive-sum", config: { middle: [18, 21, 24, 27, 32, 36, 42] }
      },
      {
        id: "eq-distance", label: "速度时间建模", pointId: "eq-modeling", tier: 3,
        generator: "distance", config: { speed: [2.4, 3.2, 4.5, 6.4, 7.5], time: [3, 4, 5, 6, 8] }
      },
      {
        id: "eq-check", label: "解方程并验算", pointId: "eq-check", tier: 2,
        generator: "check", config: { coefficient: [3, 4, 5, 6, 7], solution: [3, 4, 5, 6, 7, 8, 9], addend: [4, 7, 9, 12, 15, 18] }
      }
    ]
  };
})(typeof window !== "undefined" ? window : globalThis);
