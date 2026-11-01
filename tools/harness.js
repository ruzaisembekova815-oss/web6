// shared helpers for testing / screenshots: routes the CDN + avatars offline
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs = require('fs');
const JQ = fs.readFileSync('/usr/share/javascript/jquery/jquery.min.js', 'utf8');
function face(seed) {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 360;
  const skin = ['#f2c9a0', '#d9a066', '#a8683c', '#7a4a2a', '#e8b98a'][h % 5];
  const hair = ['#2b1d14', '#5a3a22', '#111', '#8a4b1f'][h % 4];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="hsl(${h},55%,85%)"/><ellipse cx="50" cy="40" rx="26" ry="14" fill="${hair}"/><circle cx="50" cy="55" r="24" fill="${skin}"/><path d="M26 50 Q50 18 74 50 Q50 34 26 50Z" fill="${hair}"/><circle cx="41" cy="55" r="3" fill="#222"/><circle cx="59" cy="55" r="3" fill="#222"/><path d="M42 66 Q50 72 58 66" stroke="#222" stroke-width="2.5" fill="none"/><rect x="22" y="82" width="56" height="30" rx="14" fill="hsl(${(h+120)%360},40%,45%)"/></svg>`;
}
async function open(path, opts = {}) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: opts.w || 1180, height: opts.h || 1100 } });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await page.route('**/code.jquery.com/**', r => r.fulfill({ contentType: 'application/javascript', body: JQ }));
  await page.route('**/api.dicebear.com/**', r => {
    const seed = new URL(r.request().url()).searchParams.get('seed') || 'x';
    r.fulfill({ contentType: 'image/svg+xml', body: face(seed) });
  });
  await page.goto('file://' + path);
  await page.waitForTimeout(300);
  return { browser, page };
}
module.exports = { open };
