import {
  Building2,
  Bell,
  CheckCircle,
  Clock,
  Home,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard, StatCardGrid } from '../../components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  fetchAdminDashboardStats,
  fetchPendingReviews,
  fetchRecentUsers,
  fetchRoleDistribution,
} from '../../lib/services';
import type { RoleDistributionItem } from '../../lib/services/adminStatsService';

const WEEKLY_ACTIVITY = [2, 4, 1, 3, 5, 2, 4];
const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export function AdminHome() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    newUsersToday: 0,
    newPropertiesToday: 0,
    rejectedProperties: 0,
    approvedProperties: 0,
    pendingProperties: 0,
    suspendedUsers: 0,
    activeShares: 0,
    openSupportTickets: 0,
    approvedToday: 0,
    rejectedToday: 0,
  });
  const [roleDistribution, setRoleDistribution] = useState<RoleDistributionItem[]>([]);
  const [pendingReviews, setPendingReviews] = useState<
    Array<{ id: string; title: string; city?: string }>
  >([]);
  const [recentUsers, setRecentUsers] = useState<
    Array<{ id: string; full_name: string; email: string; role: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAdminDashboardStats(),
      fetchRoleDistribution(),
      fetchPendingReviews(),
      fetchRecentUsers(4),
    ]).then(([s, roles, pending, users]) => {
      setStats(s);
      setRoleDistribution(roles);
      setPendingReviews(pending);
      setRecentUsers(users as typeof recentUsers);
      setLoading(false);
    });
  }, []);

  const maxActivity = Math.max(...WEEKLY_ACTIVITY);
  const maxRoleCount = Math.max(...roleDistribution.map((r) => r.count), 1);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">לוח בקרה</h2>
        <p className="text-sm text-muted-foreground">סקירה כללית של הפלטפורמה</p>
      </div>

      <StatCardGrid className="sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label='סה"כ משתמשים' value={stats.totalUsers} icon={Users} color="#3b82f6" to="/admin/users" />
        <StatCard label='סה"כ נכסים' value={stats.totalProperties} icon={Building2} color="#10b981" to="/admin/properties" />
        <StatCard label="משתמשים חדשים היום" value={stats.newUsersToday} icon={Users} color="#f59e0b" to="/admin/users" />
        <StatCard label="נכסים שנדחו" value={stats.rejectedProperties} icon={XCircle} color="#ef4444" to="/admin/rejected" />
      </StatCardGrid>

      <StatCardGrid className="sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="נכסים חדשים היום" value={stats.newPropertiesToday} icon={Home} color="#f59e0b" to="/admin/properties" />
        <StatCard label="מושעים" value={stats.suspendedUsers} icon={Clock} color="#f59e0b" to="/admin/users" />
        <StatCard label="נכסים מאושרים" value={stats.approvedProperties} icon={CheckCircle} color="#10b981" to="/admin/properties" />
        <StatCard label="נכסים ממתינים" value={stats.pendingProperties} icon={Clock} color="#f59e0b" to="/admin/pending" />
      </StatCardGrid>

      <StatCardGrid className="sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="שיתופי נכסים פעילים" value={stats.activeShares} icon={Home} color="#8b5cf6" to="/admin/shares" />
        <StatCard label="פניות חדשות" value={stats.openSupportTickets} icon={Bell} color="#ef4444" to="/admin/support" />
        <StatCard label="מאושרים היום" value={stats.approvedToday} icon={CheckCircle} color="#10b981" to="/admin/approved" />
        <StatCard label="דחויים היום" value={stats.rejectedToday} icon={XCircle} color="#ef4444" to="/admin/rejected" />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">פעילות בשבוע האחרון</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                משתמשים חדשים
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                נכסים חדשים
              </div>
            </div>
            <div className="flex h-24 items-end justify-between gap-2">
              {WEEKLY_ACTIVITY.map((value, i) => (
                <div key={DAYS[i]} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all"
                    style={{ height: `${(value / maxActivity) * 100}%`, minHeight: 4 }}
                  />
                  <span className="text-xs text-muted-foreground">{DAYS[i]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">התפלגות לפי תפקיד</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roleDistribution.map((role) => (
              <div key={role.key} className="flex items-center gap-3">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: role.color }} />
                <span className="flex-1 text-sm">{role.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(role.count / maxRoleCount) * 100}%`,
                        backgroundColor: role.color,
                      }}
                    />
                  </div>
                  <span className="w-6 text-end text-sm font-medium">{role.count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">ממתינים לאישור</CardTitle>
            <Link to="/admin/pending" className="text-sm text-primary hover:underline">
              הכל ←
            </Link>
          </CardHeader>
          <CardContent>
            {pendingReviews.length === 0 ? (
              <EmptyState icon={Clock} title="אין ממתינים" description="כל הנכסים אושרו" />
            ) : (
              <ul className="space-y-2">
                {pendingReviews.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground">{item.city}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">משתמשים אחרונים</CardTitle>
            <Link to="/admin/users" className="text-sm text-primary hover:underline">
              הכל ←
            </Link>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <EmptyState icon={Users} title="אין משתמשים" description="" />
            ) : (
              <ul className="space-y-2">
                {recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <div>
                      <p className="font-medium">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <span className="text-xs text-primary">{u.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
