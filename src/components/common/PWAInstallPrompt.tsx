import { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');

    if (!isStandalone && !dismissed) {
      // Show after a brief delay
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl animate-slide-up">
      <button onClick={dismiss} className="absolute top-3 right-3 text-slate-500 hover:text-slate-300">
        <X size={18} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0">
          <Share size={18} className="text-sky-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">Install App</p>
          <p className="text-xs text-slate-400 mt-1">
            Tap <Share size={12} className="inline text-sky-400" /> in Safari, then "Add to Home Screen" for the best experience
          </p>
        </div>
      </div>
    </div>
  );
}
