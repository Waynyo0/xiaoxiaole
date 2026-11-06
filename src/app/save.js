import { SAVE_KEY, SAVE_KEY_V1, PROP_START } from '../data/config.js';

function defaultSave() {
  return {
    version: 2,
    unlockedLevel: 1,
    stars: {},
    bestScores: {},
    props: { ...PROP_START },
    settings: { music: true, sfx: true, vibration: true },
    opWatched: false,
    currentGame: null,
  };
}

function migrate(v1) {
  const s = defaultSave();
  if (!v1) return s;
  if (v1.unlockedLevel) s.unlockedLevel = v1.unlockedLevel;
  if (v1.stars) s.stars = v1.stars;
  if (v1.bestScores) s.bestScores = v1.bestScores;
  if (v1.props) s.props = { ...s.props, ...v1.props };
  if (v1.settings) s.settings = { ...s.settings, ...v1.settings };
  return s;
}

let state = defaultSave();
let storageOk = true;

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function loadSave() {
  let data = read(SAVE_KEY);
  if (data && data.version === 2) {
    state = { ...defaultSave(), ...data };
  } else if (data && data.version === 1) {
    state = migrate(data);
  } else {
    const v1 = read(SAVE_KEY_V1);
    if (v1) state = migrate(v1);
    else state = defaultSave();
  }
  if (state.currentGame && !isValidCurrentGame(state.currentGame)) {
    state.currentGame = null;
  }
  return state;
}

function isValidCurrentGame(cg) {
  return (
    cg &&
    typeof cg.levelId === 'number' &&
    typeof cg.score === 'number' &&
    typeof cg.movesLeft === 'number' &&
    Array.isArray(cg.board)
  );
}

export function getSave() {
  return state;
}

export function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    storageOk = true;
  } catch (e) {
    storageOk = false;
  }
}

export function isStorageOk() {
  return storageOk;
}

export function setPropCount(type, n) {
  state.props[type] = Math.max(0, n);
  persist();
}

export function addProp(type) {
  state.props[type] = Math.max(0, state.props[type]) + 1;
  persist();
  return state.props[type];
}

export function useProp(type) {
  if (state.props[type] > 0) {
    state.props[type] -= 1;
    persist();
    return true;
  }
  return false;
}

export function setCurrentGame(cg) {
  state.currentGame = cg;
  persist();
}

export function clearCurrentGame() {
  state.currentGame = null;
  persist();
}

export function recordLevelResult(levelId, stars, score) {
  const bestStars = Math.max(state.stars[levelId] || 0, stars);
  const bestScore = Math.max(state.bestScores[levelId] || 0, score);
  state.stars[levelId] = bestStars;
  state.bestScores[levelId] = bestScore;
  if (stars >= 1 && levelId >= state.unlockedLevel) {
    state.unlockedLevel = Math.min(5, levelId + 1);
  }
  persist();
}

export function setOpWatched(v) {
  state.opWatched = v;
  persist();
}

export function setSetting(key, val) {
  state.settings[key] = val;
  persist();
}

export function resetProgress() {
  state.unlockedLevel = 1;
  state.stars = {};
  state.bestScores = {};
  state.props = { ...PROP_START };
  state.opWatched = false;
  state.currentGame = null;
  persist();
}

export function onStorageChanged(cb) {
  window.addEventListener('storage', (e) => {
    if (e.key === SAVE_KEY) {
      cb();
    }
  });
}
