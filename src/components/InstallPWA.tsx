import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if user is on iOS (iPhone/iPad)
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 2. Listen for the Chrome Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the native browser install prompt (Android/Chrome)
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      // Fallback instructions for iOS
      alert("To install Jump PropTech:\n\n1. Tap the 'Share' icon at the bottom of Safari.\n2. Scroll down and tap 'Add to Home Screen'.");
    } else {
      // Fallback for desktop or unsupported browsers
      alert("To install, look for the 'Install App' icon in your browser's address bar.");
    }
  };

  // Only show the button if the browser supports installation or it's an iOS device
  if (!deferredPrompt && !isIOS) return null;

  return (
    <button 
      onClick={handleInstallClick}
      className="flex items-center gap-3 text-sm text-gold hover:text-gold-light w-full px-4 py-2 mt-2 bg-gold/10 rounded-lg transition-colors border border-gold/20"
    >
      <Download size={18} /> Install App
    </button>
  );
}