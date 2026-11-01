// Makes all screenshots for the report into ../screens.  Usage: node tools/screenshots.js
const { open } = require('./harness');
const path = require('path');
const S = path.join(__dirname, '..', 'screens') + '/';
const T1 = path.join(__dirname, '..', 'task1', 'index.html');
const T2 = path.join(__dirname, '..', 'task2', 'index.html');
const CLIP = { x: 40, y: 255, width: 1100, height: 600 };
(async () => {
  // ---------------- Task 1 ----------------
  let { browser, page } = await open(T1, { h: 1000 });
  const wait = ms => page.waitForTimeout(ms);
  for (let i = 1; i <= 20; i++) {
    await page.click(`#cases .case-btn:nth-child(${i})`);
    await wait(i === 18 || i === 19 ? 1800 : 700);
    // the result panel height changes with the chain, so clip from the panel's result row
    const y = await page.evaluate(() => Math.round($('#result').offset().top) - 14);
    await page.screenshot({ path: S + `t1_case_${String(i).padStart(2, '0')}.png`,
      clip: { x: 40, y, width: 1100, height: 1000 - y } });
  }
  await page.screenshot({ path: S + 't1_full.png' });
  await browser.close();

  // ---------------- Task 2 ----------------
  ({ browser, page } = await open(T2, { h: 1000 }));
  const w2 = ms => page.waitForTimeout(ms);
  const shot = (n, clip) => page.screenshot({ path: S + n + '.png', ...(clip ? { clip } : {}) });
  const FULL = { x: 40, y: 0, width: 1100, height: 900 };

  await page.click('#cases .case-btn:nth-child(3)'); await w2(700);
  await shot('t2_spotlight_case3', FULL);
  await page.click('#cases .case-btn:nth-child(14)'); await w2(700);
  await shot('t2_spotlight_rooms_case14', FULL);
  await page.click('#clear'); await w2(700);
  await shot('t2_clear', FULL);

  await page.click('.guest[data-name="Timur"]'); await w2(110);
  await shot('t2_card_growing', FULL);
  await w2(500);
  await shot('t2_card_open', FULL);
  await page.keyboard.press('Escape'); await w2(120);
  await shot('t2_card_shrinking', FULL);
  await w2(500);
  await shot('t2_card_closed', FULL);

  await page.click('.guest[data-name="Arman"]'); await w2(500);
  await page.click('.profile .move-btn[data-room="balcony"]'); await w2(700);
  await shot('t2_move_flying', FULL);
  await w2(1500);
  await shot('t2_move_done', FULL);
  await page.click('#cases .case-btn:nth-child(1)'); await w2(700);
  await shot('t2_move_case1', FULL);
  await page.click('#clear'); await w2(500);

  await page.click('#room-living .sort-btn'); await w2(300);
  await shot('t2_sort_sliding', FULL);
  await w2(900);
  await shot('t2_sort_sorted', FULL);
  await page.click('#room-living .sort-btn'); await w2(1000);
  await shot('t2_sort_back', FULL);

  for (let i = 0; i < 5; i++) { await page.click('#room-kitchen .sort-btn'); await w2(60); }
  await w2(1100);
  await shot('t2_sort_fast', FULL);
  await browser.close();
  console.log('done');
})();
