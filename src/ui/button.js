import { audio } from '../app/audio.js';

export function createImageButton(scene, x, y, texture, onClick, scale = 1) {
  const img = scene.add
    .image(x, y, texture)
    .setScale(scale)
    .setInteractive({ useHandCursor: true });
  img.on('pointerdown', () => {
    img.setScale(scale * 0.96);
  });
  img.on('pointerup', () => {
    img.setScale(scale);
    audio.playSfx('ui_click');
    if (onClick) onClick();
  });
  img.on('pointerout', () => img.setScale(scale));
  return img;
}

export function createTextButton(scene, x, y, width, zh, en, onClick, height = 74) {
  const container = scene.add.container(x, y).setSize(width, height).setInteractive({ useHandCursor: true });
  const bg = scene.add
    .graphics()
    .fillStyle(0xffffff, 0.92)
    .fillRoundedRect(-width / 2, -height / 2, width, height, 18)
    .lineStyle(3, 0x8a5a3b, 1)
    .strokeRoundedRect(-width / 2, -height / 2, width, height, 18);
  container.add(bg);
  const zhText = scene.add
    .text(0, -11, zh, { fontFamily: '"Microsoft YaHei", sans-serif', fontSize: '26px', color: '#6b3f2a', align: 'center' })
    .setOrigin(0.5);
  const enText = scene.add
    .text(0, 15, en, { fontFamily: 'sans-serif', fontSize: '13px', color: '#a9745a', align: 'center' })
    .setOrigin(0.5);
  container.add([zhText, enText]);

  container.on('pointerdown', () => container.setScale(0.96));
  container.on('pointerup', () => {
    container.setScale(1);
    audio.playSfx('ui_click');
    if (onClick) onClick();
  });
  container.on('pointerout', () => container.setScale(1));
  return container;
}
