import { Building2, Banknote, ClipboardList, FileSignature, Layers, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard, StatCardGrid } from '../../components/dashboard/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { calculateDemoStats, DEMO_MANAGED_PROPERTIES } from '../../data/demoData';
import { fetchSigningLinks, fetchTasks } from '../../lib/services';
import { formatCurrency, getOccupancyPercent } from '../../lib/utils';
import type { SigningLink, Task } from '../../types/domain';
import { SIGNING_STATUS_LABELS, TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from '../../types/domain';

export function BrokerHome() {
  const { user } = useAuth();
  const stats = calculateDemoStats();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [links, setLinks] = useState<SigningLink[]>([]);

  useEffect(() => {
    fetchTasks(user?.id).then(setTasks);
    fetchSigningLinks(user?.id).then(setLinks);
  }, [user?.id]);

  const upcomingTasks = tasks.filter((t) => t.status !== 'done').slice(0, 3);

  return (
    <div className="space-y-6">
      <StatCardGrid>
        <StatCard label="משימות" value={stats.tasks} icon={ClipboardList} color="#06b6d4" to="/broker/tasks" />
        <StatCard label="לידים" value={stats.leads} icon={TrendingUp} color="#ec4899" to="/broker/leads" />
        <StatCard label="לקוחות" value={stats.clients} icon={Users} color="#8b5cf6" to="/broker/clients" />
        <StatCard label="שוכרים" value={stats.tenants} icon={Users} color="#f59e0b" to="/broker/tenants" />
        <StatCard label="יחידות" value={stats.units} icon={Layers} color="#10b981" to="/broker/properties" />
        <StatCard label="נכסים מנוהלים" value={stats.properties} icon={Building2} color="#3b82f6" to="/broker/properties" />
        <StatCard label="נכסים שלי" value={3} icon={Building2} color="#6366f1" to="/broker/my-properties" />
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
            {DEMO_MANAGED_PROPERTIES.map((property) => {
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
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">קישורי חתימה אחרונים</CardTitle>
          <Link to="/broker/agreements" className="text-sm text-primary hover:underline">הכל ←</Link>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="py-6 text-center">
              <FileSignature className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">אין קישורי חתימה</p>
              <Link to="/broker/agreements">
                <Button className="mt-3" size="sm">+ קישור חדש</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {links.slice(0, 3).map((link) => (
                <div key={link.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="font-medium text-sm">{link.client_name}</p>
                    <p className="text-xs text-muted-foreground">{link.property_title}</p>
                  </div>
                  <Badge variant={link.status === 'signed' ? 'success' : 'primary'}>
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
