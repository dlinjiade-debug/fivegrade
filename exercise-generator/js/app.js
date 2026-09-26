(function (root) {
  "use strict";

  const Core = root.ExerciseGeneratorCore;
  const makeSteps = root.ExerciseBoardSteps;
  if (!Core) return;

  const byId = function (id) { return document.getElementById(id); };
  const dom = {
    unitTitle: byId("unitTitle"), unitDescription: byId("unitDescription"),
    questionCounter: byId("questionCounter"), bankCounter: byId("bankCounter"),
    problemLabel: byId("problemLabel"), questionText: byId("questionText"),
    pointTitle: byId("pointTitle"), pointDescription: byId("pointDescription"),
    pointStrategy: byId("pointStrategy"), board: document.querySelector(".blackboard"),
    boardStage: byId("boardStage"), chalkCanvas: byId("chalkCanvas"),
    stageTitle: byId("stageTitle"), stagePoint: byId("stagePoint"),
    boardCaption: byId("boardCaption"), boardProgress: byId("boardProgress"),
    analysisDetails: byId("analysisDetails"), answerText: byId("answerText"),
    analysisSteps: byId("analysisSteps"), commonError: byId("commonError"),
    studentAnswer: byId("studentAnswer"), answerInput: byId("answerInput"),
    answerFeedback: byId("answerFeedback"), submitAnswer: byId("submitAnswer"),
    previousQuestion: byId("previousQuestion"), hintToggle: byId("hintToggle"),
    newQuestion: byId("newQuestion"), continueBoard: byId("continueBoard")
  };

  const histories = Object.create(null);
  Core.unitOrder.forEach(function (id) { histories[id] = { items: [], cursor: -1 }; });
  const state = {
    unitId: Core.unitOrder[0], mode: "teacher", showHint: true,
    question: null, boardOpen: false, analysisReady: false, boardSteps: []
  };
  const chalkBoard = root.Chalk && makeSteps
    ? new root.Chalk.Board(dom.chalkCanvas, { reduceMotion: root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches })
    : null;

  function unitState() { return histories[state.unitId]; }

  function clearFeedback() {
    dom.answerFeedback.textContent = "";
    dom.answerFeedback.className = "answer-feedback";
    dom.answerInput.value = "";
  }

  function resetPresentation() {
    state.boardOpen = false;
    state.analysisReady = false;
    state.boardSteps = [];
    dom.boardStage.hidden = true;
    dom.board.classList.remove("is-demonstrating");
    dom.analysisDetails.hidden = true;
    dom.analysisDetails.open = false;
    if (chalkBoard) chalkBoard.clear();
    clearFeedback();
  }

  function showQuestion(question) {
    state.question = question;
    resetPresentation();
    render();
  }

  function newQuestion() {
    const history = unitState();
    if (history.cursor < history.items.length - 1) {
      history.cursor += 1;
      showQuestion(history.items[history.cursor]);
      return;
    }
    const next = Core.generateQuestion(state.unitId, history.items.length + 1);
    history.items.push(next);
    history.cursor = history.items.length - 1;
    showQuestion(next);
  }

  function fillAnalysis() {
    const question = state.question;
    const point = Core.pointFor(question.pointId);
    dom.answerText.textContent = question.answer;
    dom.analysisSteps.textContent = "";
    question.analysis.forEach(function (line) {
      const item = document.createElement("li");
      item.textContent = line;
      dom.analysisSteps.appendChild(item);
    });
    dom.commonError.textContent = point ? point.commonError : "代回原题核对。";
    dom.analysisDetails.hidden = !state.analysisReady;
  }

  function render() {
    const unit = Core.units[state.unitId];
    const question = state.question;
    const point = Core.pointFor(question.pointId);
    const history = unitState();
    const roundSize = Core.questionBank[state.unitId].length * Core.questionsPerRound;
    const roundNumber = Math.floor((question.sequence - 1) / roundSize) + 1;
    const roundPosition = ((question.sequence - 1) % roundSize) + 1;
    dom.unitTitle.textContent = unit.title;
    dom.unitDescription.textContent = unit.description;
    dom.questionCounter.textContent = "第 " + roundNumber + " 轮 · " + roundPosition + "/" + roundSize + " · " + question.difficulty;
    dom.bankCounter.textContent = Core.questionBank[state.unitId].length + " 类题型";
    dom.problemLabel.textContent = question.templateName;
    dom.questionText.textContent = question.prompt;
    dom.pointTitle.textContent = point ? point.title : "本题方法";
    dom.pointDescription.textContent = point ? point.description : "";
    dom.pointStrategy.textContent = state.showHint ? ((point && point.strategy) || question.hint || "") : "";
    dom.board.classList.toggle("hide-hint", !state.showHint);
    dom.stageTitle.textContent = unit.title;
    dom.stagePoint.textContent = point ? "☆ " + point.title : "";
    dom.boardCaption.hidden = !state.showHint;
    dom.studentAnswer.hidden = state.mode !== "student";
    dom.answerInput.inputMode = Number.isFinite(Number(question.answer)) ? "decimal" : "text";
    document.querySelectorAll("[data-mode]").forEach(function (button) {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    document.querySelectorAll("[data-unit]").forEach(function (button) {
      const active = button.dataset.unit === state.unitId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "true" : "false");
    });
    const boardIndex = chalkBoard ? chalkBoard.index : -1;
    dom.previousQuestion.textContent = state.boardOpen
      ? (boardIndex > 0 ? "← 上一步" : "← 返回题目")
      : "← 上一题";
    dom.previousQuestion.disabled = !state.boardOpen && history.cursor <= 0;
    dom.hintToggle.textContent = state.showHint ? "擦掉提示" : "显示提示";
    dom.hintToggle.setAttribute("aria-pressed", state.showHint ? "true" : "false");
    dom.newQuestion.textContent = history.cursor < history.items.length - 1 ? "→ 下一题" : "↻ 换例题";
    dom.continueBoard.textContent = state.boardOpen && chalkBoard && chalkBoard.atEnd()
      ? "↺ 重放板书" : "✎ 继续板书";
    fillAnalysis();
  }

  function fitBoardViewport() {
    if (!chalkBoard) return;
    const narrow = root.matchMedia && root.matchMedia("(max-width: 760px)").matches;
    const kind = state.question && state.question.board && state.question.board.kind;
    chalkBoard.svg.setAttribute("viewBox", narrow
      ? (kind === "lines" ? "130 0 850 720" : "270 0 770 720")
      : "0 0 1280 720");
  }

  function openBoard() {
    if (!chalkBoard) {
      state.analysisReady = true;
      render();
      return;
    }
    state.boardSteps = makeSteps(state.question);
    if (!state.boardSteps.length) {
      state.analysisReady = true;
      render();
      return;
    }
    chalkBoard.load(state.boardSteps);
    fitBoardViewport();
    chalkBoard.svg.setAttribute("aria-label", state.question.unitId === "simple-equations" ? "解方程逐行板书" : state.question.unitId === "decimal-division" ? "小数除法竖式逐笔板书" : "小数乘法竖式逐笔板书");
    state.boardOpen = true;
    dom.boardStage.hidden = false;
    dom.board.classList.add("is-demonstrating");
    chalkBoard.goto(0);
    render();
  }

  function advanceBoard() {
    if (!state.boardOpen) {
      openBoard();
      return;
    }
    if (chalkBoard.atEnd()) {
      state.analysisReady = false;
      dom.analysisDetails.open = false;
      chalkBoard.goto(0);
    } else {
      chalkBoard.next();
    }
    render();
  }

  function submitAnswer() {
    if (!state.question) return;
    const correct = Core.checkAnswer(state.question, dom.answerInput.value);
    dom.answerFeedback.className = "answer-feedback " + (correct ? "is-correct" : "is-incorrect");
    dom.answerFeedback.textContent = correct
      ? "答对了。可以继续看逐步板书。"
      : "再检查一遍；也可以继续看板书。";
    if (correct) {
      state.analysisReady = true;
      fillAnalysis();
    }
  }

  if (chalkBoard) {
    chalkBoard.on("step", function (event) {
      if (event.index < 0) return;
      dom.boardCaption.textContent = event.step.text;
      dom.boardProgress.textContent = (event.index + 1) + " / " + state.boardSteps.length;
      if (chalkBoard.atEnd()) state.analysisReady = true;
      render();
    });
  }

  document.querySelectorAll("[data-unit]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.unitId = button.dataset.unit;
      const history = unitState();
      if (history.cursor < 0) newQuestion();
      else showQuestion(history.items[history.cursor]);
    });
  });
  document.querySelectorAll("[data-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      state.mode = button.dataset.mode;
      render();
      if (state.mode === "student" && !state.boardOpen) dom.answerInput.focus();
    });
  });
  dom.previousQuestion.addEventListener("click", function () {
    if (state.boardOpen) {
      if (chalkBoard.index > 0) chalkBoard.prev();
      else {
        state.boardOpen = false;
        dom.boardStage.hidden = true;
        dom.board.classList.remove("is-demonstrating");
      }
      render();
      return;
    }
    const history = unitState();
    if (history.cursor <= 0) return;
    history.cursor -= 1;
    showQuestion(history.items[history.cursor]);
  });
  dom.newQuestion.addEventListener("click", newQuestion);
  dom.hintToggle.addEventListener("click", function () {
    state.showHint = !state.showHint;
    render();
  });
  dom.continueBoard.addEventListener("click", advanceBoard);
  dom.submitAnswer.addEventListener("click", submitAnswer);
  dom.answerInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") submitAnswer();
  });
  root.addEventListener("resize", function () { if (state.boardOpen) fitBoardViewport(); });

  newQuestion();
})(typeof window !== "undefined" ? window : globalThis);
