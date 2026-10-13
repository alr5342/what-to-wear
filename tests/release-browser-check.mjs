// Release checks under a repository subpath, or against an explicit public URL.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(resolve(process.argv[2])).href);
const root = resolve('.'), prefix = '/project-3/';
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!pathname.startsWith(prefix)) { res.writeHead(404).end(); return; }
  const file = resolve(root, pathname.slice(prefix.length) || 'index.html');
  if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try { res.setHeader('Content-Type', types[extname(file)] ?? 'text/plain'); res.end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const url = process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ?? `http://127.0.0.1:${server.address().port}${prefix}`;
const browser = await chromium.launch({ headless: true });
const errors = [], checks = [], contrast = [];
function check(value, message) { assert.ok(value, message); checks.push(message); }
try {
  const context = await browser.newContext({ acceptDownloads: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => { if (response.url().startsWith(url) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  for (const size of [[320,568],[375,667],[390,844],[768,1024],[1280,900]]) {
    await page.setViewportSize({ width:size[0], height:size[1] });
    await page.goto(`${url}?dev&condition=sunny&high=90&low=40&wind=15&precip=70`);
    await page.locator('#character[data-art-ready="true"]').waitFor();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${size}: no horizontal overflow`);
    if (size[0] === 375) check(await page.locator('#share-btn').evaluate((node) => node.getBoundingClientRect().bottom <= innerHeight), '375x667 crowded layout keeps primary actions visible');
    await page.locator('#change-btn').click();
    await page.locator('input[name=forecast-date]:checked').focus(); await page.keyboard.press('ArrowRight');
    check(await page.locator('input[name=forecast-date]:checked').inputValue() === '1', `${size}: keyboard changes forecast date`);
    await page.keyboard.press('Escape');
    check(await page.locator('#change-btn').evaluate((node) => document.activeElement === node), `${size}: modal returns keyboard focus`);
    await page.locator('#share-btn').click();
    await page.waitForFunction(() => !document.querySelector('#share-download').disabled);
    check(await page.locator('#share-download').isVisible(), `${size}: image download fallback available`);
    check(await page.locator('.sheet-inner').last().evaluate((node) => node.scrollWidth <= node.clientWidth), `${size}: outfit card fits its sheet`);
    await page.keyboard.press('Escape');
    await page.locator('#info-btn').click(); await page.locator('#info-screen').waitFor({state:'visible'});
    check(await page.locator('.info-section').count() === 5 && await page.locator('.placeholder-text').count() === 0, `${size}: all five About sections completed`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${size}: About content fits`);
    check(await page.locator('#info-title').evaluate((node) => document.activeElement === node), `${size}: About heading receives focus`);
    await page.locator('#info-back').click(); await page.locator('#main-screen').waitFor({state:'visible'});
  }
  for (const condition of ['sunny','cloudy','rain','snow','storm']) {
    await page.goto(`${url}?dev&condition=${condition}`);
    await page.locator('#character[data-art-ready="true"]').waitFor();
    const sample = await page.evaluate(() => {
      const rgb = (value) => (value.match(/[\d.]+/g) ?? []).map(Number);
      const luminance = (color) => color.slice(0,3).map((v) => v / 255).map((v) => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((s,v,i) => s + v*[.2126,.7152,.0722][i],0);
      const ratio = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
      function background(node) {
        if (!node) return [255,255,255];
        const foreground = rgb(getComputedStyle(node).backgroundColor), alpha = foreground[3] ?? 1;
        const behind = background(node.parentElement);
        return foreground.slice(0,3).map((v,i) => v*alpha + behind[i]*(1-alpha));
      }
      return [...document.querySelectorAll('#headline,#temp,#condition-label,#weather-source,.wearing-item,.reminder,#share-btn,#change-btn')]
        .filter((node) => node.getClientRects().length)
        .map((node) => ({ label:node.id || node.className, ratio:ratio(rgb(getComputedStyle(node).color),background(node)) }));
    });
    contrast.push({ condition, minimum:Math.min(...sample.map((s)=>s.ratio)), samples:sample });
    check(sample.every((s) => s.ratio >= 3), `${condition}: visible text meets specified 3:1 contrast`);
  }
  await page.setViewportSize({width:375,height:667});
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  const zoom = await page.evaluate(() => ({ fits: document.documentElement.scrollWidth <= innerWidth,
    overflow: [...document.querySelectorAll('body *')].filter((node) => node.getClientRects().length && node.getBoundingClientRect().right > innerWidth + 1)
      .slice(0,12).map((node) => `${node.tagName}#${node.id}.${node.className}: ${Math.round(node.getBoundingClientRect().width)}px`) }));
  check(zoom.fits, `200% text sizing avoids horizontal overflow: ${JSON.stringify(zoom)}`);
  await page.locator('#info-btn').click(); await page.locator('#info-screen').waitFor({state:'visible'});
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '200% About text reflows');
  for (const href of ['assets/licenses/lucide-ISC.txt','assets/licenses/nunito-OFL.txt','location-config.json']) {
    check((await page.request.get(new URL(href,url).href)).ok(), `${href}: available under repository subpath`);
  }
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setEmulatedVisionDeficiency',{type:'deuteranopia'});
  await page.locator('#info-back').click(); await page.locator('#main-screen').waitFor({state:'visible'});
  await page.evaluate(() => document.documentElement.style.fontSize = '');
  await mkdir('verification',{recursive:true});
  await page.screenshot({path:'verification/checkpoint-5-color-vision.png',fullPage:true});
  await cdp.send('Emulation.setEmulatedVisionDeficiency',{type:'none'});
  await page.screenshot({path:'verification/checkpoint-5-phone.png',fullPage:true});
  check(errors.length === 0, `no page errors or local asset failures: ${errors.join('; ')}`);
  await writeFile('verification/checkpoint-5-release.json',JSON.stringify({url,checks:checks.length,contrast,errors},null,2)+'\n');
  console.log(`Release audit: ${checks.length} checks passed. Minimum text contrast ${Math.min(...contrast.map((c)=>c.minimum)).toFixed(2)}:1.`);
} finally { await browser.close(); await new Promise((done)=>server.close(done)); }
