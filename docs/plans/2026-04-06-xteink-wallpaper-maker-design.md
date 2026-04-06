# Xteink X4 Wallpaper Maker v2 - Design Document

## Overview
A modern React + Canvas web app for creating, processing, and batch-exporting wallpapers for the Xteink X4 e-reader. All client-side processing — no server uploads.

## Device Specifications
- **Xteink X4:** Portrait (480×800) / Landscape (800×480)
- **Export:** 24-bit uncompressed BMP only

## Visual Design

### Aesthetic: "Digital Darkroom"
A precision photo editing tool aesthetic. Dark theme only.

### Color Palette
| Role | Color |
|------|-------|
| Background | `#0a0a0a` |
| Surface | `#18181b` |
| Surface elevated | `#27272a` |
| Border | `#3f3f46` |
| Text primary | `#fafafa` |
| Text secondary | `#a1a1aa` |
| **Accent** | `#f59e0b` (amber-500) |

### Typography
- **Headings/Body:** Geist
- **Technical:** Geist Mono

### Responsive Breakpoints
- Mobile: < 768px (stacked, single column)
- Tablet: 768-1024px (2-column, queue drawer)
- Desktop: > 1024px (full 3-column layout)

## Features

### 1. Image Queue System
- Drag-and-drop multiple images
- Thumbnail grid with selection
- Duplicate, remove, clear all actions
- Per-image settings storage

### 2. Device Preview
- Accurate Xteink X4 device frame (SVG)
- Portrait/Landscape toggle
- Real-time canvas rendering
- Checkered background for letterbox

### 3. Image Controls
- **Fit modes:** Cover, Contain, Stretch
- **Scale:** 10%-200% slider
- **Pan:** Drag on preview OR X/Y sliders
- **Dithering:** None, Grayscale, Threshold, Floyd-Steinberg, Atkinson, Ordered

### 4. Batch Export
- ZIP file download with numbered BMPs
- Progress modal

### 5. Keyboard Shortcuts
- Arrow keys: Pan
- +/-: Scale
- Space: Reset

## Tech Stack
- React 18 + Vite
- Tailwind CSS v4
- lucide-react
- JSZip
- file-saver

## Deployed
- Vercel (static SPA)
- Build: `npm run build` → `dist/`
