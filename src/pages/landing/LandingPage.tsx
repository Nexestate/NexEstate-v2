import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import {
  AuctionsSection,
  CategoriesSection,
  CtaSection,
  FaqSection,
  FeaturesSection,
  HeroSection,
  RecentDealsSection,
} from '../../components/landing/LandingSections';

export function LandingPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace('#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <PublicLayout>
      <HeroSection />
      <CategoriesSection />
      <RecentDealsSection />
      <AuctionsSection />
      <FeaturesSection />
      <FaqSection />
      <CtaSection />
    </PublicLayout>
  );
}
