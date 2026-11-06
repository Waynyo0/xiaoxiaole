import { COLS, ROWS } from '../data/config.js';

// 清一整行，返回被清除的格子（含类型）
export function clearRow(board, row, cols = COLS) {
  const cleared = [];
  for (let c = 0; c < cols; c++) {
    if (board[row][c] != null) {
      cleared.push({ r: row, c, type: board[row][c] });
      board[row][c] = null;
    }
  }
  return cleared;
}

// 清 3x3（边缘裁剪），返回被清除的格子
export function clear3x3(board, row, col, rows = ROWS, cols = COLS) {
  const cleared = [];
  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c] != null) {
        cleared.push({ r, c, type: board[r][c] });
        board[r][c] = null;
      }
    }
  }
  return cleared;
}
