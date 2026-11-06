export function drawStars(scene, x, y, filled, total = 3, size = 40, spacing = 8) {
  const container = scene.add.container(x, y);
  const w = size + spacing;
  const startX = -((total - 1) * w) / 2;
  for (let i = 0; i < total; i++) {
    const key = i < filled ? 'star_filled' : 'star_empty';
    const s = scene.add.image(startX + i * w, 0, key).setDisplaySize(size, size);
    container.add(s);
  }
  return container;
}
