import { Building2, CheckCircle2, CreditCard, Landmark, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import {
  completePublicPayment,
  getPublicPaymentCheckout,
  initPaymentSession,
  submitPaymentTransferProof,
} from '../../lib/services';
import { uploadPaymentProof } from '../../lib/services/storageService';
import { formatCurrency } from '../../lib/utils';
import {
  PAYMENT_REQUEST_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  type PaymentRequestType,
  type PublicPaymentCheckout,
} from '../../types/domain';

type PayMethod = 'card' | 'transfer';

export function PaymentCheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [checkout, setCheckout] = useState<PublicPaymentCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [method, setMethod] = useState<PayMethod>('card');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState('');
  const [cardMode, setCardMode] = useState<'simulate' | 'redirect' | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('קישור לא תקין');
      setLoading(false);
      return;
    }
    getPublicPaymentCheckout(slug).then((data) => {
      if (!data) setError('דרישת התשלום לא נמצאה');
      else {
        setCheckout(data);
        if (data.payment_status === 'paid') setDone(true);
      }
      setLoading(false);
    });
  }, [slug]);

  const handleCardPay = async () => {
    if (!slug) return;
    setSubmitting(true);
    setFormError('');
    try {
      const session = await initPaymentSession(slug);
      setCardMode(session.mode);

      if (session.mode === 'redirect' && session.redirect_url) {
        window.location.href = session.redirect_url;
        return;
      }

      const result = await completePublicPayment(slug, 'credit');
      if (!result.success) {
        setFormError('התשלום נכשל. נסה שוב.');
        return;
      }
      setDone(true);
      setCheckout((c) =>
        c
          ? {
              ...c,
              payment_status: 'paid',
            }
          : c,
      );
    } catch {
      setFormError('שגיאה בעיבוד התשלום.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !proofFile) {
      setFormError('יש להעלות אסמכתא');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const proofUrl = await uploadPaymentProof(slug, proofFile);
      const ok = await submitPaymentTransferProof(slug, proofUrl);
      if (!ok) {
        setFormError('שגיאה בשליחת האסמכתא.');
        return;
      }
      setDone(true);
      setCheckout((c) => (c ? { ...c, payment_status: 'pending_verification' } : c));
    } catch {
      setFormError('שגיאה בהעלאת האסמכתא.');
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

  if (error || !checkout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-lg text-muted-foreground">{error || 'דף לא נמצא'}</p>
      </div>
    );
  }

  const typeLabel =
    PAYMENT_REQUEST_TYPE_LABELS[checkout.payment_type as PaymentRequestType] ?? checkout.payment_type;

  if (done) {
    const isPendingVerification = checkout.payment_status === 'pending_verification';
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center" dir="rtl">
        <CheckCircle2 className={`h-16 w-16 ${isPendingVerification ? 'text-warning' : 'text-success'}`} />
        <h1 className="text-2xl font-bold">
          {isPendingVerification ? 'האסמכתא נשלחה' : 'התשלום התקבל'}
        </h1>
        <p className="max-w-md text-muted-foreground">
          {isPendingVerification
            ? 'האסמכתא נשלחה לאימות. תקבל/י עדכון לאחר אישור המנהל.'
            : 'תודה! התשלום אושר בהצלחה.'}
        </p>
        <p className="text-sm text-muted-foreground">{formatCurrency(checkout.amount)} · {typeLabel}</p>
      </div>
    );
  }

  if (checkout.payment_status === 'cancelled') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center" dir="rtl">
        <p className="text-lg text-muted-foreground">דרישת התשלום בוטלה</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12" dir="rtl">
      <div className="border-b border-border bg-card px-4 py-6">
        <div className="mx-auto max-w-lg">
          <p className="text-sm text-muted-foreground">{checkout.manager_name}</p>
          <h1 className="mt-1 text-2xl font-bold">{formatCurrency(checkout.amount)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {typeLabel}
            {checkout.due_date ? ` · יעד: ${new Date(checkout.due_date).toLocaleDateString('he-IL')}` : ''}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            סטטוס: {PAYMENT_STATUS_LABELS[checkout.payment_status as keyof typeof PAYMENT_STATUS_LABELS] ?? checkout.payment_status}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <div className="rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-primary" />
            <span>{checkout.property_title}</span>
            {checkout.unit_number && <span className="text-muted-foreground">· יחידה {checkout.unit_number}</span>}
          </div>
          {checkout.property_address && (
            <p className="text-xs text-muted-foreground">{checkout.property_address}</p>
          )}
          <p className="text-sm">שוכר: {checkout.tenant_name}</p>
          {checkout.notes && <p className="text-sm text-muted-foreground">{checkout.notes}</p>}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              method === 'card' ? 'border-primary bg-primary/10 text-primary' : 'border-border'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            כרטיס אשראי
          </button>
          <button
            type="button"
            onClick={() => setMethod('transfer')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              method === 'transfer' ? 'border-primary bg-primary/10 text-primary' : 'border-border'
            }`}
          >
            <Landmark className="h-4 w-4" />
            העברה בנקאית
          </button>
        </div>

        {method === 'card' ? (
          <div className="space-y-4 rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">
              {cardMode === 'redirect'
                ? 'מעביר לדף תשלום מאובטח...'
                : 'תשלום מאובטח בכרטיס אשראי'}
            </p>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button className="w-full" onClick={() => void handleCardPay()} disabled={submitting}>
              {submitting ? 'מעבד...' : `שלם ${formatCurrency(checkout.amount)}`}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleTransferSubmit} className="space-y-4 rounded-xl border border-border p-4">
            <p className="text-sm font-medium">פרטי העברה</p>
            <div className="space-y-1 text-sm">
              {checkout.bank_name && <p>בנק: {checkout.bank_name}</p>}
              {checkout.bank_branch && <p>סניף: {checkout.bank_branch}</p>}
              {checkout.bank_account && <p>חשבון: {checkout.bank_account}</p>}
              {checkout.bank_account_holder && <p>בעל החשבון: {checkout.bank_account_holder}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">העלאת אסמכתא</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground hover:bg-muted/40">
                <Upload className="h-5 w-5" />
                {proofFile ? proofFile.name : 'בחר קובץ (תמונה / PDF)'}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" className="w-full" disabled={submitting || !proofFile}>
              {submitting ? 'שולח...' : 'שלח אסמכתא לאימות'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
