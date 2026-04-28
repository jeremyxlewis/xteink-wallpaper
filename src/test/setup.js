import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

typeof globalThis.performance !== 'undefined' || (globalThis.performance = { now: () => Date.now() });

if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class MockImageData {
    constructor(data, width, height) {
      this.width = width;
      this.height = height;
      if (data instanceof Uint8ClampedArray) {
        this.data = data;
      } else if (data && Array.isArray(data)) {
        this.data = new Uint8ClampedArray(data);
      } else {
        this.data = new Uint8ClampedArray(width * height * 4);
      }
    }
  };
}