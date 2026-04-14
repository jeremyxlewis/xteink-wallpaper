import { mapBrightnessToCharIndex } from './asciiCharset';

export function renderToASCII(imageData, options = {}) {
  const {
    chars = '@%#*+=-:. ',
    fontSize = 10,
    fontFamily = 'monospace',
    charSpacing = 1,
    lineHeight = 1,
    invertColors = false,
    flipH = false,
    flipV = false,
    padding = 0,
    ditherStrength = 0,
    outputWidth = 480,
    outputHeight = 800,
    bgColor = '#ffffff',
    textColor = '#000000',
    colorMode = 'grayscale',
  } = options;

  const { data, width, height } = imageData;
  const charCount = chars.length;

  const charWidth = fontSize * charSpacing * 0.6;
  const charHeight = fontSize * lineHeight;

  const cols = Math.floor((width - padding * 2) / charWidth);
  const rows = Math.floor((height - padding * 2) / charHeight);

  const canvasWidth = cols * charWidth + padding * 2;
  const canvasHeight = rows * charHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  let asciiResult = [];

  for (let row = 0; row < rows; row++) {
    let rowText = '';
    
    for (let col = 0; col < cols; col++) {
      let srcX = Math.floor((col / cols) * width);
      let srcY = Math.floor((row / rows) * height);

      if (flipH) srcX = width - 1 - srcX;
      if (flipV) srcY = height - 1 - srcY;

      const idx = (srcY * width + srcX) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      let brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      if (ditherStrength > 0) {
        const noise = (Math.random() - 0.5) * 255 * ditherStrength;
        brightness = Math.max(0, Math.min(255, brightness + noise));
      }

      if (invertColors) {
        brightness = 255 - brightness;
      }

      const charIndex = mapBrightnessToCharIndex(brightness, charCount);
      const char = chars[charIndex] || ' ';

      rowText += char;

      const x = padding + col * charWidth;
      const y = padding + row * charHeight;

      ctx.fillStyle = textColor;
      ctx.fillText(char, x, y);
    }
    asciiResult.push(rowText);
  }

  return {
    canvas,
    text: asciiResult.join('\n'),
    dimensions: {
      width: canvasWidth,
      height: canvasHeight,
      charsWide: cols,
      charsTall: rows,
    },
  };
}

export function imageToASCII(imageElement, options = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  ctx.drawImage(imageElement, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  return renderToASCII(imageData, options);
}

export function canvasToASCII(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return renderToASCII(imageData, options);
}
