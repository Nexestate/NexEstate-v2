import { BarChart3, Building2, Download, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { downloadCsv } from '../../lib/csvExport';
import {
  fetchBrokerDashboardStats,
  fetchLeases,
  fetchManagedPropertySidebar,
  fetchTenants,
} from '../../lib/services';
import { formatCurrency, getOccupancyPercent } from '../../lib/utils';

export function ReportsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    monthlyIncome: 0,
    units: 0,
    tenants: 0,
    clients: 0,
    leads: 0,
    tasks: 0,
    occupancyPercent: 0,
  });
  const [properties, setProperties] = useState<
    Array<{ id: string; title: string; occupiedUnits: number; totalUnits: number; monthlyIncome: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      fetchBrokerDashboardStats(user.id),
      fetchManagedPropertySidebar(user.id),
    ]).then(([s, { properties: props }]) => {
      setStats(s);
      setProperties(
        props.map((p) => ({
          id: p.id,
          title: p.title,
          occupiedUnits: p.occupiedUnits,
          totalUnits: p.totalUnits,
          monthlyIncome: p.monthlyIncome,
        })),
      );
      setLoading(false);
    });
  }, [user?.id]);

  const exportUnits = async () => {
    const { properties: props } = await fetchManagedPropertySidebar(user?.id);
    const rows = props.flatMap((p) =>
      p.units.map((u) => [
        p.title,
        u.unit_number,
        u.unit_name ?? '',
        u.unit_status,
        u.area_sqm ?? '',
        u.monthly_rent ?? '',
      ]),
    );
    downloadCsv('units.csv', ['נכס', 'מספר יחידה', 'שם', 'סטטוס', 'שטח', 'שכ"ד'], rows);
  };

  const exportTenants = async () => {
    const tenants = await fetchTenants(user?.id);
    downloadCsv(
      'tenants.csv',
      ['שם', 'חברה', 'טלפון', 'אימייל', 'נכס', 'סטטוס'],
      tenants.map((t) => [
        t.full_name,
        t.company_name ?? '',
        t.phone ?? '',
        t.email ?? '',
        t.property_title ?? '',
        t.status,
      ]),
    );
  };

  const exportLeases = async () => {
    const leases = await fetchLeases(user?.id);
    downloadCsv(
      'leases.csv',
      ['שוכר', 'נכס', 'יחידה', 'שכ"ד', 'פיקדון', 'התחלה', 'סיום', 'פעיל'],
      leases.map((l) => [
        l.tenant_name,
        l.property_title ?? '',
        l.unit_number ?? '',
        l.monthly_rent,
        l.deposit ?? '',
        l.start_date,
        l.end_date,
        l.is_active ? 'כן' : 'לא',
      ]),
    );
  };

  const exportFull = async () => {
    await exportUnits();
    await exportTenants();
    await exportLeases();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const monthlyData = properties.length
    ? properties.map((p) => ({ month: p.title.slice(0, 8), income: p.monthlyIncome }))
    : [{ month: '—', income: stats.monthlyIncome }];
  const maxIncome = Math.max(...monthlyData.map((d) => d.income), 1);

  return (
    <div className="space-y-6">
      <PageHeader title="דוחות" description="סקירה פיננסית ותפעולית" />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void exportUnits()}>
          <Download className="h-4 w-4" />
          ייצא יחידות
        </Button>
        <Button variant="outline" size="sm" onClick={() => void exportTenants()}>
          <Download className="h-4 w-4" />
          ייצא שוכרים
        </Button>
        <Button variant="outline" size="sm" onClick={() => void exportLeases()}>
          <Download className="h-4 w-4" />
          ייצא חוזים
        </Button>
        <Button size="sm" onClick={() => void exportFull()}>
          <Download className="h-4 w-4" />
          הורד דוח מלא
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'הכנסות חודשיות', value: formatCurrency(stats.monthlyIncome), icon: TrendingUp, color: '#10b981' },
          { label: 'תפוסה', value: `${stats.occupancyPercent}%`, icon: Building2, color: '#3b82f6' },
          { label: 'יחידות', value: stats.units, icon: BarChart3, color: '#8b5cf6' },
          { label: 'שוכרים', value: stats.tenants, icon: Users, color: '#f59e0b' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 py-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: `${color}1f`, color }}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">הכנסות לפי נכס</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-end justify-between gap-2">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{formatCurrency(d.income)}</span>
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${(d.income / maxIncome) * 100}%`, minHeight: 4 }}
                />
                <span className="max-w-full truncate text-xs text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">תפוסה לפי נכס</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {properties.map((p) => {
              const occ = getOccupancyPercent(p.occupiedUnits, p.totalUnits);
              return (
                <div key={p.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{p.title}</span>
                    <span className="font-medium text-success">{occ}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-success" style={{ width: `${occ}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">סיכום CRM</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>לידים פעילים</span><span className="font-bold">{stats.leads}</span></div>
            <div className="flex justify-between"><span>לקוחות</span><span className="font-bold">{stats.clients}</span></div>
            <div className="flex justify-between"><span>משימות פתוחות</span><span className="font-bold">{stats.tasks}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
