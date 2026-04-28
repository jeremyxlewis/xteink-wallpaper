export function toGrayscale(imageData) {
  const { data, width, height } = imageData;
  const result = new ImageData(new Uint8ClampedArray(data.length), width, height);
  const out = result.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i + 2] + 0.587 * data[i + 1] + 0.114 * data[i]);
    out[i] = out[i + 1] = out[i + 2] = gray;
    out[i + 3] = data[i + 3];
  }

  return result;
}