import { 
  Maximize, Crop, Move, 
  RotateCw, RotateCcw, FlipHorizontal, FlipVertical, 
  Contrast
} from 'lucide-react';
import { FIT_MODE, TRANSFORMS } from '../hooks/useImageProcessor';

const fitOptions = [
  { value: FIT_MODE.COVER, label: 'Cover', icon: Crop, desc: 'Fill, crop edges' },
  { value: FIT_MODE.CONTAIN, label: 'Contain', icon: Maximize, desc: 'Letterbox' },
  { value: FIT_MODE.STRETCH, label: 'Stretch', icon: Move, desc: 'To exact size' },
];

const transformOptions = [
  { value: TRANSFORMS.ROTATE_90, icon: RotateCw, desc: 'Rotate 90' },
  { value: TRANSFORMS.ROTATE_270, icon: RotateCcw, desc: 'Rotate 270' },
  { value: TRANSFORMS.MIRROR_H, icon: FlipHorizontal, desc: 'Mirror X' },
  { value: TRANSFORMS.MIRROR_V, icon: FlipVertical, desc: 'Mirror Y' },
  { value: TRANSFORMS.INVERT, icon: Contrast, desc: 'Invert' },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function Slider({ label, value, onChange, min, max, step = 1, unit = '', displayValue, id }) {
  const sliderId = id || label.toLowerCase().replace(/\s+/g, '-');
  const clampedValue = clamp(value, min, max);
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={sliderId} className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
          {label}
        </label>
        <span className="text-xs font-mono text-[var(--color-accent)]">
          {displayValue !== undefined ? displayValue : clampedValue}{unit}
        </span>
      </div>
      <input
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={clampedValue}
        onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
        className="w-full"
      />
    </div>
  );
}

export function Controls({
  fitMode,
  onFitModeChange,
  scale,
  onScaleChange,
  panX,
  onPanXChange,
  panY,
  onPanYChange,
  transforms,
  onTransformsChange,
  onReset,
  onApplyToAll,
}) {
  const handleTransformToggle = (transform) => {
    if (transforms.includes(transform)) {
      onTransformsChange(transforms.filter(t => t !== transform));
    } else {
      onTransformsChange([...transforms, transform]);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="p-4 pb-3">
        <h2 className="text-sm font-medium text-[var(--color-text)]">
          Controls
        </h2>
      </div>

      <div className="flex-1 rounded-2xl glass-panel">
        <div className="p-4 space-y-5">
          <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-accent-glow)] border border-[var(--color-accent)] rounded-lg p-3">
            Preview always converts to grayscale for e-ink display
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
              Transform
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {transformOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  aria-label={opt.desc}
                  aria-pressed={transforms.includes(opt.value)}
                  onClick={() => handleTransformToggle(opt.value)}
                  title={opt.desc}
                  className={`flex items-center justify-center p-2.5 min-w-11 min-h-11 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                    transforms.includes(opt.value)
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            {transforms.length > 0 && (
              <button
                type="button"
                onClick={() => onTransformsChange([])}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
              >
                Clear transforms
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
              Fit Mode
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {fitOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  aria-label={`Fit mode: ${opt.label} - ${opt.desc}`}
                  aria-pressed={fitMode === opt.value}
                  onClick={() => onFitModeChange(opt.value)}
                  className={`flex flex-col items-center gap-1 p-3 min-w-11 min-h-11 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                    fitMode === opt.value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
                  }`}
                >
                  <opt.icon className={`w-4 h-4 ${fitMode === opt.value ? 'text-[var(--color-accent)]' : ''}`} />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Slider
            label="Scale"
            value={scale}
            onChange={onScaleChange}
            min={10}
            max={200}
            unit="%"
          />

          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
              Pan
            </span>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label htmlFor="pan-x" className="text-xs w-6 text-[var(--color-text-secondary)]">X</label>
                <input
                  id="pan-x"
                  type="range"
                  aria-label="Pan horizontal"
                  min="-200"
                  max="200"
                  value={clamp(panX, -200, 200)}
                  onChange={(e) => onPanXChange(clamp(Number(e.target.value), -200, 200))}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-10 text-right text-[var(--color-text-secondary)]">{clamp(panX, -200, 200)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="pan-y" className="text-xs w-6 text-[var(--color-text-secondary)]">Y</label>
                <input
                  id="pan-y"
                  type="range"
                  aria-label="Pan vertical"
                  min="-200"
                  max="200"
                  value={clamp(panY, -200, 200)}
                  onChange={(e) => onPanYChange(clamp(Number(e.target.value), -200, 200))}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-10 text-right text-[var(--color-text-secondary)]">{clamp(panY, -200, 200)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        <button
          type="button"
          aria-label="Apply current settings to all images"
          onClick={onApplyToAll}
          className="w-full py-3 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          Apply to All
        </button>
        <button
          type="button"
          aria-label="Reset all settings to default"
          onClick={onReset}
          className="w-full py-3 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
