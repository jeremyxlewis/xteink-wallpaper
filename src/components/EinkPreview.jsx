import { useRef, useEffect } from 'react';
import { ImagePlus } from 'lucide-react';

const DEVICE_WIDTH = 480;
const DEVICE_HEIGHT = 800;

export function EinkPreview({ screenTexture, isLoading }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!screenTexture || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = DEVICE_WIDTH;
    canvas.height = DEVICE_HEIGHT;

    ctx.drawImage(screenTexture.image, 0, 0, DEVICE_WIDTH, DEVICE_HEIGHT);
  }, [screenTexture]);

  const containerStyle = {
    aspectRatio: `${DEVICE_WIDTH} / ${DEVICE_HEIGHT}`,
    maxHeight: '100%',
    maxWidth: '100%',
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div 
        className="relative bg-white rounded-xl p-1.5 shadow-2xl shadow-black/20" 
        style={containerStyle}
      >
        <div className="relative w-full h-full bg-[#e8e8e8] rounded-lg overflow-hidden">
          {/* E-ink style grid pattern */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(90deg, #ccc 1px, transparent 1px),
                linear-gradient(0deg, #ccc 1px, transparent 1px)
              `,
              backgroundSize: '8px 12px',
            }}
          />
          
          <canvas
            ref={canvasRef}
            className="relative w-full h-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-t-amber-500 animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Processing...</span>
              </div>
            </div>
          )}

          {!screenTexture && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/50">
              <div className="w-20 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-4 bg-white">
                <ImagePlus className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">No image selected</p>
              <p className="text-xs text-gray-400 max-w-[180px]">
                Drop an image or click to browse
              </p>
            </div>
          )}
        </div>
        
        {/* Screen bezel accent */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-t from-black/5 to-transparent rounded-b-lg" />
      </div>

      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-[var(--color-text-secondary)] opacity-50 whitespace-nowrap font-mono">
        {DEVICE_WIDTH}×{DEVICE_HEIGHT} • xteink x4
      </div>
    </div>
  );
}