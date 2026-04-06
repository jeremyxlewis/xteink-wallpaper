export function encodeBMP(width, height, imageData) {
  const { data } = imageData;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  const writeUint32 = (offset, value) => {
    view.setUint8(offset, value & 0xff);
    view.setUint8(offset + 1, (value >> 8) & 0xff);
    view.setUint8(offset + 2, (value >> 16) & 0xff);
    view.setUint8(offset + 3, (value >> 24) & 0xff);
  };

  const writeUint16 = (offset, value) => {
    view.setUint8(offset, value & 0xff);
    view.setUint8(offset + 1, (value >> 8) & 0xff);
  };

  writeUint16(0, 0x4d42);
  writeUint32(2, fileSize);
  writeUint32(10, 54);

  writeUint16(14, 40);
  writeUint32(18, width);
  writeUint32(22, height);
  writeUint16(26, 1);
  writeUint16(28, 24);
  writeUint32(30, 0);
  writeUint32(34, pixelDataSize);

  let offset = 54;

  // BMP stores pixels bottom-up (origin at bottom-left)
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const b = data[srcIdx];
      const g = data[srcIdx + 1];
      const r = data[srcIdx + 2];

      view.setUint8(offset++, b);
      view.setUint8(offset++, g);
      view.setUint8(offset++, r);
    }

    const padding = rowSize - width * 3;
    for (let p = 0; p < padding; p++) {
      view.setUint8(offset++, 0);
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}
