(function () {
  "use strict";

  var activeTimer = null;
  var activeTarget = null;
  var fullText = "";
  var onFinished = null;
  var settings = {
    enabled: true,
    typewriter: true,
    speed: 24,
    fontScale: 1,
    autoPlay: false
  };

  function clear() {
    if (activeTimer) clearInterval(activeTimer);
    activeTimer = null;
    activeTarget = null;
    fullText = "";
    onFinished = null;
  }

  function finish() {
    if (activeTimer) clearInterval(activeTimer);
    activeTimer = null;
    if (activeTarget) activeTarget.textContent = fullText;
    if (typeof onFinished === "function") {
      var callback = onFinished;
      onFinished = null;
      callback();
    }
  }

  function show(target, text, callback) {
    clear();
    activeTarget = target;
    fullText = String(text || "");
    onFinished = callback;
    if (!target) {
      finish();
      return;
    }
    target.style.setProperty("--subtitle-scale", settings.fontScale);
    if (!settings.enabled) {
      target.textContent = "";
      finish();
      return;
    }
    if (!settings.typewriter || settings.speed <= 0) {
      target.textContent = fullText;
      finish();
      return;
    }
    var index = 0;
    target.textContent = "";
    activeTimer = setInterval(function () {
      index += 1;
      target.textContent = fullText.slice(0, index);
      if (index >= fullText.length) finish();
    }, Math.max(8, Number(settings.speed)));
  }

  function skip() {
    if (!activeTimer) return false;
    finish();
    return true;
  }

  function applySettings(next) {
    settings = Object.assign({}, settings, next || {});
    document.documentElement.style.setProperty("--subtitle-scale", settings.fontScale);
  }

  window.ChengshangSubtitles = {
    show: show,
    skip: skip,
    clear: clear,
    finish: finish,
    applySettings: applySettings,
    getSettings: function () { return Object.assign({}, settings); }
  };
}());
