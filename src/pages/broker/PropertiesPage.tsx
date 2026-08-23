import { Building2, ChevronLeft, Layers, MapPin, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { FilterBar } from '../../components/ui/FilterBar';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEntityCreated } from '../../hooks/useEntityCreated';
import { fetchProperties, fetchProperty } from '../../lib/services';
import { fetchSharedWithUser } from '../../lib/services/sharedPropertiesService';
import { formatCurrency, getOccupancyPercent } from '../../lib/utils';
import type { PropertyWithUnits } from '../../types/domain';

export function PropertiesPage() {
  const { user } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isSharedOnlyRole = user?.role === 'partner' || user?.role === 'manager';

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      if (isSharedOnlyRole) {
        const shared = await fetchSharedWithUser(user.id);
        const details = await Promise.all(
          shared.map(async (s) => {
            try {
              return await fetchProperty(s.id);
            } catch (err) {
              console.warn('[PropertiesPage] property load failed', s.id, err);
              return undefined;
            }
          }),
        );
        setProperties(details.filter((p): p is PropertyWithUnits => Boolean(p)));
      } else {
        const owned = await fetchProperties(user.id);
        const shared = await fetchSharedWithUser(user.id);
        const sharedIds = new Set(owned.map((p) => p.id));
        const extra = await Promise.all(
          shared.filter((s) => !sharedIds.has(s.id)).map((s) => fetchProperty(s.id)),
        );
        setProperties([...owned, ...extra.filter((p): p is PropertyWithUnits => Boolean(p))]);
      }
    } finally {
      setLoading(false);
    }
  }, [isSharedOnlyRole, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEntityCreated(['property', 'unit'], load);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return properties;
    return properties.filter(
      (p) =>
        p.title.includes(q) ||
        p.city.includes(q) ||
        p.address.includes(q),
    );
  }, [properties, search]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{isSharedOnlyRole ? 'נכסים ששותפו' : 'נכסים מנוהלים'}</h2>
          <p className="text-sm text-muted-foreground">
            {isSharedOnlyRole
              ? 'נכסים ששותפו איתך לצפייה וניהול'
              : 'בחר נכס לצפייה ביחידות, שוכרים וחוזים'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">{properties.length} נכסים</Badge>
          {!isSharedOnlyRole && (
            <Button onClick={() => openQuickAdd('property')}>
              <Plus className="h-4 w-4" />
              נכס חדש
            </Button>
          )}
        </div>
      </div>

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש לפי שם נכס, עיר או כתובת..." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((property) => {
          const occupancy = getOccupancyPercent(property.occupiedUnits, property.totalUnits);

          return (
            <Link key={property.id} to={`/broker/properties/${property.id}`} className="group block">
              <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold group-hover:text-primary">{property.title}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {property.address}, {property.city}
                        </span>
                      </p>
                    </div>
                    <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-muted/50 px-2 py-2">
                      <p className="text-xs text-muted-foreground">תפוסה</p>
                      <p className="font-bold text-success">{occupancy}%</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-2 py-2">
                      <p className="text-xs text-muted-foreground">הכנסה</p>
                      <p className="font-bold">{formatCurrency(property.monthlyIncome)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-2 py-2">
                      <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Layers className="h-3 w-3" />
                        יחידות
                      </p>
                      <p className="font-bold">
                        {property.occupiedUnits}/{property.totalUnits}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">
          {isSharedOnlyRole
            ? 'אין נכסים משותפים עדיין. בקש מהמזמין לשלוח הזמנה מחדש, או התנתק והתחבר שוב לאחר אישור ההזמנה.'
            : 'לא נמצאו נכסים התואמים לחיפוש'}
        </p>
      )}
    </div>
  );
}
