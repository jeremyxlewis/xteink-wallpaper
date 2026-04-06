import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const colors = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-400',
};

export function Toast({ toast, onClose }) {
  const Icon = icons[toast.type] || Info;
  const colorClass = colors[toast.type] || colors.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 glass-panel-strong rounded-2xl shadow-xl border border-[var(--color-border)]">
      <Icon className={`w-5 h-5 ${colorClass}`} />
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-1 w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-elevated)] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={onRemove}
        />
      ))}
    </div>
  );
}