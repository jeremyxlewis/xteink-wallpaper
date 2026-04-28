import { useState, useCallback, useEffect, useRef } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import * as THREE from 'three';
import { ImageQueue } from './ImageQueue';
import { DevicePreview } from './DevicePreview';
import { Controls } from './Controls';
import { ExportModal } from './ExportModal';
import { ToastContainer, useToast } from '../hooks/useToast';
import { useImageProcessor, FIT_MODE, TRANSFORMS, DEVICE_SIZES } from '../hooks/useImageProcessor';
import { ErrorBoundary } from './ErrorBoundary';
import { LiveRegion } from './LiveRegion';
import { announce } from '../utils/announce';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 100;

export default function App() {
  const [images, setImages] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [fitMode, setFitMode] = useState(FIT_MODE.COVER);
  const [scale, setScale] = useState(100);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [transforms, setTransforms] = useState([]);
  const [exportModal, setExportModal] = useState({ open: false, progress: 0, total: 0, currentFile: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [screenTexture, setScreenTexture] = useState(null);
  const prevScreenTextureRef = useRef(null);

  const imageIdRef = useRef(0);

  const { canvasRef, loadImage, processImage, exportBMP } = useImageProcessor();
  const { toasts, addToast, removeToast } = useToast();

  const loadImageRef = useRef(null);
  const processImageRef = useRef(null);
  const exportBMPRef = useRef(null);

// canvasRef is managed by useImageProcessor hook for both processing and texture

  useEffect(() => {
    loadImageRef.current = loadImage;
    processImageRef.current = processImage;
    exportBMPRef.current = exportBMP;
  }, [loadImage, processImage, exportBMP]);

  const selectedImage = images[selectedIndex];

  useEffect(() => {
    let aborted = false;
    
    if (selectedImage && canvasRef.current) {
      setIsProcessing(true);
      loadImageRef.current(selectedImage.file).then(() => {
        if (aborted) return;
        
        processImageRef.current(
          DEVICE_SIZES.portrait.width,
          DEVICE_SIZES.portrait.height,
          fitMode,
          scale,
          panX,
          panY,
          transforms
        );

        if (aborted) return;
        
        // Dispose old texture to prevent memory leaks
        if (prevScreenTextureRef.current) {
          prevScreenTextureRef.current.dispose();
        }
        
        // Create texture directly from canvas
        const texture = new THREE.CanvasTexture(canvasRef.current);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        prevScreenTextureRef.current = texture;
        setScreenTexture(texture);
        
        if (!aborted) {
          setIsProcessing(false);
        }
      }).catch((err) => {
        if (!aborted) {
          setIsProcessing(false);
          addToast(err.message || 'Failed to process image', 'error');
        }
      });
    } else {
      // Dispose texture when no image selected
      if (prevScreenTextureRef.current) {
        prevScreenTextureRef.current.dispose();
        prevScreenTextureRef.current = null;
      }
      setScreenTexture(null);
    }
    
    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage, fitMode, scale, panX, panY, transforms, addToast]);

  useEffect(() => {
    if (selectedImage) {
      setFitMode(selectedImage.fitMode);
      setScale(selectedImage.scale);
      setPanX(selectedImage.panX);
      setPanY(selectedImage.panY);
      setTransforms(selectedImage.transforms || []);
      announce(`Selected image ${selectedIndex + 1} of ${images.length}`);
    }
  }, [selectedIndex, selectedImage, images.length]);

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
        transforms,
      }))
    );
    addToast(`Applied to ${images.length} images`, 'success');
  }, [images.length, fitMode, scale, panX, panY, transforms, addToast]);

  const handleExportSingle = useCallback(async () => {
    if (!selectedImage || !canvasRef.current) {
      addToast('No image selected', 'error');
      return;
    }

    try {
      const blob = exportBMPRef.current(
        DEVICE_SIZES.portrait.width,
        DEVICE_SIZES.portrait.height,
        fitMode,
        scale,
        panX,
        panY,
        transforms
      );
      
      if (blob) {
        const name = selectedImage.name.replace(/\.[^/.]+$/, '') + '.bmp';
        saveAs(blob, name);
        addToast('Image exported', 'success');
      }
    } catch (error) {
      addToast(error.message || 'Export failed', 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage, fitMode, scale, panX, panY, transforms, addToast]);

  const handleExportBatch = useCallback(async () => {
    if (images.length === 0) {
      addToast('No images to export', 'error');
      return;
    }

    setIsExporting(true);
    setExportModal({ open: true, progress: 0, total: images.length, currentFile: '' });
    let successCount = 0;
    let errorCount = 0;

    const processAndExport = async (img, index) => {
      const useScale = index === selectedIndex ? scale : img.scale;
      const useFitMode = index === selectedIndex ? fitMode : img.fitMode;
      const usePanX = index === selectedIndex ? panX : img.panX;
      const usePanY = index === selectedIndex ? panY : img.panY;
      const useTransforms = index === selectedIndex ? transforms : (img.transforms || []);

      try {
        await loadImageRef.current(img.file);
        processImageRef.current(
          DEVICE_SIZES.portrait.width,
          DEVICE_SIZES.portrait.height,
          useFitMode,
          useScale,
          usePanX,
          usePanY,
          useTransforms
        );
        
        const blob = exportBMPRef.current(
          DEVICE_SIZES.portrait.width,
          DEVICE_SIZES.portrait.height,
          useFitMode,
          useScale,
          usePanX,
          usePanY,
          useTransforms
        );
        
        if (blob) {
          successCount++;
          return blob;
        }
      } catch (error) {
        errorCount++;
        console.error(`Failed to export ${img.name}:`, error);
      }
      return null;
    };

    try {
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

      if (errorCount > 0) {
        addToast(`${successCount} exported, ${errorCount} failed`, 'warning');
      } else {
        addToast(`${successCount} images exported as ZIP`, 'success');
      }
    } catch {
      addToast('Batch export failed', 'error');
    } finally {
      setExportModal((prev) => ({ ...prev, open: false }));
      setIsExporting(false);
    }
  }, [images, selectedIndex, fitMode, scale, panX, panY, transforms, addToast]);

  return (
    <ErrorBoundary>
      <div className="min-h-[100dvh] flex flex-col relative overflow-x-hidden">
        <div className="glow-bg" />
        <div className="noise-overlay" />
        
        <h1 className="sr-only">Xteink X4 Wallpaper Maker - Create 480x800 wallpapers for e-readers</h1>
        
        <main className="flex-1 flex flex-col-reverse lg:flex-row relative bg-[var(--color-bg)]">
          <aside className="flex flex-col w-full lg:w-auto lg:min-w-[320px] order-1 lg:order-2">
            <div className="order-1 lg:order-1">
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
            
            <div className="order-2 lg:order-2">
              <Controls
                fitMode={fitMode}
                onFitModeChange={setFitMode}
                scale={scale}
                onScaleChange={setScale}
                panX={panX}
                onPanXChange={setPanX}
                panY={panY}
                onPanYChange={setPanY}
                transforms={transforms}
                onTransformsChange={setTransforms}
                onReset={handleReset}
                onApplyToAll={handleApplyToAll}
              />
            </div>
          </aside>

          <div className="flex-1 flex items-center justify-center p-4 order-2 lg:order-1 min-w-0">
            <DevicePreview
              isLoading={isProcessing}
              screenTexture={screenTexture}
            />
          </div>
        </main>

        <footer className="sticky bottom-0 glass-panel border-t border-[var(--color-border-subtle)] px-4 py-3 z-40 pb-safe">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[var(--color-text-secondary)] font-mono order-2 sm:order-1">
              xteink x4 • 480×800
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
        
        {/* Hidden canvas for image processing and texture generation */}
        <canvas
          ref={canvasRef}
          width={480}
          height={800}
          style={{ display: 'none' }}
        />
      </div>
    </ErrorBoundary>
  );
}
