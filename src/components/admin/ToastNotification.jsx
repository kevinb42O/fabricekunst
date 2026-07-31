import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastNotification({ message, type = 'success', onClose }) {
  if (!message) return null;

  const messageText = typeof message === 'object' ? message.text || message.message || String(message) : message;
  const toastType = typeof message === 'object' ? message.type || type : (
    messageText.includes('⚠️') || messageText.includes('mislukt') || messageText.includes('Fout')
      ? 'warning'
      : messageText.includes('⏳')
      ? 'info'
      : type
  );

  return (
    <div className="fixed bottom-6 right-6 z-[10001] animate-fade-in text-[#111111]">
      <div className={`px-5 py-3.5 rounded-2xl border shadow-2xl flex items-center space-x-3 text-xs font-serif font-bold transition-all max-w-md ${
        toastType === 'warning' || toastType === 'error'
          ? 'bg-amber-950 text-amber-100 border-amber-500/80 shadow-amber-950/40'
          : toastType === 'info'
          ? 'bg-stone-900 text-stone-100 border-stone-700 shadow-black/50'
          : 'bg-[#111111] text-white border-[#D4AF37]/50 shadow-black/50'
      }`}>
        {toastType === 'warning' || toastType === 'error' ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        ) : toastType === 'info' ? (
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
        )}
        <span className="leading-relaxed font-sans font-medium text-xs flex-1">{messageText}</span>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-stone-400 hover:text-white transition-colors shrink-0 cursor-pointer"
          title="Sluit melding"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
