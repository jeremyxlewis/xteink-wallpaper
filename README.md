# Xteink X4 Wallpaper Maker

Create perfect wallpapers for your Xteink X4 e-reader. Crop, resize, dither, and preview images with real-time rendering.

![Xteink X4 Wallpaper Maker](https://user-images.githubusercontent.com/jeremyxlewis/xteink-wallpaper/main/docs/screenshot.png)

## Features

- **Real-time Preview** - See exactly how your image will look on the 480x800 display
- **Drag to Pan** - Click and drag on the preview to reposition your image
- **Scroll to Zoom** - Use mouse wheel to scale images from 10% to 200%
- **Fit Modes** - Cover (crop to fill), Contain (letterbox), or Stretch
- **Transforms** - Rotate 90/270, Mirror horizontal/vertical, Invert colors
- **Dithering** - Multiple algorithms for e-ink displays:
  - None (full color)
  - Grayscale (8-bit)
  - Threshold (binary)
  - Floyd-Steinberg (smooth)
  - Atkinson (Mac OS style)
  - Ordered/Bayer
- **Batch Export** - Export all images as a ZIP file
- **Apply to All** - Quickly apply current settings to all images

## Getting Started

### Online (Recommended)

Visit: **https://xteink-wallpaper.vercel.app**

### Local Development

```bash
# Clone the repository
git clone https://github.com/jeremyxlewis/xteink-wallpaper.git
cd xteink-wallpaper

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.

## Usage

1. **Add Images** - Drag and drop images onto the queue or click to browse
2. **Preview** - Select an image to see it on the device preview
3. **Adjust** - Use the controls panel to:
   - Set fit mode (Cover/Contain/Stretch)
   - Scale the image (10-200%)
   - Pan the image position
   - Apply transforms (rotate, mirror, invert)
   - Choose dithering effect
4. **Apply Settings** - Click "Apply to All" to use current settings across all images
5. **Export** - Click "Download BMP" for single image or "Export All (ZIP)" for batch

## Technical Details

- Output format: 24-bit BMP (480x800 portrait)
- No server required - all processing happens in the browser
- Your images are never uploaded to any server

## Tech Stack

- React 19
- Vite
- Tailwind CSS 4

## License

MIT