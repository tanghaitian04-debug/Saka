(function () {
  "use strict";

  var SAVE_KEY = "chengshang-saves-v2";
  var PROGRESS_KEY = "chengshang-progress-v2";
  var SLOT_IDS = ["autosave", "slot1", "slot2", "slot3"];

  function read(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key));
      return value && typeof value === "object" ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function getAll() {
    return read(SAVE_KEY, { autosave: null, slot1: null, slot2: null, slot3: null });
  }

  function save(slotId, state, label) {
    if (SLOT_IDS.indexOf(slotId) === -1 || !state) return false;
    var saves = getAll();
    saves[slotId] = {
      slotId: slotId,
      label: label || (slotId === "autosave" ? "自动存档" : "手动存档"),
      savedAt: Date.now(),
      state: window.ChengshangState.clone(state)
    };
    return write(SAVE_KEY, saves);
  }

  function load(slotId) {
    var saveData = getAll()[slotId];
    return saveData && saveData.state ? window.ChengshangState.clone(saveData.state) : null;
  }

  function remove(slotId) {
    var saves = getAll();
    saves[slotId] = null;
    return write(SAVE_KEY, saves);
  }

  function hasAny() {
    var saves = getAll();
    return SLOT_IDS.some(function (slotId) { return !!saves[slotId]; });
  }

  function getProgress() {
    return read(PROGRESS_KEY, {
      unlockedChapters: ["shanghai_ch01", "nanjing_ch01"],
      completedChapters: [],
      endings: [],
      memories: [],
      sources: [],
      chapterStats: {}
    });
  }

  function updateProgress(state, ending) {
    var progress = getProgress();
    if (progress.completedChapters.indexOf(state.chapterId) === -1) progress.completedChapters.push(state.chapterId);
    if (ending && progress.endings.indexOf(ending.id) === -1) progress.endings.push(ending.id);
    state.unlockedMemories.forEach(function (id) { if (progress.memories.indexOf(id) === -1) progress.memories.push(id); });
    state.unlockedSources.forEach(function (id) { if (progress.sources.indexOf(id) === -1) progress.sources.push(id); });

    var chapters = window.ChengshangData.chapters;
    var current = chapters.find(function (chapter) { return chapter.id === state.chapterId; });
    var next = chapters.find(function (chapter) { return chapter.themeId === current.themeId && chapter.order === current.order + 1; });
    if (next && progress.unlockedChapters.indexOf(next.id) === -1) progress.unlockedChapters.push(next.id);

    progress.chapterStats[state.chapterId] = {
      completed: true,
      playSeconds: state.playSeconds,
      endings: progress.endings.filter(function (id) { return id.indexOf(state.chapterId) === 0 || id.indexOf("sh01_") === 0 && state.chapterId === "shanghai_ch01"; }).length,
      memories: state.unlockedMemories.length,
      lastEnding: ending ? ending.id : null
    };
    write(PROGRESS_KEY, progress);
    return progress;
  }

  function clearAll() {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(PROGRESS_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  window.ChengshangSave = {
    slots: SLOT_IDS,
    getAll: getAll,
    save: save,
    load: load,
    remove: remove,
    hasAny: hasAny,
    getProgress: getProgress,
    updateProgress: updateProgress,
    clearAll: clearAll
  };
}());
