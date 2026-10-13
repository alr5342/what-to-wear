// Generated illustration pixels, shared by DOM layers and the exported outfit card.
// Coordinates are fitting metadata for a 1024×1536 master, not drawn garment shapes.
const ART_ROOT = new URL('../assets/art/', import.meta.url);
const images = new Map();
const tints = new Map();
const fittedTops = new WeakMap();
const clippedNecks = new WeakMap();
const FIT = {
  tee: [283, 280, 446, 460],
  longsleeve: [278, 280, 466, 515],
  sweater: [270, 280, 480, 515],
  shorts: [359, 710, 310, 228],
  chinos: [357, 710, 315, 655],
  joggers: [342, 710, 345, 650],
  sneakers: [317, 1300, 435, 175],
  ankleboots: [317, 1240, 435, 235],
  winterboots: [317, 1220, 435, 255],
  shell: [258, 280, 520, 540],
  coat: [250, 280, 535, 550],
  sunhat: [305, 5, 414, 145],
  beanie: [373, 10, 270, 145],
};
const DEFAULT_WEARING = [
  { category: 'top', itemId: 'tee', colorIndex: 0, color: '#405b86' },
  { category: 'bottom', itemId: 'shorts', colorIndex: 0, color: '#405b86' },
  { category: 'footwear', itemId: 'sneakers', colorIndex: 0, color: '#405b86' },
];

export function loadArt(path) {
  if (!images.has(path)) {
    const pending = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { images.delete(path); reject(new Error('Illustration could not load. Please reload and try again.')); };
      img.src = new URL(path, ART_ROOT).href;
    });
    images.set(path, pending);
  }
  return images.get(path);
}

async function tintedGarment(item) {
  const key = `${item.itemId}:${item.color}`;
  if (!tints.has(key)) tints.set(key, (async () => {
    const img = await loadArt(`garments/${item.itemId}.png`);
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const target = [1, 3, 5].map((offset) => parseInt(item.color.slice(offset, offset + 2), 16));
    const ink = [31, 27, 25];
    const highlight = [255, 247, 231];
    for (let i = 0; i < pixels.data.length; i += 4) {
      if (!pixels.data[i + 3]) continue;
      const luminance = (pixels.data[i] * .2126 + pixels.data[i + 1] * .7152 + pixels.data[i + 2] * .0722) / 255;
      // Map original shading through ink → fabric → highlight; alpha and grain survive.
      const amount = Math.min(1, luminance <= .62 ? luminance / .62 : (luminance - .62) / .38);
      const from = luminance <= .62 ? ink : target;
      const to = luminance <= .62 ? target : highlight;
      for (let channel = 0; channel < 3; channel++) pixels.data[i + channel] = Math.round(from[channel] + (to[channel] - from[channel]) * amount);
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  })().catch((error) => { tints.delete(key); throw error; }));
  return tints.get(key);
}

function layersFor(wearing) {
  const chosen = wearing.length ? wearing : DEFAULT_WEARING;
  const layers = [{ category: 'base', path: 'base.png', rect: [0, 0, 1024, 1536] }];
  // Trouser hems cover boot shafts. Hands stay behind cuffs, rather than being
  // pasted over sleeves; the original skin pixels already live in the base.
  for (const category of ['footwear', 'bottom', 'top', 'outerwear']) {
    const item = chosen.find((entry) => entry.category === category);
    if (item) layers.push({ category, item, rect: FIT[item.itemId],
      // Hide the underlying shirt's sleeves outside the outer garment silhouette.
      clip: category === 'top' && chosen.some((entry) => entry.category === 'outerwear') ? [400, 280, 230, 500] : null,
    });
  }
  // The back of a garment's illustrated collar belongs behind the neck.
  // Reuse only skin from the master; exclude its original gray shirt collar.
  layers.push({ category: 'neck', path: 'base.png', rect: [0, 0, 1024, 1536],
    clipPoints: [[467,246],[535,246],[537,285],[547,299],[558,307],[551,316],
      [532,326],[511,330],[485,328],[465,321],[450,307],[462,299],[466,287]],
  });
  const hat = chosen.find((entry) => entry.category === 'accessory');
  if (hat) layers.push({ category: 'accessory', item: hat, rect: FIT[hat.itemId] });
  return layers;
}

async function paintLayer(ctx, layer) {
  const image = layer.item ? await tintedGarment(layer.item) : await loadArt(layer.path);
  paintImage(ctx, image, layer);
}

function paintImage(ctx, image, layer) {
  ctx.save();
  if (layer.clip) { ctx.beginPath(); ctx.rect(...layer.clip); ctx.clip(); }
  if (layer.clipPoints) {
    // Mask at source resolution so DOM and export use identical edge pixels.
    if (!clippedNecks.has(image)) {
      const neck = document.createElement('canvas'); neck.width = 1024; neck.height = 1536;
      const n = neck.getContext('2d'); n.beginPath();
      layer.clipPoints.forEach(([x, y], index) => index ? n.lineTo(x, y) : n.moveTo(x, y));
      n.closePath(); n.clip(); n.drawImage(image, 0, 0);
      clippedNecks.set(image, neck);
    }
    image = clippedNecks.get(image);
  }
  if (['longsleeve', 'sweater'].includes(layer.item?.itemId)) {
    // The atlas has almost equal shirt/cuff lengths. Fit the torso hem to the
    // waist independently of the wrists, with a continuous strip warp.
    const [x, y, width, height] = layer.rect;
    if (!fittedTops.has(image)) {
      // Compose integer-width columns once at master resolution. Overlapping
      // translucent strips at display scale would leave visible vertical seams.
      const fitted = document.createElement('canvas');
      fitted.width = width; fitted.height = height;
      const fit = fitted.getContext('2d');
      for (let i = 0; i < width; i++) {
        const fraction = (i + .5) / width;
        const torso = Math.max(0, Math.min(1, (fraction - .17) / .08, (.83 - fraction) / .08));
        fit.drawImage(image, i * image.width / width, 0, image.width / width, image.height,
          i, 0, 1, height - torso * 55);
      }
      fittedTops.set(image, fitted);
    }
    ctx.drawImage(fittedTops.get(image), x, y);
  } else ctx.drawImage(image, ...layer.rect);
  ctx.restore();
}

export function renderIllustration(container, wearing) {
  const layers = layersFor(wearing);
  const nodes = layers.map((layer) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 768;
    canvas.className = `layer layer-${layer.category}`;
    canvas.setAttribute('aria-hidden', 'true');
    if (layer.item) {
      canvas.dataset.item = layer.item.itemId;
      canvas.dataset.color = String(layer.item.colorIndex);
    }
    return canvas;
  });
  container.replaceChildren(...nodes);
  container.dataset.artReady = 'false';
  delete container.dataset.artError;
  container.artReady = Promise.all(layers.map((layer, index) => {
    const ctx = nodes[index].getContext('2d');
    ctx.scale(.5, .5);
    return paintLayer(ctx, layer);
  })).then(() => {
    // A subsequent render may have replaced these nodes while assets loaded.
    if (container.firstChild === nodes[0]) container.dataset.artReady = 'true';
  });
  container.artReady.catch((error) => {
    if (container.firstChild === nodes[0]) { container.dataset.artError = error.message; container.setAttribute('aria-label', error.message); }
  });
}

export async function drawIllustration(ctx, wearing, x, y, width, height) {
  const layers = layersFor(wearing);
  const resolved = await Promise.all(layers.map((layer) => layer.item ? tintedGarment(layer.item) : loadArt(layer.path)));
  ctx.save(); ctx.translate(x, y); ctx.scale(width / 1024, height / 1536);
  layers.forEach((layer, index) => paintImage(ctx, resolved[index], layer));
  ctx.restore();
}

export function illustratedIcon(name, className = 'icon') {
  const img = document.createElement('img');
  img.className = className;
  img.src = new URL(`icons/${name}.png`, ART_ROOT).href;
  img.alt = ''; img.setAttribute('aria-hidden', 'true'); img.draggable = false;
  return img;
}
