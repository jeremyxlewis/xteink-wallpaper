import { useCallback, useRef } from 'react';
import { encodeBMP } from '../utils/bmpEncoder';
import {
  toGrayscale,
  thresholdDither,
  floydSteinbergDither,
  atkinsonDither,
  orderedDither,
  stuckiDither,
  jarvisDither,
  sierraDither,
} from '../utils/dithering';
import { getCharSet } from '../utils/asciiCharset';
import { renderToASCII } from '../utils/asciiRenderer';

export const FIT_MODE = {
  COVER: 'cover',
  CONTAIN: 'contain',
  STRETCH: 'stretch',
};

export const DITHER_MODE = {
  NONE: 'none',
  GRAYSCALE: 'grayscale',
  THRESHOLD: 'threshold',
  FLOYD_STEINBERG: 'floyd-steinberg',
  ATKINSON: 'atkinson',
  ORDERED: 'ordered',
  STUCKI: 'stucki',
  JARVIS: 'jarvis',
  SIERRA: 'sierra',
};

export const TRANSFORMS = {
  ROTATE_90: 'rotate90',
  ROTATE_180: 'rotate180',
  ROTATE_270: 'rotate270',
  MIRROR_H: 'mirrorH',
  MIRROR_V: 'mirrorV',
  INVERT: 'invert',
};

export const DEVICE_SIZES = {
  portrait: { width: 480, height: 800 },
  landscape: { width: 800, height: 480 },
};

export const VIEW_MODE = {
  IMAGE: 'image',
  ASCII: 'ascii',
};

export const COLOR_MODE = {
  GRAYSCALE: 'grayscale',
  INVERT: 'invert',
  FULL_COLOR: 'full-color',
  MATRIX_GREEN: 'matrix-green',
  MATRIX_AMBER: 'matrix-amber',
};

export function useImageProcessor() {
  const canvasRef = useRef(null);
  const sourceImageRef = useRef(null);

  const loadImage = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          sourceImageRef.current = img;
          resolve(img);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const processImage = useCallback((
    targetWidth,
    targetHeight,
    fitMode,
    scale,
    panX,
    panY,
    ditherMode,
    transforms = [],
    options = {}
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImageRef.current) return null;

    const img = sourceImageRef.current;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const {
      brightness = 0,
      contrast = 1,
      saturation = 1,
      gamma = 1,
    } = options;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
    let dstX = 0, dstY = 0, dstW = targetWidth, dstH = targetHeight;

    const targetRatio = targetWidth / targetHeight;
    const srcRatio = img.width / img.height;

    if (fitMode === FIT_MODE.COVER) {
      if (srcRatio > targetRatio) {
        srcW = img.height * targetRatio;
        srcX = (img.width - srcW) / 2;
      } else {
        srcH = img.width / targetRatio;
        srcY = (img.height - srcH) / 2;
      }
    } else if (fitMode === FIT_MODE.CONTAIN) {
      if (srcRatio > targetRatio) {
        dstH = targetWidth / srcRatio;
        dstY = (targetHeight - dstH) / 2;
      } else {
        dstW = targetHeight * srcRatio;
        dstX = (targetWidth - dstW) / 2;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else if (fitMode === FIT_MODE.STRETCH) {
      dstW = targetWidth;
      dstH = targetHeight;
    }

    const scaledW = dstW * (scale / 100);
    const scaledH = dstH * (scale / 100);
    const scaledX = dstX + (dstW - scaledW) / 2 + panX;
    const scaledY = dstY + (dstH - scaledH) / 2 + panY;

    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);
    
    if (transforms.includes(TRANSFORMS.ROTATE_90)) {
      ctx.rotate(Math.PI / 2);
    } else if (transforms.includes(TRANSFORMS.ROTATE_180)) {
      ctx.rotate(Math.PI);
    } else if (transforms.includes(TRANSFORMS.ROTATE_270)) {
      ctx.rotate(-Math.PI / 2);
    }
    
    if (transforms.includes(TRANSFORMS.MIRROR_H)) {
      ctx.scale(-1, 1);
    }
    if (transforms.includes(TRANSFORMS.MIRROR_V)) {
      ctx.scale(1, -1);
    }
    
    ctx.translate(-targetWidth / 2, -targetHeight / 2);
    ctx.drawImage(img, srcX, srcY, srcW, srcH, scaledX, scaledY, scaledW, scaledH);
    ctx.restore();

    let imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

    if (transforms.includes(TRANSFORMS.INVERT)) {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    }

    if (brightness !== 0 || contrast !== 1 || saturation !== 1 || gamma !== 1) {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        r += brightness;
        g += brightness;
        b += brightness;

        r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * saturation;
        g = gray + (g - gray) * saturation;
        b = gray + (b - gray) * saturation;

        r = Math.pow(r / 255, 1 / gamma) * 255;
        g = Math.pow(g / 255, 1 / gamma) * 255;
        b = Math.pow(b / 255, 1 / gamma) * 255;

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }
    }

    switch (ditherMode) {
      case DITHER_MODE.GRAYSCALE:
        imageData = toGrayscale(imageData);
        break;
      case DITHER_MODE.THRESHOLD:
        imageData = thresholdDither(imageData);
        break;
      case DITHER_MODE.FLOYD_STEINBERG:
        imageData = floydSteinbergDither(imageData);
        break;
      case DITHER_MODE.ATKINSON:
        imageData = atkinsonDither(imageData);
        break;
      case DITHER_MODE.ORDERED:
        imageData = orderedDither(imageData);
        break;
      case DITHER_MODE.STUCKI:
        imageData = stuckiDither(imageData);
        break;
      case DITHER_MODE.JARVIS:
        imageData = jarvisDither(imageData);
        break;
      case DITHER_MODE.SIERRA:
        imageData = sierraDither(imageData);
        break;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }, []);

  const processASCII = useCallback((
    targetWidth,
    targetHeight,
    fitMode,
    scale,
    panX,
    panY,
    ditherMode,
    transforms = [],
    asciiOptions = {}
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImageRef.current) return null;

    const img = sourceImageRef.current;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const {
      charSet = 'CLASSIC',
      customChars = '',
      fontSize = 10,
      charSpacing = 1,
      lineHeight = 1,
      invertColors = false,
      flipH = false,
      flipV = false,
      padding = 0,
      ditherStrength = 0,
      brightness = 0,
      contrast = 1,
      saturation = 1,
      gamma = 1,
    } = asciiOptions;

    const charset = getCharSet(charSet);
    const chars = charSet === 'CUSTOM' && customChars ? customChars : charset.chars;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
    let dstX = 0, dstY = 0, dstW = targetWidth, dstH = targetHeight;

    const targetRatio = targetWidth / targetHeight;
    const srcRatio = img.width / img.height;

    if (fitMode === FIT_MODE.COVER) {
      if (srcRatio > targetRatio) {
        srcW = img.height * targetRatio;
        srcX = (img.width - srcW) / 2;
      } else {
        srcH = img.width / targetRatio;
        srcY = (img.height - srcH) / 2;
      }
    } else if (fitMode === FIT_MODE.CONTAIN) {
      if (srcRatio > targetRatio) {
        dstH = targetWidth / srcRatio;
        dstY = (targetHeight - dstH) / 2;
      } else {
        dstW = targetHeight * srcRatio;
        dstX = (targetWidth - dstW) / 2;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    } else if (fitMode === FIT_MODE.STRETCH) {
      dstW = targetWidth;
      dstH = targetHeight;
    }

    const scaledW = dstW * (scale / 100);
    const scaledH = dstH * (scale / 100);
    const scaledX = dstX + (dstW - scaledW) / 2 + panX;
    const scaledY = dstY + (dstH - scaledH) / 2 + panY;

    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);
    
    if (transforms.includes(TRANSFORMS.ROTATE_90)) {
      ctx.rotate(Math.PI / 2);
    } else if (transforms.includes(TRANSFORMS.ROTATE_180)) {
      ctx.rotate(Math.PI);
    } else if (transforms.includes(TRANSFORMS.ROTATE_270)) {
      ctx.rotate(-Math.PI / 2);
    }
    
    if (transforms.includes(TRANSFORMS.MIRROR_H)) {
      ctx.scale(-1, 1);
    }
    if (transforms.includes(TRANSFORMS.MIRROR_V)) {
      ctx.scale(1, -1);
    }
    
    ctx.translate(-targetWidth / 2, -targetHeight / 2);
    ctx.drawImage(img, srcX, srcY, srcW, srcH, scaledX, scaledY, scaledW, scaledH);
    ctx.restore();

    let imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

    if (transforms.includes(TRANSFORMS.INVERT)) {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
    }

    if (brightness !== 0 || contrast !== 1 || saturation !== 1 || gamma !== 1) {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        r += brightness;
        g += brightness;
        b += brightness;

        r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * saturation;
        g = gray + (g - gray) * saturation;
        b = gray + (b - gray) * saturation;

        r = Math.pow(r / 255, 1 / gamma) * 255;
        g = Math.pow(g / 255, 1 / gamma) * 255;
        b = Math.pow(b / 255, 1 / gamma) * 255;

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }
    }

    if (ditherMode !== DITHER_MODE.NONE) {
      switch (ditherMode) {
        case DITHER_MODE.GRAYSCALE:
          imageData = toGrayscale(imageData);
          break;
        case DITHER_MODE.THRESHOLD:
          imageData = thresholdDither(imageData);
          break;
        case DITHER_MODE.FLOYD_STEINBERG:
          imageData = floydSteinbergDither(imageData);
          break;
        case DITHER_MODE.ATKINSON:
          imageData = atkinsonDither(imageData);
          break;
        case DITHER_MODE.ORDERED:
          imageData = orderedDither(imageData);
          break;
        case DITHER_MODE.STUCKI:
          imageData = stuckiDither(imageData);
          break;
        case DITHER_MODE.JARVIS:
          imageData = jarvisDither(imageData);
          break;
        case DITHER_MODE.SIERRA:
          imageData = sierraDither(imageData);
          break;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const asciiResult = renderToASCII(imageData, {
      chars,
      fontSize,
      charSpacing,
      lineHeight,
      invertColors,
      flipH,
      flipV,
      padding,
      ditherStrength,
      outputWidth: targetWidth,
      outputHeight: targetHeight,
    });

    canvas.width = asciiResult.dimensions.width;
    canvas.height = asciiResult.dimensions.height;
    const asciiCtx = canvas.getContext('2d');
    asciiCtx.drawImage(asciiResult.canvas, 0, 0);

    return {
      canvas,
      text: asciiResult.text,
      dimensions: asciiResult.dimensions,
    };
  }, []);

  const exportBMP = useCallback((targetWidth, targetHeight, fitMode, scale, panX, panY, ditherMode, transforms = [], options = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    processImage(targetWidth, targetHeight, fitMode, scale, panX, panY, ditherMode, transforms, options);
    const imageData = canvas.getContext('2d').getImageData(0, 0, targetWidth, targetHeight);
    return encodeBMP(targetWidth, targetHeight, imageData);
  }, [processImage]);

  const exportASCIIBMP = useCallback((targetWidth, targetHeight, fitMode, scale, panX, panY, ditherMode, transforms = [], asciiOptions = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    processASCII(targetWidth, targetHeight, fitMode, scale, panX, panY, ditherMode, transforms, asciiOptions);
    const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    return encodeBMP(canvas.width, canvas.height, imageData);
  }, [processASCII]);

  return {
    canvasRef,
    loadImage,
    processImage,
    processASCII,
    exportBMP,
    exportASCIIBMP,
  };
}
