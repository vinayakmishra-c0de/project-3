import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none no-print">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border transition-all transform animate-in slide-in-from-bottom-5 duration-200 ${
              isSuccess
                ? 'bg-emerald-950 text-emerald-50 border-emerald-700/60 shadow-emerald-950/20'
                : isError
                ? 'bg-rose-950 text-rose-50 border-rose-700/60 shadow-rose-950/20'
                : isWarning
                ? 'bg-amber-950 text-amber-50 border-amber-700/60 shadow-amber-950/20'
                : 'bg-slate-900 text-slate-50 border-slate-700/60 shadow-slate-950/20'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-sky-400" />}
            </div>
            <div className="flex-1 min-w-0">
              {toast.title && <h5 className="font-semibold text-sm leading-snug">{toast.title}</h5>}
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
