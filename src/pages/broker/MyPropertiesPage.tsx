import { Building2, Eye, MapPin, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { DEMO_BROKER_LISTINGS } from '../../data/demoData';
import { formatCurrency } from '../../lib/utils';
import { useMemo, useState } from 'react';

const STATUS_LABELS = { for_sale: 'למכירה', for_rent: 'להשכרה' } as const;
const STATUS_VARIANTS = { for_sale: 'primary', for_rent: 'success' } as const;

export function MyPropertiesPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      DEMO_BROKER_LISTINGS.filter(
        (p) =>
          p.title.includes(search) ||
          p.city.includes(search) ||
          p.address.includes(search),
      ),
    [search],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="נכסים שלי"
        description={`${DEMO_BROKER_LISTINGS.length} נכסים ברשימה`}
        action={
          <Button>
            <Plus className="h-4 w-4" />
            הוסף נכס
          </Button>
        }
      />

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש נכס..." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((property) => (
          <Card key={property.id} className="overflow-hidden transition-colors hover:border-primary/50">
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
                <Badge variant={STATUS_VARIANTS[property.status] as 'primary'}>
                  {STATUS_LABELS[property.status]}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary">
                  {property.status === 'for_rent'
                    ? `${formatCurrency(property.price)}/חודש`
                    : formatCurrency(property.price)}
                </span>
                <Badge variant="outline">{property.kind}</Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{property.area_sqm} מ&quot;ר</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {property.leads_count} לידים
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <Link to={`/broker/properties/${property.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4" />
                    פרטים
                  </Button>
                </Link>
                <Link to="/broker/leads" className="flex-1">
                  <Button size="sm" className="w-full">
                    לידים
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
