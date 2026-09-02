import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  sanitizePhone,
  sanitizePrice,
  validateEmail,
  validateName,
  validatePercent,
  validatePhone,
  validatePositiveNumber,
  validateRequired,
} from '../../lib/validation';
import { cn } from '../../lib/utils';
import type { SigningLink } from '../../types/domain';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

export interface SigningLinkFormValues {
  client_name: string;
  client_phone: string;
  client_email: string;
  deal_type: string;
  agreement_type: string;
  property_description: string;
  exact_address: string;
  show_address_before_signing: boolean;
  price: string;
  hidden_details: string;
  commission_type: string;
  commission_percent: string;
  minimum_commission: string;
  valid_days: string;
  payment_days: string;
}

const DEFAULTS: SigningLinkFormValues = {
  client_name: '',
  client_phone: '',
  client_email: '',
  deal_type: 'sale',
  agreement_type: 'exclusive',
  property_description: '',
  exact_address: '',
  show_address_before_signing: false,
  price: '',
  hidden_details: '',
  commission_type: 'percentage',
  commission_percent: '2',
  minimum_commission: '',
  valid_days: '30',
  payment_days: '3',
};

export type SigningLinkSubmitResult = { link?: SigningLink; error?: string };

interface CreateSigningLinkModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SigningLinkFormValues) => Promise<{ token: string } | void>;
}

export function CreateSigningLinkModal({ open, onClose, onSubmit }: CreateSigningLinkModalProps) {
  const [form, setForm] = useState(DEFAULTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(DEFAULTS);
      setErrors({});
      setCreatedToken(null);
      setCopied(false);
    }
  }, [open]);

  const set = (key: keyof SigningLinkFormValues, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const signingUrl = createdToken ? `${window.location.origin}/sign/${createdToken}` : '';

  const copyUrl = () => {
    if (!signingUrl) return;
    void navigator.clipboard.writeText(signingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const name = validateName(form.client_name);
    if (!name.isValid) next.client_name = name.error!;
    const phone = validatePhone(form.client_phone);
    if (!phone.isValid) next.client_phone = phone.error!;
    const email = validateEmail(form.client_email, true);
    if (!email.isValid) next.client_email = email.error!;
    const pct = validatePercent(form.commission_percent);
    if (!pct.isValid) next.commission_percent = pct.error!;
    const vd = validatePositiveNumber(form.valid_days, true);
    if (!vd.isValid) next.valid_days = vd.error!;
    const pd = validatePositiveNumber(form.payment_days, true);
    if (!pd.isValid) next.payment_days = pd.error!;
    const desc = validateRequired(form.property_description, 'תיאור נכס');
    if (!desc.isValid) next.property_description = desc.error!;
    const addr = validateRequired(form.exact_address, 'כתובת מדויקת');
    if (!addr.isValid) next.exact_address = addr.error!;
    if (form.price) {
      const pr = validatePositiveNumber(form.price);
      if (!pr.isValid) next.price = pr.error!;
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setErrors({});
    try {
      const result = await onSubmit(form);
      if (result?.token) {
        setCreatedToken(result.token);
      } else {
        onClose();
      }
    } catch (err) {
      setErrors({ form: (err as Error).message || 'שגיאה ביצירת הקישור' });
    } finally {
      setSaving(false);
    }
  };

  if (createdToken) {
    return (
      <Modal open={open} onClose={onClose} title="קישור נוצר בהצלחה" size="lg">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
            <Check className="h-6 w-6 shrink-0 text-success" />
            <p className="text-sm">קישור החתימה מוכן לשליחה ללקוח</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">קישור לחתימה</p>
            <p className="break-all text-sm font-mono">{signingUrl}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={copyUrl} className="flex-1 sm:flex-none">
              <Copy className="h-4 w-4" />
              {copied ? 'הועתק!' : 'העתק קישור'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              סגור
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="קישור חתימה חדש" size="lg">
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-3 overflow-y-auto pe-1">
        <Input
          label="שם לקוח"
          value={form.client_name}
          onChange={(e) => set('client_name', e.target.value)}
          required
          error={errors.client_name}
        />
        <Input
          label="טלפון"
          value={form.client_phone}
          onChange={(e) => set('client_phone', sanitizePhone(e.target.value))}
          required
          error={errors.client_phone}
        />
        <Input
          label="אימייל"
          type="email"
          value={form.client_email}
          onChange={(e) => set('client_email', e.target.value)}
          required
          error={errors.client_email}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">סוג עסקה</label>
            <select
              className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm"
              value={form.deal_type}
              onChange={(e) => set('deal_type', e.target.value)}
            >
              {Object.entries(DEAL_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="font-semibold">הקישור נוצר בהצלחה</p>
            <p className="mt-1 text-sm text-muted-foreground">
              שלחו ל{createdLink.client_name} את הקישור לחתימה דיגיטלית
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-start">
            <p className="mb-1 text-xs font-medium text-muted-foreground">קישור לחתימה</p>
            <p className="break-all text-sm font-mono">{signingUrl}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" onClick={() => void copyUrl()} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'הועתק!' : 'העתק קישור'}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              סגור
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-3 overflow-y-auto pe-1">
          <Input
            label="שם לקוח"
            value={form.client_name}
            onChange={(e) => set('client_name', e.target.value)}
            required
            error={errors.client_name}
          />
          <Input
            label="טלפון"
            value={form.client_phone}
            onChange={(e) => set('client_phone', sanitizePhone(e.target.value))}
            required
            error={errors.client_phone}
          />
          <Input
            label="אימייל"
            type="email"
            value={form.client_email}
            onChange={(e) => set('client_email', e.target.value)}
            required
            error={errors.client_email}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">סוג עסקה</label>
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm"
                value={form.deal_type}
                onChange={(e) => set('deal_type', e.target.value)}
              >
                {Object.entries(DEAL_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">סוג הסכם</label>
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm"
                value={form.agreement_type}
                onChange={(e) => set('agreement_type', e.target.value)}
              >
                {Object.entries(AGREEMENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              תיאור נכס
              <span className="text-destructive mr-1">*</span>
            </label>
            <textarea
              className={cn(
                'min-h-20 w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm',
                errors.property_description && 'border-destructive',
              )}
              value={form.property_description}
              onChange={(e) => set('property_description', e.target.value)}
              required
            />
            {errors.property_description && (
              <p className="text-sm text-destructive">{errors.property_description}</p>
            )}
          </div>
          <Input
            label="כתובת מדויקת"
            value={form.exact_address}
            onChange={(e) => set('exact_address', e.target.value)}
            required
            error={errors.exact_address}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.show_address_before_signing}
              onChange={(e) => set('show_address_before_signing', e.target.checked)}
            />
            הצג כתובת לפני חתימה
          </label>
          <Input
            label="מחיר"
            value={form.price}
            onChange={(e) => set('price', sanitizePrice(e.target.value))}
            error={errors.price}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="% עמלה"
              value={form.commission_percent}
              onChange={(e) => set('commission_percent', e.target.value)}
              required
              error={errors.commission_percent}
            />
            <Input
              label="ימי תוקף"
              value={form.valid_days}
              onChange={(e) => set('valid_days', e.target.value)}
              required
              error={errors.valid_days}
            />
            <Input
              label="ימי תשלום"
              value={form.payment_days}
              onChange={(e) => set('payment_days', e.target.value)}
              required
              error={errors.payment_days}
            />
          </div>
          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'יוצר...' : 'צור קישור'}
          </Button>
        </form>
      )}
    </Modal>
  );
}
