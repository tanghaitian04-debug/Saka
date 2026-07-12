(function () {
  "use strict";

  function createChannel(loop) {
    var audio = new Audio();
    audio.preload = "none";
    audio.loop = !!loop;
    return { audio: audio, current: "", fadeTimer: null };
  }

  var channels = {
    music: createChannel(true),
    ambience: createChannel(true),
    sfx: createChannel(false),
    voice: createChannel(false)
  };

  var settings = {
    muted: false,
    music: true,
    ambience: true,
    sfx: true,
    voice: true,
    masterVolume: 0.6,
    musicVolume: 0.5,
    ambienceVolume: 0.55,
    sfxVolume: 0.65,
    voiceVolume: 0.75
  };

  function safePlay(audio) {
    var promise = audio.play();
    if (promise && typeof promise.catch === "function") promise.catch(function () {});
  }

  function channelVolume(name) {
    return settings.muted || settings[name] === false ? 0 : settings.masterVolume * Number(settings[name + "Volume"] || 0);
  }

  function stop(name) {
    var channel = channels[name];
    if (!channel) return;
    if (channel.fadeTimer) clearInterval(channel.fadeTimer);
    channel.audio.pause();
    channel.audio.currentTime = 0;
    channel.current = "";
  }

  function play(name, source, options) {
    var channel = channels[name];
    options = options || {};
    if (!channel || !source) return false;
    if (channel.current !== source) {
      channel.audio.pause();
      channel.audio.src = source;
      channel.current = source;
    }
    channel.audio.loop = options.loop !== undefined ? options.loop : channel.audio.loop;
    channel.audio.volume = channelVolume(name);
    safePlay(channel.audio);
    return true;
  }

  function fadeTo(name, target, duration) {
    var channel = channels[name];
    if (!channel || !channel.current) return;
    if (channel.fadeTimer) clearInterval(channel.fadeTimer);
    var start = channel.audio.volume;
    var steps = Math.max(1, Math.round((duration || 600) / 50));
    var index = 0;
    channel.fadeTimer = setInterval(function () {
      index += 1;
      channel.audio.volume = Math.max(0, Math.min(1, start + (target - start) * (index / steps)));
      if (index >= steps) {
        clearInterval(channel.fadeTimer);
        channel.fadeTimer = null;
        if (target === 0) channel.audio.pause();
      }
    }, 50);
  }

  function applySettings(next) {
    settings = Object.assign({}, settings, next || {});
    Object.keys(channels).forEach(function (name) {
      channels[name].audio.volume = channelVolume(name);
      if (channels[name].audio.volume === 0) channels[name].audio.pause();
    });
  }

  window.ChengshangAudio = {
    getSettings: function () { return Object.assign({}, settings); },
    playMusic: function (source) { return play("music", source, { loop: true }); },
    playAmbience: function (source) { return play("ambience", source, { loop: true }); },
    playSfx: function (source) { return play("sfx", source, { loop: false }); },
    playVoice: function (source) { return play("voice", source, { loop: false }); },
    stop: stop,
    stopAll: function () { Object.keys(channels).forEach(stop); },
    fadeTo: fadeTo,
    applySettings: applySettings
  };
}());
