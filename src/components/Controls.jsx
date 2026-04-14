import { 
  Maximize, Crop, Move, 
  RotateCw, RotateCcw, FlipHorizontal, FlipVertical, 
  Contrast, Type, Image
} from 'lucide-react';
import { FIT_MODE, DITHER_MODE, TRANSFORMS, VIEW_MODE } from '../hooks/useImageProcessor';
import { CHAR_SETS, getAllCharSetKeys } from '../utils/asciiCharset';

const fitOptions = [
  { value: FIT_MODE.COVER, label: 'Cover', icon: Crop, desc: 'Fill, crop edges' },
  { value: FIT_MODE.CONTAIN, label: 'Contain', icon: Maximize, desc: 'Letterbox' },
  { value: FIT_MODE.STRETCH, label: 'Stretch', icon: Move, desc: 'To exact size' },
];

const ditherOptions = [
  { value: DITHER_MODE.NONE, label: 'None', desc: 'Full color' },
  { value: DITHER_MODE.GRAYSCALE, label: 'Gray', desc: '8-bit' },
  { value: DITHER_MODE.THRESHOLD, label: 'Thresh', desc: 'Binary' },
  { value: DITHER_MODE.FLOYD_STEINBERG, label: 'Floyd', desc: 'Smooth' },
  { value: DITHER_MODE.ATKINSON, label: 'Atkin', desc: 'Mac OS' },
  { value: DITHER_MODE.ORDERED, label: 'Order', desc: 'Bayer' },
  { value: DITHER_MODE.STUCKI, label: 'Stuck', desc: 'Stable' },
  { value: DITHER_MODE.JARVIS, label: 'Jarv', desc: 'Light' },
  { value: DITHER_MODE.SIERRA, label: 'Sierra', desc: 'Smooth' },
];

const transformOptions = [
  { value: TRANSFORMS.ROTATE_90, icon: RotateCw, desc: 'Rotate 90' },
  { value: TRANSFORMS.ROTATE_270, icon: RotateCcw, desc: 'Rotate 270' },
  { value: TRANSFORMS.MIRROR_H, icon: FlipHorizontal, desc: 'Mirror X' },
  { value: TRANSFORMS.MIRROR_V, icon: FlipVertical, desc: 'Mirror Y' },
  { value: TRANSFORMS.INVERT, icon: Contrast, desc: 'Invert' },
];

function Slider({ label, value, onChange, min, max, step = 1, unit = '', displayValue }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
          {label}
        </label>
        <span className="text-xs font-mono text-[var(--color-accent)]">
          {displayValue !== undefined ? displayValue : value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
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
  ditherMode,
  onDitherModeChange,
  transforms,
  onTransformsChange,
  onReset,
  onApplyToAll,
  viewMode,
  onViewModeChange,
  charSet,
  onCharSetChange,
  customChars,
  onCustomCharsChange,
  fontSize,
  onFontSizeChange,
  charSpacing,
  onCharSpacingChange,
  lineHeight,
  onLineHeightChange,
  invertColors,
  onInvertColorsChange,
  flipH,
  onFlipHChange,
  flipV,
  onFlipVChange,
  padding,
  onPaddingChange,
  ditherStrength,
  onDitherStrengthChange,
  brightness,
  onBrightnessChange,
  contrast,
  onContrastChange,
}) {
  const handleTransformToggle = (transform) => {
    if (transforms.includes(transform)) {
      onTransformsChange(transforms.filter(t => t !== transform));
    } else {
      onTransformsChange([...transforms, transform]);
    }
  };

  const charSetKeys = getAllCharSetKeys();

  return (
    <div className="w-full md:w-64 lg:w-72 flex flex-col">
      <div className="p-4 pb-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
          Controls
        </span>
      </div>

      <div className="flex-1 mx-4 mb-4 rounded-2xl glass-panel overflow-hidden">
        <div className="p-4 space-y-5 max-h-[calc(100vh-320px)] overflow-y-auto">
          {/* View Mode Toggle */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
              View Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-label="Image mode"
                aria-pressed={viewMode === VIEW_MODE.IMAGE}
                onClick={() => onViewModeChange(VIEW_MODE.IMAGE)}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                  viewMode === VIEW_MODE.IMAGE
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
                }`}
              >
                <Image className={`w-4 h-4 ${viewMode === VIEW_MODE.IMAGE ? 'text-[var(--color-accent)]' : ''}`} />
                <span className="text-[10px] font-medium">Image</span>
              </button>
              <button
                type="button"
                aria-label="ASCII mode"
                aria-pressed={viewMode === VIEW_MODE.ASCII}
                onClick={() => onViewModeChange(VIEW_MODE.ASCII)}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                  viewMode === VIEW_MODE.ASCII
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
                }`}
              >
                <Type className={`w-4 h-4 ${viewMode === VIEW_MODE.ASCII ? 'text-[var(--color-accent)]' : ''}`} />
                <span className="text-[10px] font-medium">ASCII</span>
              </button>
            </div>
          </div>

          {/* Transform */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
              Transform
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {transformOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  aria-label={opt.desc}
                  aria-pressed={transforms.includes(opt.value)}
                  onClick={() => handleTransformToggle(opt.value)}
                  title={opt.desc}
                  className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
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

          {/* Fit Mode */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
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
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                    fitMode === opt.value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
                  }`}
                >
                  <opt.icon className={`w-4 h-4 ${fitMode === opt.value ? 'text-[var(--color-accent)]' : ''}`} />
                  <span className="text-[10px] font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scale */}
          <Slider
            label="Scale"
            value={scale}
            onChange={onScaleChange}
            min={10}
            max={200}
            unit="%"
          />

          {/* Pan */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
              Pan
            </label>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] w-6 text-[var(--color-text-secondary)]">X</span>
                <input
                  type="range"
                  aria-label="Pan horizontal"
                  min="-200"
                  max="200"
                  value={panX}
                  onChange={(e) => onPanXChange(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-[10px] font-mono w-10 text-right text-[var(--color-text-secondary)]">{panX}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] w-6 text-[var(--color-text-secondary)]">Y</span>
                <input
                  type="range"
                  aria-label="Pan vertical"
                  min="-200"
                  max="200"
                  value={panY}
                  onChange={(e) => onPanYChange(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-[10px] font-mono w-10 text-right text-[var(--color-text-secondary)]">{panY}</span>
              </div>
            </div>
          </div>

          {/* Image Adjustments */}
          <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
            <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
              Adjustments
            </label>
            
            <Slider
              label="Brightness"
              value={brightness}
              onChange={onBrightnessChange}
              min={-100}
              max={100}
            />

            <Slider
              label="Contrast"
              value={contrast}
              onChange={onContrastChange}
              min={0.1}
              max={3}
              step={0.1}
              displayValue={contrast.toFixed(1)}
            />
          </div>

          {/* Dither */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
              Dither
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {ditherOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  aria-label={`Dither: ${opt.label} - ${opt.desc}`}
                  aria-pressed={ditherMode === opt.value}
                  onClick={() => onDitherModeChange(opt.value)}
                  className={`flex flex-col items-start p-2 rounded-xl border text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                    ditherMode === opt.value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
                  }`}
                >
                  <span className={`text-[10px] font-medium ${ditherMode === opt.value ? 'text-[var(--color-accent)]' : ''}`}>
                    {opt.label}
                  </span>
                  <span className="text-[9px] text-[var(--color-text-secondary)]">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Slider
            label="Dither Strength"
            value={ditherStrength}
            onChange={onDitherStrengthChange}
            min={0}
            max={1}
            step={0.1}
            displayValue={ditherStrength.toFixed(1)}
          />

          {/* ASCII Mode Controls */}
          {viewMode === VIEW_MODE.ASCII && (
            <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
              <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]">
                ASCII Settings
              </label>

              {/* Character Set */}
              <div className="space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
                  Character Set
                </label>
                <select
                  value={charSet}
                  onChange={(e) => onCharSetChange(e.target.value)}
                  className="w-full p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:border-[var(--color-accent)] focus:outline-none"
                >
                  {charSetKeys.map((key) => (
                    <option key={key} value={key}>
                      {CHAR_SETS[key].name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Characters */}
              {charSet === 'CUSTOM' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-text-secondary)]">
                    Custom Chars
                  </label>
                  <input
                    type="text"
                    value={customChars}
                    onChange={(e) => onCustomCharsChange(e.target.value)}
                    placeholder="Enter characters..."
                    className="w-full p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </div>
              )}

              <Slider
                label="Font Size"
                value={fontSize}
                onChange={onFontSizeChange}
                min={6}
                max={24}
                unit="px"
              />

              <Slider
                label="Char Spacing"
                value={charSpacing}
                onChange={onCharSpacingChange}
                min={0.5}
                max={2}
                step={0.1}
                displayValue={charSpacing.toFixed(1)}
              />

              <Slider
                label="Line Height"
                value={lineHeight}
                onChange={onLineHeightChange}
                min={0.5}
                max={2}
                step={0.1}
                displayValue={lineHeight.toFixed(1)}
              />

              <Slider
                label="Padding"
                value={padding}
                onChange={onPaddingChange}
                min={0}
                max={50}
                unit="px"
              />

              {/* ASCII Toggles */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  aria-label="Invert colors"
                  aria-pressed={invertColors}
                  onClick={() => onInvertColorsChange(!invertColors)}
                  className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                    invertColors
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span className="text-[10px] font-medium">Invert</span>
                </button>
                <button
                  type="button"
                  aria-label="Flip horizontal"
                  aria-pressed={flipH}
                  onClick={() => onFlipHChange(!flipH)}
                  className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                    flipH
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Flip vertical"
                  aria-pressed={flipV}
                  onClick={() => onFlipVChange(!flipV)}
                  className={`flex items-center justify-center p-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
                    flipV
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-glow)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <FlipVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
