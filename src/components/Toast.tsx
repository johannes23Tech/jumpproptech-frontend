import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }: { message: string, type?: 'success' | 'error', onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-slide-down ${
      type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'
    }`}>
      {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
      <span className="font-bold text-sm tracking-wide">{message}</span>
    </div>
  );
}