import { BarChart3, Building2, TrendingUp, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { calculateDemoStats, DEMO_MANAGED_PROPERTIES } from '../../data/demoData';
import { formatCurrency, getOccupancyPercent } from '../../lib/utils';

export function ReportsPage() {
  const stats = calculateDemoStats();
  const property = DEMO_MANAGED_PROPERTIES[0];
  const occupancy = getOccupancyPercent(property.occupiedUnits, property.totalUnits);

  const monthlyData = [
    { month: 'מר', income: 98000 },
    { month: 'אפר', income: 102000 },
    { month: 'מאי', income: 99000 },
    { month: 'יונ', income: 105633 },
    { month: 'יול', income: 105633 },
    { month: 'אוג', income: 105633 },
  ];
  const maxIncome = Math.max(...monthlyData.map((d) => d.income));

  return (
    <div className="space-y-6">
      <PageHeader title="דוחות" description="סקירה פינansית ותפעולית" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'הכנסות חודשיות', value: formatCurrency(stats.monthlyIncome), icon: TrendingUp, color: '#10b981' },
          { label: 'תפוסה', value: `${occupancy}%`, icon: Building2, color: '#3b82f6' },
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
          <CardTitle className="text-base">הכנסות חודשיות — 6 חודשים אחרונים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-40">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{formatCurrency(d.income)}</span>
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${(d.income / maxIncome) * 100}%`, minHeight: 4 }}
                />
                <span className="text-xs text-muted-foreground">{d.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">תפוסה לפי נכס</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {DEMO_MANAGED_PROPERTIES.map((p) => {
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
