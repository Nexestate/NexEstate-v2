import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { PageHero } from '../../components/market/PageHero';

type LegalKind = 'terms' | 'privacy';

const CONTENT: Record<
  LegalKind,
  { title: string; subtitle: string; sections: { heading: string; body: string }[] }
> = {
  terms: {
    title: 'תנאי שימוש',
    subtitle: 'כללי שימוש בפלטפורמת NexEstate',
    sections: [
      {
        heading: '1. כללי',
        body: 'השימוש באתר NexEstate כפוף לתנאים אלו. גלישה, הרשמה או שימוש בשירות מהווים הסכמה לתנאי השימוש.',
      },
      {
        heading: '2. שירותי הפלטפורמה',
        body: 'NexEstate מספקת כלים לפרסום נכסים, ניהול CRM, חתימה דיגיטלית, ניהול שוכרים ומכירות פומביות. אין לראות במידע המוצג ייעוץ משפטי, מס או השקעות.',
      },
      {
        heading: '3. חשבון משתמש',
        body: 'המשתמש אחראי לשמירה על סודיות פרטי ההתחברות ולכל פעילות שמתבצעת בחשבונו. יש לספק מידע נכון ומעודכן בעת ההרשמה.',
      },
      {
        heading: '4. תוכן ופרסומים',
        body: 'המשתמש אחראי לדיוק המידע שמפרסם. NexEstate רשאית להסיר תוכן שמפר את החוק, מטעה או פוגע בזכויות צד שלישי.',
      },
      {
        heading: '5. שינויים',
        body: 'אנו עשויים לעדכן תנאים אלו מעת לעת. המשך שימוש לאחר עדכון מהווה הסכמה לגרסה המעודכנת.',
      },
    ],
  },
  privacy: {
    title: 'מדיניות פרטיות',
    subtitle: 'כיצד אנו אוספים, משתמשים ושומרים על המידע שלך',
    sections: [
      {
        heading: '1. מידע שאנו אוספים',
        body: 'אנו אוספים פרטי הרשמה (שם, דוא"ל, טלפון), נתוני שימוש בפלטפורמה, ומידע עסקי שמוזן על ידי המשתמש (נכסים, לקוחות, חוזים).',
      },
      {
        heading: '2. שימוש במידע',
        body: 'המידע משמש להפעלת השירות, תמיכה, שיפור חוויית המשתמש, התראות רלוונטיות ואבטחת המערכת.',
      },
      {
        heading: '3. שיתוף מידע',
        body: 'איננו מוכרים מידע אישי. מידע עשוי להישתף עם ספקי תשתית (אחסון, דוא"ל, אימות) בכפוף להסכמי סודיות.',
      },
      {
        heading: '4. אבטחה',
        body: 'אנו מיישמים אמצעי אבטחה סבירים להגנה על המידע, לרבות הצפנה, בקרות גישה ומדיניות RLS בבסיס הנתונים.',
      },
      {
        heading: '5. זכויותיך',
        body: 'ניתן לפנות אלינו ב-info@nexestate.co לבקשת עדכון, ייצוא או מחיקת מידע אישי, בכפוף לדרישות החוק.',
      },
    ],
  },
};

interface LegalPageProps {
  kind: LegalKind;
}

export function LegalPage({ kind }: LegalPageProps) {
  const content = CONTENT[kind];

  return (
    <PublicLayout>
      <PageHero title={content.title} subtitle={content.subtitle} />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        {content.sections.map((section) => (
          <section key={section.heading} className="rounded-2xl border border-border bg-card/40 p-6">
            <h2 className="text-lg font-bold">{section.heading}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
        <p className="text-center text-sm text-muted-foreground">
          שאלות?{' '}
          <a href="mailto:info@nexestate.co" className="text-primary hover:underline">
            info@nexestate.co
          </a>
          {' · '}
          <Link to="/" className="text-primary hover:underline">
            חזרה לדף הבית
          </Link>
        </p>
      </div>
    </PublicLayout>
  );
}

export function TermsPage() {
  return <LegalPage kind="terms" />;
}

export function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
