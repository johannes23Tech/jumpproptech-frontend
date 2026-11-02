import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return; // Don't show if already installed

    // Check for iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Show banner after 2 seconds to not annoy the user immediately
    setTimeout(() => setShowBanner(true), 2000);

    // Listen for Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowBanner(false);
      }
    } else if (isIOS) {
      alert("To install Jump PropTech:\n\n1. Tap the 'Share' icon at the bottom of Safari.\n2. Scroll down and tap 'Add to Home Screen'.");
    } else {
      alert("To install Jump PropTech:\n\n1. Tap your browser menu (three dots).\n2. Select 'Install app' or 'Add to Home screen'.");
    }
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Mobile Banner (Shows at the top of the dashboard on phones) */}
      <div className="md:hidden bg-charcoal text-ivory p-4 rounded-xl mb-4 flex justify-between items-center shadow-lg border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-gold p-2 rounded-lg text-black">
            <Download size={20} />
          </div>
          <div>
            <p className="font-bold text-sm">Install App</p>
            <p className="text-[10px] text-gray-400">Faster access, works offline</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleInstallClick} className="bg-gold text-black px-3 py-1.5 rounded-md text-xs font-bold">Install</button>
          <button onClick={() => setShowBanner(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
      </div>

      {/* Desktop Sidebar Button (Hidden on mobile) */}
      <button 
        onClick={handleInstallClick}
        className="hidden md:flex items-center gap-3 text-sm text-gold hover:text-gold-light w-full px-4 py-2 mt-2 bg-gold/10 rounded-lg transition-colors border border-gold/20"
      >
        <Download size={18} /> Install App
      </button>
    </>
  );
}