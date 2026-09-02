import { PublicLayout } from '../../components/layout/PublicLayout';
import { PageHero } from '../../components/market/PageHero';

interface LegalPageProps {
  title: string;
}

export function LegalPage({ title }: LegalPageProps) {
  return (
    <PublicLayout>
      <PageHero title={title} subtitle="מסמך משפטי — NexEstate" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 text-sm leading-relaxed text-muted-foreground">
        <p>
          תוכן {title} יעודכן בהמשך. לשאלות ניתן לפנות ל-
          <a href="mailto:info@nexestate.co" className="text-primary hover:underline">
            info@nexestate.co
          </a>
          .
        </p>
      </div>
    </PublicLayout>
  );
}

export function TermsPage() {
  return <LegalPage title="תנאי שימוש" />;
}

export function PrivacyPage() {
  return <LegalPage title="מדיניות פרטיות" />;
}
