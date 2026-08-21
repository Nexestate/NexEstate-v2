import { Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../lib/roles';
import { getInitials } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';

export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="הפרופיל שלי" description="נהל את פרטי החשבון שלך" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center py-8">
            <div className="relative mb-4">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-primary text-3xl font-bold text-white">
                {getInitials(user.full_name)}
              </div>
              <button type="button" className="absolute bottom-0 end-0 grid h-8 w-8 place-items-center rounded-full bg-card border border-border">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-lg font-bold">{user.full_name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="primary" className="mt-3">{ROLE_LABELS[user.role]}</Badge>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">פרטים אישיים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="שם מלא" defaultValue={user.full_name} />
              <Input label='דוא"ל' defaultValue={user.email} disabled />
              <Input label="טלפון" defaultValue={user.phone ?? ''} />
              <Input label="שם חברה" defaultValue={user.company ?? ''} />
            </div>
            <Input label="מספר רישיון תיווך" defaultValue={user.license_number ?? ''} />
            <Button>שמור שינויים</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
