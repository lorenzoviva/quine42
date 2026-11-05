// Screenshots of a skin (T284): the landing and another page at 1920 px and on a phone (390 px), the icon at its sizes, and a short
// recording of what moves, as an animated PNG (APNG) put together from Chrome's own PNG frames, without decoding them. A headless Chrome
// of its own (cdp.mjs), only on a page of this machine.
//
//   node tools/vesti/cattura.mjs --url http://127.0.0.1:4185/site/index.html --cartella docs/design/vesti/futuristica [--veste futuristica]

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { checkLocal, launch, sleep, wearSkin } from './cdp.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : fallback;
};
const URL_PAGE = opt('url', 'http://127.0.0.1:4185/site/index.html');
const OUT = opt('cartella', 'docs/design/vesti/futuristica');
const SKIN = opt('veste', 'futuristica');
const FRAMES = Number(opt('fotogrammi', '20'));
/** The recording shows the first big letters, at the lettering's own size: wide enough to see the carpet and the lights, light enough for git. */
const CLIP_WIDTH = Number(opt('larghezza-registrazione', '300'));
checkLocal(URL_PAGE);
fs.mkdirSync(OUT, { recursive: true });

const DESKTOP = { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };

async function shot(page, file, { clip, format = 'jpeg' } = {}) {
  const { data } = await page.send('Page.captureScreenshot', { format, ...(format === 'jpeg' ? { quality: 80 } : {}), ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
  const bytes = Buffer.from(data, 'base64');
  if (file) {
    fs.writeFileSync(path.join(OUT, file), bytes);
    console.log(`scritto ${path.join(OUT, file)} (${(bytes.length / 1024).toFixed(0)} KB)`);
  }
  return bytes;
}

async function open(page, device, url, settle = 3000) {
  await page.send('Emulation.setDeviceMetricsOverride', device);
  await page.send('Emulation.setTouchEmulationEnabled', { enabled: device.mobile });
  await page.send('Page.navigate', { url });
  await sleep(settle);
}

const evaluate = async (page, expression) => (await page.send('Runtime.evaluate', { expression, returnByValue: true })).result.value;

/** The chunks of a PNG: type and data. */
function chunks(png) {
  const out = [];
  for (let at = 8; at < png.length; ) {
    const length = png.readUInt32BE(at);
    out.push({ type: png.toString('latin1', at + 4, at + 8), data: png.subarray(at + 8, at + 8 + length) });
    at += 12 + length;
  }
  return out;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([head.subarray(4), data])) >>> 0, 0);
  return Buffer.concat([head, data, crc]);
}

/** An animated PNG from PNG frames of the same size: each frame's compressed data as it is, its delay in milliseconds. */
function apng(frames) {
  const parsed = frames.map(({ png }) => chunks(png));
  const ihdr = parsed[0].find((c) => c.type === 'IHDR').data;
  for (const p of parsed) if (!p.find((c) => c.type === 'IHDR').data.equals(ihdr)) throw new Error('fotogrammi di misure o formati diversi');
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const parts = [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr)];
  const actl = Buffer.alloc(8);
  actl.writeUInt32BE(frames.length, 0);
  actl.writeUInt32BE(0, 4);
  parts.push(chunk('acTL', actl));
  let seq = 0;
  parsed.forEach((p, k) => {
    const fctl = Buffer.alloc(26);
    fctl.writeUInt32BE(seq++, 0);
    fctl.writeUInt32BE(width, 4);
    fctl.writeUInt32BE(height, 8);
    fctl.writeUInt32BE(0, 12);
    fctl.writeUInt32BE(0, 16);
    fctl.writeUInt16BE(Math.max(1, Math.round(frames[k].delay)), 20);
    fctl.writeUInt16BE(1000, 22);
    fctl.writeUInt8(0, 24);
    fctl.writeUInt8(0, 25);
    parts.push(chunk('fcTL', fctl));
    for (const c of p.filter((c) => c.type === 'IDAT')) {
      if (k === 0) parts.push(chunk('IDAT', c.data));
      else {
        const seqBuf = Buffer.alloc(4);
        seqBuf.writeUInt32BE(seq++, 0);
        parts.push(chunk('fdAT', Buffer.concat([seqBuf, c.data])));
      }
    }
  });
  parts.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}

const chrome = await launch({ width: 1920, height: 1080 });
const page = chrome.page;
try {
  await page.send('Page.enable');
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await wearSkin(page, URL_PAGE, SKIN);
  const landing = new URL(URL_PAGE).href;
  const cards = new URL('/site/carte.html', URL_PAGE).href;

  // The landing at 1920: the top, then further down where the stripes are.
  await open(page, DESKTOP, landing, 4000);
  await shot(page, 'landing-1920.jpg');
  await evaluate(page, 'window.scrollTo(0, 1000)');
  await sleep(1500);
  await shot(page, 'landing-1920-strisce.jpg');
  await evaluate(page, 'window.scrollTo(0, document.body.scrollHeight)');
  await sleep(1500);
  await shot(page, 'landing-1920-piede.jpg');

  // What moves: the lettering at the top of the hero, frame by frame.
  await evaluate(page, 'window.scrollTo(0, 0)');
  await sleep(1500);
  const box = await evaluate(page, `(() => { const r = document.querySelector('.fx-scritta')?.getBoundingClientRect(); return r && { x: r.x, y: r.y, width: Math.min(r.width, ${CLIP_WIDTH}), height: r.height }; })()`);
  if (box) {
    const frames = [];
    let last = Date.now();
    for (let k = 0; k < FRAMES; k++) {
      const png = await shot(page, undefined, { clip: box, format: 'png' });
      const now = Date.now();
      frames.push({ png, delay: 0 });
      if (k) frames[k - 1].delay = now - last;
      last = now;
      await sleep(60);
    }
    frames[frames.length - 1].delay = 100;
    const file = path.join(OUT, 'scritta-animata.png');
    fs.writeFileSync(file, apng(frames));
    console.log(`scritto ${file} (${frames.length} fotogrammi, ${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
  }

  // The icon at its sizes, on a light and on a dark ground.
  const icon = await evaluate(page, "document.getElementById('skin-icon')?.getAttribute('href')");
  if (icon) {
    await evaluate(
      page,
      `(() => { const box = document.createElement('div'); box.id = 'prova-icona'; box.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#ffffff;display:flex;flex-direction:column;gap:21px;padding:21px';
        for (const ground of ['#ffffff', '#202124']) { const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:21px;align-items:end;padding:13px;background:' + ground;
          for (const s of [16, 32, 48, 64, 128, 256]) { const i = new Image(); i.src = ${JSON.stringify(icon)}; i.width = s; i.height = s; row.append(i); } box.append(row); }
        document.body.append(box); return true; })()`,
    );
    await sleep(800);
    await shot(page, 'icona.png', { clip: { x: 0, y: 0, width: 700, height: 640 }, format: 'png' });
  }

  // The variant proposed to the author: no 3D stage, MarkovJunior everywhere.
  await open(page, DESKTOP, `${landing}${landing.includes('?') ? '&' : '?'}fx=mj-pagina`, 6000);
  await shot(page, 'variante-mj-pagina-1920.jpg');

  // Another page, at 1920.
  await open(page, DESKTOP, cards, 3000);
  await shot(page, 'carte-1920.jpg');

  // A phone.
  await open(page, PHONE, landing, 4000);
  await shot(page, 'landing-390.jpg');
  await evaluate(page, 'window.scrollTo(0, 1400)');
  await sleep(1500);
  await shot(page, 'landing-390-strisce.jpg');
  await open(page, PHONE, cards, 3000);
  await shot(page, 'carte-390.jpg');
} finally {
  await chrome.close();
}
