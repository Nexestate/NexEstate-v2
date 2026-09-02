import { Bell, CreditCard, Lock, Palette, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getAuthErrorDisplay } from '../../lib/authErrors';
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from '../../lib/notificationPrefs';
import {
  getPushPermission,
  isPushSupported,
  requestPushPermission,
} from '../../lib/pushNotifications';
import { ROLE_LABELS } from '../../lib/roles';
import {
  deleteOutboundWebhook,
  fetchOutboundWebhooks,
  fetchPaymentIntegrations,
  upsertOutboundWebhook,
  upsertPaymentIntegration,
} from '../../lib/services';
import type { PaymentIntegration } from '../../types/domain';
import { PAYMENT_PROVIDER_VENDOR_LABELS } from '../../types/domain';
import { validatePassword, validatePasswordMatch, validateRequired } from '../../lib/validation';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'profile', label: 'פרופיל', icon: User },
  { id: 'security', label: 'סיסמא', icon: Lock },
  { id: 'notifications', label: 'התראות', icon: Bell },
  { id: 'appearance', label: 'תצוגה', icon: Palette },
  { id: 'privacy', label: 'פרטיות', icon: Shield },
];

const BILLING_TAB = { id: 'billing', label: 'גבייה וחשבוניות', icon: CreditCard };

interface SettingsPageProps {
  variant?: 'broker' | 'buyer' | 'admin';
}

export function SettingsPage({ variant = 'broker' }: SettingsPageProps) {
  const { user, updateProfile, updatePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    company: '',
    license_number: '',
  });
  const [password, setPassword] = useState({ new: '', confirm: '' });
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [pushStatus, setPushStatus] = useState(getPushPermission());
  const [meshulamKey, setMeshulamKey] = useState('');
  const [morningKey, setMorningKey] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);
  const [integrations, setIntegrations] = useState<PaymentIntegration[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookId, setWebhookId] = useState<string | undefined>();
  const [billingForm, setBillingForm] = useState({
    business_name: '',
    tax_id: '',
    bank_name: '',
    bank_branch: '',
    bank_account: '',
    bank_account_holder: '',
  });

  useEffect(() => {
    setPrefs(loadNotificationPrefs());
    setPushStatus(getPushPermission());
  }, []);

  useEffect(() => {
    if (!user || variant === 'buyer' || active !== 'billing') return;
    setBillingLoading(true);
    setBillingForm({
      business_name: user.business_name ?? '',
      tax_id: user.tax_id ?? '',
      bank_name: user.bank_name ?? '',
      bank_branch: user.bank_branch ?? '',
      bank_account: user.bank_account ?? '',
      bank_account_holder: user.bank_account_holder ?? '',
    });
    Promise.all([fetchPaymentIntegrations(user.id), fetchOutboundWebhooks(user.id)])
      .then(([ints, hooks]) => {
        setIntegrations(ints);
        const hook = hooks[0];
        setWebhookUrl(hook?.url ?? '');
        setWebhookId(hook?.id);
      })
      .finally(() => setBillingLoading(false));
  }, [user, variant, active]);

  const tabs = variant === 'buyer' ? TABS : [...TABS.slice(0, 3), BILLING_TAB, ...TABS.slice(3)];

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      full_name: user.full_name ?? '',
      phone: user.phone ?? '',
      company: user.company ?? '',
      license_number: user.license_number ?? '',
    });
  }, [user]);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveProfile = async () => {
    const nameCheck = validateRequired(profileForm.full_name, 'שם מלא');
    if (!nameCheck.isValid) {
      setError(nameCheck.error ?? '');
      return;
    }
    setError('');
    setErrorDetail('');
    setSaving(true);
    try {
      await updateProfile({
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim() || null,
        ...(variant !== 'buyer'
          ? {
              company: profileForm.company.trim() || null,
              license_number: profileForm.license_number.trim() || null,
            }
          : {}),
      });
      flashSaved();
    } catch (err) {
      const display = getAuthErrorDisplay(err);
      setError(display.message);
      setErrorDetail(display.detail ?? '');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    const p1 = validatePassword(password.new);
    if (!p1.isValid) {
      setError(p1.error ?? '');
      return;
    }
    const p2 = validatePasswordMatch(password.new, password.confirm);
    if (!p2.isValid) {
      setError(p2.error ?? '');
      return;
    }
    setError('');
    setErrorDetail('');
    setSaving(true);
    try {
      await updatePassword(password.new);
      setPassword({ new: '', confirm: '' });
      flashSaved();
    } catch (err) {
      const display = getAuthErrorDisplay(err);
      setError(display.message);
      setErrorDetail(display.detail ?? '');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrefs = async () => {
    setError('');
    saveNotificationPrefs(prefs);
    flashSaved();
  };

  const handleEnablePush = async () => {
    setError('');
    if (!isPushSupported()) {
      setError('הדפדפן שלך לא תומך בהתראות Push. התקן את האפליקציה או השתמש ב-Chrome/Safari עדכני.');
      return;
    }
    const permission = await requestPushPermission();
    setPushStatus(permission);
    if (permission === 'granted') {
      setPrefs((current) => {
        const next = { ...current, pushEnabled: true };
        saveNotificationPrefs(next);
        return next;
      });
      flashSaved();
      return;
    }
    if (permission === 'denied') {
      setError('ההרשאה להתראות נחסמה. אפשר/י אותה בהגדרות הדפדפן / הנייד.');
    }
  };

  const handleSaveBilling = async () => {
    if (!user) return;
    setError('');
    setSaving(true);
    try {
      await updateProfile({
        business_name: billingForm.business_name.trim() || null,
        tax_id: billingForm.tax_id.trim() || null,
        bank_name: billingForm.bank_name.trim() || null,
        bank_branch: billingForm.bank_branch.trim() || null,
        bank_account: billingForm.bank_account.trim() || null,
        bank_account_holder: billingForm.bank_account_holder.trim() || null,
      });

      if (meshulamKey.trim()) {
        await upsertPaymentIntegration(user.id, {
          provider_type: 'acquiring',
          vendor: 'meshulam',
          display_name: PAYMENT_PROVIDER_VENDOR_LABELS.meshulam,
          is_active: true,
          is_sandbox: true,
          credentials: { api_key: meshulamKey.trim() },
        });
      }
      if (morningKey.trim()) {
        await upsertPaymentIntegration(user.id, {
          provider_type: 'invoicing',
          vendor: 'morning',
          display_name: PAYMENT_PROVIDER_VENDOR_LABELS.morning,
          is_active: true,
          is_sandbox: true,
          credentials: { api_key: morningKey.trim() },
        });
      }

      if (webhookUrl.trim()) {
        await upsertOutboundWebhook(user.id, { id: webhookId, url: webhookUrl.trim() });
      } else if (webhookId) {
        await deleteOutboundWebhook(webhookId);
        setWebhookId(undefined);
      }

      setMeshulamKey('');
      setMorningKey('');
      const ints = await fetchPaymentIntegrations(user.id);
      setIntegrations(ints);
      flashSaved();
    } catch (err) {
      const display = getAuthErrorDisplay(err);
      setError(display.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader title="הגדרות" description="נהל את החשבון וההעדפות שלך" />

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-48 lg:flex-col">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActive(id);
                setError('');
                setErrorDetail('');
              }}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                active === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <Card className="flex-1">
          <CardContent className="p-6">
            {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
            {errorDetail && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive/90 break-all">
                {errorDetail}
              </p>
            )}

            {active === 'profile' && (
              <div className="space-y-4">
                <CardTitle className="text-base">פרופיל אישי</CardTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="שם מלא"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
                  />
                  <Input label='דוא"ל' value={user.email} disabled />
                  <Input
                    label="טלפון"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                  {variant !== 'buyer' && (
                    <>
                      <Input
                        label="שם חברה"
                        value={profileForm.company}
                        onChange={(e) => setProfileForm((f) => ({ ...f, company: e.target.value }))}
                      />
                      <Input
                        label="מספר רישיון תיווך"
                        value={profileForm.license_number}
                        onChange={(e) =>
                          setProfileForm((f) => ({ ...f, license_number: e.target.value }))
                        }
                        className="sm:col-span-2"
                      />
                    </>
                  )}
                </div>
                <Badge variant="primary">{ROLE_LABELS[user.role]}</Badge>
                <Button onClick={() => void handleSaveProfile()} disabled={saving}>
                  {saved ? 'נשמר!' : saving ? 'שומר...' : 'שמור שינויים'}
                </Button>
              </div>
            )}

            {active === 'security' && (
              <div className="space-y-4">
                <CardTitle className="text-base">שינוי סיסמא</CardTitle>
                <Input
                  label="סיסמא חדשה"
                  type="password"
                  value={password.new}
                  onChange={(e) => setPassword({ ...password, new: e.target.value })}
                />
                <Input
                  label="אימות סיסמא"
                  type="password"
                  value={password.confirm}
                  onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                />
                <Button onClick={() => void handleSavePassword()} disabled={saving}>
                  {saved ? 'עודכן!' : saving ? 'שומר...' : 'עדכן סיסמא'}
                </Button>
              </div>
            )}

            {active === 'notifications' && (
              <div className="space-y-4">
                <CardTitle className="text-base">התראות כלליות</CardTitle>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <input
                    type="checkbox"
                    checked={prefs.pushEnabled}
                    onChange={(e) => setPrefs({ ...prefs, pushEnabled: e.target.checked })}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">התראות Push לנייד</p>
                    <p className="text-sm text-muted-foreground">
                      קבל/י התראה מיידית על לידים חדשים (דורש הרשאה בדפדפן).
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      סטטוס:{' '}
                      {pushStatus === 'granted'
                        ? 'מאושר'
                        : pushStatus === 'denied'
                          ? 'חסום'
                          : pushStatus === 'unsupported'
                            ? 'לא נתמך'
                            : 'ממתין לאישור'}
                    </p>
                    {pushStatus !== 'granted' && (
                      <Button type="button" size="sm" className="mt-2" onClick={() => void handleEnablePush()}>
                        אפשר התראות Push
                      </Button>
                    )}
                  </div>
                </label>

                {[
                  { key: 'emailAlerts', label: 'קבל התראות במייל', desc: 'התראות דחופות יישלחו גם למייל' },
                  ...(variant !== 'buyer'
                    ? [
                        { key: 'leadAlerts', label: 'התראות על לידים חדשים', desc: '' },
                        { key: 'leaseExpiry', label: 'התראות חוזים מסתיימים', desc: 'קבל התראה כשחוזה עומד להסתיים' },
                      ]
                    : [
                        { key: 'leadAlerts', label: 'התראות על נכסים ששותפו', desc: 'קבל עדכון כשמשתף נכס חדש' },
                        { key: 'leaseExpiry', label: 'התראות על שינויי מחיר', desc: 'קבל התראה כשמחיר נכס מועדף משתנה' },
                      ]),
                  { key: 'weeklyDigest', label: 'עדכונים שבועיים במייל', desc: '' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
                    <input
                      type="checkbox"
                      checked={prefs[key as keyof typeof prefs] as boolean}
                      onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{label}</p>
                      {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
                    </div>
                  </label>
                ))}
                {variant !== 'buyer' && (
                  <div>
                    <p className="mb-2 text-sm font-medium">התראה לפני כמה ימים?</p>
                    <div className="flex gap-2">
                      {[7, 30, 60, 90].map((d) => (
                        <Button
                          key={d}
                          variant={prefs.leaseDays === d ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPrefs({ ...prefs, leaseDays: d })}
                        >
                          {d}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <Button onClick={() => void handleSavePrefs()}>שמור העדפות</Button>
              </div>
            )}

            {active === 'billing' && variant !== 'buyer' && (
              <div className="space-y-6">
                <CardTitle className="text-base">גבייה וחשבוניות</CardTitle>
                <p className="text-sm text-muted-foreground">
                  הגדר פרטי חשבון בנק, חבר ספקי סליקה וחשבוניות, וקבל התראות webhook על תשלומים.
                </p>

                <div className="space-y-3 rounded-xl border border-border p-4">
                  <p className="font-medium">פרטי חשבון לקבלת העברות</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="שם עסק (לחשבונית)"
                      value={billingForm.business_name}
                      onChange={(e) => setBillingForm((f) => ({ ...f, business_name: e.target.value }))}
                    />
                    <Input
                      label="ח.פ / ע.מ"
                      value={billingForm.tax_id}
                      onChange={(e) => setBillingForm((f) => ({ ...f, tax_id: e.target.value }))}
                    />
                    <Input
                      label="בנק"
                      value={billingForm.bank_name}
                      onChange={(e) => setBillingForm((f) => ({ ...f, bank_name: e.target.value }))}
                    />
                    <Input
                      label="סניף"
                      value={billingForm.bank_branch}
                      onChange={(e) => setBillingForm((f) => ({ ...f, bank_branch: e.target.value }))}
                    />
                    <Input
                      label="מספר חשבון"
                      value={billingForm.bank_account}
                      onChange={(e) => setBillingForm((f) => ({ ...f, bank_account: e.target.value }))}
                    />
                    <Input
                      label="בעל החשבון"
                      value={billingForm.bank_account_holder}
                      onChange={(e) => setBillingForm((f) => ({ ...f, bank_account_holder: e.target.value }))}
                    />
                  </div>
                </div>

                {integrations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {integrations.map((i) => (
                      <Badge key={i.id} variant={i.status === 'connected' ? 'success' : 'outline'}>
                        {PAYMENT_PROVIDER_VENDOR_LABELS[i.vendor]} · {i.status === 'connected' ? 'מחובר' : 'לא מחובר'}
                        {i.is_sandbox ? ' (sandbox)' : ''}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="space-y-3 rounded-xl border border-border p-4">
                  <p className="font-medium">{PAYMENT_PROVIDER_VENDOR_LABELS.meshulam}</p>
                  <p className="text-xs text-muted-foreground">סליקת אשראי (Grow / Meshulam)</p>
                  <Input
                    label="מפתח API"
                    type="password"
                    value={meshulamKey}
                    onChange={(e) => setMeshulamKey(e.target.value)}
                    placeholder="הזן מפתח API חדש..."
                  />
                </div>

                <div className="space-y-3 rounded-xl border border-border p-4">
                  <p className="font-medium">{PAYMENT_PROVIDER_VENDOR_LABELS.morning}</p>
                  <p className="text-xs text-muted-foreground">הפקת חשבוניות (Green Invoice / Morning)</p>
                  <Input
                    label="מפתח API"
                    type="password"
                    value={morningKey}
                    onChange={(e) => setMorningKey(e.target.value)}
                    placeholder="הזן מפתח API חדש..."
                  />
                </div>

                <div className="space-y-3 rounded-xl border border-border p-4">
                  <p className="font-medium">Webhook יוצא</p>
                  <p className="text-xs text-muted-foreground">
                    URL שיקבל POST עם אירוע payment.success לאחר תשלום מוצלח
                  </p>
                  <Input
                    label="Webhook URL"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>

                <Button onClick={() => void handleSaveBilling()} disabled={saving || billingLoading}>
                  {saved ? 'נשמר!' : saving ? 'שומר...' : 'שמור הגדרות גבייה'}
                </Button>
              </div>
            )}

            {active === 'appearance' && (
              <div className="space-y-4">
                <CardTitle className="text-base">תצוגה</CardTitle>
                <div className="flex gap-3">
                  {(['dark', 'light'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={cn(
                        'flex-1 rounded-xl border p-4 text-center transition-colors',
                        theme === t ? 'border-primary bg-primary/10' : 'border-border',
                      )}
                    >
                      {t === 'dark' ? '🌙 כהה' : '☀️ בהיר'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {active === 'privacy' && (
              <div className="space-y-4">
                <CardTitle className="text-base">פרטיות</CardTitle>
                <p className="text-sm text-muted-foreground">
                  הנתונים שלך מוגנים ומוצפנים. אנחנו לא משתפים מידע עם צד שלישי ללא הסכמתך.
                </p>
                <Button variant="outline">ייצוא נתונים</Button>
                <Button variant="destructive">מחיקת חשבון</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
