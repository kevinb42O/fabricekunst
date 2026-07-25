import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function ToastNotification({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short text-[#111111]">
      <div className="px-5 py-3.5 rounded-2xl bg-[#111111] text-white border border-[#D4AF37]/50 shadow-strong flex items-center space-x-3 text-xs font-serif font-bold">
        <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
        <span>{message}</span>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-stone-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
