const { open } = require('./harness');
const fs = require('fs');
(async () => {
  const { browser, page } = await open('/home/claude/aitu-party/task1/index.html');
  const out = {};
  for (let i = 1; i <= 20; i++) {
    await page.click(`#cases .case-btn:nth-child(${i})`);
    await page.waitForTimeout(i >= 18 ? 1700 : 200);
    out[i] = await page.evaluate(() => $('#result-text').html().replace(/<br>/, ' | ').replace(/<[^>]+>/g, ''));
  }
  fs.writeFileSync('/home/claude/aitu-party/screens/results.json', JSON.stringify(out, null, 1));
  await browser.close();
})();
