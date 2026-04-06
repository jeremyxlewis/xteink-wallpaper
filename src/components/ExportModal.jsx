import { X, Check, Loader2 } from 'lucide-react';

export function ExportModal({ isOpen, progress, total, currentFile, onClose }) {
  const isComplete = progress >= total && total > 0;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative glass-panel-strong rounded-3xl w-80 md:w-96 p-8 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 id="export-modal-title" className="text-lg font-semibold">
            {isComplete ? 'Export Complete' : 'Exporting...'}
          </h3>
          {!isComplete && (
            <button
              aria-label="Cancel export"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-elevated)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isComplete ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-20 h-20 rounded-full bg-[var(--color-accent-glow)] flex items-center justify-center shadow-[0_0_20px_var(--color-accent-glow)]">
              <Check className="w-10 h-10 text-[var(--color-accent)]" strokeWidth={3} />
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] text-center">
              {total} {total === 1 ? 'image' : 'images'} exported successfully
            </p>
            <button
              aria-label="Close dialog"
              onClick={onClose}
              className="w-full py-3 rounded-full bg-[var(--color-accent)] text-black font-semibold hover:bg-[var(--color-accent-hover)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] transition-all duration-500 ease-out"
                  style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)] truncate max-w-[200px]">
                {currentFile || 'Preparing...'}
              </span>
              <span className="font-mono text-[var(--color-accent)]">
                {progress}/{total}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
