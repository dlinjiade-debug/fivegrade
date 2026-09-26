/* ==========================================================================
 *  bb-topics.js —— 专题登记表：乘法 / 除法共用一套黑板和引擎
 *  ------------------------------------------------------------------
 *  两个专题的差别只有「内容」：
 *    · 乘法（第 1 单元）用 vcalc / pointjump 画竖式
 *    · 除法（第 3 单元）用 vdiv 画长除法
 *  引擎、页面、进度、自检全都是同一套，所以这里只登记数据。
 *
 *  加第三个专题（比如分数）时：写一份 bb-levels-xxx.js，
 *  在 bb-core / bb-div 里注册展开器，然后在这里加一行就行。
 * ========================================================================== */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BBTopics = api;
})(typeof self !== "undefined" ? self : globalThis, function (root) {
  "use strict";

  /* 板书小工具：和关卡文件里的一致，只是这里坐标是写死的开场白 */
  function cn(text, x, y, size, tone) {
    return { k: "cn", text: text, x: x, y: y, size: size || 26, tone: tone || "chalk" };
  }
  function num(text, x, y, size, tone) {
    return { k: "num", text: text, x: x, y: y, size: size || 44, tone: tone || "chalk" };
  }

  /* 首页黑板上的开场白：两个专题各说各的 */
  function welcomeSteps(kind) {
    if (kind === "div") {
      return [
        {
          text: "欢迎来到小数除法闯关，一共八关。",
          tip: "每关都是「先讲、再练」，一步都不跳。",
          ops: [
            cn("小数除法 · 八关小闯关", 64, 46, 50, "accent"),
            cn("每关两件事：先看黑板讲解，再动手做题。", 64, 148, 27),
            cn("讲解会一笔一笔写给你看，别急着往后翻。", 64, 196, 27, "muted"),
            num("9.6 ÷ 3 ＝ 3.2", 64, 262, 52),
            cn("第一关就从这一道开始。", 64, 358, 27, "good"),
          ],
        },
        {
          text: "除法竖式也是一步一步写出来的。",
          tip: "商写在哪儿、余数落在哪儿，看清位置再动笔。",
          ops: [
            cn("除法的竖式长这样", 64, 46, 34, "accent"),
            cn("被除数写在除号框里，除数写在框左边。", 64, 118, 27),
            cn("商写在对应的那一列上面，一位一位对齐。", 64, 166, 27),
            cn("八关全部盖满，小数的除法你就拿下了。", 64, 246, 30, "good"),
          ],
        },
      ];
    }
    return [
      {
        text: "欢迎来到小数乘法闯关，一共八关。",
        tip: "每关都是「先讲、再练」，一步都不跳。",
        ops: [
          cn("小数乘法 · 八关小闯关", 64, 46, 50, "accent"),
          cn("每关两件事：先看黑板讲解，再动手做题。", 64, 148, 27),
          cn("讲解会一笔一笔写给你看，别急着往后翻。", 64, 196, 27, "muted"),
          num("0.72 × 5 ＝ 3.6", 64, 262, 52),
          cn("第一关就从这一道开始。", 64, 358, 27, "good"),
        ],
      },
      {
        text: "做完一关盖一个章，八关全部盖满就通关。",
        tip: "答对八成以上才算过关，不够可以重做。",
        ops: [
          cn("做完一关，盖一个章。", 64, 46, 34, "accent"),
          cn("八关全部盖满，小数的乘法你就拿下了。", 64, 118, 27),
          cn("答对 8 成以上才算通关，不够就回去看看黑板。", 64, 166, 27, "muted"),
          cn("准备好了吗？点下面的卡片开始。", 64, 246, 30, "good"),
        ],
      },
    ];
  }

  const TOPICS = [
    {
      id: "mul",
      name: "小数乘法",
      chip: "第 1 单元",
      brand: "五年级上册 · 第 1 单元 小数乘法",
      docTitle: "粉笔小闯关 · 五年级小数乘法",
      desc: "跟着粉笔一笔一笔写竖式，八关闯关学会人教版五年级上册的小数乘法。",
      foot: "依据人教版五年级上册第一单元达标测试卷编写 · 所有题目答案都由算式重新核算过",
      levels: (root && root.BBLevels) ? root.BBLevels : null,
      notes: [
        {
          title: "这三条吃透了，小数乘法就稳了",
          items: [
            "先按整数乘法算，最后再处理小数点",
            "两个因数一共有几位小数，积就从右边数几位",
            "积的小数部分末尾多余的 0 可以去掉",
          ],
        },
        {
          title: "最容易丢分的地方",
          items: [
            "小数位数数少了（0.76×4.7 是 3 位，不是 2 位）",
            "位数不够忘了在前面补 0（0.048×0.15＝0.0072）",
            "用分配律时漏乘了一块（(8－0.8)×12.5 里的 0.8）",
          ],
        },
      ],
    },
    {
      id: "div",
      name: "小数除法",
      chip: "第 3 单元",
      brand: "五年级上册 · 第 3 单元 小数除法",
      docTitle: "粉笔小闯关 · 五年级小数除法",
      desc: "跟着粉笔一笔一笔写除法的竖式，八关闯关学会人教版五年级上册的小数除法。",
      foot: "依据人教版五年级上册第三单元小数除法编写 · 所有题目答案都由算式重新核算过",
      levels: (root && root.BBLevelsDiv) ? root.BBLevelsDiv : null,
      notes: [
        {
          title: "这三条吃透了，小数除法就稳了",
          items: [
            "除数是整数时，商的小数点与被除数的小数点对齐",
            "除数是小数：两个数一起把小数点向右搬",
            "有余数可添 0 继续除；余数重复时商可能无限循环",
          ],
        },
        {
          title: "最容易丢分的地方",
          items: [
            "商的小数点忘了点（9.6÷3 写成 32）",
            "只搬了除数的小数点（1.5÷0.25 没动 1.5）",
            "除不尽就停笔（5.5÷4 算成 1.3，其实还有余数）",
          ],
        },
      ],
    },
  ];

  /* 第三个卡片两份专题共用（怎么操作） */
  const HOWTO = {
    title: "怎么操作",
    items: [
      "「下一步」看下一节讲解，「重播」再写一遍",
      "「自动讲解」让它自己一关一关写下去",
      "键盘 ← → 翻页，空格下一步，R 重播",
    ],
  };

  const KEY = "bb-topic";
  const DEFAULT = "mul";

  function byId(id) {
    return TOPICS.filter(function (t) { return t.id === id; })[0] || null;
  }

  function query(name) {
    if (!root || !root.location) return null;
    const m = new RegExp("[?&]" + name + "=([^&#]*)").exec(root.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
  }

  /** 当前专题：地址栏 ?topic= 优先，其次上次记住的，最后乘法 */
  function current() {
    const want = query("topic");
    if (byId(want)) return byId(want);
    let saved = null;
    try { saved = root.localStorage && root.localStorage.getItem(KEY); } catch (e) { saved = null; }
    return byId(saved) || byId(DEFAULT);
  }

  function remember(id) {
    try { if (root.localStorage) root.localStorage.setItem(KEY, id); } catch (e) { /* 隐私模式 */ }
  }

  /** 换专题时保持在同一张页面上：地图还是地图，某一关还是某一关 */
  function switchUrl(id, levelNo) {
    const m = /([^/\\]+\.html)$/.exec((root && root.location ? root.location.pathname : "") || "");
    const page = m ? m[1] : "index.html";
    if (page === "level.html" && levelNo) return "./level.html?topic=" + id + "&no=" + levelNo;
    return "./" + page + "?topic=" + id;
  }

  function notes(topic) {
    const t = byId(topic && topic.id) || current();
    return (t.notes || []).concat([HOWTO]);
  }

  function steps(topic) {
    const t = byId(topic && topic.id) || current();
    return welcomeSteps(t.id);
  }

  function levelsOf(id) {
    const t = byId(id) || current();
    return t && t.levels ? t.levels.LEVELS : [];
  }

  return {
    TOPICS: TOPICS,
    DEFAULT: DEFAULT,
    byId: byId,
    current: current,
    remember: remember,
    switchUrl: switchUrl,
    notes: notes,
    steps: steps,
    levelsOf: levelsOf,
    welcomeSteps: welcomeSteps,
  };
});
