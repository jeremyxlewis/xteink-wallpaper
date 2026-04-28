import { describe, it, expect } from 'vitest';

describe('dithering module', () => {
  it('exports toGrayscale function', async () => {
    const module = await import('../utils/dithering.js');
    expect(typeof module.toGrayscale).toBe('function');
  });

  it('toGrayscale returns an ImageData object', async () => {
    const { toGrayscale } = await import('../utils/dithering.js');
    const data = new Uint8ClampedArray(16);
    data.fill(128);
    const input = { data, width: 2, height: 2 };
    const result = toGrayscale(input);
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('toGrayscale produces equal RGB values', async () => {
    const { toGrayscale } = await import('../utils/dithering.js');
    const data = new Uint8ClampedArray([
      255, 0, 0, 255,
      128, 128, 128, 255,
    ]);
    const input = { data, width: 2, height: 1 };
    const result = toGrayscale(input);
    expect(result.data[0]).toBe(result.data[1]);
    expect(result.data[1]).toBe(result.data[2]);
    expect(result.data[4]).toBe(result.data[5]);
    expect(result.data[5]).toBe(result.data[6]);
  });
});