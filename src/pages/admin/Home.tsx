import {
  Building2,
  Bell,
  CheckCircle,
  Clock,
  Home,
  Users,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard, StatCardGrid } from '../../components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { DEMO_ADMIN_STATS, DEMO_ADMIN_USERS, DEMO_PROPERTY_REVIEWS, DEMO_ROLE_DISTRIBUTION } from '../../data/demoData';

const WEEKLY_ACTIVITY = [2, 4, 1, 3, 5, 2, 4];
const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export function AdminHome() {
  const stats = DEMO_ADMIN_STATS;
  const pendingReviews = DEMO_PROPERTY_REVIEWS.filter((r) => r.status === 'pending');
  const recentUsers = DEMO_ADMIN_USERS.slice(0, 4);
  const maxActivity = Math.max(...WEEKLY_ACTIVITY);
  const maxRoleCount = Math.max(...DEMO_ROLE_DISTRIBUTION.map((r) => r.count));

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
        <StatCard label="שיתופי נכסים" value={3} icon={Home} color="#8b5cf6" to="/admin/shares" />
        <StatCard label="פניות תמיכה" value={2} icon={Bell} color="#ef4444" to="/admin/support" />
        <StatCard label="מאושרים היום" value={2} icon={CheckCircle} color="#10b981" to="/admin/approved" />
        <StatCard label="דחויים היום" value={1} icon={XCircle} color="#ef4444" to="/admin/rejected" />
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
            <div className="flex items-end justify-between gap-2 h-24">
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
            {DEMO_ROLE_DISTRIBUTION.map((role) => (
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
              <EmptyState
                icon={CheckCircle}
                title="אין נכסים ממתינים לאישור"
                description="כל הנכסים אושרו"
              />
            ) : (
              <div className="space-y-3">
                {pendingReviews.map((review) => (
                  <Link
                    key={review.id}
                    to="/admin/pending"
                    className="flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:border-primary/50"
                  >
                    <div>
                      <p className="font-medium">{review.title}</p>
                      <p className="text-xs text-muted-foreground">{review.city} · {review.broker_name}</p>
                    </div>
                    <Clock className="h-4 w-4 text-warning" />
                  </Link>
                ))}
              </div>
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
              <EmptyState
                icon={Users}
                title="אין משתמשים עדיין"
                description="משתמשים חדשים יופיעו כאן"
              />
            ) : (
              <div className="space-y-3">
                {recentUsers.map((u) => (
                  <Link
                    key={u.id}
                    to="/admin/users"
                    className="flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:border-primary/50"
                  >
                    <div>
                      <p className="font-medium">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('he-IL')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
