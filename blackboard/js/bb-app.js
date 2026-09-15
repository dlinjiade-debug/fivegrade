/* ==========================================================================
 *  bb-app.js —— 粉笔小闯关 · 页面逻辑
 *  ------------------------------------------------------------------
 *  两件事：
 *    ① 关卡地图（index.html）：进度、印章、续玩
 *    ② 关卡页（level.html）：阶段一「黑板讲解」→ 阶段二「闯关练习」
 *
 *  所有会算的东西都在 bb-core.js 里（纯函数、有单测）；这里只管 DOM。
 * ========================================================================== */
(function (root) {
  "use strict";

  const BB = root.BB;
  const Levels = root.BBLevels;
  const Chalk = root.Chalk;

  if (root.HW && BB && BB.setGlyphEngine) BB.setGlyphEngine(root.HW);

  const App = {};

  /* ================================================================== *
   *  1. 进度存档
   * ================================================================== */
  const STORE_KEY = "bb-progress-v1";

  function readProgress() {
    try {
      const raw = root.localStorage && root.localStorage.getItem(STORE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      return data && typeof data === "object" ? data : {};
    } catch (e) {
      return {};
    }
  }

  function writeProgress(data) {
    try {
      if (root.localStorage) root.localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) { /* 隐私模式下写不进去，不影响使用 */ }
  }

  function markLevel(id, patch) {
    const all = readProgress();
    all[id] = Object.assign({}, all[id] || {}, patch, { at: Date.now() });
    writeProgress(all);
    return all;
  }

  function clearProgress() {
    try {
      if (root.localStorage) root.localStorage.removeItem(STORE_KEY);
    } catch (e) { /* 同上 */ }
  }

  function isDone(all, id) {
    return !!(all[id] && all[id].done);
  }

  /** 下一关该玩哪一关：第一关没通关的 */
  function nextLevelNo(all) {
    for (let i = 0; i < Levels.LEVELS.length; i += 1) {
      if (!isDone(all, Levels.LEVELS[i].id)) return i + 1;
    }
    return Levels.LEVELS.length;
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function param(name) {
    const m = new RegExp("[?&]" + name + "=([^&#]*)").exec(root.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
  }

  /* ================================================================== *
   *  2. 关卡地图
   * ================================================================== */
  App.renderMap = function () {
    const all = readProgress();
    const grid = document.getElementById("mapGrid");
    const resume = document.getElementById("resumeBtn");
    const bar = document.getElementById("mapProgress");
    const lab = document.getElementById("mapProgressLabel");

    const doneCount = Levels.LEVELS.filter(function (l) { return isDone(all, l.id); }).length;
    if (bar) bar.style.width = Math.round((doneCount / Levels.LEVELS.length) * 100) + "%";
    if (lab) lab.textContent = "已通关 " + doneCount + " / " + Levels.LEVELS.length + " 关";

    if (resume) {
      const no = nextLevelNo(all);
      resume.textContent = doneCount === 0 ? "从第 1 关开始" : "继续第 " + no + " 关";
      resume.setAttribute("href", "./level.html?no=" + no);
    }

    if (!grid) return;
    grid.innerHTML = "";

    Levels.LEVELS.forEach(function (lv) {
      const done = isDone(all, lv.id);
      const rec = all[lv.id] || {};
      const card = el("a", "bb-card" + (done ? " done" : ""));
      card.href = "./level.html?no=" + lv.no;

      card.appendChild(el("div", "bb-card-no", "第 " + lv.no + " 关"));
      card.appendChild(el("h3", null, lv.title));
      card.appendChild(el("p", null, lv.sub));

      const foot = el("div", "bb-card-foot");
      const meta = el("span", "bb-locked",
        lv.steps.length + " 步讲解 · " + lv.practice.length + " 道练习");
      foot.appendChild(meta);
      if (done) {
        const seal = el("span", "bb-seal",
          rec.correct != null ? "✔ " + rec.correct + "/" + rec.total : "已通关");
        foot.appendChild(seal);
      } else if (rec.steps) {
        foot.appendChild(el("span", "bb-locked", "看到第 " + rec.steps + " 步"));
      }
      card.appendChild(foot);
      grid.appendChild(card);
    });

    const clearBtn = document.getElementById("clearBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (root.confirm("清空所有闯关进度，重新开始？这一步没法撤销。")) {
          clearProgress();
          App.renderMap();
        }
      });
    }
  };

  /* ================================================================== *
   *  3. 关卡页
   * ================================================================== */
  const PHASE = { TEACH: "teach", PRACTICE: "practice", DONE: "done" };

  App.startLevel = function () {
    const byNo = param("no") || param("id");
    const level = /^\d+$/.test(String(byNo))
      ? Levels.levelByNo(byNo)
      : Levels.levelById(byNo);
    const host = document.getElementById("boardHost");
    if (!host) return;
    if (!level) {
      host.innerHTML = "<p style='padding:40px'>找不到这一关，<a href='./index.html'>回到关卡地图</a>。</p>";
      return;
    }

    document.title = "第 " + level.no + " 关 · " + level.title + " —— 粉笔小闯关";
    fillLevelHeader(level);

    const board = new Chalk.Board(host, { reduceMotion: App.prefersReducedMotion() });
    board.load(level.steps);

    const ui = {
      board: board,
      level: level,
      step: 0,
      phase: PHASE.TEACH,
      auto: false,
      autoTimer: null,
      qIndex: 0,
      correct: 0,
      wrong: [],
      peeked: 0,
      inputs: [],
      locked: false,
    };

    /* ---- 字幕与控制 ---- */
    const cText = document.getElementById("capText");
    const cTip = document.getElementById("capTip");
    const dots = document.getElementById("stepDots");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const replayBtn = document.getElementById("replayBtn");
    const autoBtn = document.getElementById("autoBtn");
    const startBtn = document.getElementById("startPractice");
    const phaseTag = document.getElementById("phaseTag");

    dots.innerHTML = "";
    level.steps.forEach(function (s, i) {
      const d = el("button", "bb-dot");
      d.type = "button";
      d.title = "第 " + (i + 1) + " 步";
      d.setAttribute("aria-label", "跳到第 " + (i + 1) + " 步");
      d.addEventListener("click", function () { goTo(i); });
      dots.appendChild(d);
    });

    function paint() {
      const step = level.steps[ui.step];
      cText.textContent = step.text || "";
      cTip.textContent = step.tip || "";
      cTip.style.display = step.tip ? "" : "none";

      const dots0 = dots.children;
      for (let i = 0; i < dots0.length; i += 1) {
        dots0[i].className = "bb-dot" + (i < ui.step ? " done" : "") + (i === ui.step ? " cur" : "");
      }
      prevBtn.disabled = ui.step <= 0;
      const last = ui.step >= level.steps.length - 1;
      nextBtn.disabled = last;
      nextBtn.style.display = last ? "none" : "";
      startBtn.style.display = last ? "" : "none";
      if (phaseTag) phaseTag.textContent = "阶段一 · 讲解";
    }

    function stopAuto() {
      ui.auto = false;
      if (ui.autoTimer) { clearTimeout(ui.autoTimer); ui.autoTimer = null; }
      if (autoBtn) { autoBtn.classList.remove("on"); autoBtn.textContent = "自动讲解"; }
    }

    function goTo(i, instant) {
      ui.step = Math.max(0, Math.min(level.steps.length - 1, i));
      if (ui.step !== i) stopAuto();
      paint();
      board.goto(ui.step, { instant: !!instant });
      markLevel(level.id, { steps: ui.step + 1, seen: true });
    }

    board.on("done", function () {
      if (!ui.auto || ui.phase !== PHASE.TEACH) return;
      if (ui.step >= level.steps.length - 1) { stopAuto(); return; }
      ui.autoTimer = setTimeout(function () { goTo(ui.step + 1); }, 1400);
    });

    prevBtn.addEventListener("click", function () { stopAuto(); goTo(ui.step - 1, true); });
    nextBtn.addEventListener("click", function () { stopAuto(); goTo(ui.step + 1); });
    replayBtn.addEventListener("click", function () { stopAuto(); board.replay(); });
    if (autoBtn) {
      autoBtn.addEventListener("click", function () {
        if (ui.auto) { stopAuto(); return; }
        ui.auto = true;
        autoBtn.classList.add("on");
        autoBtn.textContent = "暂停讲解";
        if (ui.step >= level.steps.length - 1) goTo(0);
        else board.replay();
      });
    }

    startBtn.addEventListener("click", function () { enterPractice(); });

    /* ---- 阶段二：练习 ---- */
    const practicePanel = document.getElementById("practicePanel");
    const practiceWrap = document.getElementById("practice");

    function enterPractice() {
      stopAuto();
      ui.phase = PHASE.PRACTICE;
      ui.qIndex = 0;
      ui.correct = 0;
      ui.wrong = [];
      ui.peeked = 0;
      if (phaseTag) phaseTag.textContent = "阶段二 · 闯关练习";
      practiceWrap.hidden = false;
      practiceWrap.scrollIntoView({ behavior: "smooth", block: "start" });
      renderQuestion();
      markLevel(level.id, { steps: level.steps.length, seen: true, practice: true });
    }

    /* 当前题的反馈区 / 操作区，judge 里要用 */
    let fbBox = null;
    let actsBox = null;

    function renderQuestion() {
      const q = level.practice[ui.qIndex];
      ui.locked = false;
      ui.inputs = [];
      practicePanel.innerHTML = "";

      const head = el("div", "bb-qhead");
      head.appendChild(el("span", "bb-qno", "第 " + (ui.qIndex + 1) + " / " + level.practice.length + " 题"));
      head.appendChild(el("span", "bb-qtype", typeName(q.type)));
      const score = el("span", "bb-score", "已答对 " + ui.correct + " 题");
      head.appendChild(score);
      practicePanel.appendChild(head);

      let body;
      if (q.type === "choice") body = renderChoice(q, practicePanel);
      else if (q.type === "vf") body = renderVf(q, practicePanel);
      else body = renderFill(q, practicePanel);

      fbBox = el("div", "bb-feedback");
      fbBox.hidden = true;
      practicePanel.appendChild(fbBox);

      actsBox = el("div", "bb-acts");
      practicePanel.appendChild(actsBox);

      if (q.type === "choice" || q.type === "vf") {
        /* 选了就直接判定，控制条只留「看答案」 */
        actsBox.appendChild(makePeek(q, body));
      } else {
        const submit = el("button", "bb-btn primary", "提交答案");
        submit.type = "button";
        submit.addEventListener("click", function () { judge(q, body.value(), body); });
        actsBox.appendChild(submit);
        body.node.addEventListener("keydown", function (e) {
          if (e.key === "Enter") { e.preventDefault(); judge(q, body.value(), body); }
        });
      }
    }

    function typeName(t) {
      return t === "choice" ? "选择题" : (t === "vf" ? "判断题" : "填空题");
    }

    function makePeek(q, body) {
      const peek = el("button", "bb-btn ghost", "看答案");
      peek.type = "button";
      peek.addEventListener("click", function () {
        if (ui.locked) return;
        ui.locked = true;
        ui.peeked += 1;
        if (body.reveal) body.reveal();
        showFeedback(false, q, "（这道题看了答案，不算答对）");
        finishQuestion(body);
      });
      return peek;
    }

    function showFeedback(ok, q, extra) {
      fbBox.hidden = false;
      fbBox.className = "bb-feedback" + (ok ? "" : " no");
      fbBox.innerHTML = "";
      fbBox.appendChild(el("b", null, ok ? "✔ 答对了！" : "✗ 再想想"));
      fbBox.appendChild(el("div", null, (extra ? extra + " " : "") + (q.why || "")));
    }

    function judge(q, value, body) {
      if (ui.locked) return;
      const res = BB.gradeQuestion(q, value);
      if (!res.answered) {
        showFeedback(false, { why: "还没填完呢，先把每个空都写上。" }, "");
        return;
      }
      ui.locked = true;
      if (body.paint) body.paint(res);

      if (res.ok) {
        ui.correct += 1;
        showFeedback(true, q, "");
        finishQuestion(body);
        return;
      }

      ui.wrong.push(q.id);
      const which = res.flags
        .map(function (f, i) { return f ? null : (i + 1); })
        .filter(function (v) { return v != null; });
      const hint = which.length && q.blanks
        ? "第 " + which.join("、") + " 个空还不对。"
        : "答案还不对。";
      showFeedback(false, q, hint);

      actsBox.innerHTML = "";
      const again = el("button", "bb-btn primary", "再试一次");
      again.type = "button";
      again.addEventListener("click", function () {
        ui.locked = false;
        fbBox.hidden = true;
        actsBox.innerHTML = "";
        if (q.type === "choice" || q.type === "vf") {
          if (body.reset) body.reset();
          actsBox.appendChild(makePeek(q, body));
        } else {
          const submit = el("button", "bb-btn primary", "提交答案");
          submit.type = "button";
          submit.addEventListener("click", function () { judge(q, body.value(), body); });
          actsBox.appendChild(submit);
          if (body.reFocus) body.reFocus();
        }
      });
      const peek = el("button", "bb-btn ghost", "看答案");
      peek.type = "button";
      peek.addEventListener("click", function () {
        ui.peeked += 1;
        if (body.reveal) body.reveal();
        showFeedback(false, q, "（看过答案的题不算答对）");
        finishQuestion(body);
      });
      actsBox.appendChild(again);
      actsBox.appendChild(peek);
    }

    function finishQuestion(body) {
      actsBox.innerHTML = "";
      const next = el("button", "bb-btn primary",
        ui.qIndex >= level.practice.length - 1 ? "查看闯关结果" : "下一题");
      next.type = "button";
      next.addEventListener("click", function () {
        if (ui.qIndex >= level.practice.length - 1) finishLevel();
        else { ui.qIndex += 1; renderQuestion(); }
      });
      actsBox.appendChild(next);
      next.focus();
    }

    /* ---- 三种题型的渲染 ---- */
    function makeInput(blank, index) {
      const box = el("input", "bb-input");
      box.type = "text";
      const numeric = /\d/.test(String(blank.answer));
      box.inputMode = numeric ? "decimal" : "text";
      if (!numeric && String(blank.answer).length <= 2) box.classList.add("short");
      box.autocomplete = "off";
      box.placeholder = numeric ? "?" : "…";
      box.setAttribute("aria-label", "第 " + (index + 1) + " 个空");
      ui.inputs.push(box);
      return box;
    }

    function renderFill(q, mount) {
      const stem = el("div", "bb-stem");
      const boxes = [];

      if (q.rows) {
        const rows = el("div", "bb-rows");
        q.rows.forEach(function (r, i) {
          const row = el("div", "bb-row");
          row.appendChild(el("span", "bb-pre", r.pre));
          const box = makeInput(q.blanks[i], i);
          row.appendChild(box);
          boxes.push(box);
          row.appendChild(el("span", "bb-post", r.post));
          rows.appendChild(row);
        });
        stem.appendChild(rows);
      } else {
        const parts = String(q.stem).split("{}");
        parts.forEach(function (p, i) {
          if (p) stem.appendChild(document.createTextNode(p));
          if (i < parts.length - 1) {
            const box = makeInput(q.blanks[i], i);
            stem.appendChild(box);
            boxes.push(box);
          }
        });
      }
      mount.appendChild(stem);

      return {
        node: stem,
        value: function () { return { blanks: boxes.map(function (b) { return b.value; }) }; },
        paint: function (res) {
          boxes.forEach(function (b, i) {
            b.classList.toggle("ok", !!res.flags[i]);
            b.classList.toggle("no", !res.flags[i]);
            b.readOnly = true;
          });
        },
        reveal: function () {
          boxes.forEach(function (b, i) {
            b.value = String(q.blanks[i].answer);
            b.classList.remove("no");
            b.classList.add("ok");
            b.readOnly = true;
          });
        },
        reFocus: function () {
          boxes.forEach(function (b) {
            b.classList.remove("ok", "no", "no");
            b.readOnly = false;
          });
          if (boxes[0]) boxes[0].focus();
        },
      };
    }

    function renderChoice(q, mount) {
      const wrap = el("div", "bb-options");
      const btns = [];
      const api = {};
      q.options.forEach(function (opt, i) {
        const b = el("button", "bb-opt");
        b.type = "button";
        b.appendChild(el("span", "bb-key", String.fromCharCode(65 + i)));
        b.appendChild(el("span", null, opt));
        b.addEventListener("click", function () {
          if (ui.locked) return;
          btns.forEach(function (x) { x.classList.remove("no"); });
          b.classList.add("no");
          judge(q, { choice: i }, api);
        });
        wrap.appendChild(b);
        btns.push(b);
      });
      mount.appendChild(wrap);

      api.node = wrap;
      api.value = function () { return {}; };
      api.paint = function () {
        btns.forEach(function (b, i) {
          b.disabled = true;
          if (i === q.answer) { b.classList.add("ok"); b.classList.remove("no"); }
          else b.classList.add("dim");
        });
      };
      api.reveal = function () {
        btns.forEach(function (b, i) {
          b.disabled = true;
          b.classList.toggle("ok", i === q.answer);
          b.classList.remove("no");
        });
      };
      api.reset = function () {
        btns.forEach(function (b) {
          b.disabled = false;
          b.classList.remove("ok", "no", "dim");
        });
      };
      return api;
    }

    function renderVf(q, mount) {
      const wrap = el("div", "bb-judge");
      const yes = el("button", "bb-btn", "✓ 对");
      const no = el("button", "bb-btn", "✗ 错");
      yes.type = "button"; no.type = "button";
      wrap.appendChild(yes); wrap.appendChild(no);
      mount.appendChild(wrap);

      const api = { node: wrap, value: function () { return {}; } };
      api.paint = function () {
        yes.disabled = true; no.disabled = true;
        yes.classList.remove("no"); no.classList.remove("no");
        (q.answer ? yes : no).classList.add("ok");
      };
      api.reveal = function () {
        yes.disabled = true; no.disabled = true;
        yes.classList.remove("no"); no.classList.remove("no");
        (q.answer ? yes : no).classList.add("ok");
      };
      api.reset = function () {
        yes.disabled = false; no.disabled = false;
        yes.classList.remove("ok", "no"); no.classList.remove("ok", "no");
      };
      yes.addEventListener("click", function () {
        if (ui.locked) return;
        no.classList.remove("no"); yes.classList.add("no");
        judge(q, { vf: true }, api);
      });
      no.addEventListener("click", function () {
        if (ui.locked) return;
        yes.classList.remove("no"); no.classList.add("no");
        judge(q, { vf: false }, api);
      });
      return api;
    }

    /* ---- 通关结算 ---- */
    function finishLevel() {
      ui.phase = PHASE.DONE;
      const total = level.practice.length;
      const passed = ui.correct >= Math.ceil(total * 0.8);
      const all = markLevel(level.id, {
        done: passed, correct: ui.correct, total: total, seen: true, practice: true,
      });
      if (phaseTag) phaseTag.textContent = "本关结束";

      practicePanel.innerHTML = "";
      const box = el("div", "bb-result");
      box.appendChild(el("div", "bb-seal-big", passed ? "闯关成功" : "再来一次"));
      const p = el("p", null,
        "这一关 " + total + " 道题，一次就答对 " + ui.correct + " 道" +
        (ui.peeked ? "，有 " + ui.peeked + " 道看了答案" : "") + "。");
      box.appendChild(p);
      if (!passed) {
        box.appendChild(el("p", null, "答对 8 成以上才算通关，回去看看黑板上的讲解再试一次吧。"));
      } else if (level.no < Levels.LEVELS.length) {
        box.appendChild(el("p", null, "下一关：第 " + (level.no + 1) + " 关 " + Levels.LEVELS[level.no].title + "。"));
      } else {
        box.appendChild(el("p", null, "八关全部通关，小数的乘法你已经拿下啦！"));
      }

      const acts = el("div", "bb-acts");
      const againP = el("button", "bb-btn", "重做本关练习");
      againP.type = "button";
      againP.addEventListener("click", function () { enterPractice(); });
      acts.appendChild(againP);

      const backT = el("button", "bb-btn", "重看黑板讲解");
      backT.type = "button";
      backT.addEventListener("click", function () {
        practiceWrap.hidden = true;
        ui.phase = PHASE.TEACH;
        goTo(0);
      });
      acts.appendChild(backT);

      if (level.no < Levels.LEVELS.length) {
        const nx = el("a", "bb-btn primary", "进入第 " + (level.no + 1) + " 关");
        nx.href = "./level.html?no=" + (level.no + 1);
        acts.appendChild(nx);
      } else {
        const mp = el("a", "bb-btn primary", "回到关卡地图");
        mp.href = "./index.html";
        acts.appendChild(mp);
      }
      box.appendChild(acts);
      practicePanel.appendChild(box);

      const totalDone = Levels.LEVELS.filter(function (l) { return isDone(all, l.id); }).length;
      void totalDone;
    }

    /* ---- 键盘 ---- */
    document.addEventListener("keydown", function (e) {
      if (ui.phase !== PHASE.TEACH) return;
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        stopAuto();
        if (ui.step < level.steps.length - 1) goTo(ui.step + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stopAuto();
        goTo(ui.step - 1, true);
      } else if (e.key === "r" || e.key === "R") {
        stopAuto();
        board.replay();
      }
    });

    goTo(0);

    /* 深链接：level.html?no=6&step=3 直接跳到第 3 步（老师上课点到哪一步很方便） */
    const wantStep = parseInt(param("step"), 10);
    if (wantStep >= 1) goTo(wantStep - 1, true);
  };

  function fillLevelHeader(level) {
    const noBox = document.getElementById("lvNo");
    const tBox = document.getElementById("lvTitle");
    const subBox = document.getElementById("lvSub");
    const goalBox = document.getElementById("lvGoal");
    const keysBox = document.getElementById("lvKeys");
    const unitBox = document.getElementById("lvUnit");
    if (noBox) noBox.textContent = "第 " + level.no + " 关";
    if (tBox) tBox.textContent = level.title;
    if (subBox) subBox.textContent = level.sub;
    if (goalBox) goalBox.textContent = level.goal;
    if (unitBox) unitBox.textContent = level.unit;
    if (keysBox) {
      keysBox.innerHTML = "";
      level.keys.forEach(function (k) { keysBox.appendChild(el("li", null, k)); });
    }
  }

  App.prefersReducedMotion = function () {
    return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
  };

  root.BBApp = App;
})(typeof window !== "undefined" ? window : globalThis);
