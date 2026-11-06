import { COLS, ROWS, PIECE_TYPES } from '../data/config.js';

export function createEmptyBoard(rows = ROWS, cols = COLS) {
  const board = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(null);
    board.push(row);
  }
  return board;
}

// 生成无初始三连的棋盘
export function fillBoardNoMatches(rng, rows = ROWS, cols = COLS, types = PIECE_TYPES) {
  const board = createEmptyBoard(rows, cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const forbidden = new Set();
      // 左边两个同色
      if (c >= 2 && board[r][c - 1] === board[r][c - 2] && board[r][c - 1] != null) {
        forbidden.add(board[r][c - 1]);
      }
      // 上边两个同色
      if (r >= 2 && board[r - 1][c] === board[r - 2][c] && board[r - 1][c] != null) {
        forbidden.add(board[r - 1][c]);
      }
      let t = rng.int(types);
      let guard = 0;
      while (forbidden.has(t) && guard < 100) {
        t = rng.int(types);
        guard++;
      }
      board[r][c] = t;
    }
  }
  return board;
}

// 生成一个有效棋盘（无初始三连 + 至少一步可走）
export function generateBoard(rng, rows = ROWS, cols = COLS, types = PIECE_TYPES) {
  for (let i = 0; i < 100; i++) {
    const board = fillBoardNoMatches(rng, rows, cols, types);
    if (hasValidMove(board, rows, cols)) return board;
  }
  return fillBoardNoMatches(rng, rows, cols, types);
}

// 逐列下落 + 顶部补充（原地修改）
export function applyGravity(board, rng, rows = ROWS, cols = COLS, types = PIECE_TYPES) {
  const changed = [];
  for (let c = 0; c < cols; c++) {
    const col = [];
    for (let r = rows - 1; r >= 0; r--) {
      if (board[r][c] != null) col.push(board[r][c]);
    }
    while (col.length < rows) col.push(rng.int(types));
    col.reverse();
    for (let r = 0; r < rows; r++) {
      board[r][c] = col[r];
      changed.push({ r, c });
    }
  }
  return changed;
}

// 模拟相邻交换后是否存在匹配
export function swapCreatesMatch(board, a, b, rows = ROWS, cols = COLS) {
  const { r: ar, c: ac } = a;
  const { r: br, c: bc } = b;
  const t = board[ar][ac];
  board[ar][ac] = board[br][bc];
  board[br][bc] = t;
  const has = hasAnyMatch(board, rows, cols);
  board[br][bc] = board[ar][ac];
  board[ar][ac] = t;
  return has;
}

export function hasAnyMatch(board, rows = ROWS, cols = COLS) {
  for (let r = 0; r < rows; r++) {
    let run = 1;
    for (let c = 1; c < cols; c++) {
      if (board[r][c] != null && board[r][c] === board[r][c - 1]) {
        run++;
        if (run >= 3) return true;
      } else {
        run = 1;
      }
    }
  }
  for (let c = 0; c < cols; c++) {
    let run = 1;
    for (let r = 1; r < rows; r++) {
      if (board[r][c] != null && board[r][c] === board[r - 1][c]) {
        run++;
        if (run >= 3) return true;
      } else {
        run = 1;
      }
    }
  }
  return false;
}

export function hasValidMove(board, rows = ROWS, cols = COLS) {
  const dirs = [
    [0, 1],
    [1, 0],
  ];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < rows && nc < cols) {
          if (swapCreatesMatch(board, { r, c }, { r: nr, c: nc }, rows, cols)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

export function areAdjacent(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

export function cloneBoard(board) {
  return board.map((row) => row.slice());
}
