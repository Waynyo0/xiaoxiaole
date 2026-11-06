import { COLS, ROWS } from '../data/config.js';

// 扫描匹配段并合并成组
// 返回组数组：[{ cells: [[r,c],...], maxRun, intersection }]
export function findMatches(board, rows = ROWS, cols = COLS) {
  const runs = [];

  // 横向
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const type = board[r][c];
      if (type == null) {
        c++;
        continue;
      }
      let end = c + 1;
      while (end < cols && board[r][end] === type) end++;
      if (end - c >= 3) {
        const cells = [];
        for (let k = c; k < end; k++) cells.push([r, k]);
        runs.push({ dir: 'h', cells, length: end - c });
      }
      c = end;
    }
  }

  // 纵向
  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      const type = board[r][c];
      if (type == null) {
        r++;
        continue;
      }
      let end = r + 1;
      while (end < rows && board[end][c] === type) end++;
      if (end - r >= 3) {
        const cells = [];
        for (let k = r; k < end; k++) cells.push([k, c]);
        runs.push({ dir: 'v', cells, length: end - r });
      }
      r = end;
    }
  }

  if (runs.length === 0) return [];

  // 并查集：共享格子的 run 合并
  const parent = runs.map((_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  const cellIndex = new Map();
  for (let i = 0; i < runs.length; i++) {
    for (const [r, c] of runs[i].cells) {
      const key = r + ',' + c;
      if (!cellIndex.has(key)) cellIndex.set(key, []);
      cellIndex.get(key).push(i);
    }
  }
  for (const idxs of cellIndex.values()) {
    for (let k = 1; k < idxs.length; k++) union(idxs[0], idxs[k]);
  }

  const groupsMap = new Map();
  for (let i = 0; i < runs.length; i++) {
    const root = find(i);
    if (!groupsMap.has(root)) groupsMap.set(root, []);
    groupsMap.get(root).push(i);
  }

  const groups = [];
  for (const idxs of groupsMap.values()) {
    const cellSet = new Set();
    let maxRun = 0;
    let hasH = false;
    let hasV = false;
    for (const i of idxs) {
      const run = runs[i];
      maxRun = Math.max(maxRun, run.length);
      if (run.dir === 'h') hasH = true;
      else hasV = true;
      for (const [r, c] of run.cells) cellSet.add(r + ',' + c);
    }
    const cells = [...cellSet].map((k) => k.split(',').map(Number));
    groups.push({
      cells,
      count: cells.length,
      maxRun,
      intersection: hasH && hasV,
    });
  }

  return groups;
}

export function collectClearSet(groups) {
  const set = new Set();
  for (const g of groups) {
    for (const [r, c] of g.cells) set.add(r + ',' + c);
  }
  return [...set].map((k) => k.split(',').map(Number));
}
