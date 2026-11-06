import { createModal } from './modal.js';
import { createTextButton } from './button.js';
import { getSave, setSetting, resetProgress, persist } from '../app/save.js';
import { audio } from '../app/audio.js';
import { t } from '../data/strings.js';

function createToggle(scene, x, y, key, on) {
  const label = t(key).zh;
  const container = scene.add.container(x, y).setSize(260, 56).setInteractive({ useHandCursor: true });
  const bg = scene.add
    .graphics()
    .fillStyle(0xffffff, 0.92)
    .fillRoundedRect(-130, -28, 260, 56, 16)
    .lineStyle(2, 0x8a5a3b, 1)
    .strokeRoundedRect(-130, -28, 260, 56, 16);
  const text = scene.add
    .text(0, 0, '', { fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '22px', color: '#6b3f2a', align: 'center' })
    .setOrigin(0.5);
  container.add([bg, text]);

  const refresh = () => text.setText(`${label}：${getSave().settings[key] ? '开' : '关'}`);

  container.on('pointerup', () => {
    setSetting(key, !getSave().settings[key]);
    audio.playSfx('ui_click');
    if (key === 'music') audio.setMusicOn(getSave().settings.music);
    refresh();
  });
  refresh();
  return container;
}

export function openSettings(scene, opts = {}) {
  const { onResume, onRestart, onLevelSelect, onAfterReset, onClose } = opts;
  const extra = (onResume ? 1 : 0) + (onRestart ? 1 : 0) + (onLevelSelect ? 1 : 0);
  const buttonCount = extra + 2;
  const height = 336 + buttonCount * 72;
  const topY = -height / 2;
  const m = createModal(scene, { titleZh: t('settings').zh, titleEn: t('settings').en, height });
  const overlay = m.getOverlay();

  overlay.add(createToggle(scene, 0, topY + 120, 'music', getSave().settings.music));
  overlay.add(createToggle(scene, 0, topY + 186, 'sfx', getSave().settings.sfx));

  let by = topY + 276;
  if (onResume) {
    overlay.add(createTextButton(scene, 0, by, 300, t('resume').zh, t('resume').en, () => { m.close(); onResume(); }, 56));
    by += 72;
  }
  if (onRestart) {
    overlay.add(createTextButton(scene, 0, by, 300, t('restart').zh, t('restart').en, () => { m.close(); onRestart(); }, 56));
    by += 72;
  }
  if (onLevelSelect) {
    overlay.add(createTextButton(scene, 0, by, 300, t('levelSelect').zh, t('levelSelect').en, () => { m.close(); onLevelSelect(); }, 56));
    by += 72;
  }

  overlay.add(
    createTextButton(scene, 0, by, 300, t('resetProgress').zh, t('resetProgress').en, () => {
      const cm = createModal(scene, {
        titleZh: t('resetConfirm').zh,
        titleEn: t('resetConfirm').en,
        width: 400,
        height: 240,
      });
      const co = cm.getOverlay();
      co.add(createTextButton(scene, -80, 40, 140, t('confirm').zh, t('confirm').en, () => {
        resetProgress();
        persist();
        cm.close();
        m.close();
        if (onAfterReset) onAfterReset();
      }, 56));
      co.add(createTextButton(scene, 80, 40, 140, t('cancel').zh, t('cancel').en, () => cm.close(), 56));
    }, 56)
  );
  by += 72;

  overlay.add(
    createTextButton(scene, 0, by, 300, t('back').zh, t('back').en, () => {
      m.close();
      if (onClose) onClose();
    }, 56)
  );

  return m;
}
