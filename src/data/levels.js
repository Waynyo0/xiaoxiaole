export const LEVELS = [
  { id: 1, moves: 20, target: 600,  stars: [600, 900, 1200] },
  { id: 2, moves: 20, target: 800,  stars: [800, 1200, 1600] },
  { id: 3, moves: 18, target: 1000, stars: [1000, 1500, 2000] },
  { id: 4, moves: 18, target: 1250, stars: [1250, 1900, 2500] },
  { id: 5, moves: 16, target: 1500, stars: [1500, 2250, 3000] },
];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS[0];
}
