// src/utils/usePWAInstall.ts
import { useState, useEffect } from 'react';

export function downloadAndroidApk() {
  const link = document.createElement('a');
  link.href = '/downloads/JumpPropTech.apk';
  link.download = 'JumpPropTech.apk';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /Android/i.test(navigator.userAgent);
    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const promptInstall = async () => {
    if (isAndroid) {
      downloadAndroidApk();
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else if (isIOS) {
      alert("To install Jump PropTech:\n\n1. Tap the 'Share' icon at the bottom of Safari.\n2. Scroll down and tap 'Add to Home Screen'.");
    } else {
      alert("To install Jump PropTech:\n\n1. Tap your browser menu (three dots).\n2. Select 'Install app' or 'Add to Home screen'.");
    }
  };

  return { promptInstall };
}