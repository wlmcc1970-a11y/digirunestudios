// Store-only guard test: real hostnames served from LOCAL repo copies (no live traffic).
const { chromium } = require('/tmp/claude-0/node_modules/playwright');
const fs = require('fs'), path = require('path');
const APPS = {
  mercs:       { host: 'mercs.digirunestudios.com',       dir: '/home/claude/mercs',       target: 'https://digirunestudios.com/mercs/', pkg: 'com.digirunestudios.mercs' },
  twisted:     { host: 'twisted.digirunestudios.com',     dir: '/home/claude/twisted-app', target: 'https://digirunestudios.com/twisted/', pkg: 'com.digirunestudios.twisted' },
};
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1 PWAShell';
const SAFARI_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const PLAIN_UA = 'Mozilla/5.0 (Linux; Android 15; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

async function run(b, app, label, opts) {
  const a = APPS[app];
  const ctx = await b.newContext({ userAgent: opts.ua || PLAIN_UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const errors = [];
  await ctx.route('**/*', route => {
    const u = new URL(route.request().url());
    if (u.hostname === a.host) {
      let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(a.dir, p);
      if (fs.existsSync(f) && fs.statSync(f).isFile()) return route.fulfill({ status: 200, contentType: types[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
      return route.fulfill({ status: 404, body: 'nf' });
    }
    if (u.hostname === 'digirunestudios.com' || route.request().url() === a.target) return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>MARKETING</title>' });
    return route.abort(); // nothing else leaves the machine
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  if (app === 'twisted' && !opts.firstRun) await page.addInitScript(() => { try { localStorage.setItem('twisted_migrated_from_ghpages', '1'); } catch (e) {} });
  if (opts.standalone) await page.addInitScript(() => { const o = window.matchMedia.bind(window); window.matchMedia = q => /display-mode: standalone/.test(q) ? { matches: true, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} } : o(q); });
  if (opts.fakeRef) await page.addInitScript(r => { if (!sessionStorage.getItem('__r')) { sessionStorage.setItem('__r','1'); Object.defineProperty(Document.prototype, 'referrer', { get: () => r }); } }, opts.fakeRef);
  const url = 'https://' + a.host + (opts.path || '/') + (opts.query || '');
  await page.goto(url, { referer: opts.referer, waitUntil: 'domcontentloaded' }).catch(e => errors.push('goto ' + e.message));
  await page.waitForTimeout(1500);
  let final = page.url(), title = await page.title().catch(() => '?');
  let latchOk = null;
  if (opts.reloadPlain) { // second in-app page in the same tab, no referrer: latch must keep it
    await page.goto('https://' + a.host + '/', { waitUntil: 'domcontentloaded' }).catch(e => errors.push('goto2 ' + e.message));
    await page.waitForTimeout(1000); latchOk = !page.url().startsWith(a.target) && (await page.title()) !== 'MARKETING';
  }
  const ref = opts.fakeRef ? opts.fakeRef : opts.referer ? await page.evaluate(() => document.referrer).catch(() => '?') : '';
  await ctx.close();
  const bounced = final.startsWith(a.target) || title === 'MARKETING';
  const pass = (opts.expect === 'bounce') === bounced && (latchOk === null || latchOk);
  console.log((pass ? 'PASS' : 'FAIL'), app.padEnd(11), label.padEnd(34), bounced ? 'redirected' : 'stayed in app', latchOk === null ? '' : 'latch=' + latchOk, ref ? 'ref=' + ref : '', errors.length ? 'ERR:' + errors.slice(0, 2).join(' | ').slice(0, 160) : '');
  return pass;
}
// Real flow: inside the iOS shell, call the app's own translate hand-off, capture the URL it gives Safari,
// then open that URL in a fresh plain-Safari tab (no shell, no session flag): it must stay in the app.
async function handoff(b, app) {
  const a = APPS[app]; let sent = null;
  const ctx = await b.newContext({ userAgent: IOS_UA, viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.route('**/*', route => { const u = new URL(route.request().url()); if (u.hostname === a.host) { let p = u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname; const f = path.join(a.dir, p); if (fs.existsSync(f)) return route.fulfill({ status: 200, contentType: types[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); return route.fulfill({ status: 404, body: 'nf' }); } return route.abort(); });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.exposeFunction('__cap', u => { sent = u; });
  await page.addInitScript(() => { try { localStorage.setItem('twisted_migrated_from_ghpages', '1'); } catch (e) {} window.webkit = { messageHandlers: { openInSafari: { postMessage: u => window.__cap(u) }, translatePage: { postMessage: u => window.__cap(u) } } }; });
  await page.goto('https://' + a.host + '/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
  await page.evaluate(() => window.xlSafariHandoff && window.xlSafariHandoff()); await page.waitForTimeout(300);
  await ctx.close();
  if (!sent) { console.log('FAIL', app.padEnd(11), 'translate hand-off', 'no URL captured', errs.join('|').slice(0, 150)); return false; }
  const ok = await run(b, app, 'opened hand-off URL in Safari', { expect: 'stay', ua: SAFARI_UA, query: new URL(sent).search });
  console.log('     ', app.padEnd(11), 'hand-off URL was', sent, errs.length ? 'ERR:' + errs.join('|').slice(0, 150) : '');
  return ok;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let all = true;
  for (const app of Object.keys(APPS)) {
    const pkg = 'android-app://' + APPS[app].pkg + '/';
    all &= await run(b, app, 'plain phone browser', { expect: 'bounce' });
    all &= await run(b, app, 'plain browser + deep link ?x=1', { expect: 'bounce', query: '?x=1' });
    all &= await run(b, app, 'iOS store app (PWAShell)', { expect: 'stay', ua: IOS_UA, reloadPlain: true });
    all &= await run(b, app, 'Android store app (referrer)', { expect: 'stay', fakeRef: pkg, reloadPlain: true });
    all &= await run(b, app, 'installed app (standalone)', { expect: 'stay', standalone: true });
    all &= await run(b, app, 'launch marker ?app=android', { expect: 'stay', query: '?app=android' });
    all &= await run(b, app, 'privacy page, plain browser', { expect: 'stay', path: '/privacy.html' });
    all &= await run(b, app, 'Safari translate hand-off URL', { expect: 'stay', ua: SAFARI_UA, query: '?app=translate' });
    all &= await run(b, app, 'older MERCSApp shell label', { expect: 'stay', ua: 'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 MERCSApp' });
    all &= await run(b, app, 'plain iPhone Safari', { expect: 'bounce', ua: SAFARI_UA });
    all &= await handoff(b, app);
  }
  console.log(all ? 'ALL PASS' : 'SOME FAILED');
  await b.close();
})();
