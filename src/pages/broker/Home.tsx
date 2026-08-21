import { Building2, Banknote, ClipboardList, FileSignature, Layers, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard, StatCardGrid } from '../../components/dashboard/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { fetchBrokerDashboardStats, fetchManagedPropertySidebar, fetchSigningLinks, fetchTasks } from '../../lib/services';
import { formatCurrency, getOccupancyPercent } from '../../lib/utils';
import type { PropertyWithUnits } from '../../types/domain';
import type { SigningLink, Task } from '../../types/domain';
import { SIGNING_STATUS_LABELS, TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '../../types/domain';

export function BrokerHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    properties: 0,
    units: 0,
    tenants: 0,
    clients: 0,
    leads: 0,
    tasks: 0,
    monthlyIncome: 0,
    occupancyPercent: 0,
    myListings: 0,
  });
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [links, setLinks] = useState<SigningLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      fetchBrokerDashboardStats(user.id),
      fetchManagedPropertySidebar(user.id),
      fetchTasks(user.id),
      fetchSigningLinks(user.id),
    ]).then(([s, { properties: props }, t, l]) => {
      setStats(s);
      setProperties(props);
      setTasks(t);
      setLinks(l);
      setLoading(false);
    });
  }, [user?.id]);

  const upcomingTasks = tasks.filter((t) => t.status !== 'done').slice(0, 3);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatCardGrid>
        <StatCard label="נכסים מנוהלים" value={stats.properties} icon={Building2} color="#3b82f6" to="/broker/properties" />
        <StatCard label="יחידות" value={stats.units} icon={Layers} color="#10b981" to="/broker/units" />
        <StatCard label="שוכרים" value={stats.tenants} icon={Users} color="#f59e0b" to="/broker/tenants" />
        <StatCard label="לקוחות" value={stats.clients} icon={Users} color="#8b5cf6" to="/broker/clients" />
        <StatCard label="לידים" value={stats.leads} icon={TrendingUp} color="#ec4899" to="/broker/leads" />
        <StatCard label="משימות" value={stats.tasks} icon={ClipboardList} color="#06b6d4" to="/broker/tasks" />
      </StatCardGrid>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-success/10 text-success">
              <Banknote className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">הכנסות חודשיות</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.monthlyIncome)}</p>
            </div>
          </div>
          <div className="text-start sm:text-end">
            <p className="text-sm text-muted-foreground">תפוסה</p>
            <p className="text-3xl font-bold text-success">{stats.occupancyPercent}%</p>
          </div>
        </CardContent>
        <div className="h-1 bg-muted">
          <div className="h-full bg-success transition-all" style={{ width: `${stats.occupancyPercent}%` }} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">משימות קרובות</CardTitle>
            <Link to="/broker/tasks" className="text-sm text-primary hover:underline">הכל ←</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">אין משימות קרובות</p>
            ) : (
              upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(task.due_date).toLocaleDateString('he-IL')}
                      </p>
                    )}
                  </div>
                  <Badge
                    style={{ backgroundColor: `${TASK_PRIORITY_COLORS[task.priority]}1f`, color: TASK_PRIORITY_COLORS[task.priority] }}
                    className="text-[10px]"
                  >
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">נכסים מנוהלים</CardTitle>
            <Link to="/broker/properties" className="text-sm text-primary hover:underline">הכל ←</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {properties.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">אין נכסים מנוהלים</p>
            ) : (
              properties.slice(0, 4).map((property) => {
                const occupancy = getOccupancyPercent(property.occupiedUnits, property.totalUnits);
                return (
                  <Link
                    key={property.id}
                    to={`/broker/properties/${property.id}`}
                    className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/50 hover:bg-muted/30"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{property.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.occupiedUnits}/{property.totalUnits} מושכרות • {formatCurrency(property.monthlyIncome)}/חודש
                      </p>
                    </div>
                    <Badge variant="success">{occupancy}%</Badge>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">קישורי חתימה אחרונים</CardTitle>
          <Link to="/broker/agreements">
            <Button size="sm" variant="outline">קישור חדש</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {links.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">אין קישורי חתימה</p>
          ) : (
            links.slice(0, 4).map((link) => (
              <div key={link.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div className="flex items-center gap-3">
                  <FileSignature className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{link.client_name}</p>
                    <p className="text-xs text-muted-foreground">{link.client_phone}</p>
                  </div>
                </div>
                <Badge variant={link.status === 'signed' ? 'success' : 'warning'}>
                  {SIGNING_STATUS_LABELS[link.status]}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
