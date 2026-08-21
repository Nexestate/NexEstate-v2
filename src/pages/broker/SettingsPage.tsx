import { Bell, Lock, Palette, Shield, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ROLE_LABELS } from '../../lib/roles';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'profile', label: 'פרופיל', icon: User },
  { id: 'security', label: 'סיסמא', icon: Lock },
  { id: 'notifications', label: 'התראות', icon: Bell },
  { id: 'appearance', label: 'תצוגה', icon: Palette },
  { id: 'privacy', label: 'פרטיות', icon: Shield },
];

interface SettingsPageProps {
  variant?: 'broker' | 'buyer' | 'admin';
}

export function SettingsPage({ variant = 'broker' }: SettingsPageProps) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [password, setPassword] = useState({ new: '', confirm: '' });
  const [prefs, setPrefs] = useState({
    emailAlerts: true,
    leadAlerts: true,
    leaseExpiry: true,
    leaseDays: 7,
    weeklyDigest: false,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="הגדרות" description="נהל את החשבון וההעדפות שלך" />

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-48 lg:flex-col">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
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
            {active === 'profile' && user && (
              <div className="space-y-4">
                <CardTitle className="text-base">פרופיל אישי</CardTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="שם מלא" defaultValue={user.full_name} />
                  <Input label='דוא"ל' defaultValue={user.email} disabled />
                  <Input label="טלפון" defaultValue={user.phone ?? ''} />
                  {variant !== 'buyer' && (
                    <>
                      <Input label="שם חברה" defaultValue={user.company ?? ''} />
                      <Input label="מספר רישיון תיווך" defaultValue={user.license_number ?? ''} className="sm:col-span-2" />
                    </>
                  )}
                </div>
                <Badge variant="primary">{ROLE_LABELS[user.role]}</Badge>
                <Button onClick={handleSave}>{saved ? 'נשמר!' : 'שמור שינויים'}</Button>
              </div>
            )}

            {active === 'security' && (
              <div className="space-y-4">
                <CardTitle className="text-base">שינוי סיסמא</CardTitle>
                <Input label="סיסמא חדשה" type="password" value={password.new} onChange={(e) => setPassword({ ...password, new: e.target.value })} />
                <Input label="אימות סיסמא" type="password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} />
                <Button onClick={handleSave}>עדכן סיסמא</Button>
              </div>
            )}

            {active === 'notifications' && (
              <div className="space-y-4">
                <CardTitle className="text-base">התראות כלליות</CardTitle>
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
                <Button onClick={handleSave}>שמור העדפות</Button>
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
