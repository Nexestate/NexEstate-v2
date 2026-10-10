import { Building2, Eye, MapPin, Plus, Share2, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SharePropertyModal } from '../../components/property/SharePropertyModal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEntityCreated } from '../../hooks/useEntityCreated';
import { fetchLeads, fetchProperties } from '../../lib/services';
import { ServiceError } from '../../lib/services/serviceHelpers';
import { formatCurrency } from '../../lib/utils';
import type { PropertyWithUnits } from '../../types/domain';

const STATUS_LABELS: Record<string, string> = {
  for_sale: 'למכירה',
  for_rent: 'להשכרה',
  sold: 'נמכר',
  rented: 'הושכר',
};

const STATUS_VARIANTS: Record<string, 'primary' | 'success' | 'outline'> = {
  for_sale: 'primary',
  for_rent: 'success',
};

export function MyPropertiesPage() {
  const { user } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [shareTarget, setShareTarget] = useState<{ id: string; title: string } | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const [owned, leads] = await Promise.all([
        fetchProperties(user.id),
        fetchLeads(user.id),
      ]);
      setProperties(owned);
      const counts: Record<string, number> = {};
      for (const lead of leads) {
        const pid = lead.property_id;
        if (pid) counts[pid] = (counts[pid] ?? 0) + 1;
      }
      setLeadCounts(counts);
    } catch (err) {
      const msg =
        err instanceof ServiceError
          ? err.message
          : 'לא הצלחנו לטעון את הנכסים. נסו שוב מאוחר יותר.';
      setError(msg);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="נכסים שלי" description="הנכסים שבבעלותך במערכת" />
        <EmptyState
          icon={Building2}
          title="שגיאה בטעינה"
          description={error}
          actionLabel="נסה שוב"
          onAction={load}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="נכסים שלי"
        description={`${properties.length} נכסים בבעלותך`}
        action={
          <Button onClick={() => openQuickAdd('property')}>
            <Plus className="h-4 w-4" />
            הוסף נכס
          </Button>
        }
      />

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש נכס..." />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="אין נכסים עדיין"
          description="הוסיפו נכס ראשון כדי להתחיל לנהל לידים, יחידות ושיתופים."
          actionLabel="הוסף נכס"
          onAction={() => openQuickAdd('property')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => {
            const statusKey = property.status in STATUS_LABELS ? property.status : 'for_rent';
            const leads = leadCounts[property.id] ?? 0;

            return (
              <Card
                key={property.id}
                className="overflow-hidden transition-colors hover:border-primary/50"
              >
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                  <Building2 className="h-12 w-12 text-primary/30" />
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{property.title}</h3>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {property.city}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[statusKey] ?? 'outline'}>
                      {STATUS_LABELS[statusKey] ?? property.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {statusKey === 'for_rent'
                        ? `${formatCurrency(property.price ?? 0)}/חודש`
                        : formatCurrency(property.price ?? 0)}
                    </span>
                    <Badge variant="outline">{property.kind}</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{property.area_sqm ?? property.totalUnits} מ&quot;ר / יחידות</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {leads} לידים
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Link to={`/broker/properties/${property.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4" />
                        פרטים
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShareTarget({ id: property.id, title: property.title })}
                    >
                      <Share2 className="h-4 w-4" />
                      שיתוף
                    </Button>
                    <Link to="/broker/leads" className="flex-1">
                      <Button size="sm" className="w-full">לידים</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {shareTarget && (
        <SharePropertyModal
          open
          onClose={() => setShareTarget(null)}
          propertyId={shareTarget.id}
          propertyTitle={shareTarget.title}
        />
      )}
    </div>
  );
}
