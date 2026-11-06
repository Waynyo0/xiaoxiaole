import { ASSET_BASE } from '../data/config.js';

// 逻辑 key → 文件路径
export const ASSETS = {
  bg_menu: 'bg/bg_menu.png',
  bg_levels_char: 'bg/bg_levels_character.png',
  bg_levels_frame: 'bg/bg_levels_frame.png',
  bg_levels_petals: 'bg/bg_levels_petals.png',
  bg_game: 'bg/bg_game.png',

  logo: 'ui/logo.png',
  btn_start: 'ui/btn_start.png',
  btn_quit: 'ui/btn_quit.png',
  btn_back: 'ui/btn_back.png',
  level_title: 'ui/level_title.png',
  level_1: 'ui/level_1.png',
  level_2: 'ui/level_2.png',
  level_3: 'ui/level_3.png',
  level_4: 'ui/level_4.png',
  level_5: 'ui/level_5.png',
  icon_lock: 'ui/icon_lock.png',
  icon_gear: 'ui/icon_gear.png',
  icon_plus: 'ui/icon_plus.png',
  icon_18plus: 'ui/icon_18plus.png',
  placard_score: 'ui/score_placard.png',
  placard_moves: 'ui/moves_placard.png',
  assistant: 'ui/assistant.png',
  prop_rocket: 'ui/prop_rocket.png',
  prop_clock: 'ui/prop_clock.png',
  prop_bomb: 'ui/prop_bomb.png',
  star_filled: 'ui/star_filled.png',
  star_empty: 'ui/star_empty.png',

  digit_0: 'digits/digit_0.png',
  digit_1: 'digits/digit_1.png',
  digit_2: 'digits/digit_2.png',
  digit_3: 'digits/digit_3.png',
  digit_4: 'digits/digit_4.png',
  digit_5: 'digits/digit_5.png',
  digit_6: 'digits/digit_6.png',
  digit_7: 'digits/digit_7.png',
  digit_8: 'digits/digit_8.png',
  digit_9: 'digits/digit_9.png',

  piece_0: 'pieces/piece_0.png',
  piece_1: 'pieces/piece_1.png',
  piece_2: 'pieces/piece_2.png',
  piece_3: 'pieces/piece_3.png',
  piece_4: 'pieces/piece_4.png',
  piece_5: 'pieces/piece_5.png',

  op_poster: 'video/op_poster.jpg',
};

export function assetUrl(key) {
  return ASSET_BASE + ASSETS[key];
}

export function pieceKey(i) {
  return `piece_${i}`;
}

export function digitKey(d) {
  return `digit_${d}`;
}

export function levelButtonKey(id) {
  return `level_${id}`;
}
