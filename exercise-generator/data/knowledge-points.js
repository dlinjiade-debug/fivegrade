(function (root) {
  "use strict";

  root.ExerciseKnowledgePoints = {
    "mul-place-count": {
      title: "因数小数位数与积的定位",
      description: "先按整数乘法求积，再把两个因数的小数位数相加，从积的右边起数出相同位数点上小数点。",
      strategy: "暂时遮住小数点算整数积；小数位不够时先在积的左边补 0。",
      commonError: "只看一个因数的小数位，或把小数点和竖式末位对齐。"
    },
    "mul-integer-factor": {
      title: "小数乘整数的竖式",
      description: "先按整数乘法计算，再按小数因数的小数位数从积右边起定位；用估算检查数量级。",
      strategy: "先算整数积，再点小数点。",
      commonError: "把小数因数的位数数错，或漏写竖式进位。"
    },
    "mul-small-factor": {
      title: "小于 1 的因数与积的大小",
      description: "一个正数乘小于 1 的数，积小于这个正数；两个都小于 1 的正数相乘，积也小于任一个因数。",
      strategy: "先估计积的范围，再计算；结果若比两个因数都大，通常要回查小数点。",
      commonError: "把小数乘法误认为积一定变大。"
    },
    "mul-trailing-zero": {
      title: "积末尾的 0 与小数性质",
      description: "按小数位数点好小数点后，积末尾的 0 不改变数值，可以去掉。",
      strategy: "先确定小数点位置，再化简末尾的 0；不要先删整数积里的 0。",
      commonError: "点小数点以前就删掉 0，导致数位错位。"
    },
    "mul-inverse-factor": {
      title: "乘法关系中的未知因数",
      description: "已知积和一个因数，可以用积除以已知因数求另一个因数；所得结果要代回原式核对。",
      strategy: "先把已知因数与积看清，再用乘除互逆关系反求。",
      commonError: "把已知因数除以积，或只顾计算而不检验。"
    },
    "mul-distributive": {
      title: "乘法分配律与拆分凑整",
      description: "一个因数可拆成两个数的和，另一个因数分别乘这两部分，再把积相加。",
      strategy: "把 2.5 拆成 2 + 0.5、把 1.25 拆成 1 + 0.25 等，检查每一部分都乘到了。",
      commonError: "拆分后漏乘其中一项，或把两个部分的积相乘。"
    },
    "mul-associative": {
      title: "乘法结合律与凑整",
      description: "多个数相乘，可改变先乘哪几个数的顺序，优先把能得到整数或整十数的因数配对。",
      strategy: "先找能凑整的两对因数。",
      commonError: "改变分组时漏掉其中一个因数。"
    },
    "mul-round": {
      title: "积的近似数",
      description: "先求准确积，再根据要保留的位数看下一位，用四舍五入取近似值；用约等号。",
      strategy: "先算准确积，再看下一位。",
      commonError: "未算准确积就提前舍入，或把近似值写成等号。"
    },
    "mul-factor-size": {
      title: "用因数大小判断积的变化",
      description: "正数乘大于 1 的数，积变大；正数乘 0 到 1 之间的数，积变小。",
      strategy: "比较第二个因数和 1 的关系，不必先求出精确积。",
      commonError: "忽略因数与 1 的大小关系，凭数字位数猜积。"
    },
    "mul-area-model": {
      title: "小数乘法的面积模型",
      description: "长方形面积等于长乘宽；用小数表示边长时，乘积表示实际面积，并带有平方单位。",
      strategy: "先辨认两个相乘的量，再计算数值，最后写合适的平方单位。",
      commonError: "把面积单位写成长度单位，或把两条边长相加。"
    },
    "mul-context": {
      title: "单价、数量与总价",
      description: "总价 = 单价 × 数量；找回的钱 = 付款数 − 总价。小数数量仍按同一关系计算。",
      strategy: "先算总价，再用付款数减去总价。",
      commonError: "把付款数直接减去单价，或漏写货币单位。"
    },
    "div-integer": {
      title: "小数除以整数的竖式",
      description: "按整数除法逐位试商；除到被除数的小数部分时，商的小数点与被除数的小数点对齐。",
      strategy: "逐位试商，及时点商的小数点。",
      commonError: "漏写商的小数点，或把未除到的数位跳过去。"
    },
    "div-zero-place": {
      title: "商的数位用 0 占位",
      description: "某一位落下后不够除，商的相应数位要写 0，再落下一位继续除。",
      strategy: "每落下一位，商都要有对应数位。",
      commonError: "跳过 0 占位，把 1.02 错写成 1.2。"
    },
    "div-add-zero": {
      title: "余数后添 0 继续除",
      description: "被除数的原有数位用完还有余数，可以根据小数性质在末尾添 0 继续除；有的商会循环，不能保证余数最终为 0。",
      strategy: "余数未清零，继续添 0 试商。",
      commonError: "刚有余数就停，或认为添 0 后一定能除尽。"
    },
    "div-shift": {
      title: "除数是小数时的同倍转化",
      description: "将除数的小数点向右移动到整数，同时把被除数的小数点向右移动相同位数；位数不足时在末尾补 0。",
      strategy: "除数变整数，两数一起移。",
      commonError: "只移动除数的小数点，或被除数忘记补 0。"
    },
    "div-round": {
      title: "商的近似数",
      description: "商保留两位小数时至少算到千分位，依据第三位小数四舍五入；用约等号表达结果。",
      strategy: "多除一位，再四舍五入。",
      commonError: "只除到百分位就取近似数，或把近似数写成精确等式。"
    },
    "div-repeat": {
      title: "循环小数与循环节",
      description: "除法竖式中的余数再次出现时，后续商会重复；重复的最短一组数字叫循环节。",
      strategy: "看余数是否重复，再认循环节。",
      commonError: "把有限几位商当成精确结果。"
    },
    "div-compare": {
      title: "除数与 1 决定商的变化",
      description: "被除数为正数时，除以大于 1 的正数，商变小；除以 0 到 1 之间的正数，商变大。",
      strategy: "先比较除数和 1。",
      commonError: "认为除法的商一定小于被除数。"
    },
    "div-context": {
      title: "实际问题中的进一与去尾",
      description: "装东西有剩余仍要一个完整容器，用进一法；裁剪不足一整份不能计入，用去尾法。",
      strategy: "看余下部分能否作为完整一份。",
      commonError: "一律四舍五入，没有结合题目含义。"
    },
    "eq-letter-expression": {
      title: "用字母表示数量并合并同类项",
      description: "相同单价记为 x 时，几份就写几 x；同价数量可以先相加，固定费用另计。",
      strategy: "逐项列式，再把含 x 的同类项合并。",
      commonError: "把固定费用也当作 x 项合并，或漏写其中一次购买。"
    },
    "eq-two-step": {
      title: "两步方程与等式性质",
      description: "解含有两步运算的方程时，按与原运算相反的顺序撤销运算，并且每一步都对等式两边做相同操作。",
      strategy: "先处理加减，再处理乘除；每步写清等号并把未知数单独留下。",
      commonError: "只改方程一边，或把运算顺序倒过来。"
    },
    "eq-one-step": {
      title: "一步方程中的逆运算",
      description: "根据未知数所在位置，选择加减乘除的逆运算；等号两边同时做相同的运算。",
      strategy: "看清 x 的位置，两边同步操作。",
      commonError: "未知数在减号后面或除号前面时套错逆运算。"
    },
    "eq-combine": {
      title: "合并同类项后解方程",
      description: "含 x 的同类项可以先合并系数，再利用等式性质逐步求解。",
      strategy: "先合并 x 项，再去常数项。",
      commonError: "把常数项与 x 的系数直接相加。"
    },
    "eq-inverse-operation": {
      title: "减法中未知数的位置",
      description: "被减数 − 减数 = 差。未知数是减数时，用被减数减差求减数。",
      strategy: "先标出被减数、减数和差，再用数量关系反求未知数。",
      commonError: "看到减法就直接做差，忽略未知数所在的位置。"
    },
    "eq-modeling": {
      title: "从数量关系列方程",
      description: "先用字母表示未知量，再把题中的总量关系、倍数关系或速度 × 时间 = 路程写成等式。",
      strategy: "写出单位，明确哪些数量相加或相乘形成已知总量，再求未知数。",
      commonError: "没有说明字母代表什么，或把关系中的加法、乘法颠倒。"
    },
    "eq-check": {
      title: "解方程后的代入验算",
      description: "把求出的未知数代回原方程，分别计算等号左右两边；两边相等，解才成立。",
      strategy: "保留原方程，先算左边，再与右边比较。",
      commonError: "只写出 x 的值，没有检查是否满足原方程。"
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
