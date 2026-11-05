import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 1. Check if app is already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; 
    }

    // 2. BLOCK iOS: If the user is on an iPhone/iPad, do nothing.
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIosDevice) {
      return;
    }

    // 3. Listen for the Android/Chrome/Edge install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner only when the native install prompt is ready
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Trigger the native Android install prompt
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  // If no Android prompt is available, or on iOS, don't show anything.
  if (!showBanner || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-charcoal text-ivory p-4 rounded-2xl shadow-2xl border border-gold/30 z-[100] flex items-center justify-between animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="bg-gold p-2.5 rounded-xl text-black shrink-0">
          <Download size={20} />
        </div>
        <div>
          <p className="font-bold text-sm">Install Jump PropTech</p>
          <p className="text-[10px] text-gray-400">Add to home screen for the app experience</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleInstallClick} 
          className="bg-gold text-black px-4 py-2 rounded-lg text-xs font-bold shadow-gold hover:opacity-90 transition-opacity"
        >
          Install
        </button>
        <button onClick={() => setShowBanner(false)} className="text-gray-500 hover:text-white p-1">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}