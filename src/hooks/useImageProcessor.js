import { useCallback, useRef } from 'react';
import { encodeBMP } from '../utils/bmpEncoder';
import {
  toGrayscale,
  thresholdDither,
  floydSteinbergDither,
  atkinsonDither,
  orderedDither,
} from '../utils/dithering';

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
    transforms = []
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImageRef.current) return null;

    const img = sourceImageRef.current;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

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
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }, []);

  const exportBMP = useCallback((targetWidth, targetHeight, fitMode, scale, panX, panY, ditherMode, transforms = []) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    processImage(targetWidth, targetHeight, fitMode, scale, panX, panY, ditherMode, transforms);
    const imageData = canvas.getContext('2d').getImageData(0, 0, targetWidth, targetHeight);
    return encodeBMP(targetWidth, targetHeight, imageData);
  }, [processImage]);

  return {
    canvasRef,
    loadImage,
    processImage,
    exportBMP,
  };
}
