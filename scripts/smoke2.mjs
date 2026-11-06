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
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.mouse.click(260, 688);
await page.waitForTimeout(700);
await page.mouse.click(110, 240);
await page.waitForTimeout(2000);

await page.mouse.click(40, 40);
await page.waitForTimeout(400);
const paused1 = await page.evaluate(() => window.game.scene.isPaused('Game'));
await page.mouse.click(270, 696);
await page.waitForTimeout(500);
const paused2 = await page.evaluate(() => window.game.scene.isPaused('Game'));
console.log('PAUSE BACK:', paused1, paused2);

const r1 = await page.evaluate(async () => {
  const scene = window.game.scene.getScene('Game');
  const out = {};
  // 时钟
  const m0 = scene.moves;
  scene.useClock();
  await new Promise((res) => setTimeout(res, 400));
  out.clock = { before: m0, after: scene.moves };

  // 炸弹
  const s0 = scene.score;
  scene.armProp('bomb');
  scene.applyPropAt({ r: 4, c: 2 });
  await new Promise((res) => setTimeout(res, 1500));
  out.bomb = { before: s0, after: scene.score };

  // 结算（强制胜利）
  scene.score = 1000;
  scene.moves = 0;
  scene.saveCurrent();
  scene.settle();
  await new Promise((res) => setTimeout(res, 600));
  out.settle = { state: scene.state, stars: JSON.parse(localStorage.getItem('match3_save_v2')).stars[1], unlocked: JSON.parse(localStorage.getItem('match3_save_v2')).unlockedLevel };
  return out;
});
console.log('LEVEL1:', JSON.stringify(r1));

// �?5 �?OP 测试
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.mouse.click(260, 688);
await page.waitForTimeout(700);
await page.mouse.click(110, 240);
await page.waitForTimeout(2000);
const r2 = await page.evaluate(async () => {
  const scene = window.game.scene.getScene('Game');
  scene.levelId = 5;
  scene.level = { id: 5, target: 1500, stars: [1500, 2250, 3000] };
  scene.target = 1500;
  scene.score = 2000;
  scene.moves = 0;
  scene.saveCurrent();
  scene.settle();
  await new Promise((res) => setTimeout(res, 2600));
  const op = document.getElementById('op-video');
  const video = document.getElementById('op-video-el');
  return {
    opVisible: !op.classList.contains('hidden'),
    opWatched: JSON.parse(localStorage.getItem('match3_save_v2')).opWatched,
    playBtnExists: !!document.getElementById('op-play'),
    volume: video ? Number(video.volume.toFixed(3)) : null,
    paused: video ? video.paused : null,
  };
});
console.log('LEVEL5_OP:', JSON.stringify(r2));

console.log('--- ERRORS ---');
for (const e of errors) console.log(e);
await browser.close();
