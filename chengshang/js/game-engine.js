(function () {
  "use strict";

  var data = null;
  var eventMap = {};
  var state = null;
  var currentEvent = null;
  var callbacks = {};
  var timer = null;
  var stageSnapshots = {};

  function init(gameData, nextCallbacks) {
    data = gameData;
    callbacks = nextCallbacks || {};
    eventMap = {};
    data.events.forEach(function (event) { eventMap[event.id] = event; });
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(function () {
      if (state) state.playSeconds += 1;
    }, 1000);
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function chapterStartEvent(chapterId) {
    return chapterId === "shanghai_ch01" ? "sh01_p00" : chapterId + "_p00";
  }

  function startNew(chapterId, identityId, personaId) {
    state = window.ChengshangState.create(chapterId, identityId, personaId, data);
    stageSnapshots = {};
    startTimer();
    enterEvent(chapterStartEvent(chapterId));
    return state;
  }

  function resume(nextState) {
    if (!nextState || !nextState.currentEventId) return false;
    state = window.ChengshangState.clone(nextState);
    stageSnapshots = {};
    if (state.stageSnapshot) stageSnapshots[state.stage] = window.ChengshangState.clone(state.stageSnapshot);
    startTimer();
    enterEvent(state.currentEventId, { resumed: true });
    return true;
  }

  function getState() {
    return state;
  }

  function getCurrentEvent() {
    return currentEvent;
  }

  function resolveSpecialNext(nextId) {
    if (!nextId || nextId.indexOf("@identity:") !== 0) return nextId;
    var number = nextId.split(":")[1];
    return "sh01_" + state.identityId + "_" + String(number).padStart(2, "0");
  }

  function eventProgress() {
    var chapter = data.chapters.find(function (item) { return item.id === state.chapterId; });
    var estimate = parseInt(String(chapter.routeEventCount), 10) || chapter.eventCount || 1;
    var count = state.visitedEvents.filter(function (id) {
      return eventMap[id] && !eventMap[id].bonus;
    }).length;
    return Math.round((count / estimate) * 100);
  }

  function renderCurrent() {
    if (!currentEvent) return;
    window.ChengshangRenderer.render(currentEvent, state, {
      onChoice: function (choice) {
        if (typeof callbacks.confirmChoice === "function") callbacks.confirmChoice(currentEvent, choice, function () { choose(choice); });
        else choose(choice);
      },
      onContinue: continueEvent,
      progressPercent: eventProgress()
    });
    if (typeof callbacks.onEvent === "function") callbacks.onEvent(currentEvent, state);
  }

  function enterEvent(eventId, options) {
    options = options || {};
    eventId = resolveSpecialNext(eventId);
    var event = eventMap[eventId];
    if (!event) {
      if (typeof callbacks.onError === "function") callbacks.onError("找不到事件：" + eventId);
      return false;
    }

    if (!window.ChengshangState.requirementsMet(state, event.requirements || [])) {
      return enterEvent(resolveSpecialNext(event.fallbackNext || event.next), options);
    }

    currentEvent = event;
    state.currentEventId = event.id;
    state.stage = event.stage || state.stage;
    state.currentTask = event.task || state.currentTask;
    if (state.visitedEvents.indexOf(event.id) === -1) state.visitedEvents.push(event.id);

    if (event.stageIntro && !stageSnapshots[event.stage]) {
      var snapshot = window.ChengshangState.clone(state);
      delete snapshot.stageSnapshot;
      stageSnapshots[event.stage] = snapshot;
      state.stageSnapshot = window.ChengshangState.clone(snapshot);
      state.stageStartEventId = event.id;
    }

    if (!options.resumed && state.enteredEvents.indexOf(event.id) === -1) {
      state.enteredEvents.push(event.id);
      if (event.onEnterEffects) window.ChengshangState.applyEffects(state, event.onEnterEffects, event.title);
    }

    state.updatedAt = Date.now();
    window.ChengshangSave.save("autosave", state, "自动存档 · " + event.title);
    renderCurrent();
    return true;
  }

  function selectBonus(event, baseNext) {
    if (!event.afterPool || !event.afterPool.length) return baseNext;
    var candidates = event.afterPool.map(function (id) { return eventMap[id]; }).filter(function (candidate) {
      if (!candidate || state.visitedEvents.indexOf(candidate.id) !== -1) return false;
      if (!window.ChengshangState.requirementsMet(state, candidate.requirements || [])) return false;
      if (candidate.bonusType === "random" && Math.random() > Number(candidate.chance || 0)) return false;
      return true;
    });
    var condition = candidates.find(function (candidate) { return candidate.bonusType === "condition"; });
    return (condition || candidates[0] || {}).id || baseNext;
  }

  function goNext(nextId) {
    nextId = resolveSpecialNext(nextId);
    if (!nextId && currentEvent.type === "ending") {
      finishChapter();
      return;
    }
    enterEvent(nextId);
  }

  function afterEvent(nextId) {
    var event = currentEvent;
    if (event.stageEnd && state.completedStages.indexOf(event.stage) === -1 && typeof callbacks.onStageSettlement === "function") {
      state.completedStages.push(event.stage);
      window.ChengshangSave.save("autosave", state, "阶段结算 · 第" + event.stage + "阶段");
      callbacks.onStageSettlement(event.stage, state, function () { goNext(nextId); }, stageSnapshots[event.stage]);
      return;
    }
    goNext(nextId);
  }

  function choose(choice) {
    if (!state || !currentEvent || !choice) return;
    if (!window.ChengshangState.requirementsMet(state, choice.requirements || [])) return;
    var event = currentEvent;
    var beforeChoice = window.ChengshangState.clone(state);
    var changes = window.ChengshangState.applyChoice(state, choice, event);
    var baseNext = choice.next || event.next;
    var nextId = selectBonus(event, baseNext);
    window.ChengshangSave.save("autosave", state, "自动存档 · " + event.title);

    if (state.stats.hp <= 0) {
      state.failureContext = {
        eventId: event.id,
        time: event.date + " " + event.time,
        location: event.location,
        choice: choice.text,
        reason: choice.result
      };
      // 失败时保留选择前的自动存档，确保“从最近存档继续”真正可用。
      window.ChengshangSave.save("autosave", beforeChoice, "失败前存档 · " + event.title);
      window.ChengshangRenderer.showResult(event, choice, changes, finishChapter);
      return;
    }

    window.ChengshangRenderer.showResult(event, choice, changes, function () {
      afterEvent(nextId);
    });
  }

  function continueEvent() {
    if (!currentEvent) return;
    if (currentEvent.type === "ending") {
      if (state.completedStages.indexOf(currentEvent.stage) === -1 && typeof callbacks.onStageSettlement === "function") {
        state.completedStages.push(currentEvent.stage);
        window.ChengshangSave.save("autosave", state, "阶段结算 · 第" + currentEvent.stage + "阶段");
        callbacks.onStageSettlement(currentEvent.stage, state, finishChapter, stageSnapshots[currentEvent.stage]);
        return;
      }
      finishChapter();
      return;
    }
    afterEvent(selectBonus(currentEvent, currentEvent.next));
  }

  function finishChapter() {
    stopTimer();
    var ending = window.ChengshangState.selectEnding(state, data.endings);
    state.endingId = ending ? ending.id : null;
    var sourceIds = currentEvent && currentEvent.history ? currentEvent.history.sourceIds || [] : [];
    sourceIds.forEach(function (id) {
      if (state.unlockedSources.indexOf(id) === -1) state.unlockedSources.push(id);
    });
    window.ChengshangSave.updateProgress(state, ending);
    if (state.stats.hp > 0) window.ChengshangSave.save("autosave", state, "章节结束 · " + (ending ? ending.title : "结局"));
    if (typeof callbacks.onEnding === "function") callbacks.onEnding(ending, state, currentEvent ? currentEvent.history : null);
  }

  function saveManual(slotId) {
    if (!state) return false;
    return window.ChengshangSave.save(slotId, state, "手动存档 · " + (currentEvent ? currentEvent.title : state.chapterId));
  }

  function restartStage() {
    var snapshot = stageSnapshots[state.stage] || state.stageSnapshot;
    if (!snapshot) return false;
    state = window.ChengshangState.clone(snapshot);
    enterEvent(state.currentEventId, { resumed: true });
    return true;
  }

  function restartChapter() {
    if (!state) return false;
    return !!startNew(state.chapterId, state.identityId, state.personaId);
  }

  function jumpTo(eventId) {
    if (!eventMap[eventId] || !state) return false;
    return enterEvent(eventId);
  }

  function setStat(path, value) {
    if (!state) return false;
    var parts = String(path).split(".");
    var object = state;
    while (parts.length > 1) {
      var part = parts.shift();
      object[part] = object[part] || {};
      object = object[part];
    }
    object[parts[0]] = Number.isFinite(Number(value)) ? Number(value) : value;
    state.stats.hp = window.ChengshangState.clamp(state.stats.hp, 0, 100);
    state.stats.mental = window.ChengshangState.clamp(state.stats.mental, 0, 100);
    renderCurrent();
    return true;
  }

  window.ChengshangGame = {
    init: init,
    startNew: startNew,
    resume: resume,
    getState: getState,
    getCurrentEvent: getCurrentEvent,
    saveManual: saveManual,
    restartStage: restartStage,
    restartChapter: restartChapter,
    jumpTo: jumpTo,
    setStat: setStat,
    enterEvent: enterEvent,
    // 自动测试与开发模式使用；正式界面不会直接调用。
    testChoose: choose,
    testContinue: continueEvent,
    eventMap: function () { return eventMap; }
  };
}());
