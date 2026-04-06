import { Loader2 } from 'lucide-react';

export function LoadingSkeleton({ message = 'Loading...' }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-sm z-10">
      <div className="w-12 h-12 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
      <p className="mt-4 text-sm text-[var(--color-text-secondary)] font-medium">
        {message}
      </p>
    </div>
  );
}