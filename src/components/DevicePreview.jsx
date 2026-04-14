import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from 'react';

export const DevicePreview = forwardRef(function DevicePreview(
  { onCanvasReady, onPanChange, onScaleChange, isLoading, canvasWidth = 480, canvasHeight = 800 },
  ref
) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(100);
  const panRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    getContext: () => canvasRef.current?.getContext('2d'),
  }));

  useEffect(() => {
    if (canvasRef.current && onCanvasReady) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    const newScale = Math.min(Math.max(scale + delta, 10), 200);
    setScale(newScale);
    onScaleChange?.(newScale);
  }, [scale, onScaleChange]);

  const handleMouseDown = useCallback((e) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    panRef.current = { x: panRef.current.x + dx, y: panRef.current.y + dy };
    onPanChange?.(panRef.current.x, panRef.current.y);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [onPanChange]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const screenWidth = canvasWidth;
  const screenHeight = canvasHeight;
  const screenInset = 24;
  const screenDisplayWidth = screenWidth - screenInset;
  const screenDisplayHeight = screenHeight - screenInset;

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      const scaleX = containerWidth / (screenWidth + 80);
      const scaleY = containerHeight / (screenHeight + 80);
      const baseScale = Math.min(scaleX, scaleY, 1) * 100;
      
      setScale(baseScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [screenWidth, screenHeight]);

  const displayScale = scale / 100;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      style={{
        width: (screenWidth + 80) * displayScale,
        height: (screenHeight + 80) * displayScale,
      }}
    >
      <svg
        viewBox={`0 0 ${screenWidth + 80} ${screenHeight + 80}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          <linearGradient id="deviceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="50%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </linearGradient>
          <linearGradient id="screenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fafafa" />
            <stop offset="100%" stopColor="#f5f5f5" />
          </linearGradient>
        </defs>

        <rect
          x="40"
          y="40"
          width={screenWidth}
          height={screenHeight}
          rx="24"
          fill="url(#deviceGradient)"
          style={{ filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.6))' }}
        />

        <rect
          x="50"
          y="50"
          width={screenWidth - 20}
          height={screenHeight - 20}
          rx="16"
          fill="#0a0a0a"
        />

        <rect
          x="52"
          y="52"
          width={screenWidth - 24}
          height={screenHeight - 24}
          rx="14"
          fill="url(#screenGradient)"
          className="checkered-bg"
        />

        <circle 
          cx={screenWidth / 2 + 40} 
          cy={screenHeight + 42} 
          r="5" 
          fill="#262626" 
        />
        
        <rect
          x="58"
          y="58"
          width={screenWidth - 44}
          height={screenHeight - 44}
          rx="14"
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="1"
        />
      </svg>

      <div
        className="absolute cursor-grab"
        style={{
          left: 52 * displayScale,
          top: 52 * displayScale,
          width: screenDisplayWidth * displayScale,
          height: screenDisplayHeight * displayScale,
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-sm z-10">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={screenWidth}
          height={screenHeight}
          className="w-full h-full"
        />
      </div>
    </div>
  );
});
