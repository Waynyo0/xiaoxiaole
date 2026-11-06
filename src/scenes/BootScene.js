import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../data/config.js';
import { ASSETS, assetUrl } from '../data/asset-manifest.js';
import { loadSave, onStorageChanged } from '../app/save.js';
import { audio } from '../app/audio.js';

const AUDIO_FILES = {
  bgm_menu: 'audio/bgm_menu.mp3',
  bgm_level_1: 'audio/bgm_level_1.mp3',
  bgm_level_2: 'audio/bgm_level_2.mp3',
  bgm_level_3: 'audio/bgm_level_3.mp3',
  bgm_level_4: 'audio/bgm_level_4.mp3',
  bgm_level_5: 'audio/bgm_level_5.mp3',
  sfx_ui_click: 'audio/sfx_ui_click.mp3',
  sfx_quit: 'audio/sfx_quit.mp3',
  sfx_swap: 'audio/sfx_swap.mp3',
  sfx_opening: 'audio/sfx_opening.mp3',
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.makeProgressBar();

    for (const [key, path] of Object.entries(ASSETS)) {
      if (key === 'op_poster') continue;
      this.load.image(key, assetUrl(key));
    }
    for (const [key, path] of Object.entries(AUDIO_FILES)) {
      this.load.audio(key, './assets/' + path);
    }
    this.load.on('loaderror', (file) => {
      console.warn('load error:', file.key || file.url);
    });
  }

  makeProgressBar() {
    const bar = this.add.graphics();
    const text = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'LOADING 0%', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);
    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(0xffffff, 0.2);
      bar.fillRoundedRect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 - 6, 300, 12, 6);
      bar.fillStyle(0xffffff, 0.9);
      bar.fillRoundedRect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 - 6, 300 * v, 12, 6);
      text.setText('LOADING ' + Math.floor(v * 100) + '%');
    });
    this.load.on('complete', () => {
      bar.destroy();
      text.destroy();
    });
  }

  create() {
    loadSave();
    audio.init(this.game);
    this.registry.set('audio', audio);

    onStorageChanged(() => {
      const d = document.createElement('div');
      d.textContent = '存档已在其他窗口更新 / SAVE UPDATED ELSEWHERE';
      d.style.cssText =
        'position:fixed;top:18px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#fff;padding:10px 18px;border-radius:20px;z-index:9999;font-size:14px;';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 2600);
    });

    this.input.once('pointerdown', () => audio.unlock());

    this.scene.start('Menu');
  }
}
