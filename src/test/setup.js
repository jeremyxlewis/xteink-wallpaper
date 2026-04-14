import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

typeof globalThis.performance !== 'undefined' || (globalThis.performance = { now: () => Date.now() });

if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class MockImageData {
    constructor(data, width, height) {
      if (data && data.length) {
        this.data = data;
        this.width = width;
        this.height = height;
      } else {
        this.data = new Uint8ClampedArray(width * height * 4);
        this.width = width;
        this.height = height;
      }
    }
  };
}