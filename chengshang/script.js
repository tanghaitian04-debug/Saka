(function () {
  "use strict";

  var DATA = window.ChengshangData;
  var SETTINGS_KEY = "chengshang-settings-v2";
  var pages = Array.from(document.querySelectorAll(".page"));
  var activePage = "home";
  var selectedThemeId = "shanghai";
  var selectedChapterId = "shanghai_ch01";
  var selectedIdentityId = "soldier";
  var selectedPersonaId = "soldier_m";
  var lastFocus = null;
  var confirmCallback = null;
  var stageContinueCallback = null;
  var mainMenuIndex = 0;

  var defaultSettings = {
    music: true,
    sound: true,
    subtitles: true,
    typewriter: true,
    autoplay: false,
    highContrast: false,
    reduceMotion: false,
    confirmChoices: true,
    volume: 60,
    subtitleSpeed: 24,
    fontSize: 100
  };

  var settings = loadSettings();

  var rendererElements = {
    gameRoot: byId("gameRoot"), stage: byId("gameStage"), date: byId("gameDate"), location: byId("gameLocation"),
    eventTitle: byId("eventTitle"), eventType: byId("eventType"), image: byId("eventImage"), imageFallback: byId("imageFallback"),
    stats: byId("hudStats"), specialty: byId("hudSpecialty"), task: byId("hudTask"), progress: byId("eventProgress"),
    subtitlePanel: byId("subtitlePanel"), speaker: byId("subtitleSpeaker"), speakerRole: byId("subtitleRole"), subtitleText: byId("subtitleText"),
    controls: byId("eventControls"), resultPanel: byId("resultPanel"), resultTitle: byId("resultTitle"), resultText: byId("resultText"),
    resultChanges: byId("resultChanges"), resultContinue: byId("resultContinue")
  };

  function byId(id) { return document.getElementById(id); }

  function loadSettings() {
    try {
      var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      return Object.assign({}, defaultSettings, saved || {});
    } catch (error) {
      return Object.assign({}, defaultSettings);
    }
  }

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (error) {}
    applySettings();
  }

  function applySettings() {
    document.body.classList.toggle("high-contrast", settings.highContrast);
    document.body.classList.toggle("reduce-motion", settings.reduceMotion);
    window.ChengshangAudio.applySettings({
      music: settings.music, ambience: settings.sound, sfx: settings.sound,
      masterVolume: settings.volume / 100
    });
    window.ChengshangSubtitles.applySettings({
      enabled: settings.subtitles,
      typewriter: settings.typewriter,
      autoPlay: settings.autoplay,
      speed: settings.subtitleSpeed,
      fontScale: settings.fontSize / 100
    });
  }

  function announce(text) {
    byId("liveRegion").textContent = text;
  }

  function showPage(name, focusSelector) {
    pages.forEach(function (page) {
      var active = page.dataset.page === name;
      page.hidden = !active;
      page.classList.toggle("is-active", active);
      page.setAttribute("aria-hidden", String(!active));
      if (active) page.scrollTop = 0;
    });
    activePage = name;
    document.body.classList.toggle("home-visible", name === "home");
    document.body.classList.toggle("is-playing", name === "game");
    announce(name === "home" ? "已返回主页" : "已进入" + name);
    if (focusSelector) {
      setTimeout(function () {
        var target = document.querySelector(focusSelector);
        if (target) target.focus({ preventScroll: true });
      }, 60);
    }
  }

  function openModal(id) {
    var modal = byId(id);
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(function () {
      var focusable = modal.querySelector("button:not([disabled]), input:not([disabled])");
      if (focusable) focusable.focus();
    }, 30);
  }

  function closeModal(id) {
    var modal = byId(id);
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus({ preventScroll: true });
  }

  function confirmAction(title, text, callback) {
    byId("confirmTitle").textContent = title;
    byId("confirmText").textContent = text;
    confirmCallback = callback;
    openModal("confirmModal");
  }

  function formatSavedTime(timestamp) {
    if (!timestamp) return "无";
    try { return new Date(timestamp).toLocaleString("zh-CN", { hour12: false }); } catch (error) { return "未知时间"; }
  }

  function formatDuration(seconds) {
    seconds = Math.max(0, Number(seconds || 0));
    var minutes = Math.floor(seconds / 60);
    var rest = seconds % 60;
    return minutes + "分" + rest + "秒";
  }

  function themeById(id) { return DATA.themes.find(function (item) { return item.id === id; }); }
  function chapterById(id) { return DATA.chapters.find(function (item) { return item.id === id; }); }
  function identityById(id) { return DATA.identities.find(function (item) { return item.id === id; }); }

  function isChapterUnlocked(chapter, progress) {
    if (chapter.unlock.type === "default") return true;
    return progress.unlockedChapters.indexOf(chapter.id) !== -1 || progress.completedChapters.indexOf(chapter.unlock.chapterId) !== -1;
  }

  function renderThemes() {
    var grid = byId("themeGrid");
    grid.innerHTML = "";
    DATA.themes.forEach(function (theme) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "theme-card";
      button.innerHTML = "<small>" + theme.period + "</small><h3>" + theme.title + "</h3><p>" + theme.summary + "</p><footer><span>" + theme.location + "</span><span>四章</span></footer>";
      button.addEventListener("click", function () {
        selectedThemeId = theme.id;
        renderChapters();
        showPage("chapters", "#chaptersTitle");
      });
      grid.appendChild(button);
    });
  }

  function renderChapters() {
    var progress = window.ChengshangSave.getProgress();
    var filter = byId("chapterFilter");
    var grid = byId("chapterGrid");
    filter.innerHTML = "";
    grid.innerHTML = "";

    DATA.themes.forEach(function (theme) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = theme.title;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(theme.id === selectedThemeId));
      button.addEventListener("click", function () { selectedThemeId = theme.id; renderChapters(); });
      filter.appendChild(button);
    });

    DATA.chapters.filter(function (chapter) { return chapter.themeId === selectedThemeId; }).forEach(function (chapter) {
      var unlocked = isChapterUnlocked(chapter, progress);
      var stats = progress.chapterStats[chapter.id] || {};
      var button = document.createElement("button");
      button.type = "button";
      button.className = "chapter-card" + (unlocked ? "" : " is-locked");
      button.setAttribute("aria-disabled", String(!unlocked));
      button.innerHTML =
        "<span class='chapter-card__index'>" + String(chapter.order).padStart(2, "0") + "</span>" +
        "<div><small>" + themeById(chapter.themeId).title + " · " + chapter.dateRange + "</small><h3>" + chapter.title + "</h3>" +
        "<p class='chapter-card__meta'>" + chapter.location + "</p><p class='chapter-card__summary'>" + chapter.summary + "</p>" +
        "<div class='chapter-card__stats'><span>预计 " + chapter.estimatedMinutes + "</span><span>事件 " + chapter.eventCount + "</span><span>结局 " + (stats.endings || 0) + "/" + chapter.endingCount + "</span><span>记忆 " + (stats.memories || 0) + "/" + chapter.memoryCount + "</span></div></div>" +
        "<footer class='chapter-card__footer'><span>完成度 " + (stats.completed ? "100%" : "0%") + "</span><span>" + (unlocked ? (chapter.status === "playable" ? "首章可玩版" : chapter.status === "full" ? "正式章节" : "可完成开发版") : "完成上一章后解锁") + "</span></footer>";
      button.addEventListener("click", function () {
        if (!unlocked) { announce("该章节尚未解锁"); return; }
        selectedChapterId = chapter.id;
        renderIdentities();
        showPage("identity", "#identityTitle");
      });
      grid.appendChild(button);
    });
  }

  function renderIdentities() {
    var grid = byId("identityGrid");
    grid.innerHTML = "";
    byId("identityDetail").hidden = true;
    DATA.identities.forEach(function (identity) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "identity-card";
      button.innerHTML = "<span class='identity-card__icon'>" + identity.icon + "</span><h3>" + identity.title + "</h3><p>" + identity.ability + "</p>";
      button.addEventListener("click", function () {
        selectedIdentityId = identity.id;
        selectedPersonaId = identity.personas[0].id;
        Array.from(grid.children).forEach(function (child) { child.classList.toggle("is-selected", child === button); });
        renderIdentityDetail(identity);
      });
      grid.appendChild(button);
    });
  }

  function renderIdentityDetail(identity) {
    var detail = byId("identityDetail");
    var content = byId("identityDetailContent");
    content.innerHTML = "<h3>" + identity.title + "</h3>" +
      "<dl><dt>出身</dt><dd>" + identity.origin + "</dd><dt>职业</dt><dd>" + identity.occupation + "</dd><dt>家庭</dt><dd>" + identity.family + "</dd><dt>留下原因</dt><dd>" + identity.reason + "</dd><dt>主要职责</dt><dd>" + identity.duties + "</dd><dt>身份风险</dt><dd>" + identity.risk + "</dd><dt>视觉形象</dt><dd>" + identity.portrait + "</dd></dl>" +
      "<div class='identity-stats'><span>血量 " + identity.initial.hp + "</span><span>精神 " + identity.initial.mental + "</span><span>物资 " + identity.initial.supplies + "</span></div><p>专属能力：" + identity.ability + "</p>";
    var picker = byId("personaPicker");
    picker.innerHTML = "";
    identity.personas.forEach(function (persona, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = persona.name + " · " + persona.gender + " · " + persona.age + "岁";
      button.classList.toggle("is-selected", index === 0);
      button.addEventListener("click", function () {
        selectedPersonaId = persona.id;
        Array.from(picker.children).forEach(function (child) { child.classList.toggle("is-selected", child === button); });
      });
      picker.appendChild(button);
    });
    detail.hidden = false;
    detail.scrollIntoView({ behavior: settings.reduceMotion ? "auto" : "smooth", block: "nearest" });
  }

  function renderMemories() {
    var progress = window.ChengshangSave.getProgress();
    var grid = byId("memoryGrid");
    grid.innerHTML = "";
    DATA.items.forEach(function (item) {
      var unlocked = progress.memories.indexOf(item.id) !== -1;
      var article = document.createElement("article");
      article.className = "memory-card" + (unlocked ? "" : " is-locked");
      article.innerHTML = "<img src='" + item.image + "' alt='" + (unlocked ? item.name : "未解锁物件") + "'><h3>" + (unlocked ? item.name : "未解锁记忆") + "</h3><p>" + (unlocked ? item.description : item.type + " · 在剧情中保存后解锁") + "</p>";
      grid.appendChild(article);
    });
    var sourceArchive = byId("sourceArchive");
    sourceArchive.innerHTML = "";
    DATA.historySources.forEach(function (source) {
      if (progress.sources.indexOf(source.id) === -1) return;
      var link = document.createElement("a");
      link.href = source.url; link.target = "_blank"; link.rel = "noopener noreferrer";
      link.textContent = source.institution + " · " + source.title;
      sourceArchive.appendChild(link);
    });
    if (!sourceArchive.children.length) sourceArchive.textContent = "完成章节后解锁资料来源。";
  }

  function renderStartModal() {
    var saves = window.ChengshangSave.getAll();
    var autosave = saves.autosave;
    byId("continueGameButton").disabled = !autosave;
    byId("saveSummary").innerHTML = autosave
      ? "<strong>最近自动存档</strong><br>" + (chapterById(autosave.state.chapterId) || {}).title + " · " + autosave.state.personaName + "<br>" + formatSavedTime(autosave.savedAt)
      : "当前没有剧情存档。新游戏将从主题、章节与身份选择开始。";
    openModal("startModal");
  }

  function preloadForChapter(chapterId, done) {
    var screen = byId("loadingScreen");
    var bar = byId("loadingProgress");
    var status = byId("loadingStatus");
    var images = DATA.events.filter(function (event) { return event.chapterId === chapterId && event.image; }).slice(0, 5).map(function (event) { return event.image; });
    screen.hidden = false;
    if (!images.length) { screen.hidden = true; done(); return; }
    var complete = 0;
    images.forEach(function (source) {
      var image = new Image();
      function mark() {
        complete += 1;
        var percent = Math.round((complete / images.length) * 100);
        bar.style.width = percent + "%";
        status.textContent = percent + "%";
        if (complete >= images.length) setTimeout(function () { screen.hidden = true; done(); }, 120);
      }
      image.onload = mark; image.onerror = mark; image.src = source;
    });
  }

  function beginSelectedGame() {
    preloadForChapter(selectedChapterId, function () {
      showPage("game");
      window.ChengshangGame.startNew(selectedChapterId, selectedIdentityId, selectedPersonaId);
    });
  }

  function renderStageSettlement(stage, state, continueCallback, snapshot) {
    stageContinueCallback = continueCallback;
    snapshot = snapshot || { stats: state.stats, relationships: state.relationships };
    function delta(key) {
      var value = Number(state.stats[key] || 0) - Number(snapshot.stats[key] || 0);
      return (value > 0 ? "+" : "") + value;
    }
    var trustDelta = Object.keys(state.relationships).reduce(function (total, id) {
      return total + Number(state.relationships[id] || 0) - Number((snapshot.relationships || {})[id] || 0);
    }, 0);
    byId("stageTitle").textContent = "第" + stage + "阶段结算";
    byId("stageSummary").innerHTML = "<dl><dt>血量变化</dt><dd>" + delta("hp") + "（现为 " + state.stats.hp + "/100）</dd><dt>精神变化</dt><dd>" + delta("mental") + "（现为 " + state.stats.mental + "/100）</dd><dt>物资变化</dt><dd>" + delta("supplies") + "（剩余 " + state.stats.supplies + "）</dd><dt>人物关系</dt><dd>总信任变化 " + (trustDelta > 0 ? "+" : "") + trustDelta + "</dd><dt>救援记录</dt><dd>" + state.stats.rescueScore + "</dd><dt>已完成任务</dt><dd>" + (state.currentTask || "阶段任务") + "</dd><dt>未解决问题</dt><dd>" + (state.flags.companionAtRisk ? "一名同伴去向未明" : "仍有人员与物资未能确认") + "</dd><dt>阶段评价</dt><dd>你保住了一部分人和记录，也留下了无法立即回答的问题。</dd><dt>历史时间</dt><dd>将推进至下一阶段</dd></dl>";
    openModal("stageModal");
  }

  function renderEnding(ending, state, history) {
    showPage("ending", "#endingTitle");
    byId("endingTitle").textContent = ending ? ending.title : "章节结束";
    var failure = state.stats.hp <= 0 && state.failureContext;
    byId("endingDescription").textContent = failure
      ? state.failureContext.time + "，" + state.failureContext.location + "。" + ending.description + " 关键选择：" + state.failureContext.choice + "。"
      : ending.description;
    byId("endingStats").innerHTML = "<div><small>游玩时间</small><strong>" + formatDuration(state.playSeconds) + "</strong></div><div><small>剩余血量</small><strong>" + state.stats.hp + "</strong></div><div><small>精神</small><strong>" + state.stats.mental + "</strong></div><div><small>物资</small><strong>" + state.stats.supplies + "</strong></div><div><small>救援</small><strong>" + state.stats.rescueScore + "</strong></div><div><small>结局</small><strong>1</strong></div>";
    byId("endingCharacters").textContent = Object.keys(state.characterStates).map(function (id) {
      var character = DATA.characters.find(function (item) { return item.id === id; });
      var status = state.characterStates[id];
      return character.name + "：" + (status.missing ? "失踪" : status.injured ? "受伤" : "去向已记录");
    }).join("　");
    byId("endingItems").textContent = state.inventory.length ? state.inventory.map(function (id) {
      var item = DATA.items.find(function (candidate) { return candidate.id === id; });
      return item ? item.name : id;
    }).join("、") : "没有物件被完整保存。";
    var choices = byId("endingChoices");
    choices.innerHTML = "";
    state.choices.slice(-6).forEach(function (record) { var li = document.createElement("li"); li.textContent = record.choiceText + "——" + record.result; choices.appendChild(li); });
    byId("historyFact").textContent = history && history.fact ? history.fact : "本章依据官方档案与纪念馆资料划分历史阶段。";
    byId("historyFiction").textContent = history && history.fiction ? history.fiction : "玩家和普通同行者为基于历史环境创作的虚构人物。";
    var sources = byId("historySources"); sources.innerHTML = "";
    window.ChengshangHistory.renderList(history ? history.sourceIds : []).forEach(function (li) { sources.appendChild(li); });
    byId("continueRecentButton").hidden = !failure;
    byId("replayStageEndingButton").hidden = !failure;
    var current = chapterById(state.chapterId);
    var next = DATA.chapters.find(function (chapter) { return chapter.themeId === current.themeId && chapter.order === current.order + 1; });
    byId("nextChapterButton").hidden = !next;
    if (next) byId("nextChapterButton").textContent = "下一章：" + next.title;
    updateDevState();
  }

  function renderSaveSlots() {
    var container = byId("saveSlots");
    var saves = window.ChengshangSave.getAll();
    container.innerHTML = "";
    window.ChengshangSave.slots.forEach(function (slotId) {
      var slot = saves[slotId];
      var div = document.createElement("div");
      div.className = "save-slot";
      div.innerHTML = "<header><strong>" + (slotId === "autosave" ? "自动存档" : "手动存档 " + slotId.slice(-1)) + "</strong><span>" + (slot ? formatSavedTime(slot.savedAt) : "空") + "</span></header><p>" + (slot ? ((chapterById(slot.state.chapterId) || {}).title + " · " + slot.state.personaName + " · 第" + slot.state.stage + "阶段") : "尚未保存") + "</p>";
      if (slotId !== "autosave") {
        var button = document.createElement("button"); button.type = "button"; button.textContent = slot ? "覆盖此存档" : "保存到此位置";
        button.addEventListener("click", function () { window.ChengshangGame.saveManual(slotId); renderSaveSlots(); announce("存档已保存"); }); div.appendChild(button);
      }
      container.appendChild(div);
    });
  }

  function setupSettings() {
    var map = {
      musicToggle: "music", soundToggle: "sound", subtitleToggle: "subtitles", typewriterToggle: "typewriter",
      autoplayToggle: "autoplay", contrastToggle: "highContrast", motionToggle: "reduceMotion", confirmChoiceToggle: "confirmChoices"
    };
    Object.keys(map).forEach(function (id) {
      byId(id).checked = !!settings[map[id]];
      byId(id).addEventListener("change", function () { settings[map[id]] = this.checked; saveSettings(); });
    });
    [["volumeSlider", "volume", "volumeValue", function (v) { return v + "%"; }], ["subtitleSpeedSlider", "subtitleSpeed", "subtitleSpeedValue", function (v) { return v < 18 ? "快" : v > 38 ? "慢" : "中"; }], ["fontSizeSlider", "fontSize", "fontSizeValue", function (v) { return v + "%"; }]].forEach(function (entry) {
      var input = byId(entry[0]); var output = byId(entry[2]); input.value = settings[entry[1]]; output.textContent = entry[3](settings[entry[1]]);
      input.addEventListener("input", function () { settings[entry[1]] = Number(input.value); output.textContent = entry[3](settings[entry[1]]); saveSettings(); });
    });
  }

  function setupDevPanel() {
    var storedDev = false;
    try { storedDev = localStorage.getItem("chengshang_dev") === "1"; } catch (error) {}
    var enabled = location.hash === "#dev" || storedDev;
    var panel = byId("devPanel"); panel.hidden = !enabled;
    if (!enabled) return;
    byId("devToggle").addEventListener("click", function () { panel.classList.toggle("is-collapsed"); });
    byId("devJump").addEventListener("click", function () { window.ChengshangGame.jumpTo(byId("devEventId").value.trim()); updateDevState(); });
    byId("devSetHp").addEventListener("click", function () { window.ChengshangGame.setStat("stats.hp", byId("devHp").value); updateDevState(); });
    byId("devUnlockAll").addEventListener("click", function () {
      var progress = window.ChengshangSave.getProgress(); progress.unlockedChapters = DATA.chapters.map(function (chapter) { return chapter.id; });
      try { localStorage.setItem("chengshang-progress-v2", JSON.stringify(progress)); } catch (error) {}
      renderChapters();
    });
    byId("devClearSaves").addEventListener("click", function () { window.ChengshangSave.clearAll(); updateDevState(); });
  }

  function updateDevState() {
    if (byId("devPanel").hidden) return;
    var state = window.ChengshangGame.getState();
    byId("devState").textContent = state ? JSON.stringify({ event: state.currentEventId, stage: state.stage, stats: state.stats, flags: state.flags, relationships: state.relationships }, null, 2) : "尚未开始剧情";
    if (state) byId("devHp").value = state.stats.hp;
  }

  function setupActions() {
    document.querySelectorAll("[data-home-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.dataset.homeAction;
        if (action === "start") renderStartModal();
        if (action === "story") { selectedThemeId = "shanghai"; renderChapters(); showPage("chapters", "#chaptersTitle"); }
        if (action === "memories") { renderMemories(); showPage("memories", "#memoriesTitle"); }
        if (action === "settings") openModal("settingsModal");
      });
    });

    document.querySelectorAll("[data-nav]").forEach(function (button) {
      button.addEventListener("click", function () {
        var page = button.dataset.nav;
        if (page === "theme") renderThemes();
        if (page === "chapters") renderChapters();
        showPage(page, page === "home" ? ".menu-button" : "#" + page + "Title");
      });
    });
    document.querySelectorAll("[data-close-modal]").forEach(function (element) { element.addEventListener("click", function () { closeModal(element.dataset.closeModal); }); });

    byId("continueGameButton").addEventListener("click", function () {
      var saved = window.ChengshangSave.load("autosave"); if (!saved) return;
      closeModal("startModal"); showPage("game"); window.ChengshangGame.resume(saved);
    });
    byId("newGameButton").addEventListener("click", function () {
      var proceed = function () { closeModal("startModal"); renderThemes(); showPage("theme", "#themeTitle"); };
      if (window.ChengshangSave.hasAny()) confirmAction("开始新游戏", "自动存档会在进入新章节后更新。已有手动存档仍会保留。", proceed); else proceed();
    });
    byId("openChapterSelectButton").addEventListener("click", function () { closeModal("startModal"); renderChapters(); showPage("chapters", "#chaptersTitle"); });
    byId("confirmIdentityButton").addEventListener("click", beginSelectedGame);
    byId("gameMenuButton").addEventListener("click", function () { renderSaveSlots(); openModal("gameMenuModal"); });
    byId("stageContinueButton").addEventListener("click", function () { closeModal("stageModal"); if (stageContinueCallback) { var callback = stageContinueCallback; stageContinueCallback = null; callback(); } });
    byId("confirmCancel").addEventListener("click", function () { confirmCallback = null; closeModal("confirmModal"); });
    byId("confirmAccept").addEventListener("click", function () { var callback = confirmCallback; confirmCallback = null; closeModal("confirmModal"); if (callback) callback(); });
    byId("restartStageButton").addEventListener("click", function () { confirmAction("重玩本阶段", "本阶段之后的选择与自动存档将被覆盖。", function () { closeModal("gameMenuModal"); window.ChengshangGame.restartStage(); }); });
    byId("restartCurrentChapterButton").addEventListener("click", function () { confirmAction("重玩本章", "本章当前进度将被覆盖，已解锁结局与资料不会删除。", function () { closeModal("gameMenuModal"); window.ChengshangGame.restartChapter(); }); });
    byId("quitToChaptersButton").addEventListener("click", function () { window.ChengshangGame.saveManual("autosave"); closeModal("gameMenuModal"); renderChapters(); showPage("chapters", "#chaptersTitle"); });
    byId("replayChapterButton").addEventListener("click", function () { showPage("game"); window.ChengshangGame.restartChapter(); });
    byId("replayStageEndingButton").addEventListener("click", function () { showPage("game"); window.ChengshangGame.restartStage(); });
    byId("continueRecentButton").addEventListener("click", function () { var saved = window.ChengshangSave.load("autosave"); if (saved) { showPage("game"); window.ChengshangGame.resume(saved); } });
    byId("nextChapterButton").addEventListener("click", function () {
      var state = window.ChengshangGame.getState(); var current = chapterById(state.chapterId); var next = DATA.chapters.find(function (chapter) { return chapter.themeId === current.themeId && chapter.order === current.order + 1; });
      if (!next) return; selectedThemeId = next.themeId; selectedChapterId = next.id; renderIdentities(); showPage("identity", "#identityTitle");
    });
  }

  function setupKeyboard() {
    var menuButtons = Array.from(document.querySelectorAll(".menu-button"));
    document.addEventListener("keydown", function (event) {
      var openModalElement = document.querySelector(".modal.is-open");
      if (event.key === "Escape") {
        if (openModalElement) { closeModal(openModalElement.id); event.preventDefault(); return; }
        if (activePage === "game") { renderSaveSlots(); openModal("gameMenuModal"); event.preventDefault(); return; }
        if (activePage !== "home") { showPage("home", ".menu-button"); event.preventDefault(); }
        return;
      }
      if (activePage !== "home" || openModalElement) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault(); mainMenuIndex = (mainMenuIndex + (event.key === "ArrowDown" ? 1 : -1) + menuButtons.length) % menuButtons.length;
        menuButtons.forEach(function (button, index) { button.classList.toggle("is-keyboard-selected", index === mainMenuIndex); }); menuButtons[mainMenuIndex].focus();
      }
      if (event.key === "Enter") { event.preventDefault(); menuButtons[mainMenuIndex].click(); }
    });
  }

  function setupParallax() {
    if (!matchMedia("(pointer:fine)").matches || settings.reduceMotion) return;
    var frame = null; var image = byId("sceneImage");
    window.addEventListener("mousemove", function (event) {
      if (frame) return;
      frame = requestAnimationFrame(function () {
        image.style.setProperty("--parallax-x", ((event.clientX / innerWidth - .5) * -5).toFixed(1) + "px");
        image.style.setProperty("--parallax-y", ((event.clientY / innerHeight - .5) * -3).toFixed(1) + "px"); frame = null;
      });
    }, { passive: true });
  }

  window.ChengshangRenderer.init(rendererElements);
  window.ChengshangGame.init(DATA, {
    onEvent: function () { showPage("game"); updateDevState(); },
    onStageSettlement: renderStageSettlement,
    onEnding: renderEnding,
    onError: function (message) { announce(message); confirmAction("剧情错误", message, function () { renderChapters(); showPage("chapters"); }); },
    confirmChoice: function (event, choice, proceed) {
      if (!settings.confirmChoices || ["climax", "crisis"].indexOf(event.type) === -1) { proceed(); return; }
      confirmAction("确认关键选择", choice.text + "。这个选择可能产生延迟或不可逆后果。", proceed);
    }
  });

  setupSettings(); applySettings(); setupActions(); setupKeyboard(); setupParallax(); setupDevPanel(); renderThemes(); renderChapters(); renderMemories();
  document.body.classList.add("home-visible");
  requestAnimationFrame(function () { requestAnimationFrame(function () { document.body.classList.add("is-loaded"); }); });
}());
