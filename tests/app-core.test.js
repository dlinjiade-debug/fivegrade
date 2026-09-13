const test = require("node:test");
const assert = require("node:assert/strict");

const Core = require("../js/app-core.js");

test("九份案卷保持教材单元顺序并使用批准的案卷名称", () => {
  assert.deepEqual(
    Core.CASES.map((item) => [item.id, item.officialName, item.caseName]),
    [
      ["unit1", "观察简单组合体", "空间证物室"],
      ["unit2", "小数乘法", "小数点追踪"],
      ["unit3", "小数除法", "除法迷雾"],
      ["unit4", "图形的运动", "轨迹重建"],
      ["unit5", "简易方程", "天平密码"],
      ["unit6", "可能性", "随机疑云"],
      ["unit7", "多边形的面积", "面积侦探"],
      ["unit8", "数学广角·植树问题", "间隔谜案"],
      ["unit9", "有趣的密铺", "密铺工坊"],
    ]
  );
});

test("课程流程按谜题、线索、验证、规律、破案推进", () => {
  assert.deepEqual(
    Core.FLOW_STAGES.map((stage) => [stage.id, stage.label, stage.section]),
    [
      ["brief", "提出谜题", "brief"],
      ["evidence", "收集线索", "teach"],
      ["investigate", "动手验证", "practice"],
      ["conclusion", "锁定规律", "why"],
      ["challenge", "独立破案", "game"],
    ]
  );
});

test("非法模式回退到导演模式", () => {
  assert.equal(Core.normalizeMode("director"), "director");
  assert.equal(Core.normalizeMode("challenge"), "challenge");
  assert.equal(Core.normalizeMode("anything"), "director");
  assert.equal(Core.normalizeMode(null), "director");
});

test("阶段前进和后退不会越界", () => {
  assert.equal(Core.moveStage("brief", -1), "brief");
  assert.equal(Core.moveStage("brief", 1), "evidence");
  assert.equal(Core.moveStage("investigate", 1), "conclusion");
  assert.equal(Core.moveStage("challenge", 1), "challenge");
  assert.equal(Core.moveStage("missing", 1), "brief");
});

test("会话状态保留合法单元、模式和阶段", () => {
  assert.deepEqual(
    Core.createSessionState({ unitId: "unit5", mode: "challenge", stageId: "investigate" }),
    { unitId: "unit5", mode: "challenge", stageId: "investigate", hintLevel: 0 }
  );
  assert.deepEqual(
    Core.createSessionState({ unitId: "unit99", mode: "bad", stageId: "bad", hintLevel: -4 }),
    { unitId: "unit1", mode: "director", stageId: "brief", hintLevel: 0 }
  );
});

test("线索最多两层且不会超过案卷配置", () => {
  assert.equal(Core.nextHintLevel(0), 1);
  assert.equal(Core.nextHintLevel(1), 2);
  assert.equal(Core.nextHintLevel(2), 2);
});

test("旧章节区块能映射到统一破案流程", () => {
  assert.equal(Core.stageForSection("section teach demo"), "evidence");
  assert.equal(Core.stageForSection("section practice"), "investigate");
  assert.equal(Core.stageForSection("section why"), "conclusion");
  assert.equal(Core.stageForSection("section game"), "challenge");
  assert.equal(Core.stageForSection("section unknown"), "evidence");
});

test("分层提示短而明确，第二层引导验证规律", () => {
  const first = Core.hintLines("unit2", 1);
  const second = Core.hintLines("unit2", 2);
  assert.deepEqual(first, ["先按整数相乘，再追踪两个因数的小数位。"]);
  assert.deepEqual(second, [
    "先按整数相乘，再追踪两个因数的小数位。",
    "还没锁定？进入“锁定规律”，再回来完成判断。",
  ]);
  assert.equal(Core.hintLines("unit2", 99).length, 2);
});

test("错因档案能标记常见错误并生成答案位置变化的变式", () => {
  assert.equal(Core.inferWrongCause("3.6 × 2.4 的积应有几位小数？"), "小数点与数位");
  assert.equal(Core.inferWrongCause("平行四边形的面积怎样计算？"), "公式与图形关系");
  const variant = Core.rotateOptions(["8.64", "86.4", "0.864"], 0);
  assert.deepEqual(variant, { options: ["86.4", "0.864", "8.64"], answer: 2 });
});

test("右侧线索随当前破案步骤变化", () => {
  assert.equal(Core.stageLead("unit1", "evidence"), "旋转证物，从三个方向核对轮廓。");
  assert.equal(Core.stageLead("unit1", "investigate"), "轮到你操作：每次只改变一个条件。");
  assert.equal(Core.stageLead("unit1", "challenge"), "独立完成，需要时只打开一层提示。");
});

test("工作台默认保留目录并收起任务抽屉，且只接受布尔偏好", () => {
  assert.deepEqual(Core.normalizeWorkbenchPanels(), {
    railCollapsed: false,
    taskCollapsed: true,
  });
  assert.deepEqual(Core.normalizeWorkbenchPanels({
    railCollapsed: true,
    taskCollapsed: false,
  }), {
    railCollapsed: true,
    taskCollapsed: false,
  });
  assert.deepEqual(Core.normalizeWorkbenchPanels({
    railCollapsed: "true",
    taskCollapsed: "false",
  }), {
    railCollapsed: false,
    taskCollapsed: true,
  });
});

test("本步任务卡给出当前步骤、具体操作和完成标志", () => {
  assert.deepEqual(Core.stageTask("unit4", "evidence"), {
    step: 2,
    total: 5,
    label: "收集线索",
    action: "跟着演示，重点观察：比较对应点、移动方向与旋转中心。",
    done: "完成一次演示或观察",
  });
  assert.deepEqual(Core.stageTask("unit2", "investigate"), {
    step: 3,
    total: 5,
    label: "动手验证",
    action: "自己操作：逐笔完成竖式并放置积的小数点。",
    done: "提交一次判断或结果",
  });
  assert.deepEqual(Core.stageTask("missing", "missing"), {
    step: 1,
    total: 5,
    label: "提出谜题",
    action: "先判断：被挡住的方块藏在哪里？",
    done: "作出一次选择或操作",
  });
});

test("教材官方单元名是主名称，案卷特色名是副标题", () => {
  assert.deepEqual(Core.caseIdentity("unit2"), {
    title: "小数乘法",
    subtitle: "小数点追踪",
  });
  assert.deepEqual(Core.caseIdentity("unit8"), {
    title: "数学广角·植树问题",
    subtitle: "间隔谜案",
  });
});

test("竖式超出草稿可视区时计算出完整露出的滚动位置", () => {
  assert.equal(Core.revealScrollTop({
    scrollTop: 0,
    clientHeight: 580,
    targetTop: 295,
    targetHeight: 532,
    margin: 16,
  }), 271);
  assert.equal(Core.revealScrollTop({
    scrollTop: 120,
    clientHeight: 580,
    targetTop: 180,
    targetHeight: 260,
    margin: 16,
  }), 120);
});
