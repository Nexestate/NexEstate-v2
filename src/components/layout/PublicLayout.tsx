import { useEffect, type ReactNode } from 'react';
import { AccessibilityProvider } from '../../contexts/AccessibilityContext';
import { LandingFooter } from '../landing/LandingSections';
import { LandingHeader } from '../landing/LandingHeader';
import { AccessibilityWidget, ScrollToTopButton } from '../landing/LandingFloatingActions';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  useEffect(() => {
    document.documentElement.classList.add('public-site');
    return () => document.documentElement.classList.remove('public-site');
  }, []);

  return (
    <AccessibilityProvider>
      <div id="top" className="landing-page min-h-screen bg-background font-sans" dir="rtl">
        <div className="landing-header-spacer" aria-hidden="true" />
        <LandingHeader />
        <main>{children}</main>
        <LandingFooter />

        <ScrollToTopButton />
        <AccessibilityWidget />
      </div>
    </AccessibilityProvider>
  );
}
