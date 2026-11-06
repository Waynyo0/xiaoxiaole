import { BASE_PER_TILE, INTERSECT_BONUS, LONG_BONUS_4, LONG_BONUS_5, COMBO_MULTIPLIERS } from '../data/config.js';

export function groupLongBonus(group) {
  let bonus = 0;
  if (group.maxRun >= 5) bonus += LONG_BONUS_5;
  else if (group.maxRun === 4) bonus += LONG_BONUS_4;
  if (group.intersection) bonus += INTERSECT_BONUS;
  return bonus;
}

export function groupBase(group) {
  return group.count * BASE_PER_TILE;
}

export function comboMultiplier(round) {
  if (round <= 1) return COMBO_MULTIPLIERS[0];
  if (round === 2) return COMBO_MULTIPLIERS[1];
  if (round === 3) return COMBO_MULTIPLIERS[2];
  return COMBO_MULTIPLIERS[3];
}

// 计算一轮消除的得分
export function computeRoundScore(groups, round) {
  let base = 0;
  let bonus = 0;
  for (const g of groups) {
    base += groupBase(g);
    bonus += groupLongBonus(g);
  }
  return Math.round((base + bonus) * comboMultiplier(round));
}

export function computePropScore(tileCount) {
  return tileCount * BASE_PER_TILE;
}

export function computeStars(score, stars) {
  if (score >= stars[2]) return 3;
  if (score >= stars[1]) return 2;
  if (score >= stars[0]) return 1;
  return 0;
}
