import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, subtitle, children }: ModalProps) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-ivory w-full max-w-2xl rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh] md:max-h-[85vh] border border-white/10">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-charcoal to-black px-6 py-5 flex justify-between items-center shrink-0 border-b border-gold/20">
          <div className="min-w-0 pr-4">
            {subtitle && <p className="text-gold text-[10px] tracking-[0.2em] uppercase font-bold mb-1">{subtitle}</p>}
            <h3 className="font-display text-xl md:text-2xl text-ivory font-bold truncate">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2.5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-gradient-to-b from-ivory to-white">
          {children}
        </div>
      </div>
    </div>
  );
}