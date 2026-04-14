import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ImageQueue } from './ImageQueue';
import { DevicePreview } from './DevicePreview';
import { Controls } from './Controls';
import { ExportModal } from './ExportModal';
import { ToastContainer, useToast } from '../hooks/useToast';
import { useImageProcessor, FIT_MODE, DITHER_MODE, TRANSFORMS, DEVICE_SIZES, VIEW_MODE } from '../hooks/useImageProcessor';
import { ErrorBoundary } from './ErrorBoundary';
import { LiveRegion } from './LiveRegion';
import { announce } from '../utils/announce';

export default function App() {
  const [mobileTab, setMobileTab] = useState('preview');
  const [images, setImages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fitMode, setFitMode] = useState(FIT_MODE.COVER);
  const [scale, setScale] = useState(100);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [ditherMode, setDitherMode] = useState(DITHER_MODE.NONE);
  const [transforms, setTransforms] = useState([]);
  const [exportModal, setExportModal] = useState({ open: false, progress: 0, total: 0, currentFile: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // View mode (Image or ASCII)
  const [viewMode, setViewMode] = useState(VIEW_MODE.IMAGE);

  // Image adjustments
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);

  // ASCII options
  const [charSet, setCharSet] = useState('CLASSIC');
  const [customChars, setCustomChars] = useState('');
  const [fontSize, setFontSize] = useState(10);
  const [charSpacing, setCharSpacing] = useState(1);
  const [lineHeight, setLineHeight] = useState(1);
  const [invertColors, setInvertColors] = useState(false);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [padding, setPadding] = useState(0);
  const [ditherStrength, setDitherStrength] = useState(0);
  
  // Track rendered canvas dimensions
  const [renderedDimensions, setRenderedDimensions] = useState({ width: 480, height: 800 });

  const imageIdRef = useRef(0);

  const deviceSize = useMemo(() => DEVICE_SIZES.portrait, []);

  const { canvasRef, loadImage, processImage, processASCII, exportBMP, exportASCIIBMP } = useImageProcessor();
  const previewRef = useRef(null);
  const { toasts, addToast, removeToast } = useToast();

  const loadImageRef = useRef(null);
  const processImageRef = useRef(null);
  const processASCIIRef = useRef(null);
  const exportBMPRef = useRef(null);
  const exportASCIIBMPRef = useRef(null);

  useEffect(() => {
    loadImageRef.current = loadImage;
    processImageRef.current = processImage;
    processASCIIRef.current = processASCII;
    exportBMPRef.current = exportBMP;
    exportASCIIBMPRef.current = exportASCIIBMP;
  }, [loadImage, processImage, processASCII, exportBMP, exportASCIIBMP]);

  const selectedImage = images[selectedIndex];

  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      setIsProcessing(true);
      loadImageRef.current(selectedImage.file).then(() => {
        if (viewMode === VIEW_MODE.ASCII) {
          const result = processASCIIRef.current(
            deviceSize.width,
            deviceSize.height,
            fitMode,
            scale,
            panX,
            panY,
            ditherMode,
            transforms,
            {
              charSet,
              customChars,
              fontSize,
              charSpacing,
              lineHeight,
              invertColors,
              flipH,
              flipV,
              padding,
              ditherStrength,
              brightness,
              contrast,
              saturation: 1,
              gamma: 1,
            }
          );
          if (result && result.dimensions) {
            setRenderedDimensions({
              width: result.dimensions.width,
              height: result.dimensions.height,
            });
          }
        } else {
          processImageRef.current(deviceSize.width, deviceSize.height, fitMode, scale, panX, panY, ditherMode, transforms, {
            brightness,
            contrast,
            saturation: 1,
            gamma: 1,
          });
          setRenderedDimensions({ width: deviceSize.width, height: deviceSize.height });
        }
        setIsProcessing(false);
      }).catch(() => {
        setIsProcessing(false);
      });
    }
  }, [selectedImage, fitMode, scale, panX, panY, ditherMode, transforms, deviceSize, viewMode, charSet, customChars, fontSize, charSpacing, lineHeight, invertColors, flipH, flipV, padding, ditherStrength, brightness, contrast]);

  useEffect(() => {
    if (selectedIndex >= 0 && images[selectedIndex]) {
      const img = images[selectedIndex];
      setFitMode(img.fitMode);
      setScale(img.scale);
      setPanX(img.panX);
      setPanY(img.panY);
      setDitherMode(img.ditherMode);
      setTransforms(img.transforms || []);
      announce(`Selected image ${selectedIndex + 1} of ${images.length}`);
    }
  }, [selectedIndex]);

  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const MAX_FILES = 100;

  const createThumbnail = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 150;
          const ratio = img.width / img.height;
          let w = size, h = size;
          if (ratio > 1) {
            h = size / ratio;
          } else {
            w = size * ratio;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImages = useCallback(async (files) => {
    let validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        addToast(`${file.name} is not an image`, 'error');
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        addToast(`${file.name} exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`, 'error');
        return false;
      }
      return true;
    });

    const remainingSlots = MAX_FILES - images.length;
    if (validFiles.length > remainingSlots) {
      validFiles = validFiles.slice(0, remainingSlots);
      addToast(`Only ${remainingSlots} slots available`, 'info');
    }

    for (const file of validFiles) {
      try {
        const thumbnail = await createThumbnail(file);
        setImages((prev) => [
          ...prev,
          {
            id: ++imageIdRef.current,
            file,
            name: file.name,
            thumbnail,
            fitMode: FIT_MODE.COVER,
            scale: 100,
            panX: 0,
            panY: 0,
            ditherMode: DITHER_MODE.NONE,
            transforms: [],
          },
        ]);
      } catch {
        addToast(`Failed to load ${file.name}`, 'error');
      }
    }
    if (selectedIndex < 0 && images.length === 0) {
      setSelectedIndex(0);
    }
    if (validFiles.length > 0) {
      addToast(`${validFiles.length} image${validFiles.length > 1 ? 's' : ''} added`, 'success');
    }
  }, [selectedIndex, images.length, addToast]);

  const handleSelect = useCallback((idx) => {
    setSelectedIndex(idx);
    if (images[idx]) {
      setFitMode(images[idx].fitMode);
      setScale(images[idx].scale);
      setPanX(images[idx].panX);
      setPanY(images[idx].panY);
      setDitherMode(images[idx].ditherMode);
      setTransforms(images[idx].transforms || []);
    }
  }, [images]);

  const handleRemove = useCallback((idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (selectedIndex >= images.length - 1) {
      setSelectedIndex(Math.max(0, images.length - 2));
    }
    addToast('Image removed', 'info');
  }, [selectedIndex, images.length, addToast]);

  const handleDuplicate = useCallback((idx) => {
    const original = images[idx];
    if (original) {
      const newFile = new File([original.file], `copy_${original.name}`, { type: original.file.type });
      createThumbnail(newFile).then((thumbnail) => {
        setImages((prev) => [
          ...prev,
          {
            ...original,
            id: ++imageIdRef.current,
            file: newFile,
            name: `copy_${original.name}`,
            thumbnail,
          },
        ]);
      });
    }
    addToast('Image duplicated', 'success');
  }, [images, addToast]);

  const handleClearAll = useCallback(() => {
    setImages([]);
    setSelectedIndex(0);
  }, []);

  const handleReset = useCallback(() => {
    setFitMode(FIT_MODE.COVER);
    setScale(100);
    setPanX(0);
    setPanY(0);
    setDitherMode(DITHER_MODE.NONE);
    setTransforms([]);
    setBrightness(0);
    setContrast(1);
    setCharSet('CLASSIC');
    setCustomChars('');
    setFontSize(10);
    setCharSpacing(1);
    setLineHeight(1);
    setInvertColors(false);
    setFlipH(false);
    setFlipV(false);
    setPadding(0);
    setDitherStrength(0);
  }, []);

  const handleApplyToAll = useCallback(() => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        fitMode,
        scale,
        panX,
        panY,
        ditherMode,
        transforms,
      }))
    );
    addToast(`Applied to ${images.length} images`, 'success');
  }, [images.length, fitMode, scale, panX, panY, ditherMode, transforms, addToast]);

  const handleExportSingle = useCallback(async () => {
    if (!selectedImage || !canvasRef.current) return;

    const asciiOptions = {
      charSet,
      customChars,
      fontSize,
      charSpacing,
      lineHeight,
      invertColors,
      flipH,
      flipV,
      padding,
      ditherStrength,
      brightness,
      contrast,
      saturation: 1,
      gamma: 1,
    };

    const imageOptions = {
      brightness,
      contrast,
      saturation: 1,
      gamma: 1,
    };

    const blob = viewMode === VIEW_MODE.ASCII
      ? exportASCIIBMPRef.current(deviceSize.width, deviceSize.height, fitMode, scale, panX, panY, ditherMode, transforms, asciiOptions)
      : exportBMPRef.current(deviceSize.width, deviceSize.height, fitMode, scale, panX, panY, ditherMode, transforms, imageOptions);
    
    if (blob) {
      const suffix = viewMode === VIEW_MODE.ASCII ? '_ascii' : '';
      const name = selectedImage.name.replace(/\.[^/.]+$/, '') + suffix + '.bmp';
      saveAs(blob, name);
      addToast('Image exported', 'success');
    }
  }, [selectedImage, deviceSize, fitMode, scale, panX, panY, ditherMode, transforms, viewMode, charSet, customChars, fontSize, charSpacing, lineHeight, invertColors, flipH, flipV, padding, ditherStrength, brightness, contrast, addToast]);

  const handleExportBatch = useCallback(async () => {
    if (images.length === 0) return;

    setIsExporting(true);
    setExportModal({ open: true, progress: 0, total: images.length, currentFile: '' });

    const processAndExport = async (img, index) => {
      const useScale = index === selectedIndex ? scale : img.scale;
      const useFitMode = index === selectedIndex ? fitMode : img.fitMode;
      const usePanX = index === selectedIndex ? panX : img.panX;
      const usePanY = index === selectedIndex ? panY : img.panY;
      const useDitherMode = index === selectedIndex ? ditherMode : img.ditherMode;
      const useTransforms = index === selectedIndex ? transforms : (img.transforms || []);

      await loadImageRef.current(img.file);
      processImageRef.current(deviceSize.width, deviceSize.height, useFitMode, useScale, usePanX, usePanY, useDitherMode, useTransforms);
      
      return exportBMPRef.current(deviceSize.width, deviceSize.height, useFitMode, useScale, usePanX, usePanY, useDitherMode, useTransforms);
    };

    const zip = new JSZip();
    const batchSize = 3;
    const totalBatches = Math.ceil(images.length / batchSize);

    for (let batch = 0; batch < totalBatches; batch++) {
      const startIdx = batch * batchSize;
      const endIdx = Math.min(startIdx + batchSize, images.length);
      const batchImages = images.slice(startIdx, endIdx);

      const results = await Promise.all(
        batchImages.map((img, i) => processAndExport(img, startIdx + i))
      );

      results.forEach((blob, i) => {
        const fileIdx = startIdx + i;
        if (blob) {
          setExportModal((prev) => ({ ...prev, currentFile: images[fileIdx].name }));
          zip.file(`wallpaper_${String(fileIdx + 1).padStart(3, '0')}.bmp`, blob);
        }
      });

      setExportModal((prev) => ({ ...prev, progress: endIdx }));
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'wallpapers.zip');

    setExportModal((prev) => ({ ...prev, open: false }));
    setIsExporting(false);
    addToast(`${images.length} images exported as ZIP`, 'success');
  }, [images, selectedIndex, deviceSize, fitMode, scale, panX, panY, ditherMode, transforms, addToast]);

  return (
    <ErrorBoundary>
      <div className="min-h-[100dvh] flex flex-col relative">
        <div className="glow-bg" />
        <div className="noise-overlay" />
        
        {/* Mobile Tab Bar */}
        <div className="lg:hidden flex border-b border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-3 text-sm font-medium ${mobileTab === 'preview' ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('queue')}
            className={`flex-1 py-3 text-sm font-medium ${mobileTab === 'queue' ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`}
          >
            Images ({images.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('tools')}
            className={`flex-1 py-3 text-sm font-medium ${mobileTab === 'tools' ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`}
          >
            Tools
          </button>
        </div>
        
        <main className="flex-1 flex flex-col lg:flex-row relative bg-[var(--color-bg)]">
          {/* Image Queue - Desktop sidebar / Mobile tab */}
          <div className={`bg-[var(--color-bg)] ${mobileTab === 'queue' || mobileTab === 'preview' ? '' : 'hidden'} lg:block`}>
            <ImageQueue
              images={images}
              selectedIndex={selectedIndex}
              onSelect={handleSelect}
              onRemove={handleRemove}
              onDuplicate={handleDuplicate}
              onClearAll={handleClearAll}
              onAddImages={handleAddImages}
            />
          </div>

          {/* Device Preview */}
          <div className={`flex-1 flex items-center justify-center p-4 ${mobileTab !== 'preview' && 'hidden lg:flex'}`}>
            <DevicePreview
              ref={previewRef}
              isLoading={isProcessing}
              canvasWidth={renderedDimensions.width}
              canvasHeight={renderedDimensions.height}
              onCanvasReady={(canvas) => {
                canvasRef.current = canvas;
              }}
              onPanChange={(x, y) => {
                setPanX(x);
                setPanY(y);
              }}
              onScaleChange={(s) => {
                setScale(s);
              }}
            />
          </div>

          {/* Controls - Desktop sidebar / Mobile tab */}
          <div className={`bg-[var(--color-bg)] ${mobileTab === 'tools' || mobileTab === 'preview' ? '' : 'hidden'} lg:block`}>
            <Controls
              fitMode={fitMode}
              onFitModeChange={setFitMode}
              scale={scale}
              onScaleChange={setScale}
              panX={panX}
              onPanXChange={setPanX}
              panY={panY}
              onPanYChange={setPanY}
              ditherMode={ditherMode}
              onDitherModeChange={setDitherMode}
              transforms={transforms}
              onTransformsChange={setTransforms}
              onReset={handleReset}
              onApplyToAll={handleApplyToAll}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              charSet={charSet}
              onCharSetChange={setCharSet}
              customChars={customChars}
              onCustomCharsChange={setCustomChars}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
              charSpacing={charSpacing}
              onCharSpacingChange={setCharSpacing}
              lineHeight={lineHeight}
              onLineHeightChange={setLineHeight}
              invertColors={invertColors}
              onInvertColorsChange={setInvertColors}
              flipH={flipH}
              onFlipHChange={setFlipH}
              flipV={flipV}
              onFlipVChange={setFlipV}
              padding={padding}
              onPaddingChange={setPadding}
              ditherStrength={ditherStrength}
              onDitherStrengthChange={setDitherStrength}
              brightness={brightness}
              onBrightnessChange={setBrightness}
              contrast={contrast}
              onContrastChange={setContrast}
            />
          </div>
        </main>

        <footer className="sticky bottom-0 glass-panel border-t border-[var(--color-border-subtle)] px-4 py-3 z-40 pb-safe">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[var(--color-text-secondary)] font-mono order-2 sm:order-1">
              Drag to pan • Scroll to zoom
            </div>
            <div className="flex gap-2 order-1 sm:order-2">
              <button
                type="button"
                aria-label="Download current image as BMP"
                onClick={handleExportSingle}
                disabled={!selectedImage || isExporting}
                className="group relative px-5 py-2.5 rounded-full border border-[var(--color-border)] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-[0.98]"
              >
                <span className="relative z-10">Download BMP</span>
              </button>
              <button
                type="button"
                aria-label="Export all images as ZIP"
                onClick={handleExportBatch}
                disabled={images.length === 0 || isExporting}
                className="group relative px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-black text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-[var(--color-accent-hover)] active:scale-[0.98] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Export All (ZIP)
                </span>
              </button>
            </div>
          </div>
        </footer>

        <ExportModal
          isOpen={exportModal.open}
          progress={exportModal.progress}
          total={exportModal.total}
          currentFile={exportModal.currentFile}
          onClose={() => setExportModal({ open: false, progress: 0, total: 0, currentFile: '' })}
        />

        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <LiveRegion />
      </div>
    </ErrorBoundary>
  );
}
