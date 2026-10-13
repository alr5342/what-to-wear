// Prepare PNG before a Share tap: native sharing needs transient user activation.
import { drawIllustration, loadArt } from './art.js';

function wrapText(ctx, text, width) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if (!word) continue;
    if (ctx.measureText(line ? `${line} ${word}` : word).width > width) {
      if (line) { lines.push(line); line = ''; }
      // Long unbroken place names must not disappear beyond the card edge.
      let fragment = '';
      for (const character of word) {
        if (ctx.measureText(fragment + character).width > width && fragment) { lines.push(fragment); fragment = ''; }
        fragment += character;
      }
      line = fragment;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

export async function createOutfitPNG(state, { background = '#f4efe5', ink = '#292d29', softInk = '#565b51' } = {}) {
  if (!state) throw new Error('Load a forecast before creating an outfit card.');
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  const font = (weight, size) => `${weight} ${size}px Nunito, sans-serif`;
  const blocks = [
    { text: state.headline.text, size: 60, weight: 900, gap: 34, color: ink },
    { text: state.conditionLabel, size: 34, weight: 800, gap: 25, color: softInk },
    { text: state.location.name, size: 32, weight: 800, gap: 12, color: softInk },
    { text: state.dateLong, size: 30, weight: 800, gap: 12, color: softInk },
  ];
  for (const block of blocks) { ctx.font = font(block.weight, block.size); block.lines = wrapText(ctx, block.text, 570); }
  const textHeight = blocks.reduce((height, block) => height + block.lines.length * block.size * 1.22 + block.gap, 140);
  canvas.height = Math.max(1000, Math.ceil(textHeight + 200));
  ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = ink; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(16, 16, 1168, canvas.height - 32, 40); ctx.stroke();
  await drawIllustration(ctx, state.wearing, 38, (canvas.height - 810) / 2, 540, 810);
  const weatherIcon = await loadArt(`icons/${state.condition}.png`);
  let y = (canvas.height - textHeight) / 2;
  ctx.textBaseline = 'top';
  blocks.forEach((block, index) => {
    ctx.font = font(block.weight, block.size); ctx.fillStyle = block.color;
    for (const line of block.lines) { ctx.fillText(line, 585, y); y += block.size * 1.22; }
    y += block.gap;
    if (index === 0) {
      ctx.drawImage(weatherIcon, 585, y, 82, 82);
      ctx.font = font(900, 70); ctx.fillStyle = ink;
      ctx.fillText(`${state.tempF}°F`, 686, y + 4); y += 115;
    }
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the image. Please try again.')), 'image/png');
  });
}

export function initShareActions() {
  const dialog = document.getElementById('share-dialog');
  const nativeButton = document.getElementById('share-native');
  const downloadButton = document.getElementById('share-download');
  const status = document.getElementById('share-status');
  const phone = window.matchMedia('(max-width: 799.98px)');
  let state = null;
  let file = null;
  let version = 0;
  let busy = false;
  let fallback = false;

  function supportsFileShare() {
    try { return Boolean(file && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })); }
    catch { return false; }
  }
  function buttons() {
    nativeButton.hidden = fallback;
    nativeButton.disabled = !file || busy || fallback || !supportsFileShare();
    downloadButton.disabled = !file || busy;
    downloadButton.classList.toggle('share-fallback', fallback && phone.matches);
  }
  async function prepare() {
    const request = ++version;
    const selected = state;
    file = null; busy = true; fallback = false; buttons();
    status.textContent = 'Preparing your outfit image…';
    try {
      const style = getComputedStyle(document.getElementById('share-card'));
      const blob = await createOutfitPNG(selected, {
        background: style.backgroundColor,
        ink: style.getPropertyValue('--ink').trim() || '#292d29',
        softInk: style.getPropertyValue('--ink-soft').trim() || '#565b51',
      });
      if (request !== version || !dialog.open) return;
      const place = selected.location.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'location';
      file = new File([blob], `outfit-${place}-${selected.date}.png`, { type: 'image/png' });
      fallback = !supportsFileShare();
      status.textContent = phone.matches && fallback ? 'Image sharing isn’t supported here. Download your card instead.' : 'Your outfit image is ready.';
    } catch (error) {
      if (request !== version || !dialog.open) return;
      status.textContent = `${error.message} Close and reopen the card to retry.`;
    } finally {
      if (request === version) { busy = false; buttons(); }
    }
  }

  nativeButton.addEventListener('click', async () => {
    if (!file || busy) return;
    const request = version;
    busy = true; buttons();
    try {
      // No awaited image work before this call; retain the tap's user activation.
      await navigator.share({ files: [file], title: 'Your Outfit Card' });
      if (request !== version || !dialog.open) return;
      status.textContent = 'Your card was passed to the share sheet.';
    } catch (error) {
      if (request !== version || !dialog.open) return;
      if (error.name === 'AbortError') status.textContent = 'Share cancelled. Your card is still ready.';
      else { fallback = true; status.textContent = 'Couldn’t share the image. Download your card instead.'; }
    } finally { if (request === version) { busy = false; buttons(); } }
  });
  downloadButton.addEventListener('click', () => {
    if (!file || busy) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url; link.download = file.name;
    document.body.append(link); link.click(); link.remove();
    // Allow the browser to consume the URL before releasing it.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Download started.';
  });
  dialog.addEventListener('close', () => { version++; file = null; busy = false; buttons(); });
  phone.addEventListener('change', () => {
    buttons();
    if (file) status.textContent = phone.matches && fallback ? 'Image sharing isn’t supported here. Download your card instead.' : 'Your outfit image is ready.';
  });
  return {
    update(next) { state = next; if (dialog.open) prepare(); },
    open() { if (!state) return; dialog.showModal(); prepare(); },
  };
}
