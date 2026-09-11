import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(size) {
  // A clean branded icon: indigo background with rounded feel and a stylized pen/form check
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 72, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData.writeUInt8(8, 8);       // bit depth
  ihdrData.writeUInt8(6, 9);       // color type (RGBA)
  ihdrData.writeUInt8(0, 10);      // compression method
  ihdrData.writeUInt8(0, 11);      // filter method
  ihdrData.writeUInt8(0, 12);      // interlace method
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data: (1 filter byte + size * 4 bytes) per scanline
  const scanlineWidth = 1 + size * 4;
  const rawData = Buffer.alloc(scanlineWidth * size);

  const radius = size * 0.22;
  const center = size / 2;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * scanlineWidth;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Rounded rectangle mask
      const dx = Math.max(0, Math.abs(x - center + 0.5) - (center - radius));
      const dy = Math.max(0, Math.abs(y - center + 0.5) - (center - radius));
      const isInside = (dx * dx + dy * dy) <= (radius * radius);

      if (isInside) {
        // Form icon design: Indigo gradient with checkmark / form lines
        // Base color: #4F46E5 (rgb: 79, 70, 229) to #6366F1 (rgb: 99, 102, 241)
        const t = y / size;
        let r = Math.round(79 + t * 20);
        let g = Math.round(70 + t * 32);
        let b = Math.round(229 + t * 12);
        let a = 255;

        // Inner form icon lines (white)
        const normX = x / size;
        const normY = y / size;

        // Checkmark / form indicator in white
        // Line 1: top bar
        const onTopBar = normY >= 0.30 && normY <= 0.40 && normX >= 0.25 && normX <= 0.75;
        // Line 2: middle bar
        const onMidBar = normY >= 0.46 && normY <= 0.54 && normX >= 0.25 && normX <= 0.65;
        // Line 3: bottom bar
        const onBotBar = normY >= 0.60 && normY <= 0.68 && normX >= 0.25 && normX <= 0.50;

        if (onTopBar || onMidBar || onBotBar) {
          r = 255;
          g = 255;
          b = 255;
          a = 245;
        }

        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = a;
      } else {
        // Transparent
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Standard CRC32
function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  table[i] = c;
}

const iconsDir = path.resolve('public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const png = createPng(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), png);
  console.log(`Generated icon-${size}.png (${png.length} bytes)`);
});
