(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MysteryCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CASES = [
    { id: "unit1", num: "01", officialName: "观察简单组合体", caseName: "空间证物室", question: "被挡住的方块藏在哪里？", clue: "旋转证物，从三个方向核对轮廓。", focus: "旋转积木，从正面、左面和上面核对轮廓" },
    { id: "unit2", num: "02", officialName: "小数乘法", caseName: "小数点追踪", question: "积的小数点该落在哪里？", clue: "先按整数相乘，再追踪两个因数的小数位。", focus: "逐笔完成竖式并放置积的小数点" },
    { id: "unit3", num: "03", officialName: "小数除法", caseName: "除法迷雾", question: "怎样让除数先变成整数？", clue: "除数移动几位，被除数也必须移动几位。", focus: "同步移动小数点，再观察商、余数和落数" },
    { id: "unit4", num: "04", officialName: "图形的运动", caseName: "轨迹重建", question: "图形究竟怎样到达新位置？", clue: "盯住对应点、旋转中心和移动方向。", focus: "比较对应点、移动方向与旋转中心" },
    { id: "unit5", num: "05", officialName: "简易方程", caseName: "天平密码", question: "怎样操作还能保持两边平衡？", clue: "等式两边必须同时进行相同操作。", focus: "对天平两边进行同一种操作" },
    { id: "unit6", num: "06", officialName: "可能性", caseName: "随机疑云", question: "哪种结果更容易发生？", clue: "先比较数量，再用多次实验核对判断。", focus: "调整比例并重复实验，比较频数与频率" },
    { id: "unit7", num: "07", officialName: "多边形的面积", caseName: "面积侦探", question: "陌生图形能变成熟悉图形吗？", clue: "剪、移、拼只改变形状，不改变面积。", focus: "切割、旋转并拼合图形，核对面积不变" },
    { id: "unit8", num: "08", officialName: "数学广角·植树问题", caseName: "间隔谜案", question: "棵数和间隔数差在哪里？", clue: "先判断两端，再数间隔。", focus: "切换端点条件，摆树并数清间隔" },
    { id: "unit9", num: "09", officialName: "有趣的密铺", caseName: "密铺工坊", question: "这些图形为什么能铺满？", clue: "观察同一顶点周围的角能否正好拼成一周。", focus: "旋转图形并检查同一顶点周围的角" },
  ];

  const FLOW_STAGES = [
    { id: "brief", label: "提出谜题", section: "brief" },
    { id: "evidence", label: "收集线索", section: "teach" },
    { id: "investigate", label: "动手验证", section: "practice" },
    { id: "conclusion", label: "锁定规律", section: "why" },
    { id: "challenge", label: "独立破案", section: "game" },
  ];

  function normalizeMode(value) {
    return value === "challenge" ? "challenge" : "director";
  }

  function moveStage(stageId, delta) {
    const index = FLOW_STAGES.findIndex(function (stage) { return stage.id === stageId; });
    if (index < 0) return FLOW_STAGES[0].id;
    const next = Math.max(0, Math.min(FLOW_STAGES.length - 1, index + (delta < 0 ? -1 : 1)));
    return FLOW_STAGES[next].id;
  }

  function nextHintLevel(level) {
    const safe = Number.isFinite(Number(level)) ? Number(level) : 0;
    return Math.max(0, Math.min(2, safe + 1));
  }

  function createSessionState(input) {
    input = input || {};
    const unitId = CASES.some(function (item) { return item.id === input.unitId; }) ? input.unitId : CASES[0].id;
    const stageId = FLOW_STAGES.some(function (stage) { return stage.id === input.stageId; }) ? input.stageId : FLOW_STAGES[0].id;
    const hint = Number(input.hintLevel);
    return {
      unitId: unitId,
      mode: normalizeMode(input.mode),
      stageId: stageId,
      hintLevel: Number.isFinite(hint) ? Math.max(0, Math.min(2, Math.floor(hint))) : 0,
    };
  }

  function stageForSection(className) {
    const value = String(className || "");
    if (/\bpractice\b/.test(value)) return "investigate";
    if (/\bwhy\b/.test(value)) return "conclusion";
    if (/\bgame\b/.test(value)) return "challenge";
    return "evidence";
  }

  function hintLines(unitId, level) {
    const item = CASES.find(function (entry) { return entry.id === unitId; }) || CASES[0];
    const safeLevel = Math.max(0, Math.min(2, Math.floor(Number(level) || 0)));
    const lines = [];
    if (safeLevel >= 1) lines.push(item.clue);
    if (safeLevel >= 2) lines.push("还没锁定？进入“锁定规律”，再回来完成判断。");
    return lines;
  }

  function inferWrongCause(question) {
    const text = String(question || "");
    if (/小数|小数点|乘|除/.test(text)) return "小数点与数位";
    if (/面积|图形|平行四边形|三角形|梯形|密铺/.test(text)) return "公式与图形关系";
    if (/方程|等式|天平/.test(text)) return "等量关系";
    if (/可能|概率|随机/.test(text)) return "条件与可能性";
    if (/植树|间隔|棵/.test(text)) return "端点与间隔";
    return "审题与方法";
  }

  function rotateOptions(options, answer) {
    const source = Array.isArray(options) ? options.slice() : [];
    if (!source.length) return { options: [], answer: -1 };
    const safeAnswer = Math.max(0, Math.min(source.length - 1, Number(answer) || 0));
    return { options: source.slice(1).concat(source[0]), answer: (safeAnswer + source.length - 1) % source.length };
  }

  function stageLead(unitId, stageId) {
    const item = CASES.find(function (entry) { return entry.id === unitId; }) || CASES[0];
    if (stageId === "evidence") return item.clue;
    if (stageId === "investigate") return "轮到你操作：每次只改变一个条件。";
    if (stageId === "conclusion") return "用一句话说出规律，再打开完整讲解。";
    if (stageId === "challenge") return "独立完成，需要时只打开一层提示。";
    return "先做出判断，再动手核对。";
  }

  function normalizeWorkbenchPanels(input) {
    input = input || {};
    return {
      railCollapsed: input.railCollapsed === true,
      taskCollapsed: input.taskCollapsed === false ? false : true,
    };
  }

  function stageTask(unitId, stageId) {
    const item = CASES.find(function (entry) { return entry.id === unitId; }) || CASES[0];
    const safeStage = FLOW_STAGES.find(function (stage) { return stage.id === stageId; }) || FLOW_STAGES[0];
    const step = FLOW_STAGES.indexOf(safeStage) + 1;
    const tasks = {
      brief: {
        action: "先判断：" + item.question,
        done: "作出一次选择或操作",
      },
      evidence: {
        action: "跟着演示，重点观察：" + item.focus + "。",
        done: "完成一次演示或观察",
      },
      investigate: {
        action: "自己操作：" + item.focus + "。",
        done: "提交一次判断或结果",
      },
      conclusion: {
        action: "用一句话说清“" + item.caseName + "”里不变的关系。",
        done: "说出规律并确认",
      },
      challenge: {
        action: "独立完成当前题；卡住时只打开一层提示。",
        done: "达到本章通过要求并提交案卷",
      },
    };
    return {
      step: step,
      total: FLOW_STAGES.length,
      label: safeStage.label,
      action: tasks[safeStage.id].action,
      done: tasks[safeStage.id].done,
    };
  }

  function caseIdentity(unitId) {
    const item = CASES.find(function (entry) { return entry.id === unitId; }) || CASES[0];
    return { title: item.officialName, subtitle: item.caseName };
  }

  function revealScrollTop(metrics) {
    metrics = metrics || {};
    const scrollTop = Math.max(0, Number(metrics.scrollTop) || 0);
    const clientHeight = Math.max(0, Number(metrics.clientHeight) || 0);
    const targetTop = Math.max(0, Number(metrics.targetTop) || 0);
    const targetHeight = Math.max(0, Number(metrics.targetHeight) || 0);
    const margin = Math.max(0, Number(metrics.margin) || 0);
    const visibleTop = scrollTop + margin;
    const visibleBottom = scrollTop + clientHeight - margin;
    const targetBottom = targetTop + targetHeight;

    if (targetTop >= visibleTop && targetBottom <= visibleBottom) return scrollTop;
    if (targetHeight + margin * 2 <= clientHeight) {
      return Math.max(0, Math.round(targetTop - (clientHeight - targetHeight) / 2));
    }
    if (targetTop < visibleTop) return Math.max(0, Math.round(targetTop - margin));
    return Math.max(0, Math.round(targetBottom - clientHeight + margin));
  }

  return {
    CASES: CASES,
    FLOW_STAGES: FLOW_STAGES,
    normalizeMode: normalizeMode,
    moveStage: moveStage,
    nextHintLevel: nextHintLevel,
    createSessionState: createSessionState,
    stageForSection: stageForSection,
    hintLines: hintLines,
    inferWrongCause: inferWrongCause,
    rotateOptions: rotateOptions,
    stageLead: stageLead,
    normalizeWorkbenchPanels: normalizeWorkbenchPanels,
    stageTask: stageTask,
    caseIdentity: caseIdentity,
    revealScrollTop: revealScrollTop,
  };
});
