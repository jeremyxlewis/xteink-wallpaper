import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ImageQueue } from './ImageQueue';
import { DevicePreview } from './DevicePreview';
import { Controls } from './Controls';
import { ExportModal } from './ExportModal';
import { ToastContainer, useToast } from '../hooks/useToast';
import { useImageProcessor, FIT_MODE, DITHER_MODE, TRANSFORMS, DEVICE_SIZES } from '../hooks/useImageProcessor';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSkeleton } from './LoadingSkeleton';

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
  const imageIdRef = useRef(0);

  const { canvasRef, loadImage, processImage, exportBMP } = useImageProcessor();
  const previewRef = useRef(null);
  const { toasts, addToast, removeToast } = useToast();

  const deviceSize = useMemo(() => DEVICE_SIZES.portrait, []);
  const selectedImage = images[selectedIndex];

  // Portrait only - 480x800
  const orientation = 'portrait';

  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      setIsProcessing(true);
      loadImage(selectedImage.file).then(() => {
        const width = deviceSize.width;
        const height = deviceSize.height;
        processImage(width, height, fitMode, scale, panX, panY, ditherMode, transforms);
        setIsProcessing(false);
      }).catch(() => {
        setIsProcessing(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage, orientation, fitMode, scale, panX, panY, ditherMode, transforms, deviceSize, loadImage, processImage]);

  const handleAddImages = useCallback(async (files) => {
    for (const file of files) {
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
    }
    if (selectedIndex < 0) {
      setSelectedIndex(0);
    }
  }, [selectedIndex]);

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

    const width = deviceSize.width;
    const height = deviceSize.height;
    const blob = exportBMP(width, height, fitMode, scale, panX, panY, ditherMode, transforms);
    
    if (blob) {
      const name = selectedImage.name.replace(/\.[^/.]+$/, '') + '.bmp';
      saveAs(blob, name);
      addToast('Image exported', 'success');
    }
  }, [selectedImage, deviceSize, fitMode, scale, panX, panY, ditherMode, transforms, exportBMP, addToast, canvasRef]);

  const handleExportBatch = useCallback(async () => {
    if (images.length === 0) return;

    setIsExporting(true);
    setExportModal({ open: true, progress: 0, total: images.length, currentFile: '' });

    const zip = new JSZip();
    const width = deviceSize.width;
    const height = deviceSize.height;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      setExportModal((prev) => ({ ...prev, currentFile: img.name }));

      // Use current state for selected image, stored settings for others
      const useScale = i === selectedIndex ? scale : img.scale;
      const useFitMode = i === selectedIndex ? fitMode : img.fitMode;
      const usePanX = i === selectedIndex ? panX : img.panX;
      const usePanY = i === selectedIndex ? panY : img.panY;
      const useDitherMode = i === selectedIndex ? ditherMode : img.ditherMode;
      const useTransforms = i === selectedIndex ? transforms : (img.transforms || []);

      await loadImage(img.file);
      processImage(width, height, useFitMode, useScale, usePanX, usePanY, useDitherMode, useTransforms);
      
      const blob = exportBMP(width, height, useFitMode, useScale, usePanX, usePanY, useDitherMode, useTransforms);
      
      if (blob) {
        zip.file(`wallpaper_${String(i + 1).padStart(3, '0')}.bmp`, blob);
      }

      setExportModal((prev) => ({ ...prev, progress: i + 1 }));
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'wallpapers.zip');

    setExportModal((prev) => ({ ...prev, open: false }));
    setIsExporting(false);
    addToast(`${images.length} images exported as ZIP`, 'success');
  }, [images, selectedIndex, deviceSize, fitMode, scale, panX, panY, ditherMode, transforms, loadImage, processImage, exportBMP, addToast]);

  useEffect(() => {
    if (selectedIndex >= 0 && images[selectedIndex]) {
      const img = images[selectedIndex];
      setFitMode(img.fitMode);
      setScale(img.scale);
      setPanX(img.panX);
      setPanY(img.panY);
      setDitherMode(img.ditherMode);
      setTransforms(img.transforms || []);
    }
  }, [selectedIndex, images]);

  // Only load settings when switching images, don't auto-save on every control change
  // Settings are preserved in state and applied on export

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
            />
          </div>
        </main>

        <footer className="sticky bottom-0 glass-panel border-t border-[var(--color-border-subtle)] px-4 py-3 z-40">
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
      </div>
    </ErrorBoundary>
  );
}
