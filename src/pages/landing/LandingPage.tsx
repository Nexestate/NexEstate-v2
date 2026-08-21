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
