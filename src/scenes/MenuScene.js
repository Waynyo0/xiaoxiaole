import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../data/config.js';
import { t } from '../data/strings.js';
import { createModal } from '../ui/modal.js';
import { audio } from '../app/audio.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_menu').setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.image(GAME_WIDTH / 2, 200, 'logo').setDisplaySize(430, 110);

    audio.autoPlayBgm('bgm_menu');

    const start = this.add
      .image(260, 688, 'btn_start')
      .setDisplaySize(330, 100)
      .setInteractive({ useHandCursor: true });
    start.on('pointerdown', () => {
      audio.unlock();
      audio.playSfx('ui_click');
      audio.playBgm('bgm_menu');
      this.scene.start('LevelSelect');
    });

    const quit = this.add
      .image(260, 782, 'btn_quit')
      .setDisplaySize(315, 95)
      .setInteractive({ useHandCursor: true });
    quit.on('pointerdown', () => {
      audio.unlock();
      audio.stopBgm();
      audio.playSfx('quit');
      this.showThanks();
    });

    // 右下角 18+ 适龄提示（装饰，不可点击）
    this.add.image(524, 944, 'icon_18plus').setOrigin(1, 1).setDisplaySize(56, 72);

    this.events.once('shutdown', () => {
      /* noop */
    });
  }

  showThanks() {
    const m = createModal(this, { titleZh: t('thanks').zh, titleEn: t('thanks').en, width: 400, height: 240 });
    const co = m.getOverlay();

    const hint = this.add
      .text(0, 58, '页面即将关闭… / CLOSING…', {
        fontFamily: '"Microsoft YaHei", sans-serif',
        fontSize: '16px',
        color: '#8a5a3b',
        align: 'center',
      })
      .setOrigin(0.5);
    co.add(hint);

    this.time.delayedCall(2000, () => {
      try {
        window.close();
      } catch (e) {
        /* ignore */
      }
      this.time.delayedCall(800, () => {
        hint.setText('浏览器未自动关闭，请手动关闭标签页 / PLEASE CLOSE THE TAB');
      });
    });
  }
}
