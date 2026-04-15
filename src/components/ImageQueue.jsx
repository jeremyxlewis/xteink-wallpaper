import { useCallback, useState } from 'react';
import { X, Copy, Image, Plus } from 'lucide-react';

export function ImageQueue({
  images,
  selectedIndex,
  onSelect,
  onRemove,
  onDuplicate,
  onClearAll,
  onAddImages,
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith('image/')
    );
    if (files.length > 0) {
      onAddImages(files);
    }
  }, [onAddImages]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <aside className="w-full flex flex-col">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
              Queue
            </h2>
            <span className="text-xs font-mono text-[var(--color-accent)]">
              {images.length}
            </span>
          </div>
          {images.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div
        className={`flex-1 rounded-2xl glass-panel transition-all duration-300 ${
          isDragging ? 'border-[var(--color-accent)] border-2' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {images.length === 0 ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => document.getElementById('file-input').click()}
            onKeyDown={(e) => e.key === 'Enter' && document.getElementById('file-input').click()}
            className="h-48 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[var(--color-surface-elevated)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-inset"
          >
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-elevated)] flex items-center justify-center">
              <Image className="w-6 h-6 text-[var(--color-text-secondary)]" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Drop images here
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]/60 mt-1">
                or click to browse
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2 grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
            {images.map((img, idx) => (
              <div
                key={img.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(idx)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(idx)}
                className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1 focus:ring-offset-[var(--color-surface)] ${
                  selectedIndex === idx
                    ? 'ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-surface)]'
                    : 'hover:ring-1 hover:ring-[var(--color-border)]'
                }`}
              >
                <div className="aspect-square bg-[var(--color-surface-elevated)]">
                  <img
                    src={img.thumbnail}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-[var(--color-bg)]/90 backdrop-blur-sm flex items-center justify-center text-[10px] font-mono font-medium">
                  {idx + 1}
                </div>

                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-300 flex gap-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(idx);
                    }}
                    className="w-5 h-5 rounded bg-[var(--color-bg)]/90 backdrop-blur-sm flex items-center justify-center hover:bg-[var(--color-accent)] hover:text-black transition-all duration-200 active:scale-[0.95] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  >
                    <Copy className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(idx);
                    }}
                    className="w-5 h-5 rounded bg-[var(--color-bg)]/90 backdrop-blur-sm flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-200 active:scale-[0.95] focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <input
        type="file"
        id="file-input"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files);
          if (files.length > 0) {
            onAddImages(files);
          }
          e.target.value = '';
        }}
      />

      {images.length > 0 && (
        <button
          type="button"
          onClick={() => document.getElementById('file-input').click()}
          className="mx-4 mb-4 py-3 rounded-xl border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add More
        </button>
      )}
    </aside>
  );
}
