// Optional, dependency-free preparation tool; never needed by the app.
// Re-encode PNG filters/DEFLATE without changing a single decoded pixel or
// dropping metadata. Only replace files when the verified output is smaller.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';
import assert from 'node:assert/strict';

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});
function chunk(type, data) {
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length); result.write(type, 4); data.copy(result, 8);
  let crc = 0xffffffff;
  for (const byte of result.subarray(4, -4)) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4);
  return result;
}
function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
function predictor(filter, left, up, corner) {
  return [0, left, up, Math.floor((left + up) / 2), paeth(left, up, corner)][filter];
}
function decode(encoded, width, height, bpp) {
  const stride = width * bpp, pixels = Buffer.alloc(stride * height);
  assert.equal(encoded.length, (stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const filter = encoded[y * (stride + 1)]; assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x;
      pixels[i] = encoded[y * (stride + 1) + x + 1] + predictor(filter,
        x >= bpp ? pixels[i - bpp] : 0, y ? pixels[i - stride] : 0, y && x >= bpp ? pixels[i - stride - bpp] : 0);
    }
  }
  return pixels;
}
function encode(pixels, width, height, bpp) {
  const stride = width * bpp, output = Buffer.alloc((stride + 1) * height);
  const candidates = Array.from({ length: 5 }, () => Buffer.alloc(stride));
  for (let y = 0; y < height; y++) {
    const scores = [0, 0, 0, 0, 0];
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x;
      const left = x >= bpp ? pixels[i - bpp] : 0, up = y ? pixels[i - stride] : 0;
      const corner = y && x >= bpp ? pixels[i - stride - bpp] : 0;
      const predictions = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, corner)];
      for (let f = 0; f < 5; f++) {
        const value = (pixels[i] - predictions[f]) & 255;
        candidates[f][x] = value; scores[f] += Math.min(value, 256 - value);
      }
    }
    const best = scores.indexOf(Math.min(...scores));
    output[y * (stride + 1)] = best; candidates[best].copy(output, y * (stride + 1) + 1);
  }
  return output;
}
async function optimize(path) {
  const original = await readFile(path), chunks = [];
  for (let offset = 8; offset < original.length;) {
    const size = original.readUInt32BE(offset), end = offset + size + 12;
    chunks.push({ type: original.toString('ascii', offset + 4, offset + 8), data: original.subarray(offset + 8, end - 4), original: original.subarray(offset, end) });
    offset = end;
  }
  const header = chunks.find((c) => c.type === 'IHDR').data;
  const width = header.readUInt32BE(0), height = header.readUInt32BE(4);
  const bpp = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[header[9]];
  if (header[8] !== 8 || header[12] || !bpp || chunks.some((c) => c.type === 'acTL')) return { before: original.length, after: original.length };
  const encoded = inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)));
  const pixels = decode(encoded, width, height, bpp);
  const adaptive = encode(pixels, width, height, bpp);
  assert.ok(decode(adaptive, width, height, bpp).equals(pixels), `${path}: exact pixel verification`);
  const compressed = [deflateSync(encoded, { level: 9 }), deflateSync(adaptive, { level: 9 })].sort((a, b) => a.length - b.length)[0];
  assert.ok(decode(inflateSync(compressed), width, height, bpp).equals(pixels));
  let inserted = false;
  const pieces = [original.subarray(0, 8)];
  for (const c of chunks) {
    if (c.type !== 'IDAT') pieces.push(c.original);
    else if (!inserted) { pieces.push(chunk('IDAT', compressed)); inserted = true; }
  }
  const result = Buffer.concat(pieces);
  if (result.length < original.length) await writeFile(path, result);
  return { before: original.length, after: Math.min(original.length, result.length) };
}
async function* files(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (entry.name.endsWith('.png')) yield path;
  }
}
let before = 0, after = 0, count = 0;
for (const directory of process.argv.slice(2)) for await (const path of files(directory)) {
  const result = await optimize(path); before += result.before; after += result.after; count++;
  console.log(`${path}: ${result.before} -> ${result.after} bytes; pixels unchanged`);
}
console.log(JSON.stringify({ files: count, before, after, saved: before - after }));
