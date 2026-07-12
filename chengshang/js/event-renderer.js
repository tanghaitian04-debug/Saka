(function () {
  "use strict";

  var elements = {};
  var currentHandlers = null;
  var dialogueLines = [];
  var dialogueIndex = 0;
  var currentEvent = null;
  var currentState = null;
  var autoTimer = null;

  function clearAutoTimer() {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
  }

  function init(map) {
    elements = map;
    if (elements.subtitlePanel) {
      elements.subtitlePanel.addEventListener("click", function () {
        if (window.ChengshangSubtitles.skip()) return;
      });
    }
  }

  function formatDate(date) {
    if (!date) return "时间不详";
    var match = String(date).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    return match ? match[1] + "年" + Number(match[2]) + "月" + Number(match[3]) + "日" : date;
  }

  function specialtySummary(state) {
    return Object.keys(state.specialty).slice(0, 3).map(function (key) {
      return key + " " + state.specialty[key];
    }).join(" · ");
  }

  function renderStats(state, changes) {
    if (!elements.stats) return;
    elements.stats.innerHTML = "";
    var stats = [
      ["血量", state.stats.hp, "hp"],
      ["精神", state.stats.mental, "mental"],
      ["物资", state.stats.supplies, "supplies"]
    ];
    stats.forEach(function (stat) {
      var item = document.createElement("div");
      item.className = "hud-stat hud-stat--" + stat[2];
      var changed = (changes || []).find(function (change) { return change.key === stat[2]; });
      if (changed) item.classList.add(changed.delta < 0 ? "is-loss" : "is-gain");
      item.innerHTML = "<span>" + stat[0] + "</span><strong>" + stat[1] + "</strong>";
      elements.stats.appendChild(item);
    });
    if (elements.specialty) elements.specialty.textContent = specialtySummary(state);
    if (elements.task) elements.task.textContent = state.currentTask || "完成当前事件";
    document.body.classList.toggle("is-low-health", state.stats.hp > 0 && state.stats.hp < 30);
  }

  function renderImage(event) {
    if (!elements.image || !elements.imageFallback) return;
    elements.image.classList.remove("is-loaded");
    elements.imageFallback.hidden = true;
    elements.image.alt = event.title + "：" + event.location;
    elements.image.onload = function () {
      elements.image.classList.add("is-loaded");
      elements.imageFallback.hidden = true;
    };
    elements.image.onerror = function () {
      elements.image.removeAttribute("src");
      elements.imageFallback.hidden = false;
      elements.imageFallback.textContent = "场景图暂时无法载入 · " + event.location;
    };
    if (event.image) elements.image.src = event.image;
    else elements.image.onerror();
  }

  function createButton(label, className, action, disabled) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.disabled = !!disabled;
    button.addEventListener("click", action);
    return button;
  }

  function choiceLabel(choice, index) {
    return String.fromCharCode(65 + index) + "　" + choice.text;
  }

  function renderChoices(event, state) {
    elements.controls.innerHTML = "";
    var heading = document.createElement("p");
    heading.className = "interaction-heading";
    var labels = {
      choice: "作出决定",
      route: "选择路线",
      priority: "确定优先顺序",
      resource: "提交分配方案",
      item: "决定携带物件",
      triage: "安排伤员救治顺序",
      intel: "判断情报真伪与用途",
      map: "选择地图节点与路线",
      rescue: "在有限条件下安排救援",
      "dialogue-choice": "选择回应态度",
      evacuation: "安排多步骤撤离",
      crisis: "危机决策",
      climax: "不可逆选择"
    };
    heading.textContent = labels[event.type] || "选择行动";
    elements.controls.appendChild(heading);

    var list = document.createElement("div");
    list.className = "event-options event-options--" + event.type;
    (event.choices || []).forEach(function (choice, index) {
      var allowed = window.ChengshangState.requirementsMet(state, choice.requirements || []);
      var button = createButton(choiceLabel(choice, index), "event-option", function () {
        currentHandlers.onChoice(choice);
      }, !allowed);
      if (!allowed) {
        var reason = choice.lockedReason || "当前属性或物资不足";
        button.title = reason;
        button.setAttribute("aria-label", choice.text + "，不可选择：" + reason);
      }
      if (event.type === "route") button.dataset.route = String(index + 1);
      list.appendChild(button);
    });
    elements.controls.appendChild(list);
  }

  function renderContinue(event) {
    elements.controls.innerHTML = "";
    var label = event.type === "archive" ? "收起档案并继续" : event.type === "transition" ? "进入下一阶段" : "继续";
    elements.controls.appendChild(createButton(label, "event-continue", function () {
      currentHandlers.onContinue();
    }));
  }

  function revealControls() {
    if (!currentEvent) return;
    clearAutoTimer();
    var interactive = ["choice", "route", "priority", "resource", "item", "triage", "intel", "map", "rescue", "dialogue-choice", "evacuation", "crisis", "climax"].indexOf(currentEvent.type) !== -1;
    if (interactive) renderChoices(currentEvent, currentState);
    else renderContinue(currentEvent);
    elements.controls.classList.add("is-ready");
    // 自动播放只推进旁白和对白，绝不会替玩家自动作出选择。
    if (!interactive && window.ChengshangSubtitles.getSettings().autoPlay) {
      autoTimer = setTimeout(function () { currentHandlers.onContinue(); }, 1600);
    }
  }

  function playCurrentLine() {
    var line = dialogueLines[dialogueIndex];
    elements.speaker.textContent = line.speaker || (dialogueIndex === 0 ? "旁白" : "");
    elements.speakerRole.textContent = line.role || "";
    elements.subtitleText.textContent = "";
    elements.controls.innerHTML = "";
    elements.controls.classList.remove("is-ready");
    window.ChengshangSubtitles.show(elements.subtitleText, line.text, function () {
      if (dialogueIndex < dialogueLines.length - 1) {
        elements.controls.innerHTML = "";
        elements.controls.appendChild(createButton("下一句", "subtitle-next", function () {
          clearAutoTimer();
          dialogueIndex += 1;
          playCurrentLine();
        }));
        elements.controls.classList.add("is-ready");
        if (window.ChengshangSubtitles.getSettings().autoPlay) {
          autoTimer = setTimeout(function () { dialogueIndex += 1; playCurrentLine(); }, 1300);
        }
      } else {
        revealControls();
      }
    });
  }

  function render(event, state, handlers) {
    clearAutoTimer();
    currentEvent = event;
    currentState = state;
    currentHandlers = handlers;
    dialogueIndex = 0;
    dialogueLines = [{ speaker: "旁白", role: "", text: event.narration || "" }].concat(event.dialogue || []);

    elements.stage.textContent = "第" + event.stage + "阶段";
    elements.date.textContent = formatDate(event.date) + " · " + (event.time || "");
    elements.location.textContent = event.location || "";
    elements.eventTitle.textContent = event.title || "未命名事件";
    elements.eventType.textContent = event.type.toUpperCase();
    elements.progress.style.width = Math.max(4, Math.min(100, handlers.progressPercent || 0)) + "%";
    elements.gameRoot.dataset.eventType = event.type;
    elements.gameRoot.dataset.stage = event.stage;
    if (event.audio) {
      if (event.audio.ambience) window.ChengshangAudio.playAmbience(event.audio.ambience);
      if (event.audio.sfx) window.ChengshangAudio.playSfx(event.audio.sfx);
    }
    renderImage(event);
    renderStats(state);
    playCurrentLine();
  }

  function showResult(event, choice, changes, callback) {
    elements.resultTitle.textContent = choice.text;
    elements.resultText.textContent = choice.result || "这个决定改变了后续局势。";
    elements.resultChanges.innerHTML = "";
    if (!changes.length) {
      var unchanged = document.createElement("span");
      unchanged.textContent = "影响将在后续事件中显现";
      elements.resultChanges.appendChild(unchanged);
    } else {
      changes.forEach(function (change) {
        var item = document.createElement("span");
        item.className = change.delta < 0 ? "change-loss" : "change-gain";
        item.textContent = change.label + " " + (change.delta > 0 ? "+" : "") + change.delta;
        elements.resultChanges.appendChild(item);
      });
    }
    renderStats(currentState, changes);
    elements.resultPanel.hidden = false;
    elements.resultPanel.classList.add("is-visible");
    elements.resultContinue.onclick = function () {
      elements.resultPanel.classList.remove("is-visible");
      elements.resultPanel.hidden = true;
      callback();
    };
    elements.resultContinue.focus();
  }

  window.ChengshangRenderer = {
    init: init,
    render: render,
    renderStats: renderStats,
    showResult: showResult
  };
}());
