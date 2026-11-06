import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../data/config.js';
import { getLevel } from '../data/levels.js';
import { t } from '../data/strings.js';
import { makeDigits } from '../ui/digits.js';
import { drawStars } from '../ui/stars.js';
import { createTextButton, createImageButton } from '../ui/button.js';
import { createModal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';
import { openSettings } from '../ui/settings.js';
import * as save from '../app/save.js';
import { audio } from '../app/audio.js';
import { playOp } from '../app/op-video.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create(data) {
    this.levelId = data.levelId;
    this.level = getLevel(this.levelId);
    this.gameScene = this.scene.get('Game');
    this.armHighlight = null;
    this.opAutoTimer = null;

    audio.playBgm('bgm_level_' + this.levelId);

    this.buildHUD(data);
    this.buildProps();
    this.bindEvents();
    this.showTargetBanner();
  }

  buildHUD(data) {
    const gear = createImageButton(this, 38, 42, 'icon_gear', () => this.openPause(), 0.65);
    gear.setDepth(20);
    this.gearBtn = gear;

    this.add.image(140, 86, 'assistant').setDisplaySize(160, 110);

    this.add.image(310, 85, 'placard_score').setDisplaySize(140, 118);
    this.scoreDigits = makeDigits(this, 309, 57, 30);
    this.scoreDigits.container.setRotation(Phaser.Math.DegToRad(-10));
    this.scoreDigits.set(data.score);

    this.add.image(460, 85, 'placard_moves').setDisplaySize(140, 118);
    this.movesDigits = makeDigits(this, 465, 61, 30);
    this.movesDigits.container.setRotation(Phaser.Math.DegToRad(8));
    this.movesDigits.set(data.moves);
  }

  buildProps() {
    const props = ['rocket', 'clock', 'bomb'];
    this.propIcons = {};
    this.propCounts = {};
    props.forEach((type, i) => {
      const x = 130 + i * 140;
      const y = 912;
      const icon = this.add
        .image(x, y, 'prop_' + type)
        .setDisplaySize(72, 72)
        .setInteractive({ useHandCursor: true })
        .setDepth(20);
      icon.on('pointerdown', () => {
        audio.playSfx('ui_click');
        if (type === 'clock') this.gameScene.useClock();
        else this.gameScene.armProp(type);
      });
      this.propIcons[type] = icon;

      const count = this.add
        .text(x, y + 30, String(save.getSave().props[type]), {
          fontFamily: 'sans-serif',
          fontSize: '18px',
          color: '#ffffff',
          stroke: '#6b3f2a',
          strokeThickness: 4,
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(21);
      this.propCounts[type] = count;

      const plus = this.add
        .image(x + 32, y + 28, 'icon_plus')
        .setDisplaySize(26, 22)
        .setInteractive({ useHandCursor: true })
        .setDepth(21);
      plus.on('pointerdown', () => {
        audio.playSfx('ui_click');
        const n = save.addProp(type);
        this.propCounts[type].setText(String(n));
      });
    });
    this.armHighlight = this.add.graphics().setDepth(19);
  }

  bindEvents() {
    const g = this.gameScene.events;
    g.on('score', (s) => this.scoreDigits.set(s));
    g.on('moves', (m) => this.movesDigits.set(m));
    g.on('toast', (key) => toast(this, key));
    g.on('props', () => this.updatePropCounts());
    g.on('prop-armed', (type) => this.highlightProp(type));
    g.on('level-end', (info) => this.showResult(info));
  }

  updatePropCounts() {
    const p = save.getSave().props;
    for (const type of ['rocket', 'clock', 'bomb']) {
      this.propCounts[type].setText(String(p[type]));
    }
  }

  highlightProp(type) {
    this.armHighlight.clear();
    if (!type) return;
    const icon = this.propIcons[type];
    this.armHighlight.lineStyle(4, 0xffe000, 1).strokeCircle(icon.x, icon.y, 42);
  }

  showTargetBanner() {
    const c = this.add.container(GAME_WIDTH / 2, 235).setDepth(50);
    const bg = this.add
      .graphics()
      .fillStyle(0x000000, 0.5)
      .fillRoundedRect(-130, -34, 260, 68, 16);
    const zh = this.add
      .text(0, -10, `目标 ${this.level.target}`, { fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '28px', color: '#ffffff', align: 'center' })
      .setOrigin(0.5);
    const en = this.add
      .text(0, 16, `TARGET ${this.level.target}`, { fontFamily: 'sans-serif', fontSize: '13px', color: '#dddddd', align: 'center' })
      .setOrigin(0.5);
    c.add([bg, zh, en]);
    c.setAlpha(0);
    this.tweens.add({
      targets: c,
      alpha: { from: 0, to: 1 },
      duration: 200,
      yoyo: true,
      hold: 1800,
      onComplete: () => c.destroy(),
    });
  }

  openPause() {
    const st = this.gameScene.state;
    if (st !== 'IDLE' && st !== 'PROP_ARMED') return;
    this.gameScene.cancelProp();
    this.scene.pause('Game');
    openSettings(this, {
      onResume: () => this.scene.resume('Game'),
      onRestart: () => this.restartLevel(),
      onLevelSelect: () => this.confirmAbandon(),
      onAfterReset: () => this.gotoLevelSelect(),
      onClose: () => this.scene.resume('Game'),
    });
  }

  confirmAbandon() {
    const m = createModal(this, { titleZh: t('abandonConfirm').zh, titleEn: t('abandonConfirm').en, width: 400, height: 240 });
    const co = m.getOverlay();
    co.add(createTextButton(this, -80, 40, 140, t('confirm').zh, t('confirm').en, () => {
      save.clearCurrentGame();
      m.close();
      this.gotoLevelSelect();
    }, 56));
    co.add(createTextButton(this, 80, 40, 140, t('cancel').zh, t('cancel').en, () => {
      m.close();
      this.scene.resume('Game');
    }, 56));
  }

  restartLevel() {
    save.clearCurrentGame();
    this.scene.stop('UI');
    this.scene.start('Game', { levelId: this.levelId, resume: false });
  }

  gotoLevel(levelId, resume) {
    this.scene.stop('UI');
    this.scene.start('Game', { levelId, resume });
  }

  gotoLevelSelect() {
    this.scene.stop('UI');
    this.scene.stop('Game');
    this.scene.start('LevelSelect');
  }

  gotoMenu() {
    this.scene.stop('UI');
    this.scene.stop('Game');
    this.scene.start('Menu');
  }

  showResult(info) {
    const { won, score, stars, levelId, target, best } = info;
    const isLast = levelId === 5;
    const titleKey = won ? (isLast ? 'allClear' : 'clear') : 'failed';
    const m = createModal(this, { titleZh: t(titleKey).zh, titleEn: t(titleKey).en, height: won ? 520 : 420 });
    const overlay = m.getOverlay();

    if (won) {
      overlay.add(drawStars(this, 0, -150, stars, 3, 52, 12));
      overlay.add(this.makeRow(`分数 ${score} / SCORE`, -80));
      overlay.add(this.makeRow(`最高 ${best} / BEST`, -40));
      overlay.add(this.makeRow(`目标 ${target} / TARGET`, 0));
      let by = 80;
      if (!isLast) {
        overlay.add(createTextButton(this, 0, by, 300, t('nextLevel').zh, t('nextLevel').en, () => this.gotoLevel(levelId + 1, false), 56));
        by += 72;
      } else {
        overlay.add(createTextButton(this, 0, by, 300, t('watchOp').zh, t('watchOp').en, () => this.triggerOp(), 56));
        by += 72;
      }
      overlay.add(createTextButton(this, 0, by, 300, t('retry').zh, t('retry').en, () => this.gotoLevel(levelId, false), 56));
      by += 72;
      overlay.add(createTextButton(this, 0, by, 300, t('levels').zh, t('levels').en, () => this.gotoLevelSelect(), 56));

      if (isLast && !save.getSave().opWatched) {
        this.opAutoTimer = this.time.delayedCall(1800, () => this.triggerOp());
      }
    } else {
      overlay.add(this.makeRow(`分数 ${score} / SCORE`, -60));
      overlay.add(this.makeRow(`目标 ${target} / TARGET`, -20));
      overlay.add(createTextButton(this, 0, 60, 300, t('retry').zh, t('retry').en, () => this.gotoLevel(levelId, false), 56));
      overlay.add(createTextButton(this, 0, 132, 300, t('levels').zh, t('levels').en, () => this.gotoLevelSelect(), 56));
    }
  }

  makeRow(text, y) {
    return this.add.text(0, y, text, { fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '24px', color: '#6b3f2a', align: 'center' }).setOrigin(0.5);
  }

  triggerOp() {
    if (this.opAutoTimer) {
      this.opAutoTimer.remove(false);
      this.opAutoTimer = null;
    }
    audio.stopBgm();
    playOp({
      onEnd: () => {
        save.setOpWatched(true);
        audio.playBgm('bgm_menu');
        this.gotoMenu();
      },
      onError: () => {
        audio.playBgm('bgm_menu');
        this.gotoMenu();
      },
    });
  }
}
