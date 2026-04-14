export function toGrayscale(imageData) {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i + 2] + 0.587 * data[i + 1] + 0.114 * data[i]);
    out[i] = out[i + 1] = out[i + 2] = gray;
    out[i + 3] = data[i + 3];
  }

  return result;
}

export function thresholdDither(imageData, threshold = 128) {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i + 2] + 0.587 * data[i + 1] + 0.114 * data[i]);
    const bit = gray >= threshold ? 255 : 0;
    out[i] = out[i + 1] = out[i + 2] = bit;
    out[i + 3] = data[i + 3];
  }

  return result;
}

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map(row => row.map(v => v * 255 / 16));

export function orderedDither(imageData, strength = 1.0) {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = Math.round(0.299 * data[idx + 2] + 0.587 * data[idx + 1] + 0.114 * data[idx]);
      const threshold = BAYER_4X4[y % 4][x % 4] * strength;
      const bit = gray >= threshold ? 255 : 0;
      out[idx] = out[idx + 1] = out[idx + 2] = bit;
      out[idx + 3] = data[idx + 3];
    }
  }

  return result;
}

export function floydSteinbergDither(imageData, strength = 1.0) {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  for (let i = 0; i < data.length; i += 4) {
    out[i] = data[i];
    out[i + 1] = data[i + 1];
    out[i + 2] = data[i + 2];
    out[i + 3] = data[i + 3];
  }

  const grayscale = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * out[idx + 2] + 0.587 * out[idx + 1] + 0.114 * out[idx];
      grayscale[y * width + x] = gray;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = grayscale[idx];
      const newPixel = oldPixel >= 128 ? 255 : 0;
      grayscale[idx] = newPixel;

      const error = (oldPixel - newPixel) * strength;

      if (x + 1 < width) {
        grayscale[idx + 1] += error * 7 / 16;
      }
      if (y + 1 < height) {
        if (x > 0) {
          grayscale[idx + width - 1] += error * 3 / 16;
        }
        grayscale[idx + width] += error * 5 / 16;
        if (x + 1 < width) {
          grayscale[idx + width + 1] += error * 1 / 16;
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const val = Math.max(0, Math.min(255, grayscale[y * width + x]));
      out[idx] = out[idx + 1] = out[idx + 2] = val;
    }
  }

  return result;
}

export function atkinsonDither(imageData, strength = 1.0) {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  for (let i = 0; i < data.length; i += 4) {
    out[i] = data[i];
    out[i + 1] = data[i + 1];
    out[i + 2] = data[i + 2];
    out[i + 3] = data[i + 3];
  }

  const grayscale = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * out[idx + 2] + 0.587 * out[idx + 1] + 0.114 * out[idx];
      grayscale[y * width + x] = gray;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = grayscale[idx];
      const newPixel = oldPixel >= 128 ? 255 : 0;
      grayscale[idx] = newPixel;

      const error = ((oldPixel - newPixel) / 8) * strength;

      if (x + 1 < width) grayscale[idx + 1] += error;
      if (x + 2 < width) grayscale[idx + 2] += error;
      if (y + 1 < height) {
        if (x > 0) grayscale[idx + width - 1] += error;
        grayscale[idx + width] += error;
        if (x + 1 < width) grayscale[idx + width + 1] += error;
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const val = Math.max(0, Math.min(255, grayscale[y * width + x]));
      out[idx] = out[idx + 1] = out[idx + 2] = val;
    }
  }

  return result;
}

export function stuckiDither(imageData, strength = 1.0) {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  for (let i = 0; i < data.length; i += 4) {
    out[i] = data[i];
    out[i + 1] = data[i + 1];
    out[i + 2] = data[i + 2];
    out[i + 3] = data[i + 3];
  }

  const grayscale = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * out[idx + 2] + 0.587 * out[idx + 1] + 0.114 * out[idx];
      grayscale[y * width + x] = gray;
    }
  }

  const weights = [
    [1, 0, 8], [1, 1, 5], [1, 2, 2],
    [2, -2, 4], [2, -1, 8], [2, 0, 9], [2, 1, 10], [2, 2, 4]
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = grayscale[idx];
      const newPixel = oldPixel >= 128 ? 255 : 0;
      grayscale[idx] = newPixel;

      const error = ((oldPixel - newPixel) / 42) * strength;

      for (const [dx, dy, w] of weights) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          grayscale[ny * width + nx] += error * w;
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const val = Math.max(0, Math.min(255, grayscale[y * width + x]));
      out[idx] = out[idx + 1] = out[idx + 2] = val;
    }
  }

  return result;
}

export function jarvisDither(imageData, strength = 1.0) {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  for (let i = 0; i < data.length; i += 4) {
    out[i] = data[i];
    out[i + 1] = data[i + 1];
    out[i + 2] = data[i + 2];
    out[i + 3] = data[i + 3];
  }

  const grayscale = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * out[idx + 2] + 0.587 * out[idx + 1] + 0.114 * out[idx];
      grayscale[y * width + x] = gray;
    }
  }

  const weights = [
    [1, 0, 7], [2, 0, 5],
    [-2, 1, 3], [-1, 1, 5], [0, 1, 7], [1, 1, 5], [2, 1, 3],
    [-2, 2, 1], [-1, 2, 3], [0, 2, 5], [1, 2, 3], [2, 2, 1]
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = grayscale[idx];
      const newPixel = oldPixel >= 128 ? 255 : 0;
      grayscale[idx] = newPixel;

      const error = ((oldPixel - newPixel) / 16) * strength;

      for (const [dx, dy, w] of weights) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          grayscale[ny * width + nx] += error * w;
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const val = Math.max(0, Math.min(255, grayscale[y * width + x]));
      out[idx] = out[idx + 1] = out[idx + 2] = val;
    }
  }

  return result;
}

export function sierraDither(imageData, strength = 1.0) {
  const { data, width, height } = imageData;
  const result = new ImageData(width, height);
  const out = result.data;

  for (let i = 0; i < data.length; i += 4) {
    out[i] = data[i];
    out[i + 1] = data[i + 1];
    out[i + 2] = data[i + 2];
    out[i + 3] = data[i + 3];
  }

  const grayscale = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * out[idx + 2] + 0.587 * out[idx + 1] + 0.114 * out[idx];
      grayscale[y * width + x] = gray;
    }
  }

  const weights = [
    [1, 0, 10], [2, 0, 8],
    [-2, 1, 4], [-1, 1, 6], [0, 1, 10], [1, 1, 6], [2, 1, 4],
    [-1, 2, 4], [0, 2, 6], [1, 2, 4]
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldPixel = grayscale[idx];
      const newPixel = oldPixel >= 128 ? 255 : 0;
      grayscale[idx] = newPixel;

      const error = ((oldPixel - newPixel) / 32) * strength;

      for (const [dx, dy, w] of weights) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          grayscale[ny * width + nx] += error * w;
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const val = Math.max(0, Math.min(255, grayscale[y * width + x]));
      out[idx] = out[idx + 1] = out[idx + 2] = val;
    }
  }

  return result;
}
