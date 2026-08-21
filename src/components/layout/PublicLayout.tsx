import { Accessibility, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { LandingFooter } from '../landing/LandingSections';
import { LandingHeader } from '../landing/LandingHeader';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div id="top" className="min-h-screen bg-background" dir="rtl">
      <LandingHeader />
      <main>{children}</main>
      <LandingFooter />

      <button
        type="button"
        className="fixed bottom-6 start-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 transition-transform hover:scale-105"
        aria-label="צ'אט"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
      <a
        href="#top"
        className="fixed bottom-6 end-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 transition-transform hover:scale-105"
        aria-label="נגישות"
      >
        <Accessibility className="h-5 w-5" />
      </a>
    </div>
  );
}
