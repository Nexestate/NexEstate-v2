import {
  Building,
  Building2,
  ChevronDown,
  Clock,
  Factory,
  Gavel,
  Home,
  MapPin,
  Search,
  Sparkles,
  Store,
  TreePine,
  Users,
  Wand2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { cn, formatCurrency } from '../../lib/utils';
import { AnimatedSearchInput } from './AnimatedSearchInput';
import { DashboardMockup } from './DashboardMockup';
import { SigningMockup } from './SigningMockup';

/* ─── Data ─── */

const STATS = [
  { value: '10,000+', label: 'נכסים פעילים' },
  { value: '500+', label: 'מפרסמים פעילים' },
  { value: '₪50M+', label: 'עסקאות מכירה' },
  { value: '99.9%', label: 'זמינות' },
];

const QUICK_LINKS = [
  { label: 'דירה בתל אביב', href: '/market?category=דירות' },
  { label: 'משרדים להשכרה', href: '/market?category=משרדים' },
  { label: 'מגרש בראשון לציון', href: '/market?category=מגרשים' },
  { label: 'מכירות פומביות', href: '/auctions' },
];

const CATEGORIES = [
  { icon: TreePine, label: 'מגרשים', color: '#10b981' },
  { icon: Factory, label: 'תעשייה', color: '#ef4444' },
  { icon: Store, label: 'מסחרי', color: '#f59e0b' },
  { icon: Building2, label: 'משרדים', color: '#8b5cf6' },
  { icon: Home, label: 'בתים', color: '#22c55e' },
  { icon: Building, label: 'דירות', color: '#3b82f6' },
];

const RECENT_DEALS = [
  { price: 2_710_000, type: 'דירה', city: 'תל אביב', address: 'רothschild 12' },
  { price: 1_850_000, type: 'משרד', city: 'רמת גן', address: 'בialik 45' },
  { price: 4_200_000, type: 'בית', city: 'הרצליה', address: 'הרצל 8' },
  { price: 980_000, type: 'דירה', city: 'חיפה', address: 'הנשיא 22' },
  { price: 3_500_000, type: 'מסחרי', city: 'ירושלים', address: 'jaffa 100' },
  { price: 1_200_000, type: 'מגרש', city: 'ראשון לציון', address: 'אזור תעשייה' },
];

const AUCTIONS = [
  {
    id: 1,
    title: 'דירת 4 חדרים — נווה צedek',
    city: 'תל אביב',
    price: 3_100_000,
    endsAt: Date.now() + 3 * 86400000 + 5 * 3600000,
  },
  {
    id: 2,
    title: 'משרדים — Azrieli',
    city: 'תל אביב',
    price: 5_500_000,
    endsAt: Date.now() + 7 * 86400000,
  },
  {
    id: 3,
    title: 'מגרש בנייה',
    city: 'ראשון לציון',
    price: 1_450_000,
    endsAt: Date.now() + 1 * 86400000 + 12 * 3600000,
  },
];

const ROLE_TABS = [
  {
    id: 'broker',
    label: 'מתווך',
    features: [
      { icon: TrendingUpIcon, title: 'ניהול לידים', desc: 'מעקב מלא מליד ועד סגירה' },
      { icon: BellIcon, title: 'התראות חכמות', desc: 'חוזים, תשלומים וצ\'קים' },
      { icon: LayoutIcon, title: 'לוח בקרה מתקדם', desc: 'סטטיסטיקות בזמן אמת' },
      { icon: SparklesIcon, title: 'קידום נכסים', desc: 'פרסום לשוק ו-off-market' },
    ],
  },
  {
    id: 'investor',
    label: 'משקיע',
    features: [
      { icon: TrendingUpIcon, title: 'ניתוח תשואות', desc: 'ROI ותחזיות הכנסה' },
      { icon: Building2, title: 'תיק נכסים', desc: 'ניהול מרוכז של השקעות' },
      { icon: BellIcon, title: 'התראות שוק', desc: 'הזדמנויות חדשות בזמן אמת' },
    ],
  },
  {
    id: 'seller',
    label: 'מוכר פרטי',
    features: [
      { icon: SparklesIcon, title: 'פרסום מהיר', desc: 'העלה נכס ב-5 דקות' },
      { icon: Users, title: 'גישה למתווכים', desc: 'רשת מתווכים מוסמכים' },
      { icon: FileIcon, title: 'חתימה דיגיטלית', desc: 'הסכמים וחוזים online' },
    ],
  },
] as const;

function TrendingUpIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>;
}
function BellIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function LayoutIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>;
}
function SparklesIcon({ className }: { className?: string }) {
  return <Sparkles className={className} />;
}
function FileIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>;
}

const FAQ = [
  {
    q: 'איך מפרסמים נכס?',
    a: 'נרשמים כמתווך (או מוכר פרטי), מוסיפים נכס מהדשבורד עם תמונות ופרטים, ובוחרים בין פרסום לשוק הציבורי, off-market, או מכירה פומבית.',
  },
  {
    q: 'האם יש חתימה דיגיטלית?',
    a: 'כן — יוצרים קישור חתימה מהדשבורד, הלקוח חותם מהנייד על Canvas, ומתקבל PDF אוטומטי עם כל הפרטים.',
  },
  {
    q: 'איך משתפים נכס עם שותף?',
    a: 'ממודל השיתוף — שולחים הזמנה במייל עם רמת הרשאה (צפייה/עריכה/מנהל). משתמש חדש מקבל הזמנה, נרשם, והנכס מופיע אוטומטית.',
  },
  {
    q: 'מה כולל CRM המערכת?',
    a: 'ניהול לידים (טבלה + קנבן), לקוחות, משימות, התראות על חוזים ותשלומים, ודוחות פיננסיים — הכל במקום אחד.',
  },
  {
    q: 'האם יש ניהול שוכרים וחוזים?',
    a: 'כן — ניהול יחידות, שוכרים, חוזי שכירות, מעקב תשלומים והתראות על חוזים שעומדים להסתיים.',
  },
];

const FOOTER_LINKS: Record<string, { label: string; to: string }[]> = {
  חברה: [
    { label: 'אודות', to: '/' },
    { label: 'צוות', to: '/players' },
    { label: 'בלוג', to: '/' },
  ],
  עזרה: [
    { label: 'מרכז תמיכה', to: '/login' },
    { label: 'שאלות נפוצות', to: '/#faq' },
    { label: 'צור קשר', to: '/login' },
  ],
  משפטי: [
    { label: 'תנאי שימוש', to: '/register' },
    { label: 'מדיניות פרטיות', to: '/register' },
  ],
  שירותים: [
    { label: 'שוק נכסים', to: '/market' },
    { label: 'מכירות פומביות', to: '/auctions' },
    { label: 'מחשבון תשואה', to: '/calculator' },
    { label: 'מחירים', to: '/prices' },
  ],
};

/* ─── Countdown hook ─── */
function useCountdown(target: number) {
  const [left, setLeft] = useState(formatCountdown(target));

  useEffect(() => {
    const id = setInterval(() => setLeft(formatCountdown(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return left;
}

function formatCountdown(target: number) {
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${d}י ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function AuctionCard({ auction }: { auction: typeof AUCTIONS[0] }) {
  const countdown = useCountdown(auction.endsAt);

  return (
    <div className="group min-w-[300px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-warning/50 hover:shadow-lg hover:shadow-warning/10 sm:min-w-[340px]">
      <div className="relative h-36 bg-gradient-to-br from-warning/20 via-card to-primary/10 flex items-center justify-center">
        <Gavel className="h-14 w-14 text-warning/40 transition-transform group-hover:scale-110" />
        <div className="absolute top-3 start-3 flex items-center gap-1 rounded-full bg-destructive/90 px-2.5 py-1 text-[10px] font-bold text-white">
          <Clock className="h-3 w-3" />
          {countdown}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm">{auction.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {auction.city}
        </p>
        <p className="mt-3 text-xl font-bold text-warning">{formatCurrency(auction.price)}</p>
      </div>
    </div>
  );
}

/* ─── Main export sections used by LandingPage ─── */

export function HeroSection() {
  const navigate = useNavigate();
  const [searchTab, setSearchTab] = useState<'sale' | 'rent'>('sale');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (searchTab) params.set('type', searchTab);
    navigate(`/market${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <section id="hero" className="relative overflow-hidden px-4 pb-16 pt-10 sm:pt-16">
      <div className="pointer-events-none absolute inset-0 hero-gradient" />
      <div className="pointer-events-none absolute start-1/4 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute end-1/4 top-40 h-48 w-48 rounded-full bg-accent/10 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-[4.5rem] animate-fade-up">
          <span className="text-gradient">מצא. פרסם. סגור עסקה.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg animate-fade-up" style={{ animationDelay: '0.1s' }}>
          שוק נכסים, פרויקטים ומכירות — The leading real estate market for properties, projects, and auctions.
        </p>

        <div className="mx-auto mt-8 max-w-2xl animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="mb-3 flex justify-center gap-2">
            {(['sale', 'rent'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSearchTab(tab)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition-all',
                  searchTab === tab
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                )}
              >
                {tab === 'sale' ? 'למכירה' : 'להשכרה'}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute -top-3 start-1/2 z-10 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                <Wand2 className="h-3 w-3" />
                חיפוש חכם
              </span>
            </div>
            <div className="search-bar-glow flex flex-col gap-2 rounded-2xl border border-primary/20 bg-card/80 p-2 backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full sm:ps-4">
              <AnimatedSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
              />
              <Button className="h-11 w-full shrink-0 rounded-xl px-6 sm:h-12 sm:w-auto sm:rounded-full sm:px-8" onClick={handleSearch}>
                <Search className="h-4 w-4 shrink-0" />
                חיפוש
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-primary sm:text-sm">
            {QUICK_LINKS.map((link) => (
              <Link key={link.label} to={link.href} className="transition-colors hover:underline">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-5 transition-transform hover:scale-[1.02]"
            >
              <div className="text-xl font-bold text-primary sm:text-2xl">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoriesSection() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section id="categories" className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">סוגי נכסים</h2>
            <p className="mt-1 text-sm text-muted-foreground">בחר קטגוריה והתחל לחפש</p>
          </div>
          <Link to="/market" className="hidden text-sm text-primary hover:underline sm:block">
            לכל הנכסים ←
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {CATEGORIES.map(({ icon: Icon, label, color }) => (
            <Link
              key={label}
              to={`/market?category=${encodeURIComponent(label)}`}
              className={cn(
                'category-glow flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all',
                active === label ? 'border-primary bg-primary/5' : 'border-border bg-card/50 hover:bg-card',
              )}
              style={{ '--glow-color': `${color}66` } as React.CSSProperties}
              onMouseEnter={() => setActive(label)}
              onMouseLeave={() => setActive(null)}
            >
              <span
                className="grid h-14 w-14 place-items-center rounded-2xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${color}1a`, color, boxShadow: active === label ? `0 0 24px ${color}40` : undefined }}
              >
                <Icon className="h-7 w-7" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RecentDealsSection() {
  return (
    <section id="deals" className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">עסקאות אחרונות בשוק</h2>
            <p className="mt-1 text-sm text-muted-foreground">עסקאות שנסגרו לאחרונה</p>
          </div>
          <Link to="/deals" className="hidden text-sm text-primary hover:underline sm:block">
            הצג הכל ←
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {RECENT_DEALS.map((deal, i) => (
            <div
              key={deal.address}
              className="min-w-[220px] shrink-0 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 sm:min-w-[240px]"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="text-2xl font-bold text-primary">{formatCurrency(deal.price)}</div>
              <div className="mt-1 text-sm font-medium">{deal.type}</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {deal.city} • {deal.address}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AuctionsSection() {
  return (
    <section id="auctions" className="px-4 py-16 bg-card/20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">מכירות פומביות קרובות</h2>
            <p className="mt-1 text-sm text-muted-foreground">הזדמנויות עם טיימר חי</p>
          </div>
          <Link to="/auctions" className="hidden text-sm text-warning hover:underline sm:block">
            כל המכרזים ←
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {AUCTIONS.map((a) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const [role, setRole] = useState<'broker' | 'investor' | 'seller'>('broker');
  const tab = ROLE_TABS.find((t) => t.id === role)!;

  return (
    <section id="features" className="px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">הכלים שמתאימים לך</h2>
          <p className="mt-2 text-muted-foreground">בחר את התפקיד שלך וראה מה המערכת מציעה</p>
        </div>

        <div className="mb-8 flex justify-center gap-2">
          {ROLE_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setRole(id)}
              className={cn(
                'rounded-full px-5 py-2.5 text-sm font-medium transition-all',
                role === id
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'border border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4">
            {tab.features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl border border-border bg-card/50 p-4 transition-colors hover:border-primary/30 hover:bg-card"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
            <Link to="/register">
              <Button size="lg" className="mt-4 w-full sm:w-auto glow-primary">
                התחל ניסיון חינם
              </Button>
            </Link>
          </div>

          <div className="relative">
            {role === 'seller' ? (
              <SigningMockup className="animate-float mx-auto max-w-sm" />
            ) : role === 'investor' ? (
              <DashboardMockup className="animate-float opacity-90" />
            ) : (
              <DashboardMockup className="animate-float" />
            )}
            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="px-4 py-20 bg-card/20">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">יש לכם שאלות?</h2>
        <p className="mb-10 text-center text-sm text-muted-foreground">תשובות לשאלות הנפוצות</p>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div
              key={item.q}
              className={cn(
                'overflow-hidden rounded-2xl border transition-colors',
                open === i ? 'border-primary/30 bg-card' : 'border-border bg-card/50',
              )}
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-start font-medium"
              >
                {item.q}
                <ChevronDown className={cn('h-5 w-5 shrink-0 text-primary transition-transform duration-300', open === i && 'rotate-180')} />
              </button>
              <div className={cn('grid transition-all duration-300', open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <div className="overflow-hidden">
                  <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 animate-shimmer" />
          <h2 className="relative text-3xl font-bold sm:text-4xl">מוכנים להתחיל?</h2>
          <p className="relative mt-3 text-muted-foreground">
            הצטרפו לאלפי מתווכים, משקיעים ובעלי נכסים שכבר סוגרים עסקאות עם NexEstate
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button size="lg" className="glow-primary px-10">
                הצטרף עכשיו — חינם
              </Button>
            </Link>
            <Link to="/market">
              <Button size="lg" variant="outline" className="px-10 rounded-full">
                <Search className="h-4 w-4" />
                חפש נכס
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block">
              <span className="text-xl font-extrabold">
                <span className="text-foreground">Nex</span>
                <span className="text-primary">Estate</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">info@nexestate.co</p>
            <p className="text-sm text-muted-foreground">03-1234567</p>
            <p className="mt-1 text-sm text-muted-foreground">רחוב הרצל 1, תל אביב</p>
            <div className="mt-4 flex gap-3">
              {['Facebook', 'LinkedIn', 'Twitter'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {s.charAt(0)}
                </a>
              ))}
            </div>
          </div>
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="mb-4 font-semibold">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">© 2026 NexEstate. כל הזכויות שמורות.</p>
          <p className="text-xs text-muted-foreground">נבנה בישראל 🇮🇱</p>
        </div>
      </div>
    </footer>
  );
}
