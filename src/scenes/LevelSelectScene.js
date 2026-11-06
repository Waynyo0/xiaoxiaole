import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../data/config.js';
import { t } from '../data/strings.js';
import { createImageButton } from '../ui/button.js';
import { createTextButton } from '../ui/button.js';
import { createModal } from '../ui/modal.js';
import { drawStars } from '../ui/stars.js';
import { openSettings } from '../ui/settings.js';
import * as save from '../app/save.js';
import { audio } from '../app/audio.js';

const BTN_POS = [
  { id: 1, x: 110, y: 240, badgeDy: -58 },
  { id: 2, x: 222, y: 240, badgeDy: -58 },
  { id: 3, x: 334, y: 240, badgeDy: -58 },
  { id: 4, x: 446, y: 240, badgeDy: -58 },
  { id: 5, x: 110, y: 355, badgeDy: 78 },
];

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    audio.playBgm('bgm_menu');
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_levels_petals').setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_levels_char').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.96);
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_levels_frame').setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.image(200, 118, 'level_title').setDisplaySize(240, 74);

    this.content = this.add.container(0, 0);
    this.buildLevels();

    const back = createImageButton(this, 445, 858, 'btn_back', () => this.scene.start('Menu'), 0.94);
    back.setDepth(20);

    const gear = createImageButton(this, 500, 52, 'icon_gear', () => this.openSettings(), 0.45);
    gear.setDepth(20);

    this.unlockAudioOnce();
  }

  unlockAudioOnce() {
    this.input.once('pointerdown', () => audio.unlock());
  }

  buildLevels() {
    this.content.removeAll(true);
    const s = save.getSave();
    for (const b of BTN_POS) {
      const unlocked = b.id <= s.unlockedLevel;
      const btn = this.add
        .image(b.x, b.y, 'level_' + b.id)
        .setDisplaySize(88, 88)
        .setInteractive({ useHandCursor: true })
        .setAlpha(unlocked ? 1 : 0.55);
      this.content.add(btn);

      if (!unlocked) {
        const lock = this.add.image(b.x, b.y, 'icon_lock').setDisplaySize(22, 22);
        this.content.add(lock);
        btn.on('pointerdown', () => audio.playSfx('invalid'));
        continue;
      }

      btn.on('pointerdown', () => this.onSelect(b.id));

      const stars = s.stars[b.id] || 0;
      this.content.add(drawStars(this, b.x, b.y + 54, stars, 3, 18, 3));

      if (s.currentGame && s.currentGame.levelId === b.id) {
        const badge = this.add
          .text(b.x, b.y + b.badgeDy, t('inProgress').zh + ' / ' + t('inProgress').en, {
            fontFamily: '"Microsoft YaHei", sans-serif',
            fontSize: '13px',
            color: '#e0a028',
            stroke: '#5b2c16',
            strokeThickness: 3,
            align: 'center',
          })
          .setOrigin(0.5);
        this.content.add(badge);
      }
    }
  }

  onSelect(id) {
    const s = save.getSave();
    audio.playSfx('ui_click');
    const resume = !!(s.currentGame && s.currentGame.levelId === id);
    const hasOtherCurrent = s.currentGame && s.currentGame.levelId !== id;
    if (hasOtherCurrent) {
      const m = createModal(this, { titleZh: t('abandonCurrent').zh, titleEn: t('abandonCurrent').en, width: 400, height: 240 });
      const co = m.getOverlay();
      co.add(createTextButton(this, -80, 40, 140, t('confirm').zh, t('confirm').en, () => {
        save.clearCurrentGame();
        m.close();
        this.scene.start('Game', { levelId: id, resume: false });
      }, 56));
      co.add(createTextButton(this, 80, 40, 140, t('cancel').zh, t('cancel').en, () => m.close(), 56));
      return;
    }
    this.scene.start('Game', { levelId: id, resume });
  }

  openSettings() {
    openSettings(this, {
      onAfterReset: () => {
        this.buildLevels();
      },
    });
  }
}
