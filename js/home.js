(function () {
  "use strict";

  const core = window.MysteryCore;
  if (!core || typeof Math5 === "undefined") return;

  const session = Math5.loadMysterySession();
  const settings = Math5.loadMysterySettings();
  const grid = document.getElementById("caseGrid");
  const resume = document.getElementById("resumeCard");
  const wrongSection = document.getElementById("wrongFiles");
  const wrongList = document.getElementById("wrongList");

  document.body.dataset.mode = session.mode;
  document.body.classList.toggle("reduce-motion", settings.reducedMotion);

  function renderMode() {
    document.querySelectorAll(".mode-switch [data-mode]").forEach(function (button) {
      const active = button.dataset.mode === session.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  document.querySelectorAll(".mode-switch [data-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
      session.mode = core.normalizeMode(button.dataset.mode);
      Math5.saveMysterySession(session);
      document.body.dataset.mode = session.mode;
      renderMode();
    });
  });

  function renderCases() {
    grid.innerHTML = "";
    core.CASES.forEach(function (item) {
      const done = Math5.isUnitComplete(item.id);
      const link = document.createElement("a");
      link.className = "home-case-card" + (done ? " is-complete" : "");
      link.href = item.id + ".html";
      link.innerHTML = '<span class="case-number">' + item.num + '</span><div><h3>' + item.officialName + '</h3><p>案卷主题 · ' + item.caseName + '</p></div>' +
        '<span class="file-status">' + (done ? "案卷已盖章" : "等待侦破") + '</span>';
      grid.appendChild(link);
    });

    const current = core.CASES.find(function (item) { return item.id === session.lastUnitId; }) || core.CASES[0];
    const stageId = session.stages[current.id] || "brief";
    const stage = core.FLOW_STAGES.find(function (item) { return item.id === stageId; }) || core.FLOW_STAGES[0];
    resume.innerHTML = '<div><small>继续上次 · ' + stage.label + '</small><h3>' + current.officialName + '</h3><p>案卷主题 · ' + current.caseName + '　' + current.question + '</p></div>' +
      '<a href="' + current.id + '.html">继续追踪</a>';
  }

  function createButton(label, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className || "btn";
    button.textContent = label;
    return button;
  }

  function renderOptions(host, wrong, options, answer, onCorrect) {
    const choices = document.createElement("div");
    choices.className = "wb-opts";
    options.forEach(function (option, index) {
      const button = createButton(option, "btn-opt");
      button.onclick = function () {
        if (index === answer) {
          button.classList.add("correct");
          Array.from(choices.children).forEach(function (item) { item.disabled = true; });
          window.setTimeout(onCorrect, settings.reducedMotion ? 0 : 420);
        } else {
          button.classList.add("wrong");
          window.setTimeout(function () { button.classList.remove("wrong"); }, settings.reducedMotion ? 0 : 650);
        }
      };
      choices.appendChild(button);
    });
    host.appendChild(choices);
  }

  function renderWrongCard(wrong) {
    const unit = core.CASES.find(function (item) { return item.id === wrong.unit; }) || core.CASES[0];
    const card = document.createElement("article");
    card.className = "wb-item";

    const head = document.createElement("div");
    head.className = "wb-head";
    const identity = document.createElement("span");
    identity.className = "wb-unit";
    identity.innerHTML = '<b>' + unit.officialName + '</b><small>案卷主题 · ' + unit.caseName + '</small>';
    const chip = document.createElement("span");
    chip.className = "wb-chip";
    chip.textContent = core.inferWrongCause(wrong.q);
    const question = document.createElement("div");
    question.className = "wb-q";
    question.textContent = wrong.q;
    head.appendChild(identity);
    head.appendChild(chip);
    head.appendChild(question);
    card.appendChild(head);

    const flow = document.createElement("div");
    flow.className = "wrong-flow-label";
    flow.textContent = "1 回看提示  ·  2 重做原题  ·  3 完成变式";
    card.appendChild(flow);

    const action = document.createElement("div");
    action.className = "wrong-action";
    card.appendChild(action);

    const review = createButton("回看关键提示", "btn-opt");
    review.onclick = function () {
      action.innerHTML = "";
      const note = document.createElement("p");
      note.className = "why-card";
      note.textContent = wrong.why || ("先检查“" + core.inferWrongCause(wrong.q) + "”，再重新判断。");
      const retry = createButton("重做原题", "btn-opt");
      retry.onclick = function () {
        action.innerHTML = "";
        renderOptions(action, wrong, wrong.opts, wrong.ans, function () {
          action.innerHTML = "";
          const variantLabel = document.createElement("p");
          variantLabel.className = "wrong-flow-label";
          variantLabel.textContent = "变式追问：选项顺序改变后，哪一个仍能使原题成立？";
          action.appendChild(variantLabel);
          const variant = core.rotateOptions(wrong.opts, wrong.ans);
          renderOptions(action, wrong, variant.options, variant.answer, function () {
            Math5.removeWrong(wrong.unit, wrong.q);
            action.innerHTML = '<div class="wb-done">错因已查清，案卷归档。</div>';
            window.setTimeout(renderWrong, settings.reducedMotion ? 0 : 900);
          });
        });
      };
      action.appendChild(note);
      action.appendChild(retry);
    };
    action.appendChild(review);
    return card;
  }

  function renderWrong() {
    const list = Math5.loadWrong().slice().reverse();
    wrongSection.hidden = !list.length;
    wrongList.innerHTML = "";
    list.forEach(function (wrong) { wrongList.appendChild(renderWrongCard(wrong)); });
    Math5.refreshWrongBadge();
  }

  const settingsDialog = document.getElementById("homeSettingsDialog");
  document.getElementById("homeSettings").onclick = function () {
    if (settingsDialog.showModal) settingsDialog.showModal(); else settingsDialog.setAttribute("open", "");
  };
  document.getElementById("homeFullscreen").onclick = function () {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };
  const motionToggle = document.getElementById("homeReduceMotion");
  motionToggle.checked = settings.reducedMotion;
  motionToggle.onchange = function () {
    settings.reducedMotion = motionToggle.checked;
    document.body.classList.toggle("reduce-motion", settings.reducedMotion);
    Math5.saveMysterySettings(settings);
  };
  document.getElementById("btnResetAll").onclick = function () {
    if (!confirm("确定重置全部九份案卷的完成进度吗？错因档案会保留。")) return;
    Math5.resetAll();
    renderCases();
    settingsDialog.close();
  };
  document.getElementById("btnClearWrong").onclick = function () {
    if (!confirm("确定清空全部错因档案吗？")) return;
    Math5.clearWrong();
    renderWrong();
  };

  window.refreshHomeProgress = renderCases;
  renderMode();
  renderCases();
  renderWrong();
})();
