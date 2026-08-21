import { Building2, Eye, Heart, Pencil, Search, Share2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard, StatCardGrid } from '../../components/dashboard/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { DEMO_BUYER_NOTIFICATIONS, DEMO_FAVORITES, DEMO_SHARED_PROPERTIES } from '../../data/demoData';

const PERMISSION_LABELS = { view: 'צפייה', edit: 'עריכה', admin: 'מנהל' } as const;
const PERMISSION_VARIANTS = { view: 'primary', edit: 'warning', admin: 'success' } as const;

export function BuyerHome() {
  const sharedCount = DEMO_SHARED_PROPERTIES.length;
  const favoritesCount = DEMO_FAVORITES.length;
  const unreadNotifications = DEMO_BUYER_NOTIFICATIONS.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">לוח בקרה</h2>
        <p className="text-sm text-muted-foreground">סקירה אישית של הנכסים שלך</p>
      </div>

      <StatCardGrid className="lg:grid-cols-4">
        <StatCard label="נכסים במועדפים" value={favoritesCount} icon={Heart} color="#ef4444" to="/buyer/favorites" />
        <StatCard label="נכסים ששותפו" value={sharedCount} icon={Share2} color="#8b5cf6" to="/buyer/shared" />
        <StatCard label="נכסים מתאימים" value={0} icon={Building2} color="#10b981" to="/buyer/search" />
        <StatCard label="התראות חדשות" value={unreadNotifications} icon={TrendingUp} color="#f59e0b" to="/buyer/notifications" />
      </StatCardGrid>

      {sharedCount > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">נכסים ששותפו איתך</CardTitle>
            <Link to="/buyer/shared" className="text-sm text-primary hover:underline">
              הכל ←
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_SHARED_PROPERTIES.slice(0, 3).map((property) => (
                <div
                  key={property.id}
                  className="rounded-2xl border border-border p-4 transition-colors hover:border-primary/50"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <Badge variant={PERMISSION_VARIANTS[property.permissionLevel] as 'primary'}>
                      {property.permissionLevel === 'view' ? <Eye className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                      {PERMISSION_LABELS[property.permissionLevel]}
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{property.title}</h3>
                  <p className="text-sm text-muted-foreground">{property.city}</p>
                  <p className="mt-1 text-xs text-muted-foreground">שותף ע&quot;י: {property.sharedByName}</p>
                  <p className="text-xs text-muted-foreground">{property.address}</p>
                  <Link
                    to={`/buyer/shared/${property.id}`}
                    className="mt-3 inline-flex text-sm text-primary hover:underline"
                  >
                    צפייה בנכס ←
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              icon={Search}
              title="התחילו לחפש נכס"
              description="השתמשו במנוע החיפוש למציאת נכסים בהתאמה אישית"
              actionLabel="חיפוש נכסים"
              onAction={() => {}}
            />
            <div className="flex justify-center pb-6">
              <Link to="/buyer/search">
                <Button>חיפוש נכסים</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
