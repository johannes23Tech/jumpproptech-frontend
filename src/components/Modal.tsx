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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-ivory w-full max-w-2xl rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh] md:max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-charcoal px-6 py-5 flex justify-between items-center shrink-0">
          <div>
            {subtitle && <p className="text-gold text-[10px] tracking-[0.2em] uppercase font-bold mb-1">{subtitle}</p>}
            <h3 className="font-display text-xl md:text-2xl text-ivory font-bold">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}