import { Download, Smartphone, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/Button';

const DISMISS_KEY = 'nexestate-install-dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function AppInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) === '1') return;

    if (isIos()) {
      setIosHelp(true);
    }

    const onInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onInstall);
    return () => window.removeEventListener('beforeinstallprompt', onInstall);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDeferredPrompt(null);
    setIosHelp(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }, [deferredPrompt, dismiss]);

  if (isStandalone() || localStorage.getItem(DISMISS_KEY) === '1') return null;
  if (!deferredPrompt && !iosHelp) return null;

  return (
    <div className="mb-6 w-full max-w-lg rounded-2xl border border-primary/30 bg-primary/5 p-4 text-start shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">הורד את אפליקציית NexEstate</p>
          <p className="mt-1 text-sm text-muted-foreground">
            גישה מהירה מהנייד, התראות על לידים חדשים, וחוויית שימוש מותאמת.
          </p>
          {iosHelp && !deferredPrompt && (
            <p className="mt-2 text-xs text-muted-foreground">
              ב-iPhone/iPad: לחץ על «שיתוף» בתחתית Safari ← «הוסף למסך הבית».
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {deferredPrompt && (
              <Button type="button" size="sm" onClick={() => void install()}>
                <Download className="h-4 w-4" />
                התקן אפליקציה
              </Button>
            )}
            <Button type="button" size="sm" variant="outline" onClick={dismiss}>
              {deferredPrompt ? 'אולי אחר כך' : 'הבנתי'}
            </Button>
          </div>
        </div>
        <button
          type="button"
          aria-label="סגור"
          onClick={dismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
