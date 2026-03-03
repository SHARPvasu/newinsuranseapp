import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) { setIsInstalled(true); return; }

    // Check if dismissed before
    const wasDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (wasDismissed) { setDismissed(true); return; }

    // Detect iOS
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const safari = /safari/.test(navigator.userAgent.toLowerCase()) && !/chrome/.test(navigator.userAgent.toLowerCase());
    if (ios && safari) {
      setIsIOS(true);
      // Show iOS prompt after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000);
    }

    // Listen for install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt || isInstalled || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 animate-slideUp">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4">
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
            <svg viewBox="0 0 40 40" className="w-8 h-8">
              <path d="M20 4L32 10L32 22C32 29 26 35 20 38C14 35 8 29 8 22L8 10Z" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M14 20L18 24L26 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">UV Insurance Agency</h3>
                <p className="text-xs text-slate-500 mt-0.5">Install for quick access</p>
              </div>
              <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  To install on iPhone/iPad:
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
                    Tap <Share className="w-3.5 h-3.5 text-blue-600 mx-0.5" /> Share button in Safari
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
                    Select "Add to Home Screen"
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
                    Tap "Add" to install
                  </div>
                </div>
                <button onClick={handleDismiss} className="w-full mt-2 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 font-medium hover:bg-slate-200 transition-colors">
                  Got it, thanks!
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install App
                </button>
                <button
                  onClick={handleDismiss}
                  className="py-2 px-3 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                >
                  Later
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            Works on Android & iOS
          </div>
          <div className="text-xs text-slate-400">•</div>
          <div className="text-xs text-slate-500">Works offline</div>
          <div className="text-xs text-slate-400">•</div>
          <div className="text-xs text-slate-500">Fast access</div>
        </div>
      </div>
    </div>
  );
}
