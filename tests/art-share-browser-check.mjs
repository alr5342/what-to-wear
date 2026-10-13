// Actual PNG rendering/downloads; native-share calls are instrumented because a
// headless browser cannot verify an operating system's share sheet or target app.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(pathToFileURL(resolve(process.argv[2])).href);
const root = resolve('.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try { response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream'); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
let checks = 0;
const errors = [];
const check = (value, message) => { assert.ok(value, message); checks++; };
const artReady = (page) => page.locator('#character[data-art-ready="true"]').waitFor();
const cardReady = (page) => page.locator('#share-download').waitFor({ state: 'attached' }).then(() => page.waitForFunction(() => !document.querySelector('#share-download').disabled));
const pngSignature = Buffer.from([137,80,78,71,13,10,26,10]);

try {
  await mkdir('verification', { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${origin}/?dev&condition=sunny`); await artReady(page);
  check(await page.locator('#character canvas[data-item]').count() >= 3, 'illustrated PNG garment layers are used');
  check(await page.locator('#character svg').count() === 0, 'no geometric character renderer remains active');
  check(await page.locator('#condition-icon img').count() === 1, 'generated weather icon is used');
  await page.screenshot({ path: 'verification/checkpoint-4-laptop.png' });

  const artwork = await page.evaluate(async () => {
    const { drawIllustration, loadArt } = await import('./js/art.js');
    const { createRecommendation, analyzeForecast, WARDROBE, COLORS } = await import('./js/state.js');
    const forecasts = [
      { name: 'Hot / dry', highF: 90, lowF: 72, shortForecast: 'Sunny', precipProbability: 0, windSpeed: 5 },
      { name: 'Mild / dry', highF: 68, lowF: 62, shortForecast: 'Cloudy', precipProbability: 0, windSpeed: 5 },
      { name: 'Cool / shell', highF: 62, lowF: 48, shortForecast: 'Cloudy', precipProbability: 0, windSpeed: 5 },
      { name: 'Warm / rain', highF: 82, lowF: 64, shortForecast: 'Rain', precipProbability: 80, windSpeed: 20 },
      { name: 'Cold / snow', highF: 30, lowF: 20, shortForecast: 'Snow', precipProbability: 80, windSpeed: 20 },
      { name: 'Hot / cold night', highF: 90, lowF: 40, shortForecast: 'Sunny', precipProbability: 70, windSpeed: 20 },
    ];
    const gallery = document.createElement('canvas'); gallery.width = 1200; gallery.height = forecasts.length * 370;
    const g = gallery.getContext('2d'); g.fillStyle = '#f5efe2'; g.fillRect(0, 0, gallery.width, gallery.height);
    const counts = []; const pixelDifferences = []; const details = [];
    for (let row = 0; row < forecasts.length; row++) {
      const f = forecasts[row]; const eligible = analyzeForecast(f).eligible; const hashes = new Set(); const rendered = [];
      const base = createRecommendation(f, { location: { name: 'Test', lat: 40, lon: -74 }, date: '2026-10-12', today: '2026-10-12', random: () => 0 });
      for (let variant = 0; variant < 4; variant++) {
        const wearing = base.wearing.map((item) => ({ ...item, color: COLORS[0].value, colorIndex: 0 }));
        wearing.find((item) => item.category === 'top').itemId = eligible.top[Math.floor(variant / 2)];
        wearing.find((item) => item.category === 'bottom').itemId = eligible.bottom[variant % 2];
        const image = document.createElement('canvas'); image.width = 200; image.height = 300;
        await drawIllustration(image.getContext('2d'), wearing, 0, 0, 200, 300);
        if ([0, 3, 4].includes(row) && variant === 2) {
          const detail = document.createElement('canvas'); detail.width = 512; detail.height = 768;
          const d = detail.getContext('2d'); d.fillStyle = '#f5efe2'; d.fillRect(0, 0, 512, 768);
          const reviewWear = wearing.map((item) => ({ ...item, color: COLORS[item.category === 'top' ? 2 : item.category === 'bottom' ? 1 : 0].value }));
          await drawIllustration(d, reviewWear, 0, 0, 512, 768);
          details.push({ name: ['hot', '', '', 'rain', 'snow'][row], png: detail.toDataURL().split(',')[1] });
        }
        const pixels = image.getContext('2d').getImageData(0, 0, 200, 300).data; rendered.push(pixels);
        let hash = 2166136261;
        for (const byte of pixels) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
        hashes.add(hash);
        g.drawImage(image, variant * 300 + 50, row * 370 + 30);
        g.fillStyle = '#292d29'; g.font = '800 18px Nunito';
        g.fillText(f.name, variant * 300 + 18, row * 370 + 18);
        g.font = '700 15px Nunito';
        g.fillText(`${WARDROBE[wearing.find((i) => i.category === 'top').itemId].label} + ${WARDROBE[wearing.find((i) => i.category === 'bottom').itemId].label}`, variant * 300 + 18, row * 370 + 350);
      }
      counts.push({ name: f.name, combinations: hashes.size });
      let topChange = 0;
      for (let i = 0; i < rendered[0].length; i += 4) if (Math.abs(rendered[0][i]-rendered[2][i])+Math.abs(rendered[0][i+1]-rendered[2][i+1])+Math.abs(rendered[0][i+2]-rendered[2][i+2]) > 15) topChange++;
      pixelDifferences.push({ name: f.name, topChange });
    }
    const assets = [];
    for (const id of Object.keys(WARDROBE)) {
      const img = await loadArt(`garments/${id}.png`);
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d'); ctx.drawImage(img,0,0);
      const data = ctx.getImageData(0,0,c.width,c.height).data;
      let transparent=0, opaque=0; const tones=new Set();
      for(let i=0;i<data.length;i+=4) { if(data[i+3]===0) transparent++; if(data[i+3]>200) { opaque++; tones.add(data[i]); } }
      assets.push({id,transparent,opaque,tones:tones.size});
    }
    const wearing = [...document.querySelectorAll('#character [data-item]')].map((node) => ({ itemId: node.dataset.item, category: WARDROBE[node.dataset.item].category, colorIndex: Number(node.dataset.color), color: COLORS[Number(node.dataset.color)].value }));
    const dom = document.createElement('canvas'); dom.width=512; dom.height=768;
    for(const node of document.querySelectorAll('#character canvas')) dom.getContext('2d').drawImage(node,0,0);
    const exportArt = document.createElement('canvas'); exportArt.width=512; exportArt.height=768;
    await drawIllustration(exportArt.getContext('2d'),wearing,0,0,512,768);
    const a=dom.getContext('2d').getImageData(0,0,512,768).data; const b=exportArt.getContext('2d').getImageData(0,0,512,768).data;
    let mismatches=0;
    for(let i=0;i<a.length;i++) if(Math.abs(a[i]-b[i])>5) mismatches++;
    const colorHashes=[];
    for(const color of COLORS) {
      const canvas=document.createElement('canvas'); canvas.width=120;canvas.height=180;
      await drawIllustration(canvas.getContext('2d'),wearing.map((item)=>({...item,color:color.value})),0,0,120,180);
      colorHashes.push(canvas.toDataURL());
    }
    return { counts,pixelDifferences,assets,mismatches,colorCount:new Set(colorHashes).size,gallery:gallery.toDataURL().split(',')[1],details };
  });
  for (const row of artwork.counts) check(row.combinations === 4, `${row.name}: four genuinely different garment renders without color changes`);
  for (const row of artwork.pixelDifferences) check(row.topChange > 100, `${row.name}: selected top remains visibly distinct under outerwear`);
  for (const asset of artwork.assets) check(asset.transparent > 0 && asset.opaque > 1000 && asset.tones > 40, `${asset.id}: genuine alpha and illustrated shading`);
  check(artwork.mismatches === 0, 'DOM character and exported illustration share the same pixels within rounding tolerance');
  check(artwork.colorCount === 3, 'three distinct rendered palettes');
  await writeFile('verification/checkpoint-4-wardrobe.png', Buffer.from(artwork.gallery, 'base64'));
  for (const detail of artwork.details) await writeFile(`verification/checkpoint-4-fit-${detail.name}.png`, Buffer.from(detail.png, 'base64'));

  await page.locator('#share-btn').click(); await cardReady(page);
  check(await page.locator('#share-download').isVisible(), 'laptop offers image download');
  check(!await page.locator('#share-native').isVisible(), 'laptop does not offer native Share');
  const downloading = page.waitForEvent('download'); await page.locator('#share-download').click();
  const download = await downloading;
  check(/^outfit-austin-tx-\d{4}-\d{2}-\d{2}\.png$/.test(download.suggestedFilename()), 'PNG filename identifies selected place/date');
  await download.saveAs('verification/checkpoint-4-card.png');
  const png = await readFile('verification/checkpoint-4-card.png');
  check(png.subarray(0,8).equals(pngSignature), 'actual downloaded file is PNG');
  check(png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) >= 1000 && png.length > 30000, 'export has full resolution and illustration content');
  await page.screenshot({ path: 'verification/checkpoint-4-share-laptop.png' });
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:375,height:667});
  await page.goto(`${origin}/?dev&condition=sunny&high=90&low=72&precip=0&wind=5`); await artReady(page);
  await page.screenshot({ path: 'verification/checkpoint-4-phone.png' });
  await page.locator('#share-btn').click(); await cardReady(page);
  check(await page.locator('#share-download').isVisible(), 'unsupported phone has working download fallback');
  check(!await page.locator('#share-native').isVisible(), 'unsupported phone shows a single usable action');
  check(/Download your card/.test(await page.locator('#share-status').textContent()), 'unsupported sharing is explained');
  await page.screenshot({ path: 'verification/checkpoint-4-share-phone.png' });
  const fallbackDownload = page.waitForEvent('download'); await page.locator('#share-download').click();
  check((await fallbackDownload).suggestedFilename().endsWith('.png'), 'phone fallback starts a real PNG download');

  const native = await browser.newContext({ viewport: {width:375,height:667} });
  await native.addInitScript(() => {
    window.shareCalls=[]; window.shareMode='success';
    Object.defineProperty(navigator,'canShare',{value:(data)=>data.files?.[0]?.type==='image/png'});
    Object.defineProperty(navigator,'share',{value:(data)=>{
      window.shareCalls.push({name:data.files[0].name,type:data.files[0].type,size:data.files[0].size,activation:navigator.userActivation.isActive});
      if(window.shareMode==='cancel') return Promise.reject(new DOMException('Cancelled','AbortError'));
      if(window.shareMode==='failure') return Promise.reject(new DOMException('Blocked','NotAllowedError'));
      return Promise.resolve();
    }});
  });
  const phone = await native.newPage(); phone.on('pageerror',(error)=>errors.push(error.message));
  await phone.goto(`${origin}/?dev&condition=snow`); await artReady(phone);
  await phone.locator('#share-btn').click(); await cardReady(phone);
  check(await phone.locator('#share-native').isEnabled(), 'supported phone enables native Share after PNG preparation');
  check(!await phone.locator('#share-download').isVisible(), 'supported phone uses its primary native action');
  await phone.locator('#share-native').click();
  await phone.locator('#share-status').filter({hasText:'passed to the share sheet'}).waitFor();
  const call = await phone.evaluate(()=>window.shareCalls[0]);
  check(call.type==='image/png' && call.size>30000 && call.activation, 'native Share receives prepared PNG during the original user gesture');
  await phone.evaluate(()=>window.shareMode='cancel'); await phone.locator('#share-native').click();
  await phone.locator('#share-status').filter({hasText:'cancelled'}).waitFor();
  check(await phone.locator('#share-native').isEnabled(), 'cancelled sharing can be tried again');
  await phone.evaluate(()=>window.shareMode='failure'); await phone.locator('#share-native').click();
  await phone.locator('#share-status').filter({hasText:'Couldn’t share'}).waitFor();
  check(await phone.locator('#share-download').isVisible(), 'native failure exposes download recovery');
  await phone.keyboard.press('Escape'); await phone.evaluate(()=>window.shareMode='success');
  await phone.locator('#share-btn').click(); await cardReady(phone);
  check(await phone.locator('#share-native').isEnabled(), 'reopening resets a previous native-share failure');
  await native.close();

  const failed = await browser.newContext({viewport:{width:1280,height:900}});
  await failed.route('**/assets/art/icons/sunny.png',(route)=>route.abort());
  const broken=await failed.newPage(); await broken.goto(`${origin}/?dev&condition=sunny`); await artReady(broken);
  await broken.locator('#share-btn').click();
  await broken.locator('#share-status').filter({hasText:'Illustration could not load'}).waitFor();
  check(await broken.locator('#share-download').isDisabled(), 'failed image loading cannot export a partial or blank card');
  await broken.keyboard.press('Escape'); await failed.unroute('**/assets/art/icons/sunny.png');
  await broken.locator('#share-btn').click(); await cardReady(broken);
  check(await broken.locator('#share-download').isEnabled(), 'image-load failure can retry when card is reopened');
  await failed.close();
  check(errors.length===0, `no uncaught browser errors: ${errors.join('; ')}`);
  console.log(`Artwork/Share browser verification: ${checks} checks passed.`);
  console.log('Six weather profiles each rendered four distinct same-color outfits. Top pixel differences:', JSON.stringify(artwork.pixelDifferences));
  console.log('Screenshots/gallery/actual downloaded PNG: verification/checkpoint-4-*.png');
} finally {
  await browser?.close();
  await new Promise((done)=>server.close(done));
}
