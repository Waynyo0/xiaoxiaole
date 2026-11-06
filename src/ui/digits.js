import { digitKey } from '../data/asset-manifest.js';

const ratioCache = {};

function ratioOf(scene, d) {
  const key = digitKey(d);
  if (!ratioCache[key] && scene.textures.exists(key)) {
    const f = scene.textures.get(key).get(0);
    ratioCache[key] = f.width / f.height;
  }
  return ratioCache[key] || 0.62;
}

export function makeDigits(scene, x, y, height, center = true) {
  const container = scene.add.container(x, y);
  let value = 0;

  function render() {
    container.removeAll(true);
    const str = String(Math.max(0, Math.round(value)));
    const gap = Math.max(1, height * 0.04);
    const cellW = height * 0.9;
    const ratios = str.split('').map((ch) => ratioOf(scene, ch));
    const total = str.length * cellW + gap * (str.length - 1);
    let cx = center ? -total / 2 : 0;
    for (let i = 0; i < str.length; i++) {
      const r = ratios[i];
      const img = scene.add
        .image(cx + cellW / 2, 0, digitKey(str[i]))
        .setDisplaySize(r * height, height);
      container.add(img);
      cx += cellW + gap;
    }
  }

  return {
    container,
    set(n) {
      value = n;
      render();
    },
    get() {
      return value;
    },
    destroy() {
      container.destroy();
    },
  };
}
