// Build local PNG icons, without a network request or native image dependency.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}
for (const size of [192, 512]) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2;
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x / size, py = y / size;
      const radius = Math.hypot(px - .475, py - .5);
      const letter = radius > .145 && radius < .255 && !(px > .475 && Math.abs(py - .5) < .097);
      const dot = Math.hypot(px - .715, py - .675) < .047;
      const color = letter || dot ? [255, 252, 251] : [9, 63, 180];
      const offset = y * (size * 3 + 1) + 1 + x * 3;
      raw.set(color, offset);
    }
  }
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), png);
}
