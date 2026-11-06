import { chromium } from 'playwright-core';

const EXE = 'C:\\Users\\WAYNY\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';
const URL = 'http://localhost:5173/';

const errors = [];
const browser = await chromium.launch({
  executablePath: EXE,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--disable-gpu'],
});

const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text() + ' @ ' + (msg.location() && msg.location().url));
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: 'scripts/shot_menu.png' });
const menuInfo = await page.evaluate(() => {
  const menu = window.game.scene.getScene('Menu');
  const find = (key) => menu.children.list.find((o) => o.texture && o.texture.key === key);
  const hint = find('icon_18plus');
  const start = find('btn_start');
  const quit = find('btn_quit');
  return {
    hint: hint ? { x: hint.x, y: hint.y, ox: hint.originX, oy: hint.originY, w: hint.displayWidth, h: hint.displayHeight } : null,
    start: start ? { x: start.x, y: start.y } : null,
    quit: quit ? { x: quit.x, y: quit.y } : null,
  };
});
console.log('MENU LAYOUT:', JSON.stringify(menuInfo));
console.log('MENU ok');

await page.mouse.click(260, 688);
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/shot_levels.png' });
const levelLayout = await page.evaluate(() => {
  const s = window.game.scene.getScene('LevelSelect');
  const wanted = ['level_title', 'btn_back', 'icon_gear', 'bg_levels_frame', 'bg_levels_char', 'bg_levels_petals'];
  return s.children.list
    .filter((o) => o.texture && wanted.includes(o.texture.key))
    .map((o) => ({ key: o.texture.key, x: o.x, y: o.y, w: Math.round(o.displayWidth), h: Math.round(o.displayHeight) }));
});
console.log('LEVEL LAYOUT:', JSON.stringify(levelLayout));
console.log('LEVELSELECT ok');

await page.mouse.click(500, 52);
await page.waitForTimeout(400);
const settingsOpen = await page.evaluate(() => {
  const s = window.game.scene.getScene('LevelSelect');
  return s.children.list.some((o) => o.type === 'Container' && o.depth === 400);
});
await page.mouse.click(270, 588);
await page.waitForTimeout(400);
const settingsClosed = await page.evaluate(() => {
  const s = window.game.scene.getScene('LevelSelect');
  return !s.children.list.some((o) => o.type === 'Container' && o.depth === 400);
});
console.log('SETTINGS BACK:', settingsOpen, settingsClosed);

await page.mouse.click(110, 240);
await page.waitForTimeout(2200);
await page.screenshot({ path: 'scripts/shot_game.png' });
console.log('GAME ok');

const uiInfo = await page.evaluate(() => {
  const ui = window.game.scene.getScene('UI');
  const props = {};
  for (const k of ['rocket', 'clock', 'bomb']) props[k] = ui.propIcons[k].displayWidth;
  const a = ui.children.list.find((o) => o.texture && o.texture.key === 'assistant');
  const g = window.game.scene.getScene('Game');
  const tile = g.tiles.flat().find(Boolean);
  return {
    props,
    pieceSize: tile ? Math.round(tile.displayWidth) : null,
    assistant: a ? [a.x, a.y, a.displayWidth, a.displayHeight] : null,
    scoreRot: ui.scoreDigits.container.rotation,
    movesRot: ui.movesDigits.container.rotation,
    scorePos: [ui.scoreDigits.container.x, ui.scoreDigits.container.y],
    movesPos: [ui.movesDigits.container.x, ui.movesDigits.container.y],
    scoreDigitHeights: ui.scoreDigits.container.list.map((o) => Math.round(o.displayHeight)),
    movesDigitHeights: ui.movesDigits.container.list.map((o) => Math.round(o.displayHeight)),
  };
});
console.log('UI LAYOUT:', JSON.stringify(uiInfo));

const result = await page.evaluate(async () => {
  const g = window.game;
  const scene = g.scene.getScene('Game');
  const board = scene.board;
  const rows = board.length;
  const cols = board[0].length;

  const hasMatch = (b) => {
    for (let r = 0; r < rows; r++) {
      let run = 1;
      for (let c = 1; c < cols; c++) {
        if (b[r][c] != null && b[r][c] === b[r][c - 1]) { run++; if (run >= 3) return true; }
        else run = 1;
      }
    }
    for (let c = 0; c < cols; c++) {
      let run = 1;
      for (let r = 1; r < rows; r++) {
        if (b[r][c] != null && b[r][c] === b[r - 1][c]) { run++; if (run >= 3) return true; }
        else run = 1;
      }
    }
    return false;
  };

  const swapOk = (a, bb) => {
    const t = board[a.r][a.c];
    board[a.r][a.c] = board[bb.r][bb.c];
    board[bb.r][bb.c] = t;
    const ok = hasMatch(board);
    board[bb.r][bb.c] = board[a.r][a.c];
    board[a.r][a.c] = t;
    return ok;
  };

  const dirs = [[0, 1], [1, 0]];
  let move = null;
  outer: for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < rows && nc < cols && swapOk({ r, c }, { r: nr, c: nc })) {
          move = { a: { r, c }, b: { r: nr, c: nc } };
          break outer;
        }
      }
    }
  }
  if (!move) return { found: false };

  const beforeScore = scene.score;
  const beforeMoves = scene.moves;
  scene.trySwap(move.a, move.b);
  await new Promise((res) => setTimeout(res, 2500));
  return {
    found: true,
    move,
    beforeScore,
    beforeMoves,
    afterScore: scene.score,
    afterMoves: scene.moves,
    state: scene.state,
  };
});

console.log('SWAP RESULT:', JSON.stringify(result));
await page.screenshot({ path: 'scripts/shot_after.png' });

const afterSizes = await page.evaluate(() => {
  const g = window.game.scene.getScene('Game');
  const tiles = g.tiles.flat().filter(Boolean);
  const sizes = tiles.map((t) => Math.round(t.displayWidth));
  return { count: sizes.length, min: Math.min(...sizes), max: Math.max(...sizes) };
});
console.log('AFTER SWAP PIECE SIZES:', JSON.stringify(afterSizes));

console.log('--- ERRORS ---');
for (const e of errors) console.log(e);

await browser.close();
