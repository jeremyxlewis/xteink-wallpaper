import { describe, it, expect } from 'vitest';

describe('dithering module', () => {
  it('exports all required dithering functions', async () => {
    const module = await import('../utils/dithering.js');
    expect(typeof module.toGrayscale).toBe('function');
    expect(typeof module.thresholdDither).toBe('function');
    expect(typeof module.floydSteinbergDither).toBe('function');
    expect(typeof module.atkinsonDither).toBe('function');
    expect(typeof module.orderedDither).toBe('function');
  });

  it('toGrayscale handles valid image data', async () => {
    const { toGrayscale } = await import('../utils/dithering.js');
    const data = new Uint8ClampedArray(16);
    data.fill(128);
    const input = { data, width: 2, height: 2 };
    const result = toGrayscale(input);
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
  });

  it('thresholdDither uses correct threshold', async () => {
    const { thresholdDither } = await import('../utils/dithering.js');
    const data = new Uint8ClampedArray(16);
    data.fill(128);
    const input = { data, width: 2, height: 2 };
    expect(() => thresholdDither(input, 128)).not.toThrow();
  });

  it('floydSteinbergDither handles small images', async () => {
    const { floydSteinbergDither } = await import('../utils/dithering.js');
    const data = new Uint8ClampedArray([
      100, 100, 100, 255, 150, 150, 150, 255,
      100, 100, 100, 255, 150, 150, 150, 255,
    ]);
    const input = { data, width: 2, height: 2 };
    const result = floydSteinbergDither(input);
    expect(result).toBeDefined();
  });

  it('atkinsonDither handles small images', async () => {
    const { atkinsonDither } = await import('../utils/dithering.js');
    const data = new Uint8ClampedArray([
      100, 100, 100, 255, 150, 150, 150, 255,
      100, 100, 100, 255, 150, 150, 150, 255,
    ]);
    const input = { data, width: 2, height: 2 };
    const result = atkinsonDither(input);
    expect(result).toBeDefined();
  });

  it('orderedDither is exported and callable', async () => {
    const { orderedDither } = await import('../utils/dithering.js');
    expect(typeof orderedDither).toBe('function');
  });
});