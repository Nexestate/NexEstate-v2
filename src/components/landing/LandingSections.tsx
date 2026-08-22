import {
  BarChart3,
  Bed,
  Building,
  Building2,
  ChevronDown,
  Clock,
  Facebook,
  Factory,
  FileSignature,
  Gavel,
  Home,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  Store,
  TreePine,
  TrendingUp,
  Twitter,
  Users,
  Youtube,
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
  { value: '99.9%', label: 'אמינות' },
];

const QUICK_LINKS = [
  { label: 'דירה בתל אביב', href: '/market?category=דירות' },
  { label: 'משרדים להשכרה', href: '/market?category=משרדים' },
  { label: 'מגרש בראשון לציון', href: '/market?category=מגרשים' },
  { label: 'מכירות פומביות', href: '/auctions' },
];

const CATEGORIES = [
  { icon: Building, label: 'דירות', color: '#3b82f6' },
  { icon: Home, label: 'בתים', color: '#22c55e' },
  { icon: Building2, label: 'משרדים', color: '#8b5cf6' },
  { icon: Store, label: 'מסחרי', color: '#f59e0b' },
  { icon: Factory, label: 'תעשייה', color: '#ef4444' },
  { icon: TreePine, label: 'מגרשים', color: '#10b981' },
];

const RECENT_DEALS = [
  { price: 15_710_000, city: 'תל אביב', address: 'דיזנגוף 17', rooms: 4, date: '31.7.2026' },
  { price: 8_450_000, city: 'תל אביב', address: 'רוטשילד 45', rooms: 5, date: '28.7.2026' },
  { price: 6_200_000, city: 'רמת גן', address: 'ביאליק 12', rooms: 4, date: '25.7.2026' },
  { price: 4_850_000, city: 'הרצליה', address: 'סוקולוב 8', rooms: 5, date: '22.7.2026' },
];

const AUCTIONS = [
  {
    id: 1,
    title: 'דירת 4 חדרים — נווה צדק',
    city: 'תל אביב',
    price: 3_100_000,
    bidders: 12,
    endsAt: Date.now() + 3 * 86400000 + 5 * 3600000,
  },
  {
    id: 2,
    title: 'משרדים — מגדל עזריאלי',
    city: 'תל אביב',
    price: 5_500_000,
    bidders: 7,
    endsAt: Date.now() + 7 * 86400000,
  },
  {
    id: 3,
    title: 'מגרש בנייה',
    city: 'ראשון לציון',
    price: 1_450_000,
    bidders: 23,
    endsAt: Date.now() + 1 * 86400000 + 12 * 3600000,
  },
];

const SERVICE_TABS = [
  {
    id: 'publish',
    label: 'פרסום נכס',
    icon: Building2,
    features: [
      { icon: Sparkles, title: 'פרסום מהיר', desc: 'העלה נכס ב-5 דקות עם תמונות ופרטים מלאים' },
      { icon: TrendingUp, title: 'חשיפה מקסימלית', desc: 'הגע לאלפי קונים ומשקיעים פעילים' },
      { icon: BarChart3, title: 'סטטיסטיקות בזמן אמת', desc: 'מעקב צפיות, פניות ומועדפים' },
      { icon: Users, title: 'גישה למתווכים', desc: 'רשת מתווכים מוסמכים לסגירת עסקה' },
    ],
    mockup: 'dashboard' as const,
  },
  {
    id: 'crm',
    label: 'ניהול לקוחות',
    icon: Users,
    features: [
      { icon: TrendingUp, title: 'ניהול לידים', desc: 'מעקב מלא מליד ועד סגירה — טבלה וקנבן' },
      { icon: Users, title: 'CRM מתקדם', desc: 'לקוחות, משימות והתראות במקום אחד' },
      { icon: BarChart3, title: 'דוחות וניתוח', desc: 'סטטיסטיקות ביצועים ותחזיות' },
    ],
    mockup: 'dashboard' as const,
  },
  {
    id: 'signing',
    label: 'חתימה דיגיטלית',
    icon: FileSignature,
    features: [
      { icon: FileSignature, title: 'הסכמים דיגיטליים', desc: 'יצירת קישור חתימה ללקוח בדקות' },
      { icon: Sparkles, title: 'חתימה מהנייד', desc: 'הלקוח חותם על Canvas ומקבל PDF' },
      { icon: TrendingUp, title: 'מעקב סטטוס', desc: 'ניהול קישורים, תוקף וסטטוס חתימה' },
    ],
    mockup: 'signing' as const,
  },
  {
    id: 'auctions',
    label: 'מכירות פומביות',
    icon: Gavel,
    features: [
      { icon: Gavel, title: 'מכרזים חיים', desc: 'הגדר מחיר פתיחה ועקוב אחר הצעות' },
      { icon: Clock, title: 'טיימר בזמן אמת', desc: 'ספירה לאחור אוטומטית לסיום מכרז' },
      { icon: Users, title: 'מגוון מציעים', desc: 'התראות על הצעות חדשות ומעקב מתמיד' },
    ],
    mockup: 'dashboard' as const,
  },
] as const;

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
    { label: 'קריירה', to: '/' },
  ],
  'שירותי האתר': [
    { label: 'שוק נכסים', to: '/market' },
    { label: 'מכירות פומביות', to: '/auctions' },
    { label: 'מחשבון תשואה', to: '/calculator' },
    { label: 'מחירים', to: '/prices' },
    { label: 'מפת עסקאות', to: '/deals' },
    { label: 'הזדמנויות', to: '/opportunities' },
  ],
  עזרה: [
    { label: 'מרכז תמיכה', to: '/login' },
    { label: 'שאלות נפוצות', to: '/#faq' },
    { label: 'צור קשר', to: '/login' },
    { label: 'מדריכים', to: '/market' },
    { label: 'תנאי שימוש', to: '/register' },
    { label: 'מדיניות פרטיות', to: '/register' },
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
    <Link
      to="/auctions"
      className="auction-card group flex h-full flex-col overflow-hidden rounded-xl border border-border/60 transition-all"
    >
      <div className="relative flex h-36 shrink-0 items-center justify-center bg-gradient-to-br from-warning/25 via-card to-primary/10 sm:h-40">
        <Gavel className="h-14 w-14 text-warning/50 transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16" />
        <div className="absolute top-3 start-3 flex items-center gap-1 rounded-full bg-destructive/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
          <Clock className="h-3 w-3" />
          {countdown}
        </div>
        <div className="absolute top-3 end-3 rounded-full bg-warning/90 px-2.5 py-1 text-[10px] font-bold text-black">
          חדש
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold leading-snug">{auction.title}</h3>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {auction.city}
        </p>
        <p className="mt-auto pt-4 text-xl font-bold text-warning sm:text-2xl">{formatCurrency(auction.price)}</p>
        <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {auction.bidders} מציעים
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Sections ─── */

export function HeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    navigate(`/market${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <section id="hero" className="relative overflow-hidden px-4 pb-20 pt-12 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 hero-gradient" />
      <div className="pointer-events-none absolute start-1/4 top-16 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-orb-drift" />
      <div className="pointer-events-none absolute end-1/4 top-32 h-56 w-56 rounded-full bg-accent/12 blur-3xl animate-orb-drift" style={{ animationDelay: '2s' }} />
      <div className="pointer-events-none absolute start-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl animate-pulse-glow" />

      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="animate-fade-up text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-[4.5rem]">
          <span className="text-[#60a5fa]">מצא.</span>
          <span className="text-white"> פרסם. סגור עסקה.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-up" style={{ animationDelay: '0.1s' }}>
          שוק הנדל&quot;ן המוביל לנכסים, פרויקטים ומכירות פומביות.
        </p>

        <div className="mx-auto mt-10 max-w-3xl animate-fade-up pt-3" style={{ animationDelay: '0.2s' }}>
          <div className="hero-search-bar relative flex items-center gap-2 rounded-full border border-primary/30 p-1.5 pe-2 backdrop-blur-xl sm:p-2 sm:pe-2.5">
            <span className="hero-smart-badge absolute -top-3 start-5 z-10 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold sm:start-6">
              <Sparkles className="h-3 w-3" />
              חיפוש חכם
            </span>
            <AnimatedSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearch}
            />
            <Button
              className="hero-search-btn h-11 shrink-0 rounded-full px-7 text-sm font-bold sm:h-12 sm:px-9"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4 shrink-0" />
              חיפוש
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="hero-quick-link rounded-full px-3.5 py-1.5 text-xs font-medium text-primary/90 transition-colors sm:text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          {STATS.map((stat) => (
            <div key={stat.label} className="stat-card-glow rounded-2xl px-4 py-5 sm:px-5 sm:py-6">
              <div className="text-xl font-bold text-primary sm:text-2xl">{stat.value}</div>
              <div className="mt-1.5 text-xs text-muted-foreground">{stat.label}</div>
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
    <section id="categories" className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">סוגי נכסים</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">בחר קטגוריה והתחל לחפש</p>
          </div>
          <Link to="/market" className="hidden text-sm text-primary transition-colors hover:underline sm:block">
            לכל הנכסים ←
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {CATEGORIES.map(({ icon: Icon, label, color }) => (
            <Link
              key={label}
              to={`/market?category=${encodeURIComponent(label)}`}
              className={cn(
                'category-glow group flex min-h-[140px] flex-col items-center justify-end gap-4 rounded-2xl border border-border/60 p-5 sm:min-h-[160px]',
                active === label && 'border-primary/40',
              )}
              style={{ '--glow-color': `${color}55` } as React.CSSProperties}
              onMouseEnter={() => setActive(label)}
              onMouseLeave={() => setActive(null)}
            >
              <span
                className="grid h-14 w-14 place-items-center rounded-2xl transition-all duration-300 group-hover:scale-110 sm:h-16 sm:w-16"
                style={{
                  backgroundColor: `${color}18`,
                  color,
                  boxShadow: active === label ? `0 0 32px ${color}50` : `0 0 16px ${color}20`,
                }}
              >
                <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
              </span>
              <span className="text-sm font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RecentDealsSection() {
  return (
    <section id="deals" className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-warning/15 text-base">🔥</span>
              עסקאות אחרונות בשוק
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">נתונים אמיתיים מרשם המקרקעין</p>
          </div>
          <Link to="/deals" className="hidden text-sm font-medium text-primary transition-colors hover:underline sm:block">
            לכל העסקאות ←
          </Link>
        </div>
        <div className="landing-cards-container rounded-2xl border border-primary/15 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RECENT_DEALS.map((deal) => (
              <Link
                key={deal.address}
                to="/deals"
                className="deal-card flex h-full min-w-0 flex-col rounded-xl border border-border/60 p-5 transition-all"
              >
                <div className="text-xl font-bold text-primary sm:text-2xl">{formatCurrency(deal.price)}</div>
                <div className="mt-2 text-base font-semibold">{deal.address}</div>
                <div className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {deal.city}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  <span>{deal.date}</span>
                  <span className="flex items-center gap-1">
                    <Bed className="h-3.5 w-3.5" />
                    {deal.rooms} חדרים
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AuctionsSection() {
  return (
    <section id="auctions" className="border-y border-border/30 bg-card/10 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">מכירות פומביות קרובות</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">הזדמנויות עם טיימר חי</p>
          </div>
          <Link to="/auctions" className="hidden text-sm text-warning transition-colors hover:underline sm:block">
            כל המכרזים ←
          </Link>
        </div>
        <div className="landing-cards-container rounded-2xl border border-warning/20 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AUCTIONS.map((a) => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const [service, setService] = useState<string>('publish');
  const tab = SERVICE_TABS.find((t) => t.id === service)!;

  return (
    <section id="features" className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">פרסם והגע לאלפי קונים</h2>
          <p className="mt-2 text-muted-foreground">הכלים שיעזרו לך לסגור עסקאות מהר יותר</p>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {SERVICE_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setService(id)}
              className={cn(
                'service-card flex flex-col items-center gap-3 rounded-2xl border border-border/60 p-5 transition-all sm:p-6',
                service === id && 'service-card-active',
              )}
            >
              <span
                className={cn(
                  'grid h-12 w-12 place-items-center rounded-xl transition-colors',
                  service === id ? 'bg-warning/20 text-warning' : 'bg-primary/10 text-primary',
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-center text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4">
            {tab.features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl border border-border/50 bg-card/40 p-4 transition-all hover:border-primary/30 hover:bg-card/70"
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
              <Button size="lg" className="mt-4 w-full shadow-lg shadow-primary/30 sm:w-auto">
                פרסם מודעה חדשה
              </Button>
            </Link>
          </div>

          <div className="relative">
            {tab.mockup === 'signing' ? (
              <SigningMockup className="mockup-glow animate-float mx-auto max-w-sm" />
            ) : (
              <DashboardMockup className="mockup-glow animate-float" />
            )}
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl bg-primary/8 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-border/30 bg-card/10 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">יש לכם שאלות?</h2>
        <p className="mb-10 text-center text-sm text-muted-foreground">תשובות לשאלות הנפוצות</p>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div
              key={item.q}
              className={cn(
                'overflow-hidden rounded-2xl border transition-all duration-300',
                open === i
                  ? 'border-primary/30 bg-card shadow-lg shadow-primary/5'
                  : 'border-border/50 bg-card/40 hover:border-border',
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
                  <p className="border-t border-border/50 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
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
    <section className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="cta-glow relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card/80 to-accent/10 px-6 py-14 text-center backdrop-blur-sm sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 animate-shimmer" />
          <div className="pointer-events-none absolute -top-20 start-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <h2 className="relative text-3xl font-bold sm:text-4xl">מוכנים להתחיל?</h2>
          <p className="relative mt-3 text-muted-foreground">
            הצטרפו לאלפי מתווכים, משקיעים ובעלי נכסים שכבר סוגרים עסקאות עם NexEstate
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/market">
              <Button size="lg" className="px-10 shadow-lg shadow-primary/30">
                <Search className="h-4 w-4" />
                חפש נכסים עכשיו
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="rounded-full border-primary/30 px-10 hover:bg-primary/10">
                הוסף נכס
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  const social = [
    { label: 'Facebook', icon: Facebook, href: '#' },
    { label: 'LinkedIn', icon: Linkedin, href: '#' },
    { label: 'YouTube', icon: Youtube, href: '#' },
    { label: 'Twitter', icon: Twitter, href: '#' },
  ];

  return (
    <footer className="border-t border-border/50 bg-card/20 px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-3">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-extrabold">
                <span className="text-foreground">Nex</span>
                <span className="text-primary">Estate</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              פלטפורמת הנדל&quot;ן המתקדמת בישראל — שוק נכסים, CRM, חתימה דיגיטלית, ניהול שוכרים ומכירות פומביות במקום אחד.
            </p>
            <div className="mt-5 flex gap-2.5">
              {social.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 text-muted-foreground transition-all hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className="lg:col-span-2">
              <h4 className="mb-4 text-sm font-bold">{title}</h4>
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

          <div className="sm:col-span-2 lg:col-span-3">
            <h4 className="mb-4 text-sm font-bold">יצירת קשר</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:info@nexestate.co" className="hover:text-foreground">info@nexestate.co</a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+97231234567" className="hover:text-foreground">03-1234567</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>רחוב הרצל 1, תל אביב</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>א׳–ה׳ 09:00–18:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">© 2026 NexEstate. כל הזכויות שמורות.</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/register" className="hover:text-foreground">תנאי שימוש</Link>
            <Link to="/register" className="hover:text-foreground">מדיניות פרטיות</Link>
            <span>נבנה בישראל 🇮🇱</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
