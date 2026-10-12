import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const SKY = { r: 14, g: 165, b: 233 };
const WHITE = { r: 255, g: 255, b: 255 };

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function coverage(d) {
  return clamp01(0.5 - d);
}

function roundRectDist(px, py, r, half) {
  const qx = Math.abs(px) - (half - r);
  const qy = Math.abs(py) - (half - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function circleDist(px, py, r) {
  return Math.hypot(px, py) - r;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePNG(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 4)] = 0;
    rgba.copy(raw, y * (1 + size * 4) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function draw(size, { tile }) {
  const rgba = Buffer.alloc(size * size * 4);
  const half = size / 2;
  const corner = size * 0.21;
  const sun = size * 0.29;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5 - half;
      const py = y + 0.5 - half;
      const i = (y * size + x) * 4;
      const bgA = tile ? coverage(roundRectDist(px, py, corner, half)) : 1;
      if (bgA <= 0) continue;
      const sunA = coverage(circleDist(px, py, sun));
      const r = Math.round(((SKY.r + (WHITE.r - SKY.r) * sunA) * 255) / 255);
      const g = Math.round(((SKY.g + (WHITE.g - SKY.g) * sunA) * 255) / 255);
      const b = Math.round(((SKY.b + (WHITE.b - SKY.b) * sunA) * 255) / 255);
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = Math.round(clamp01(bgA) * 255);
    }
  }
  return encodePNG(size, rgba);
}

const targets = [
  ["icons/icon-192.png", 192, { tile: true }],
  ["icons/icon-512.png", 512, { tile: true }],
  ["icons/icon-maskable-512.png", 512, { tile: false }],
  ["icons/apple-touch-icon.png", 180, { tile: false }],
];

for (const [rel, size, opts] of targets) {
  const file = join(ROOT, "public", rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, draw(size, opts));
  console.log(`wrote public/${rel}`);
}
