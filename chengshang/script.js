const screens = [...document.querySelectorAll('.screen')];
const settingsModal = document.getElementById('settingsModal');
const transition = document.getElementById('transition');
const volumeInput = document.getElementById('volume');
const STORAGE_KEY = 'chengshang-settings-v1';

const defaults = {
  music: false,
  sfx: true,
  subtitles: true,
  volume: 70
};

let settings = { ...defaults };
try {
  settings = { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
} catch (_) {}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function showScreen(id) {
  screens.forEach(screen => screen.classList.toggle('active', screen.id === id));
}

function openSettings() {
  settingsModal.classList.add('show');
  settingsModal.setAttribute('aria-hidden', 'false');
}

function closeSettings() {
  settingsModal.classList.remove('show');
  settingsModal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('[data-screen]').forEach(button => {
  button.addEventListener('click', () => showScreen(button.dataset.screen));
});

document.querySelectorAll('.back-btn').forEach(button => {
  button.addEventListener('click', () => showScreen('homeScreen'));
});

document.querySelector('[data-action="settings"]').addEventListener('click', openSettings);
document.querySelector('.close-settings').addEventListener('click', closeSettings);

document.querySelector('[data-action="start"]').addEventListener('click', () => {
  transition.classList.add('show');
  setTimeout(() => {
    transition.classList.remove('show');
    showScreen('storyScreen');
  }, 1450);
});

settingsModal.addEventListener('click', event => {
  if (event.target === settingsModal) closeSettings();
});

document.querySelectorAll('.toggle').forEach(toggle => {
  const key = toggle.dataset.setting;
  const enabled = Boolean(settings[key]);
  toggle.classList.toggle('on', enabled);
  toggle.setAttribute('aria-pressed', String(enabled));

  toggle.addEventListener('click', () => {
    settings[key] = !settings[key];
    toggle.classList.toggle('on', settings[key]);
    toggle.setAttribute('aria-pressed', String(settings[key]));
    saveSettings();
  });
});

volumeInput.value = settings.volume;
volumeInput.addEventListener('input', () => {
  settings.volume = Number(volumeInput.value);
  saveSettings();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (settingsModal.classList.contains('show')) closeSettings();
    else showScreen('homeScreen');
  }
});