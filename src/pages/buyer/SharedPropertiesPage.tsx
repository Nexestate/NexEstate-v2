import { Building2, Eye, MapPin, Pencil, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { useBuyerSharedProperties } from '../../hooks/useBuyerSharedProperties';

const PERMISSION_LABELS = { view: 'צפייה', edit: 'עריכה', admin: 'מנהל' } as const;
const PERMISSION_VARIANTS = { view: 'primary', edit: 'warning', admin: 'success' } as const;

export function SharedPropertiesPage() {
  const { properties, loading } = useBuyerSharedProperties();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="נכסים ששותפו"
        description={`${properties.length} נכסים שותפו איתך`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.id} className="transition-colors hover:border-primary/50">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </span>
                <Badge variant={PERMISSION_VARIANTS[property.permissionLevel] as 'primary'}>
                  {property.permissionLevel === 'view' ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <Pencil className="h-3 w-3" />
                  )}
                  {PERMISSION_LABELS[property.permissionLevel]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <CardTitle className="text-base">{property.title}</CardTitle>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {property.city} · {property.address}
              </p>
              {property.sharedByName && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Share2 className="h-3 w-3" />
                  שותף ע&quot;י {property.sharedByName}
                </p>
              )}
              <Link
                to={`/broker/properties/${property.id}`}
                className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
              >
                צפייה בנכס ←
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
