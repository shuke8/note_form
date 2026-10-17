const path = require('path');
const { chromium } = require(process.env.PW_PATH || 'playwright');

const URL = process.env.COMPOSER_URL || 'http://127.0.0.1:8080/composer.html';
const results = [];

function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || '' });
}

async function openPage(browser, viewport, theme) {
  const ctx = await browser.newContext({ viewport, colorScheme: theme || 'light' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#scopeList .scope-row', { timeout: 15000 });
  return { ctx, page, errors };
}

async function fillToStep4(page) {
  await page.click('#scopeAll');
  await page.click('#nextBtn');
  await page.fill('#uzTitle', 'Suv ta’minoti vaqtincha to‘xtatiladi');
  await page.fill('#uzBody', '26-sentabr kuni 10:00 dan 16:00 gacha suv berilmaydi.');
  await page.fill('#ruTitle', 'Водоснабжение будет временно отключено');
  await page.fill('#ruBody', '26 сентября с 10:00 до 16:00 воды не будет.');
  await page.click('#nextBtn');
  await page.click('#nextBtn');
}

async function wizardFlow(browser) {
  const { ctx, page, errors } = await openPage(browser, { width: 1440, height: 900 });

  await page.click('#nextBtn');
  check('step1 blocks without scope', await page.isVisible('#scopeError'));
  check('step1 stays current', (await page.getAttribute('body', 'data-step')) === '1');

  await page.click('#scopeAll');
  check('rail shows scope value', (await page.textContent('#st1 .step-state-text')).includes('Respublika'));
  check('peek shows reach', (await page.textContent('#sideReach')).startsWith('~'));

  await page.click('#nextBtn');
  check('step2 opened', (await page.getAttribute('body', 'data-step')) === '2');
  check('step1 marked done', (await page.getAttribute('.stepper-item[data-step="1"]', 'data-done')) === 'true');

  await page.fill('#uzTitle', 'Sarlavha');
  check('preview title live', (await page.textContent('#pvTitle')) === 'Sarlavha');
  check('uz state not ok while body empty', (await page.getAttribute('#uzState', 'data-ok')) === 'false');
  await page.fill('#uzBody', 'Matn');
  check('uz state ok when filled', (await page.getAttribute('#uzState', 'data-ok')) === 'true');
  await page.fill('#ruTitle', 'Заголовок');
  await page.fill('#ruBody', 'Текст');
  await page.click('#pvRu');
  check('preview switches language', (await page.textContent('#pvTitle')) === 'Заголовок');

  await page.click('#nextBtn');
  check('step3 opened', (await page.getAttribute('body', 'data-step')) === '3');
  check('phone clock is a time', /^\d{2}:\d{2}$/.test(await page.textContent('#pvClock')));
  await page.click('[data-when="later"]');
  check('later reveals date/time', await page.isVisible('#whenLater'));
  await page.fill('#fTime', '18:30');
  check('phone clock follows scheduled time', (await page.textContent('#pvClock')) === '18:30');
  await page.click('[data-when="repeat"]');
  check('repeat reveals schedule', await page.isVisible('#whenRepeat'));
  check('months shown by default', await page.isVisible('#spanMonths'));
  await page.click('[data-span="range"]');
  check('range reveals dates', await page.isVisible('#spanRange'));
  await page.click('[data-when="now"]');

  await page.click('#nextBtn');
  check('step4 opened', (await page.getAttribute('body', 'data-step')) === '4');
  check('next says skip without files', (await page.textContent('#nextLabel')).includes('O‘tkazib'));
  await page.setInputFiles('#fFiles', { name: 'grafik.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2048) });
  check('file row rendered', (await page.locator('#fileList .file-row').count()) === 1);
  check('next label updates after file added', (await page.textContent('#nextLabel')) === 'Keyingi');
  await page.click('#fileList .file-row button');
  check('next label returns to skip after removal', (await page.textContent('#nextLabel')).includes('O‘tkazib'));

  await page.click('#nextBtn');
  check('step5 opened', (await page.getAttribute('body', 'data-step')) === '5');
  check('peek hidden on review', !(await page.isVisible('#peek')));
  check('review ready', (await page.getAttribute('#rcCard', 'data-ready')) === 'true');
  check('submit visible', await page.isVisible('#submitBtn'));

  await page.click('#submitBtn');
  await page.waitForSelector('#resultDialog[open]', { timeout: 5000 });
  check('result dialog opens', true);
  await page.keyboard.press('Escape');

  await page.click('.stepper-item[data-step="2"]');
  check('rail navigates back', (await page.getAttribute('body', 'data-step')) === '2');

  check('no console errors in flow', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

async function layout(browser, width, height, theme) {
  const { ctx, page, errors } = await openPage(browser, { width, height }, theme);
  await fillToStep4(page);
  for (const step of [1, 2, 3, 4]) {
    await page.click(`.stepper-item[data-step="${step}"]`);
    await page.waitForTimeout(350);
    const m = await page.evaluate(() => {
      const bar = document.getElementById('actions').getBoundingClientRect();
      const sec = document.querySelector('.step-sec:not([hidden])').getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        barInside: bar.left >= sec.left - 1 && bar.right <= sec.right + 1,
        barVisible: bar.bottom <= innerHeight + 1,
      };
    });
    check(`${width}px ${theme} step${step} no horizontal scroll`, m.overflow <= 0, 'overflow=' + m.overflow);
    check(`${width}px ${theme} step${step} action bar aligned`, m.barInside && m.barVisible, JSON.stringify(m));
  }
  if (width >= 900) {
    const peek = await page.evaluate(() => document.getElementById('peek').getBoundingClientRect().bottom <= innerHeight + 1);
    check(`${width}px ${theme} preview fits viewport`, peek);
  }
  check(`${width}px ${theme} no console errors`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true });
  try {
    await wizardFlow(browser);
    await layout(browser, 1440, 900, 'light');
    await layout(browser, 1440, 900, 'dark');
    await layout(browser, 1024, 768, 'light');
    await layout(browser, 390, 844, 'light');
    await layout(browser, 320, 640, 'light');
  } finally {
    await browser.close();
  }
  const failed = results.filter(r => !r.ok);
  results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : '  ' + r.detail)));
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
