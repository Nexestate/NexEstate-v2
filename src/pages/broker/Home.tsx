import {
  Building2,
  Banknote,
  ClipboardList,
  FileSignature,
  Layers,
  TrendingUp,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard, StatCardGrid } from '../../components/dashboard/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSection } from '../../components/ui/PageSection';
import { PageSkeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { fetchBrokerDashboardStats, fetchManagedPropertySidebar, fetchProperty, fetchSigningLinks, fetchTasks } from '../../lib/services';
import { fetchSharedWithUser } from '../../lib/services/sharedPropertiesService';
import { formatCurrency, getOccupancyPercent } from '../../lib/utils';
import type { PropertyWithUnits } from '../../types/domain';
import type { SigningLink, Task } from '../../types/domain';
import { SIGNING_STATUS_LABELS, TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '../../types/domain';

type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  to: string;
};

export function BrokerHome() {
  const { user } = useAuth();
  const { openQuickAdd } = useQuickAdd();
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

  const isSharedOnlyRole = user?.role === 'partner' || user?.role === 'manager';

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    if (isSharedOnlyRole) {
      void fetchSharedWithUser(user.id)
        .then((shared) => Promise.all(shared.map((s) => fetchProperty(s.id))))
        .then((props) => {
          setProperties(props.filter((p): p is PropertyWithUnits => Boolean(p)));
        })
        .catch((err) => {
          console.error('[BrokerHome] shared properties load failed', err);
        })
        .finally(() => setLoading(false));
      return;
    }

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
  }, [isSharedOnlyRole, user?.id]);

  const upcomingTasks = tasks.filter((t) => t.status !== 'done').slice(0, 3);
  const pendingAgreements = links.filter((l) => l.status === 'pending' || l.status === 'sent');

  const attention = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (pendingAgreements.length > 0) {
      items.push({
        id: 'agreements',
        title: `${pendingAgreements.length} הסכמים ממתינים לחתימה`,
        detail: 'שלחו תזכורת או פתחו את קישור החתימה',
        to: '/broker/agreements',
      });
    }
    const openTasks = tasks.filter((t) => t.status !== 'done');
    if (openTasks.length > 0) {
      items.push({
        id: 'tasks',
        title: `${openTasks.length} משימות פתוחות`,
        detail: 'טפלו במשימות הקרובות כדי לא לפספס מעקב',
        to: '/broker/tasks',
      });
    }
    if (stats.properties === 0 && !isSharedOnlyRole) {
      items.push({
        id: 'property',
        title: 'אין נכס מנוהל עדיין',
        detail: 'הוסיפו נכס כדי לנהל שוכרים, הסכמים ותשלומים במקום אחד',
        to: '/broker/properties',
      });
    }
    return items.slice(0, 3);
  }, [isSharedOnlyRole, pendingAgreements.length, stats.properties, tasks]);

  if (loading) return <PageSkeleton />;

  if (isSharedOnlyRole) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-page-title">לוח בקרה</h2>
          <p className="text-meta mt-1">נכסים ששותפו איתך</p>
        </div>
        <StatCardGrid className="lg:grid-cols-2">
          <StatCard label="נכסים ששותפו" value={properties.length} icon={Building2} color="#3b82f6" to="/broker/properties" />
        </StatCardGrid>
        {properties.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>הנכסים שלך</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  to={`/broker/properties/${property.id}`}
                  className="rounded-xl border border-border p-4 transition-colors hover:border-primary/40"
                >
                  <h3 className="font-semibold">{property.title}</h3>
                  <p className="text-meta">{property.city}</p>
                  <p className="mt-2 text-sm text-primary">צפייה בנכס ←</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={Building2}
            title="אין נכסים משותפים עדיין"
            description="לאחר קבלת הזמנה והתחברות מחדש, הנכס יופיע כאן."
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {attention.length > 0 && (
        <PageSection className="border-warning/40 bg-warning/5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-warning/20 text-warning ring-1 ring-warning/35">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-page-title">דורש תשומת לב עכשיו</h2>
              <p className="text-meta">טיפול מהיר בפריטים הקריטיים ביותר</p>
            </div>
          </div>
          <div className="space-y-3">
            {attention.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className="flex items-start justify-between gap-4 rounded-2xl border border-border/90 bg-card/80 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <div>
                  <p className="text-lg font-semibold">{item.title}</p>
                  <p className="text-meta mt-1">{item.detail}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">פתח ←</span>
              </Link>
            ))}
          </div>
        </PageSection>
      )}

      <StatCardGrid>
        <StatCard label="נכסים מנוהלים" value={stats.properties} icon={Building2} color="#3b82f6" to="/broker/properties" />
        <StatCard label="יחידות" value={stats.units} icon={Layers} color="#14b8a6" to="/broker/units" />
        <StatCard label="שוכרים" value={stats.tenants} icon={Users} color="#f59e0b" to="/broker/tenants" />
        <StatCard label="לקוחות" value={stats.clients} icon={Users} color="#3b82f6" to="/broker/clients" />
        <StatCard label="לידים" value={stats.leads} icon={TrendingUp} color="#14b8a6" to="/broker/leads" />
        <StatCard label="משימות" value={stats.tasks} icon={ClipboardList} color="#f59e0b" to="/broker/tasks" />
      </StatCardGrid>

      <Card className="overflow-hidden border-success/30">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-success/10 text-success">
              <Banknote className="h-6 w-6" />
            </span>
            <div>
              <p className="text-meta">הכנסות חודשיות</p>
              <p className="text-value">{formatCurrency(stats.monthlyIncome)}</p>
            </div>
          </div>
          <div className="text-start sm:text-end">
            <p className="text-meta">תפוסה</p>
            <p className="text-3xl font-bold text-success">{stats.occupancyPercent}%</p>
          </div>
        </CardContent>
        <div className="h-2 bg-muted">
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${stats.occupancyPercent}%` }} />
        </div>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>משימות קרובות</CardTitle>
            <Link to="/broker/tasks" className="text-sm text-primary hover:underline">הכל ←</Link>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="אין משימות קרובות"
                description="צרו משימה כדי לעקוב אחרי שיחות, חוזים או גבייה."
                actionLabel="משימה חדשה"
                onAction={() => openQuickAdd('task')}
                className="py-6"
              />
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{task.title}</p>
                      {task.due_date && (
                        <p className="text-meta">
                          {new Date(task.due_date).toLocaleDateString('he-IL')}
                        </p>
                      )}
                    </div>
                    <Badge
                      style={{ backgroundColor: `${TASK_PRIORITY_COLORS[task.priority]}1f`, color: TASK_PRIORITY_COLORS[task.priority] }}
                    >
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>נכסים מנוהלים</CardTitle>
            <Link to="/broker/properties" className="text-sm text-primary hover:underline">הכל ←</Link>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="אין נכסים מנוהלים"
                description="הוסיפו נכס ראשון — משם מנהלים שוכרים, הסכמים ותשלומים."
                actionLabel="הוסף נכס"
                onAction={() => openQuickAdd('property')}
                className="py-6"
              />
            ) : (
              <div className="space-y-3">
                {properties.slice(0, 4).map((property) => {
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
                        <p className="text-meta">
                          {property.occupiedUnits}/{property.totalUnits} מושכרות • {formatCurrency(property.monthlyIncome)}/חודש
                        </p>
                      </div>
                      <Badge variant="success">{occupancy}%</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>קישורי חתימה אחרונים</CardTitle>
          <Button size="sm" variant="outline" onClick={() => openQuickAdd('agreement')}>
            קישור חדש
          </Button>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <EmptyState
              icon={FileSignature}
              title="אין קישורי חתימה"
              description="צרו קישור מאובטח ללקוח או שוכר — הסטטוס יופיע כאן."
              actionLabel="צור הסכם"
              onAction={() => openQuickAdd('agreement')}
              className="py-6"
            />
          ) : (
            <div className="space-y-2">
              {links.slice(0, 4).map((link) => (
                <div key={link.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div className="flex items-center gap-3">
                    <FileSignature className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{link.client_name}</p>
                      <p className="text-meta">{link.client_phone}</p>
                    </div>
                  </div>
                  <Badge variant={link.status === 'signed' ? 'success' : 'warning'}>
                    {SIGNING_STATUS_LABELS[link.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
