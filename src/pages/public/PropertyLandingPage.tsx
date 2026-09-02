import { Bed, Car, FileText, MapPin, Maximize, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getPublicLandingPage, submitPublicLead } from '../../lib/services';
import type { PublicLandingPage } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import { PROPERTY_KIND_LABELS, PROPERTY_STATUS_LABELS } from '../../lib/constants';
import type { PropertyKind, PropertyStatus } from '../../types';
import { validateName, validatePhone, sanitizePhone } from '../../lib/validation';

export function PropertyLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PublicLandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!slug) {
      setError('קישור לא תקין');
      setLoading(false);
      return;
    }
    getPublicLandingPage(slug).then((data) => {
      if (!data) setError('דף הנחיתה לא נמצא');
      else setPage(data);
      setLoading(false);
    });
  }, [slug]);

  const whatsappUrl = page?.broker_phone
    ? `https://wa.me/${page.broker_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`שלום, אני מתעניין/ת ב"${page.title}"`)}`
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    const nameResult = validateName(name);
    const phoneResult = validatePhone(phone);
    if (!nameResult.isValid || !phoneResult.isValid) {
      setFormError(nameResult.error || phoneResult.error || 'נא למלא שם וטלפון');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await submitPublicLead(slug, {
        full_name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        interest: interest.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      setFormError('שגיאה בשליחה. נסה שוב.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-lg text-muted-foreground">{error || 'דף לא נמצא'}</p>
      </div>
    );
  }

  const heroImage = page.images[0];

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      <div className="relative aspect-[4/3] w-full bg-muted sm:aspect-[16/9]">
        {heroImage ? (
          <img src={heroImage} alt={page.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">אין תמונה</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 w-full p-5 text-white">
          <p className="text-sm opacity-90">
            {PROPERTY_KIND_LABELS[page.kind as PropertyKind] ?? page.kind} ·{' '}
            {PROPERTY_STATUS_LABELS[page.status as PropertyStatus] ?? page.status}
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{page.title}</h1>
          <p className="mt-2 text-2xl font-bold text-primary-foreground">{formatCurrency(page.price)}</p>
          <p className="mt-1 flex items-center gap-1 text-sm opacity-90">
            <MapPin className="h-4 w-4" />
            {page.address}, {page.city}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {page.area_sqm != null && (
            <Spec icon={Maximize} label="שטח" value={`${page.area_sqm} מ"ר`} />
          )}
          {page.rooms != null && <Spec icon={Bed} label="חדרים" value={String(page.rooms)} />}
          {page.floor != null && <Spec icon={BuildingIcon} label="קומה" value={String(page.floor)} />}
          {page.parking_spots != null && (
            <Spec icon={Car} label="חנייה" value={String(page.parking_spots)} />
          )}
        </div>

        {page.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {page.images.slice(1).map((img) => (
              <img
                key={img}
                src={img}
                alt=""
                className="h-24 w-32 shrink-0 rounded-xl object-cover"
              />
            ))}
          </div>
        )}

        {page.description && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">תיאור הנכס</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {page.description}
            </p>
          </section>
        )}

        {page.documents.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">מסמכים</h2>
            <div className="space-y-2">
              {page.documents.map((doc) => (
                <a
                  key={doc}
                  href={doc}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm hover:bg-muted/40"
                >
                  <FileText className="h-4 w-4 text-primary" />
                  הורדת מסמך
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-border p-4">
          <h2 className="mb-3 text-lg font-semibold">השאר פרטים</h2>
          {submitted ? (
            <p className="rounded-xl bg-success/10 p-4 text-sm text-success">
              תודה! הפרטים נשלחו. {page.broker_name} יחזור/תחזור אליך בהקדם.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input label="שם מלא" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input
                label="טלפון"
                value={phone}
                onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                required
              />
              <Input label="אימייל" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input
                label="הערות / עניין"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="מתי נוח לכם לבקר?"
              />
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'שולח...' : 'שלח פרטים'}
              </Button>
            </form>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-2">
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex-1">
              <Button variant="outline" className="w-full border-success/40 text-success">
                <MessageCircle className="h-4 w-4" />
                וואטסאפ
              </Button>
            </a>
          )}
          <Button
            className="flex-1"
            onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            השאר פרטים
          </Button>
        </div>
      </div>
    </div>
  );
}

function Spec({ icon: Icon, label, value }: { icon: typeof Bed; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12h12M10 6h.01M10 10h.01M10 14h.01M10 18h.01M14 6h.01M14 10h.01M14 14h.01M14 18h.01" />
    </svg>
  );
}
