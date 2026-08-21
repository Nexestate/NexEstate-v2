import { Accessibility, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { LandingFooter } from '../landing/LandingSections';
import { LandingHeader } from '../landing/LandingHeader';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <LandingHeader />
      <main>{children}</main>
      <LandingFooter />

      <a
        href="#top"
        className="fixed bottom-6 end-6 z-40 grid h-11 w-11 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105 sm:h-12 sm:w-12"
        aria-label="נגישות"
      >
        <Accessibility className="h-5 w-5" />
      </a>
      <button
        type="button"
        className="fixed bottom-6 start-6 z-40 grid h-11 w-11 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105 sm:h-12 sm:w-12"
        aria-label="צ'אט"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
