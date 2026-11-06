import { GAME_WIDTH, GAME_HEIGHT } from '../data/config.js';

export function createModal(scene, { titleZh, titleEn, width = 420, height = 480, dim = true }) {
  const overlay = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(400);

  if (dim) {
    const bg = scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setInteractive();
    overlay.add(bg);
  }

  const panel = scene.add
    .graphics()
    .fillStyle(0xfff8ee, 0.98)
    .fillRoundedRect(-width / 2, -height / 2, width, height, 24)
    .lineStyle(4, 0x8a5a3b, 1)
    .strokeRoundedRect(-width / 2, -height / 2, width, height, 24);
  overlay.add(panel);

  if (titleZh) {
    const t = scene.add
      .text(0, -height / 2 + 40, titleZh, {
        fontFamily: '"Microsoft YaHei", sans-serif',
        fontSize: '34px',
        color: '#6b3f2a',
        align: 'center',
      })
      .setOrigin(0.5);
    overlay.add(t);
    if (titleEn) {
      const e = scene.add
        .text(0, -height / 2 + 72, titleEn, {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#a9745a',
          align: 'center',
        })
        .setOrigin(0.5);
      overlay.add(e);
    }
  }

  let contentY = -height / 2 + 110;

  return {
    overlay,
    addText(text, style = {}) {
      const t = scene.add
        .text(0, contentY, text, {
          fontFamily: '"Microsoft YaHei", sans-serif',
          fontSize: '24px',
          color: '#6b3f2a',
          align: 'center',
          ...style,
        })
        .setOrigin(0.5, 0);
      overlay.add(t);
      contentY += 46;
      return t;
    },
    addImage(key, y, size) {
      const img = scene.add.image(0, y, key).setDisplaySize(size, size);
      overlay.add(img);
      return img;
    },
    addNode(node, y) {
      node.setPosition(0, y);
      overlay.add(node);
      return node;
    },
    close() {
      overlay.destroy();
    },
    getOverlay() {
      return overlay;
    },
  };
}
