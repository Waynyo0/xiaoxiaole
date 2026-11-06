import { COLS, ROWS, PIECE_TYPES } from '../data/config.js';
import { fillBoardNoMatches, hasValidMove } from './board.js';

// 洗牌：保留棋子多重集，保证无初始三连且有解
export function shuffleBoard(board, rng, rows = ROWS, cols = COLS, types = PIECE_TYPES) {
  const pool = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] != null) pool.push(board[r][c]);
    }
  }
  for (let attempt = 0; attempt < 200; attempt++) {
    const shuffled = rng.shuffle(pool);
    const next = fillTypes(shuffled, rows, cols);
    if (!hasAnyThree(next, rows, cols) && hasValidMove(next, rows, cols)) {
      return next;
    }
  }
  // 兜底：重新生成
  return fillBoardNoMatches(rng, rows, cols, types);
}

function fillTypes(pool, rows, cols) {
  const board = [];
  let i = 0;
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(pool[i++]);
    board.push(row);
  }
  return board;
}

function hasAnyThree(board, rows, cols) {
  for (let r = 0; r < rows; r++) {
    let run = 1;
    for (let c = 1; c < cols; c++) {
      if (board[r][c] === board[r][c - 1]) {
        run++;
        if (run >= 3) return true;
      } else run = 1;
    }
  }
  for (let c = 0; c < cols; c++) {
    let run = 1;
    for (let r = 1; r < rows; r++) {
      if (board[r][c] === board[r - 1][c]) {
        run++;
        if (run >= 3) return true;
      } else run = 1;
    }
  }
  return false;
}
