// Generates assets/icon.ico (and icon.png) — a simple calendar glyph on a blue
// field. No external image libraries required.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 256;

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// Build RGBA pixel buffer.
const px = Buffer.alloc(SIZE * SIZE * 4);
function setPixel(x, y, r, g, b, a) {
  const i = (y * SIZE + x) * 4;
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
}

// Background gradient-ish blue.
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const t = y / SIZE;
    setPixel(x, y, Math.round(10 + 20 * t), Math.round(102 - 30 * t), Math.round(194 - 40 * t), 255);
  }
}

// Draw a white calendar body in the center.
const m = 52;
for (let y = m + 20; y < SIZE - m; y++) {
  for (let x = m; x < SIZE - m; x++) {
    setPixel(x, y, 255, 255, 255, 255);
  }
}
// Red header band.
for (let y = m; y < m + 34; y++) {
  for (let x = m; x < SIZE - m; x++) {
    setPixel(x, y, 209, 36, 47, 255);
  }
}
// Two binding rings above the header.
for (const cx of [m + 40, SIZE - m - 40]) {
  for (let y = m - 16; y < m + 8; y++) {
    for (let x = cx - 6; x < cx + 6; x++) setPixel(x, y, 60, 60, 70, 255);
  }
}
// Grid lines inside the body.
const gridTop = m + 44;
const gridBottom = SIZE - m - 10;
const gridLeft = m + 12;
const gridRight = SIZE - m - 12;
for (let i = 1; i < 4; i++) {
  const yy = gridTop + Math.round(((gridBottom - gridTop) * i) / 4);
  for (let x = gridLeft; x < gridRight; x++) setPixel(x, yy, 200, 208, 220, 255);
}
for (let i = 1; i < 5; i++) {
  const xx = gridLeft + Math.round(((gridRight - gridLeft) * i) / 5);
  for (let y = gridTop; y < gridBottom; y++) setPixel(xx, y, 200, 208, 220, 255);
}
// Highlight one archived day cell.
for (let y = gridTop + 2; y < gridTop + Math.round((gridBottom - gridTop) / 4) - 2; y++) {
  for (let x = gridLeft + Math.round(((gridRight - gridLeft) * 3) / 5) + 2; x < gridLeft + Math.round(((gridRight - gridLeft) * 4) / 5) - 2; x++) {
    setPixel(x, y, 10, 102, 194, 255);
  }
}

// Encode PNG.
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0; // filter none
  px.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);

// Wrap PNG in an ICO container (Vista+ supports PNG-compressed icons).
const dir = Buffer.alloc(6);
dir.writeUInt16LE(0, 0);
dir.writeUInt16LE(1, 2);
dir.writeUInt16LE(1, 4);
const entry = Buffer.alloc(16);
entry[0] = 0; // 256
entry[1] = 0; // 256
entry[2] = 0;
entry[3] = 0;
entry.writeUInt16LE(1, 4); // planes
entry.writeUInt16LE(32, 6); // bpp
entry.writeUInt32LE(png.length, 8);
entry.writeUInt32LE(22, 12); // offset
const ico = Buffer.concat([dir, entry, png]);

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });
fs.writeFileSync(path.join(assetsDir, 'icon.png'), png);
fs.writeFileSync(path.join(assetsDir, 'icon.ico'), ico);
console.log('Wrote assets/icon.png and assets/icon.ico');
