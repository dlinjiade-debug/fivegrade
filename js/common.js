/* ===== 共享逻辑：单元目录、得星、进度保存、单元页顶栏 ===== */

/** 单元总目录（主页与单元页顶栏共用） */
const UNITS = [
  { id: "unit1", num: "一", short: "空间证物室", name: "观察简单组合体", desc: "从正面、上面、左面看世界 👀" },
  { id: "unit2", num: "二", short: "小数点追踪", name: "小数乘法", desc: "竖式一步步点，小数点搬家记心间 ✖️" },
  { id: "unit3", num: "三", short: "除法迷雾", name: "小数除法", desc: "除数变整数，商的小数点对齐 ➗" },
  { id: "unit4", num: "四", short: "轨迹重建", name: "图形的运动", desc: "平移 · 旋转 · 轴对称，动起来 🔷" },
  { id: "unit5", num: "五", short: "天平密码", name: "简易方程", desc: "字母表示数 · 天平解方程 ⚖️" },
  { id: "unit6", num: "六", short: "随机疑云", name: "可能性", desc: "抛硬币、摸球、转盘公平吗 🎲" },
  { id: "unit7", num: "七", short: "面积侦探", name: "多边形的面积", desc: "割补法推出三个面积公式 📐" },
  { id: "unit8", num: "八", short: "间隔谜案", name: "数学广角·植树问题", desc: "先数间隔，再定棵数 🌳" },
  { id: "unit9", num: "九", short: "密铺工坊", name: "有趣的密铺", desc: "什么图形能铺满地面 🧩" },
];

const Math5 = {
  KEY: "math5_progress_v1",
  WKEY: "math5_wrongbook_v1",
  SESSION_KEY: "math5_mystery_session_v2",
  SETTINGS_KEY: "math5_mystery_settings_v2",

  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || { stars: {} }; }
    catch (e) { return { stars: {} }; }
  },
  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },
  /** 给某单元加 n 颗星（不会重复累计同一关） */
  addStar(unitId, levelId, n = 1) {
    const d = this.load();
    d.stars[unitId] = d.stars[unitId] || {};
    if (d.stars[unitId][levelId]) return false; // 已得过
    d.stars[unitId][levelId] = n;
    this.save(d);
    this.refreshStars(unitId);
    return true;
  },
  hasStar(unitId, levelId) {
    const d = this.load();
    return !!(d.stars[unitId] && d.stars[unitId][levelId]);
  },
  unitStars(unitId) {
    const d = this.load();
    return Object.keys(d.stars[unitId] || {}).length;
  },
  isUnitComplete(unitId) {
    const d = this.load();
    const levels = d.stars[unitId] || {};
    return !!(levels["case-complete"] || levels.game);
  },
  refreshStars(unitId) {
    const el = document.getElementById("starCount");
    if (el && unitId) {
      const complete = this.isUnitComplete(unitId);
      el.textContent = complete ? "已盖章" : "待侦破";
      el.classList.toggle("is-complete", complete);
    }
    // 同步各处进度显示（主页概览 / 顶栏跳转条）
    if (typeof refreshHomeProgress === "function") refreshHomeProgress();
    if (document.querySelector(".u-star[data-unit]")) this.paintStripStars();
  },

  /** 全册总星数 */
  totalStars() {
    const d = this.load();
    return UNITS.reduce((s, u) => s + Object.keys(d.stars[u.id] || {}).length, 0);
  },
  /** 清空单个单元进度 */
  resetUnit(unitId) {
    const d = this.load();
    delete d.stars[unitId];
    this.save(d);
    this.refreshStars(unitId);
  },
  /** 清空全部进度 */
  resetAll() {
    this.save({ stars: {} });
    this.refreshStars();
  },

  loadMysterySession() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.SESSION_KEY)) || {};
      return {
        mode: window.MysteryCore ? MysteryCore.normalizeMode(saved.mode) : (saved.mode === "challenge" ? "challenge" : "director"),
        lastUnitId: saved.lastUnitId || "unit1",
        stages: saved.stages || {},
        hints: saved.hints || {},
      };
    } catch (e) {
      return { mode: "director", lastUnitId: "unit1", stages: {}, hints: {} };
    }
  },

  saveMysterySession(session) {
    try { localStorage.setItem(this.SESSION_KEY, JSON.stringify(session)); }
    catch (e) { /* localStorage 不可用时不阻塞学习 */ }
  },

  loadMysterySettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.SETTINGS_KEY)) || {};
      return { reducedMotion: !!saved.reducedMotion };
    } catch (e) { return { reducedMotion: false }; }
  },

  saveMysterySettings(settings) {
    try { localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings)); }
    catch (e) { /* localStorage 不可用时不阻塞学习 */ }
  },

  /** 单元页通用初始化：unitId 如 "unit1"，title 单元名 */
  initUnitPage(unitId, title) {
    if (document.body.dataset.mysteryReady === "true") return;
    document.body.dataset.mysteryReady = "true";

    const core = window.MysteryCore;
    const cases = core ? core.CASES : UNITS.map(function (u, index) {
      return { id: u.id, num: String(index + 1).padStart(2, "0"), officialName: u.name, caseName: u.short, question: u.desc, clue: u.desc };
    });
    const flow = core ? core.FLOW_STAGES : [
      { id: "brief", label: "提出谜题", section: "brief" },
      { id: "evidence", label: "收集线索", section: "teach" },
      { id: "investigate", label: "动手验证", section: "practice" },
      { id: "conclusion", label: "锁定规律", section: "why" },
      { id: "challenge", label: "独立破案", section: "game" },
    ];
    const currentCase = cases.find(function (item) { return item.id === unitId; }) || cases[0];
    const originalWrap = document.querySelector("body > .wrap");
    if (!originalWrap) return;

    const icons = {
      casebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12.5H7.5A2.5 2.5 0 0 1 5 17V4.5Zm0 12.5a2.5 2.5 0 0 1 2.5-2.5H19M9 8h6M9 11h5"/></svg>',
      director: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16M6 10 8 5l4 5 4-5 2 5M7 14h10l-1 5H8l-1-5Z"/></svg>',
      challenge: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.6-4.1 2.8-6.2 6.5-6.2s5.9 2.1 6.5 6.2"/></svg>',
      expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>',
      settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="m19 13.5 1.3 1-.9 2.2-1.6-.2-1.3 1.3.2 1.6-2.2.9-1-1.3h-1.9l-1 1.3-2.2-.9.2-1.6-1.3-1.3-1.6.2-.9-2.2 1.3-1v-1.9l-1.3-1 .9-2.2 1.6.2 1.3-1.3-.2-1.6 2.2-.9 1 1.3h1.9l1-1.3 2.2.9-.2 1.6 1.3 1.3 1.6-.2.9 2.2-1.3 1v1.9Z"/></svg>',
      eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.3-5 9.5-5 9.5 5 9.5 5-3.3 5-9.5 5-9.5-5-9.5-5Z"/><circle cx="12" cy="12" r="2.6"/></svg>',
      clue: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M8.5 15.5C7 14.4 6 12.7 6 10.7a6 6 0 1 1 12 0c0 2-1 3.7-2.5 4.8-.8.6-1 1.2-1 2h-5c0-.8-.2-1.4-1-2Z"/></svg>',
      shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3c4.5 0 5.5 10 10 10h3M17 4l3 3-3 3M4 17h3c1.8 0 3-1.6 4.1-3.6M15 7.8c.6-.5 1.2-.8 2-.8h3M17 14l3 3-3 3"/></svg>',
      check: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 8"/></svg>',
      pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
      play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>',
      hide: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3 21 21M10.7 7.1A10.8 10.8 0 0 1 12 7c6.2 0 9.5 5 9.5 5a14 14 0 0 1-3 3.3M6.1 6.2A15.7 15.7 0 0 0 2.5 12s3.3 5 9.5 5c1.1 0 2.1-.2 3-.4M9.9 9.8a3 3 0 0 0 4.3 4.3"/></svg>',
    };
    function icon(name) { return '<span class="mystery-icon">' + icons[name] + '</span>'; }

    const saved = this.loadMysterySession();
    const stageId = flow.some(function (item) { return item.id === saved.stages[unitId]; }) ? saved.stages[unitId] : "brief";
    const state = {
      mode: core ? core.normalizeMode(saved.mode) : (saved.mode === "challenge" ? "challenge" : "director"),
      stageId: stageId,
      hintLevel: Math.max(0, Math.min(2, Number(saved.hints[unitId]) || 0)),
      answersHidden: false,
      interacted: {},
    };
    saved.lastUnitId = unitId;
    saved.stages[unitId] = state.stageId;
    this.saveMysterySession(saved);

    const settings = this.loadMysterySettings();
    document.body.className = (document.body.className + " mystery-unit").trim();
    document.body.dataset.mode = state.mode;
    document.body.classList.toggle("reduce-motion", settings.reducedMotion);

    const header = document.createElement("header");
    header.className = "mystery-topbar";
    header.innerHTML =
      '<a class="mystery-brand" href="index.html">' + icon("casebook") + '<span>数学解谜局</span></a>' +
      '<div class="mode-switch" role="group" aria-label="学习模式">' +
        '<button type="button" data-mode="director">' + icon("director") + '<span>导演模式</span></button>' +
        '<button type="button" data-mode="challenge">' + icon("challenge") + '<span>闯关模式</span></button>' +
      '</div>' +
      '<div class="top-actions">' +
        '<button type="button" id="mysteryFullscreen" class="icon-button" aria-label="全屏">' + icon("expand") + '<span>全屏</span></button>' +
        '<button type="button" id="mysterySettings" class="icon-button" aria-label="设置">' + icon("settings") + '<span>设置</span></button>' +
      '</div>';

    const workbench = document.createElement("main");
    workbench.className = "mystery-workbench";

    const rail = document.createElement("aside");
    rail.className = "case-rail";
    rail.setAttribute("aria-label", "数学案卷");
    rail.innerHTML = '<div class="rail-title"><span>数学案例档案</span><small>CASE FILES</small></div><nav>' + cases.map(function (item) {
      const active = item.id === unitId ? " is-active" : "";
      const complete = Math5.isUnitComplete(item.id) ? " is-complete" : "";
      return '<a class="case-link' + active + complete + '" href="' + item.id + '.html" aria-current="' + (active ? "page" : "false") + '">' +
        '<span class="case-number">' + item.num + '</span><span class="case-link-copy"><b>' + item.officialName + '</b><small>' + item.caseName + '</small></span><span class="case-mark" aria-label="已完成">✓</span></a>';
    }).join("") + '</nav><a class="wrong-file-link" href="index.html#wrongFiles">错因档案 <span class="wrong-badge"></span></a>';

    const workspace = document.createElement("section");
    workspace.className = "case-workspace";
    workspace.innerHTML =
      '<div class="case-heading"><div><span class="eyebrow">CASE ' + currentCase.num + '</span><h1>' + currentCase.officialName + '</h1><p>案卷主题 · ' + currentCase.caseName + '</p></div><span class="case-stamp" id="starCount">待侦破</span></div>' +
      '<nav class="case-progress" aria-label="破案步骤"></nav><div class="paper-stack"><div class="case-stage-deck"></div></div>';

    const progress = workspace.querySelector(".case-progress");
    progress.innerHTML = flow.map(function (item, index) {
      return '<button type="button" data-stage-target="' + item.id + '"><span>' + (index + 1) + '</span><b>' + item.label + '</b></button>';
    }).join("");
    const deck = workspace.querySelector(".case-stage-deck");

    const briefPanel = document.createElement("article");
    briefPanel.className = "mystery-stage-panel brief-panel";
    briefPanel.dataset.stage = "brief";
    briefPanel.innerHTML =
      '<div class="stage-kicker">今日谜题</div><h2>' + currentCase.question + '</h2>' +
      '<p class="brief-copy">先做出判断，再动手核对。证据会比答案更有说服力。</p>' +
      '<div class="signature-lab" id="signatureLab" aria-live="polite"></div>';
    deck.appendChild(briefPanel);

    const panelMap = { evidence: [], investigate: [], conclusion: [], challenge: [] };
    Array.from(originalWrap.children).forEach(function (section) {
      if (!section.classList.contains("section")) return;
      const target = core ? core.stageForSection(section.className) : (section.classList.contains("practice") ? "investigate" : section.classList.contains("why") ? "conclusion" : section.classList.contains("game") ? "challenge" : "evidence");
      panelMap[target].push(section);
      const heading = section.querySelector(":scope > h2");
      if (heading) heading.textContent = heading.textContent.replace(/^[^\u4e00-\u9fffA-Za-z0-9]+/, "").trim();
    });
    flow.slice(1).forEach(function (flowItem) {
      const panel = document.createElement("article");
      panel.className = "mystery-stage-panel";
      panel.dataset.stage = flowItem.id;
      if (flowItem.id === "conclusion") {
        const challengeSummary = document.createElement("div");
        challengeSummary.className = "challenge-conclusion";
        challengeSummary.innerHTML = '<strong>先说出规律</strong><p>用一句话说出你发现的规律。说完再进入独立破案。</p>' +
          '<button type="button" data-conclusion-confirm>我说出了规律</button>';
        panel.appendChild(challengeSummary);
      }
      if (!panelMap[flowItem.id].length) panel.innerHTML = '<div class="empty-stage">本步骤的证据正在整理。</div>';
      panelMap[flowItem.id].forEach(function (section) { panel.appendChild(section); });
      deck.appendChild(panel);
    });
    originalWrap.remove();

    const cluePanel = document.createElement("aside");
    cluePanel.className = "clue-panel";
    cluePanel.innerHTML =
      '<div class="clue-tab">当前线索</div><div class="clue-sheet"><span class="clue-case">' + currentCase.officialName + '</span><span class="clue-alias">' + currentCase.caseName + '</span>' +
      '<div class="clue-rule"><span></span>' + icon("clue") + '<span></span></div><h2>' + currentCase.question + '</h2>' +
      '<div class="clue-copy" id="mysteryClueCopy">先观察中央证物，暂时不要急着看结论。</div><div class="clue-status" id="mysteryStatus" aria-live="polite"></div></div>';

    const dock = document.createElement("footer");
    dock.className = "director-dock";
    dock.innerHTML =
      '<button type="button" id="mysteryPrev">' + icon("eye") + '<span>回看线索</span></button>' +
      '<button type="button" id="mysteryHint">' + icon("clue") + '<span>给一点提示</span></button>' +
      '<span class="dock-separator" aria-hidden="true"></span>' +
      '<button type="button" class="director-only" id="mysteryPause">' + icon("pause") + '<span>暂停</span></button>' +
      '<button type="button" class="director-only" id="mysteryAuto">' + icon("play") + '<span>自动演示</span></button>' +
      '<button type="button" class="director-only" id="mysteryHide">' + icon("hide") + '<span>隐藏答案</span></button>' +
      '<button type="button" id="mysteryShuffle">' + icon("shuffle") + '<span>换一题</span></button>' +
      '<button type="button" class="primary-action" id="mysteryPrimary">' + icon("check") + '<span>下一步</span></button>';

    const dialog = document.createElement("dialog");
    dialog.className = "mystery-settings-dialog";
    dialog.innerHTML = '<form method="dialog"><div class="dialog-heading"><div><small>工作台设置</small><h2>保持专注，减少干扰</h2></div><button value="close" aria-label="关闭">×</button></div>' +
      '<label class="setting-row"><span><b>减少动画</b><small>关闭不必要的移动效果</small></span><input id="reduceMotionToggle" type="checkbox"></label>' +
      '<button type="button" class="reset-case" id="btnResetUnit">重置本案卷进度</button></form>';

    workbench.appendChild(rail);
    workbench.appendChild(workspace);
    workbench.appendChild(cluePanel);
    workbench.appendChild(dock);
    document.body.prepend(dialog);
    document.body.prepend(workbench);
    document.body.prepend(header);

    const labContainer = document.getElementById("signatureLab");
    let labController = null;
    const packs = window.MysteryLabPacks || {};
    const pack = [packs.arithmetic, packs.geometry].find(function (candidate) {
      return candidate && typeof candidate.getDefinition === "function" && candidate.getDefinition(unitId);
    });
    if (pack && typeof pack.mount === "function") {
      labController = pack.mount(unitId, labContainer, {
        onInteract: function (message) {
          state.interacted.brief = true;
          if (message) document.getElementById("mysteryStatus").textContent = message;
        },
      });
    } else {
      labContainer.innerHTML = '<div class="lab-loading"><b>证物已就位</b><span>进入“收集线索”，调用本章互动模型。</span></div>';
    }

    const interactiveSelector = "button, a, input, select, textarea, [role=button], canvas, svg, .clickable-digit, [tabindex]";
    deck.addEventListener("click", function (event) {
      if (state.stageId !== "challenge" && event.target.closest(interactiveSelector)) state.interacted[state.stageId] = true;
    });
    deck.addEventListener("input", function () {
      if (state.stageId !== "challenge") state.interacted[state.stageId] = true;
    });
    const conclusionConfirm = deck.querySelector("[data-conclusion-confirm]");
    if (conclusionConfirm) {
      conclusionConfirm.addEventListener("click", function () {
        state.interacted.conclusion = true;
        conclusionConfirm.textContent = "规律已锁定";
        conclusionConfirm.disabled = true;
        setStatus("规律已经说清楚，可以进入独立破案。", "ok");
      });
    }

    function persist() {
      const current = Math5.loadMysterySession();
      current.mode = state.mode;
      current.lastUnitId = unitId;
      current.stages[unitId] = state.stageId;
      current.hints[unitId] = state.hintLevel;
      Math5.saveMysterySession(current);
    }

    function renderHints() {
      const box = document.getElementById("mysteryClueCopy");
      const lines = core ? core.hintLines(unitId, state.hintLevel) : (state.hintLevel ? [currentCase.clue] : []);
      const lead = core ? core.stageLead(unitId, state.stageId) : currentCase.clue;
      box.innerHTML = lines.length ? lines.map(function (line) { return '<p>' + line + '</p>'; }).join("") : lead;
    }

    function setStatus(message, tone) {
      const el = document.getElementById("mysteryStatus");
      el.textContent = message || "";
      el.dataset.tone = tone || "";
    }

    function render() {
      document.body.dataset.mode = state.mode;
      document.querySelectorAll(".mode-switch [data-mode]").forEach(function (button) {
        const active = button.dataset.mode === state.mode;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      const activeIndex = flow.findIndex(function (item) { return item.id === state.stageId; });
      document.querySelectorAll("[data-stage-target]").forEach(function (button, index) {
        button.classList.toggle("is-active", button.dataset.stageTarget === state.stageId);
        button.classList.toggle("is-done", index < activeIndex);
        button.disabled = state.mode === "challenge" && index > activeIndex;
      });
      document.querySelectorAll(".mystery-stage-panel[data-stage]").forEach(function (panel) {
        const active = panel.dataset.stage === state.stageId;
        panel.hidden = !active;
        panel.setAttribute("aria-hidden", active ? "false" : "true");
      });
      const primary = document.getElementById("mysteryPrimary");
      primary.querySelector("span:last-child").textContent = state.stageId === "challenge" ? "完成案卷" : "下一步";
      document.getElementById("mysteryPrev").disabled = activeIndex <= 0;
      renderHints();
      persist();
    }

    function goTo(nextStage, force) {
      if (!flow.some(function (item) { return item.id === nextStage; })) return;
      if (!force && state.mode === "challenge" && !state.interacted[state.stageId]) {
        setStatus("先完成一次选择或操作，再继续追踪。", "warn");
        return;
      }
      if (__currentStepper && __currentStepper.playing) __currentStepper.stop();
      state.stageId = nextStage;
      state.hintLevel = 0;
      setStatus("");
      render();
      workspace.scrollTo({ top: 0, behavior: settings.reducedMotion ? "auto" : "smooth" });
    }

    document.querySelectorAll(".mode-switch [data-mode]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.mode = button.dataset.mode;
        setStatus(state.mode === "director" ? "导演控制已展开，当前步骤保持不变。" : "闯关模式已开启，先操作再继续。", "ok");
        render();
      });
    });
    progress.addEventListener("click", function (event) {
      const button = event.target.closest("[data-stage-target]");
      if (!button || button.disabled) return;
      goTo(button.dataset.stageTarget, true);
    });
    document.getElementById("mysteryPrev").onclick = function () {
      goTo(core ? core.moveStage(state.stageId, -1) : flow[Math.max(0, flow.findIndex(function (item) { return item.id === state.stageId; }) - 1)].id, true);
    };
    document.getElementById("mysteryHint").onclick = function () {
      state.hintLevel = core ? core.nextHintLevel(state.hintLevel) : Math.min(2, state.hintLevel + 1);
      setStatus(state.hintLevel === 2 ? "最后一层线索已展开。" : "第一层线索已展开。", "ok");
      render();
    };
    document.getElementById("mysteryPrimary").onclick = function () {
      if (state.stageId === "challenge") {
        if (!Math5.hasStar(unitId, "game")) {
          setStatus("先完成独立破案并达到本章通过要求，再提交案卷。", "warn");
          return;
        }
        Math5.addStar(unitId, "case-complete", 1);
        setStatus("案卷已盖章。你可以换题再查一次，或进入下一份案卷。", "ok");
        Math5.refreshStars(unitId);
        rail.querySelector('.case-link[href="' + unitId + '.html"]').classList.add("is-complete");
        return;
      }
      goTo(core ? core.moveStage(state.stageId, 1) : flow[Math.min(flow.length - 1, flow.findIndex(function (item) { return item.id === state.stageId; }) + 1)].id, false);
    };
    document.getElementById("mysteryPause").onclick = function () {
      if (__currentStepper && __currentStepper.playing) __currentStepper.stop();
      setStatus("演示已暂停，当前证据保留。", "ok");
    };
    document.getElementById("mysteryAuto").onclick = function () {
      if (__currentStepper) {
        if (__currentStepper.playing) {
          __currentStepper.stop();
          setStatus("演示已暂停，当前证据保留。", "ok");
        } else {
          __currentStepper.play();
          setStatus("正在按课堂慢速逐笔播放；可随时暂停。", "ok");
        }
      } else setStatus("请先在中央选择一个演示案例。", "warn");
    };
    document.getElementById("mysteryHide").onclick = function () {
      state.answersHidden = !state.answersHidden;
      deck.classList.toggle("answers-hidden", state.answersHidden);
      document.getElementById("mysteryHide").querySelector("span:last-child").textContent = state.answersHidden ? "显示答案" : "隐藏答案";
      setStatus(state.answersHidden ? "答案与反馈已遮住。" : "答案与反馈已恢复。", "ok");
    };
    document.getElementById("mysteryShuffle").onclick = function () {
      if (labController && typeof labController.randomize === "function" && state.stageId === "brief") {
        labController.randomize();
        state.interacted.brief = false;
        setStatus("新证物已放上工作台。", "ok");
        return;
      }
      const active = deck.querySelector('[data-stage="' + state.stageId + '"]');
      const target = active && Array.from(active.querySelectorAll("button")).find(function (button) {
        const style = window.getComputedStyle ? window.getComputedStyle(button) : button.style;
        const isVisible = button.getClientRects().length > 0 && style.display !== "none" && style.visibility !== "hidden";
        return !button.disabled && isVisible && (/换|下一|重置|再来|新题/.test(button.textContent) || /Next|Reset|New/i.test(button.id));
      });
      if (target) {
        target.click();
        state.interacted[state.stageId] = false;
        setStatus("本步骤已更换一组证据。", "ok");
      } else setStatus("这一页没有备用题，先完成当前线索。", "warn");
    };
    document.getElementById("mysteryFullscreen").onclick = function () {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      else if (document.exitFullscreen) document.exitFullscreen();
    };
    document.getElementById("mysterySettings").onclick = function () {
      if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
    };
    const motionToggle = document.getElementById("reduceMotionToggle");
    motionToggle.checked = settings.reducedMotion;
    motionToggle.onchange = function () {
      settings.reducedMotion = motionToggle.checked;
      document.body.classList.toggle("reduce-motion", settings.reducedMotion);
      Math5.saveMysterySettings(settings);
    };
    document.getElementById("btnResetUnit").onclick = function () {
      if (!confirm("确定重置「" + currentCase.officialName + "（案卷：" + currentCase.caseName + "）」吗？原有教材进度会清空。")) return;
      Math5.resetUnit(unitId);
      const current = Math5.loadMysterySession();
      delete current.stages[unitId];
      delete current.hints[unitId];
      Math5.saveMysterySession(current);
      location.reload();
    };

    this.refreshStars(unitId);
    this.refreshWrongBadge();
    render();
  },

  /** 给跳转条上每个单元补上星星标记 */
  paintStripStars() {
    const d = this.load();
    document.querySelectorAll(".u-star[data-unit]").forEach(function (el) {
      const n = Object.keys(d.stars[el.dataset.unit] || {}).length;
      el.textContent = n > 0 ? "已封存" : "";
      el.className = "u-star" + (n > 0 ? " got" : "");
    });
  },

  /** 通用答题反馈 */
  showFeedback(el, ok, msg) {
    el.className = "feedback " + (ok ? "ok" : "no");
    el.textContent = (ok ? "✅ " : "❌ ") + msg;
  },

  /* ================= 错题本 ================= */

  loadWrong() {
    try { return JSON.parse(localStorage.getItem(this.WKEY)) || []; }
    catch (e) { return []; }
  },
  /** 答错的选择题自动入本（需要 q.q 文本 + q.opts 选项才收录，交互式题自动跳过） */
  addWrong(unitId, q) {
    if (!q || typeof q.q !== "string" || !Array.isArray(q.opts) || q.opts.length < 2) return;
    const list = this.loadWrong().filter(w => !(w.unit === unitId && w.q === q.q));
    list.push({ unit: unitId, q: q.q, opts: q.opts, ans: q.ans, why: q.why, t: Date.now() });
    if (list.length > 100) list.shift(); // 上限 100 题，旧的先淘汰
    try { localStorage.setItem(this.WKEY, JSON.stringify(list)); } catch (e) { /* 存储满则忽略 */ }
    this.refreshWrongBadge();
  },
  /** 答对重做后从错题本移除 */
  removeWrong(unitId, qText) {
    const list = this.loadWrong().filter(w => !(w.unit === unitId && w.q === qText));
    localStorage.setItem(this.WKEY, JSON.stringify(list));
    this.refreshWrongBadge();
  },
  clearWrong() {
    localStorage.removeItem(this.WKEY);
    this.refreshWrongBadge();
  },
  wrongCount() { return this.loadWrong().length; },

  /** 主页/单元页上的错题本角标（存在才显示） */
  refreshWrongBadge() {
    const n = this.wrongCount();
    document.querySelectorAll(".wrong-badge").forEach(el => {
      el.style.display = n > 0 ? "" : "none";
      el.textContent = n;
    });
  },
};

/** 分步演示器：管理步骤数组，控制上一步/下一步/自动演示 */
let __currentStepper = null; // 保证同一时刻只有一个演示在播放

function Stepper(steps, stageEl, onChange) {
  let idx = -1;
  let timer = null;

  function revealWritingSurface() {
    const target = stageEl.querySelector(".vsheet, .hw-card, .shift-card");
    const viewport = stageEl.closest(".case-stage-deck");
    if (!target || !viewport) return;
    const reveal = function () {
      const viewportRect = viewport.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const metrics = {
        scrollTop: viewport.scrollTop,
        clientHeight: viewport.clientHeight,
        targetTop: viewport.scrollTop + targetRect.top - viewportRect.top,
        targetHeight: targetRect.height,
        margin: 16,
      };
      const helper = window.MysteryCore && window.MysteryCore.revealScrollTop;
      const nextTop = helper ? helper(metrics) : Math.max(0, metrics.targetTop - metrics.margin);
      if (Math.abs(nextTop - viewport.scrollTop) < 2) return;
      viewport.scrollTo({
        top: nextTop,
        behavior: document.body.classList.contains("reduce-motion") ? "auto" : "smooth",
      });
    };
    if (window.requestAnimationFrame) window.requestAnimationFrame(reveal);
    else reveal();
  }

  function show() {
    stageEl.innerHTML = "";
    if (idx >= 0 && steps[idx].render) steps[idx].render(stageEl);
    if (idx >= 0 && steps[idx].explain && !stageEl.querySelector(".explain-bubble")) {
      const explanation = document.createElement("div");
      explanation.className = "explain-bubble";
      explanation.innerHTML = steps[idx].explain;
      stageEl.appendChild(explanation);
    }
    const ind = document.getElementById("stepIndicator");
    if (ind) ind.textContent = (idx + 1) + " / " + steps.length;
    if (onChange) onChange(idx);
    revealWritingSurface();
  }

  function syncPlayLabels(playing) {
    if (autoBtn) autoBtn.textContent = playing ? "⏸ 暂停演示" : "▶ 自动演示";
    const dockAuto = document.getElementById("mysteryAuto");
    const dockLabel = dockAuto && dockAuto.querySelector("span:last-child");
    if (dockLabel) dockLabel.textContent = playing ? "暂停演示" : "自动演示";
    if (dockAuto) dockAuto.setAttribute("aria-pressed", playing ? "true" : "false");
  }

  function stopTimer() {
    if (timer) { clearTimeout(timer); timer = null; }
    syncPlayLabels(false);
  }

  /* 自动演示按钮：插在步骤控制条里，所有单元页通用 */
  let autoBtn = null;
  try {
    const ind0 = document.getElementById("stepIndicator");
    const bar = ind0 ? ind0.closest(".step-controls") : null;
    if (bar) {
      const old = bar.querySelector(".auto-btn");
      if (old) old.remove(); // 换演示时防重复
      autoBtn = document.createElement("button");
      autoBtn.className = "btn blue auto-btn";
      autoBtn.textContent = "▶ 自动演示";
      bar.insertBefore(autoBtn, ind0);
    }
  } catch (e) { /* 不影响正常流程 */ }

  function delayForCurrent(override) {
    if (Number.isFinite(Number(override)) && Number(override) > 0) return Number(override);
    const stepDelay = idx >= 0 && steps[idx] ? Number(steps[idx].autoDelayMs) : 0;
    return Number.isFinite(stepDelay) && stepDelay >= 1000 ? stepDelay : 7000;
  }

  function scheduleNext(override) {
    const delay = delayForCurrent(override);
    timer = setTimeout(function () {
      timer = null;
      if (idx >= steps.length - 1) { stopTimer(); return; }
      idx++;
      show();
      scheduleNext(override);
    }, delay);
  }

  const api = {
    next() {
      stopTimer();
      if (idx < steps.length - 1) { idx++; show(); }
    },
    prev() {
      stopTimer();
      if (idx > 0) { idx--; show(); } else if (idx === 0) { idx = -1; show(); }
    },
    reset() { stopTimer(); idx = -1; show(); },
    /** 自动播放：等待本步逐笔书写完成，再留出阅读时间后推进。 */
    play(interval) {
      stopTimer();
      if (idx >= steps.length - 1) idx = -1; // 播完过就从头来
      if (idx < 0) { idx++; show(); }        // 点击后立刻演示第一步，不用干等
      syncPlayLabels(true);
      scheduleNext(interval);
    },
    stop() { stopTimer(); },
    get playing() { return !!timer; },
    get index() { return idx; },
    get total() { return steps.length; },
  };

  if (autoBtn) {
    autoBtn.onclick = () => {
      if (api.playing) { stopTimer(); return; }
      api.play();
    };
  }

  /* 新演示开始时，停掉上一个演示的播放 */
  if (__currentStepper && __currentStepper !== api && __currentStepper.playing) __currentStepper.stop();
  __currentStepper = api;

  /* 快捷键提示（悬停按钮可见） */
  const nb = document.getElementById("btnNext"), pb = document.getElementById("btnPrev");
  if (nb) nb.title = "快捷键：→ 或 空格";
  if (pb) pb.title = "快捷键：←";

  return api;
}

/* 键盘操作：→ / 空格 下一步，← 上一步，Esc 停止自动播放 */
document.addEventListener("keydown", function (e) {
  const tag = e.target && e.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
  if (!__currentStepper) return;
  if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); __currentStepper.next(); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); __currentStepper.prev(); }
  else if (e.key === "Escape" && __currentStepper.playing) { __currentStepper.stop(); }
});
