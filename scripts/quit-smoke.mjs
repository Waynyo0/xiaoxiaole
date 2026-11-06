import { chromium } from 'playwright-core';

const EXE = 'C:\\Users\\WAYNY\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';
const browser = await chromium.launch({
  executablePath: EXE,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--disable-gpu'],
});
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.mouse.click(260, 782);
await page.waitForTimeout(400);

const state = await page.evaluate(() => {
  const s = window.game.scene.getScene('Menu');
  const modal = s.children.list.find((o) => o.type === 'Container' && o.depth === 400);
  return {
    hasModal: !!modal,
    texts: modal ? modal.list.filter((o) => o.type === 'Text').map((o) => o.text) : [],
  };
});
console.log('AFTER QUIT:', JSON.stringify(state));

await page.waitForTimeout(2800);
console.log('PAGE CLOSED:', page.isClosed());
if (!page.isClosed()) {
  const hint = await page.evaluate(() => {
    const s = window.game.scene.getScene('Menu');
    const modal = s.children.list.find((o) => o.type === 'Container' && o.depth === 400);
    return modal ? modal.list.filter((o) => o.type === 'Text').map((o) => o.text) : [];
  });
  console.log('AFTER 2.8S TEXTS:', JSON.stringify(hint));
}
console.log('ERRORS:', errors);
await browser.close();
