import { Building2, Eye, Heart, Pencil, Share2, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard, StatCardGrid } from '../../components/dashboard/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { useBuyerSharedProperties } from '../../hooks/useBuyerSharedProperties';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuth } from '../../contexts/AuthContext';
import { getUnreadCount, fetchNotifications } from '../../lib/services';

const PERMISSION_LABELS = { view: 'צפייה', edit: 'עריכה', admin: 'מנהל' } as const;
const PERMISSION_VARIANTS = { view: 'primary', edit: 'warning', admin: 'success' } as const;

export function BuyerHome() {
  const { user } = useAuth();
  const { properties, loading } = useBuyerSharedProperties();
  const { count: favoritesCount } = useFavorites();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id).then((list) => setUnreadNotifications(getUnreadCount(list)));
    }
  }, [user?.id]);

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
        <p className="text-sm text-muted-foreground">נכסים ששותפו איתך</p>
      </div>

      <StatCardGrid className="lg:grid-cols-3">
        <StatCard label="נכסים ששותפו" value={properties.length} icon={Share2} color="#8b5cf6" to="/buyer/shared" />
        <StatCard label="מועדפים" value={favoritesCount} icon={Heart} color="#ef4444" to="/buyer/favorites" />
        <StatCard label="התראות חדשות" value={unreadNotifications} icon={TrendingUp} color="#f59e0b" to="/buyer/notifications" />
      </StatCardGrid>

      {properties.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">נכסים ששותפו איתך</CardTitle>
            <Link to="/buyer/shared" className="text-sm text-primary hover:underline">
              הכל ←
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.slice(0, 3).map((property) => (
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
                  {property.sharedByName && (
                    <p className="mt-1 text-xs text-muted-foreground">שותף ע&quot;י: {property.sharedByName}</p>
                  )}
                  {property.address && (
                    <p className="text-xs text-muted-foreground">{property.address}</p>
                  )}
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
              icon={Share2}
              title="אין נכסים משותפים עדיין"
              description="כשמישהו ישתף איתך נכס, הוא יופיע כאן אוטומטית לאחר ההתחברות"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
