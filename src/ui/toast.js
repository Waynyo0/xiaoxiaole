import { t } from '../data/strings.js';

let current = null;

export function toast(scene, key, duration = 1400) {
  if (current) current.destroy();
  const info = t(key);
  const w = 340;
  const h = 64;
  const container = scene.add.container(scene.scale.width / 2, 200);
  const bg = scene.add
    .graphics()
    .fillStyle(0x000000, 0.55)
    .fillRoundedRect(-w / 2, -h / 2, w, h, 16);
  container.add(bg);
  const zh = scene.add
    .text(0, -12, info.zh, { fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '24px', color: '#ffffff', align: 'center' })
    .setOrigin(0.5);
  const en = scene.add
    .text(0, 16, info.en, { fontFamily: 'sans-serif', fontSize: '13px', color: '#dddddd', align: 'center' })
    .setOrigin(0.5);
  container.add([zh, en]);
  container.setDepth(500);
  container.setAlpha(0);
  scene.tweens.add({
    targets: container,
    alpha: { from: 0, to: 1 },
    duration: 180,
    yoyo: true,
    hold: duration,
    onComplete: () => container.destroy(),
  });
  current = container;
}
