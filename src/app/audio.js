import { getSave } from './save.js';

const REAL_SFX = new Set(['ui_click', 'quit', 'swap', 'opening']);
const BGM_KEYS = ['bgm_menu', 'bgm_level_1', 'bgm_level_2', 'bgm_level_3', 'bgm_level_4', 'bgm_level_5'];

class AudioManager {
  constructor() {
    this.game = null;
    this.ctx = null;
    this.bgmKey = null;
    this.bgm = null;
    this.bgmBaseVolume = 0.6;
    this.unlocked = false;
  }

  init(game) {
    this.game = game;
  }

  // 首次用户交互后解锁 AudioContext
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (this.game && this.game.sound) {
      const soundCtx = this.game.sound.context;
      if (soundCtx && (soundCtx.state === 'suspended' || soundCtx.state === 'interrupted')) {
        const key = this.bgmKey;
        soundCtx.resume().then(() => {
          if (key && this.bgmKey === key) this.restartBgm(key);
        });
      }
    }
    this.unlocked = true;
  }

  isLocked() {
    const ctx = this.game && this.game.sound ? this.game.sound.context : null;
    return !!(ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted'));
  }

  restartBgm(key) {
    this.stopBgm();
    this.playBgm(key);
  }

  // 自动播放尝试：浏览器允许时立即播放；被限制时在首次交互/聚焦后自动接上
  autoPlayBgm(key) {
    this.playBgm(key);
    const events = ['pointerdown', 'touchstart', 'keydown', 'focus', 'visibilitychange'];
    let timer1 = null;
    let timer2 = null;
    let done = false;

    const cleanup = () => {
      if (done) return;
      done = true;
      for (const e of events) window.removeEventListener(e, tryPlay);
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
    };

    const tryPlay = () => {
      if (this.bgmKey !== key) {
        cleanup();
        return;
      }
      this.unlock();
      if (!this.isLocked() && (!this.bgm || !this.bgm.isPlaying)) {
        this.restartBgm(key);
      }
      if (!this.isLocked() && this.bgm && this.bgm.isPlaying) cleanup();
    };

    for (const e of events) window.addEventListener(e, tryPlay, { passive: true });
    timer1 = setTimeout(tryPlay, 600);
    timer2 = setTimeout(tryPlay, 1600);
  }

  get settings() {
    return getSave().settings;
  }

  loadInScene(scene, onComplete) {
    for (const k of BGM_KEYS) {
      scene.load.audio(k, assetUrl2('audio/' + k + '.mp3'));
    }
    scene.load.audio('sfx_ui_click', assetUrl2('audio/sfx_ui_click.mp3'));
    scene.load.audio('sfx_quit', assetUrl2('audio/sfx_quit.mp3'));
    scene.load.audio('sfx_swap', assetUrl2('audio/sfx_swap.mp3'));
    scene.load.audio('sfx_opening', assetUrl2('audio/sfx_opening.mp3'));
    if (onComplete) scene.load.once('complete', onComplete);
  }

  playSfx(name) {
    if (!this.settings.sfx) return;
    if (REAL_SFX.has(name)) {
      const key = 'sfx_' + name;
      if (this.game && this.game.sound && this.game.cache.audio.exists(key)) {
        this.game.sound.play(key, { volume: 0.7 });
        return;
      }
    }
    this.synth(name);
  }

  playBgm(key) {
    if (!this.game) return;
    if (this.bgmKey === key && this.bgm && this.bgm.isPlaying) return;
    this.stopBgm();
    this.bgmKey = key;
    if (this.game.cache.audio.exists(key)) {
      this.bgmBaseVolume = key.startsWith('bgm_level_') ? 0.1 : 0.6;
      this.bgm = this.game.sound.add(key, {
        loop: true,
        volume: this.settings.music ? this.bgmBaseVolume : 0,
      });
      this.bgm.play();
    }
  }

  stopBgm() {
    if (this.bgm) {
      this.bgm.stop();
      this.bgm.destroy();
      this.bgm = null;
    }
    this.bgmKey = null;
  }

  setMusicOn(on) {
    if (this.bgm) this.bgm.setVolume(on ? this.bgmBaseVolume : 0);
  }

  vibrate(ms) {
    if (this.settings.vibration && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        /* ignore */
      }
    }
  }

  synth(name) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.connect(ctx.destination);
    out.gain.setValueAtTime(0.0001, now);

    const tone = (freq, start, dur, type, vol) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, now + start);
      g.gain.setValueAtTime(0.0001, now + start);
      g.gain.exponentialRampToValueAtTime(vol, now + start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      o.connect(g).connect(ctx.destination);
      o.start(now + start);
      o.stop(now + start + dur + 0.05);
    };

    switch (name) {
      case 'match':
        tone(520, 0, 0.08, 'sine', 0.4);
        tone(780, 0.04, 0.09, 'sine', 0.3);
        break;
      case 'combo':
        tone(660, 0, 0.07, 'sine', 0.35);
        tone(880, 0.05, 0.08, 'sine', 0.35);
        tone(1100, 0.1, 0.1, 'sine', 0.35);
        break;
      case 'invalid':
        tone(180, 0, 0.12, 'square', 0.25);
        break;
      case 'rocket':
        tone(1200, 0, 0.18, 'sawtooth', 0.12);
        tone(900, 0.1, 0.18, 'sawtooth', 0.12);
        break;
      case 'clock':
        tone(1000, 0, 0.06, 'sine', 0.3);
        tone(1000, 0.1, 0.06, 'sine', 0.3);
        break;
      case 'bomb':
        tone(120, 0, 0.3, 'square', 0.35);
        tone(80, 0.05, 0.35, 'sawtooth', 0.3);
        break;
      case 'win':
        tone(523, 0, 0.12, 'sine', 0.35);
        tone(659, 0.12, 0.12, 'sine', 0.35);
        tone(784, 0.24, 0.25, 'sine', 0.4);
        break;
      case 'lose':
        tone(392, 0, 0.18, 'sine', 0.3);
        tone(330, 0.18, 0.25, 'sine', 0.3);
        break;
      case 'shuffle':
        tone(300, 0, 0.25, 'triangle', 0.15);
        break;
      case 'star':
        tone(880, 0, 0.09, 'sine', 0.35);
        tone(1320, 0.06, 0.14, 'sine', 0.35);
        break;
      default:
        tone(600, 0, 0.06, 'sine', 0.25);
    }
  }
}

function assetUrl2(path) {
  return './assets/' + path;
}

export const audio = new AudioManager();
