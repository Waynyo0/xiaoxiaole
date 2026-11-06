import test from 'node:test';
import assert from 'node:assert/strict';
import { findMatches } from '../src/core/match.js';
import { computeRoundScore, computeStars } from '../src/core/score.js';
import { generateBoard, hasValidMove, applyGravity, cloneBoard } from '../src/core/board.js';
import { shuffleBoard } from '../src/core/shuffle.js';
import { clear3x3, clearRow } from '../src/core/props.js';
import { createRng } from '../src/core/rng.js';

test('十字形是一个组，5 个唯一格，交叉奖励', () => {
  // 十字：中心在 (1,1)，横向 0,1,2 和纵向 0,1,2 都是类型 1
  const board = [
    [2, 1, 3, 4, 5],
    [1, 1, 1, 2, 3],
    [4, 1, 5, 1, 2],
    [5, 4, 3, 2, 1],
    [3, 5, 4, 1, 2],
    [2, 3, 5, 4, 1],
    [1, 2, 3, 5, 4],
    [4, 1, 2, 3, 5],
  ];
  const groups = findMatches(board);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].count, 5);
  assert.equal(groups[0].intersection, true);
  // 基础 50 + 交叉 20 = 70
  assert.equal(computeRoundScore(groups, 1), 70);
});

function baseBoard() {
  // (r+c)%6 保证无三连
  const board = [];
  for (let r = 0; r < 8; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) row.push((r + c) % 6);
    board.push(row);
  }
  return board;
}

test('两个互不相连的三连分别成组', () => {
  const board = baseBoard();
  board[0][0] = 1;
  board[0][1] = 1;
  board[0][2] = 1;
  board[3][0] = 2;
  board[3][1] = 2;
  board[3][2] = 2;
  const groups = findMatches(board);
  assert.equal(groups.length, 2);
  // 3+3 = 60，无奖励
  assert.equal(computeRoundScore(groups, 1), 60);
});

test('4 连 + 交叉 3（6 唯一格）= 100', () => {
  const board = baseBoard();
  // 横向 4 连在 row1 col0-3 = 1，纵向 3 连在 col1 row0-2 = 1
  for (let c = 0; c < 4; c++) board[1][c] = 1;
  board[0][1] = 1;
  board[1][1] = 1;
  board[2][1] = 1;
  const groups = findMatches(board);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].count, 6);
  assert.equal(groups[0].maxRun, 4);
  assert.equal(groups[0].intersection, true);
  // 6*10 + 20 + 20 = 100
  assert.equal(computeRoundScore(groups, 1), 100);
});

test('生成棋盘无初始三连且至少一步可走', () => {
  const rng = createRng(42);
  for (let i = 0; i < 50; i++) {
    const board = generateBoard(rng);
    assert.equal(findMatches(board).length, 0);
    assert.equal(hasValidMove(board), true);
  }
});

test('重力下落补位保持行数', () => {
  const rng = createRng(7);
  const board = [
    [1, 0, 0, 0, 0],
    [0, 2, 0, 0, 0],
    [0, 0, 3, 0, 0],
    [0, 0, 0, 4, 0],
    [0, 0, 0, 0, 5],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
  ];
  applyGravity(board, rng);
  for (let c = 0; c < 5; c++) {
    for (let r = 0; r < 8; r++) assert.notEqual(board[r][c], null);
  }
});

test('洗牌保留棋子多重集', () => {
  const rng = createRng(99);
  const board = [
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
    [0, 0, 0, 0, 0],
    [1, 2, 3, 4, 5],
    [0, 1, 2, 3, 4],
    [5, 4, 3, 2, 1],
    [1, 1, 2, 2, 3],
  ];
  const before = {};
  board.flat().forEach((t) => (before[t] = (before[t] || 0) + 1));
  const after = shuffleBoard(cloneBoard(board), rng);
  const afterCount = {};
  after.flat().forEach((t) => (afterCount[t] = (afterCount[t] || 0) + 1));
  assert.deepEqual(before, afterCount);
  assert.equal(findMatches(after).length, 0);
  assert.equal(hasValidMove(after), true);
});

test('炸弹边缘裁剪', () => {
  const board = [
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 1],
    [3, 4, 5, 1, 2],
    [4, 5, 1, 2, 3],
    [5, 1, 2, 3, 4],
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 1],
    [3, 4, 5, 1, 2],
  ];
  const cleared = clear3x3(board, 0, 0);
  assert.equal(cleared.length, 4); // 角落 2x2
  const clearedCenter = clear3x3(board, 4, 2);
  assert.equal(clearedCenter.length, 9);
});

test('火箭清整行', () => {
  const board = [
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 1],
    [3, 4, 5, 1, 2],
    [4, 5, 1, 2, 3],
    [5, 1, 2, 3, 4],
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 1],
    [3, 4, 5, 1, 2],
  ];
  const cleared = clearRow(board, 3);
  assert.equal(cleared.length, 5);
});

test('星级计算', () => {
  assert.equal(computeStars(600, [600, 900, 1200]), 1);
  assert.equal(computeStars(900, [600, 900, 1200]), 2);
  assert.equal(computeStars(1200, [600, 900, 1200]), 3);
  assert.equal(computeStars(599, [600, 900, 1200]), 0);
});
