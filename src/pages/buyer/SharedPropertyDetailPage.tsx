import { ArrowRight, Building2, Eye, Heart, MapPin, Pencil, Share2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { DEMO_SHARED_PROPERTIES, getDemoProperty } from '../../data/demoData';
import { formatCurrency, getOccupancyPercent } from '../../lib/utils';

const PERMISSION_LABELS = { view: 'צפייה', edit: 'עריכה', admin: 'מנהל' } as const;

const SHARED_TO_PROPERTY: Record<string, string> = {
  'shared-1': 'prop-1',
  'shared-2': 'prop-1',
};

export function SharedPropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const shared = DEMO_SHARED_PROPERTIES.find((p) => p.id === id);

  if (!shared) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">נכס לא נמצא</p>
        <Link to="/buyer/shared" className="mt-4 text-primary hover:underline">
          חזרה לנכסים ששותפו
        </Link>
      </div>
    );
  }

  const propertyId = SHARED_TO_PROPERTY[shared.id] ?? shared.id;
  const property = getDemoProperty(propertyId);
  const favorited = isFavorite(propertyId);
  const canEdit = shared.permissionLevel === 'edit' || shared.permissionLevel === 'admin';
  const occupancy = property
    ? getOccupancyPercent(property.occupiedUnits, property.totalUnits)
    : null;

  return (
    <div className="space-y-6">
      <Link to="/buyer/shared" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowRight className="h-4 w-4" />
        חזרה לנכסים ששותפו
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-2xl font-bold">{shared.title}</h2>
            <p className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {shared.address}, {shared.city}
            </p>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Share2 className="h-3.5 w-3.5" />
              שותף ע&quot;י {shared.sharedByName}
            </p>
          </div>
        </div>
        <Badge variant={canEdit ? 'warning' : 'primary'}>
          {canEdit ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {PERMISSION_LABELS[shared.permissionLevel]}
        </Badge>
      </div>

      {property && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-success">{occupancy}%</p>
              <p className="text-sm text-muted-foreground">תפוסה</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-primary">{formatCurrency(property.monthlyIncome)}</p>
              <p className="text-sm text-muted-foreground">הכנסה חודשית</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{property.totalUnits}</p>
              <p className="text-sm text-muted-foreground">יחידות</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 font-semibold">פרטי הנכס</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">סוג</dt>
              <dd className="font-medium">{property?.kind ?? 'משרדים'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">שטח</dt>
              <dd className="font-medium">{property?.area_sqm ?? '—'} מ&quot;ר</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">סטטוס</dt>
              <dd className="font-medium">{property?.status ?? 'פעיל'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">הרשאה שלך</dt>
              <dd className="font-medium">{PERMISSION_LABELS[shared.permissionLevel]}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link to="/buyer/search">
          <Button variant="outline">חיפוש נכסים דומים</Button>
        </Link>
        <Button
          variant={favorited ? 'default' : 'outline'}
          onClick={() => void toggleFavorite(propertyId)}
        >
          <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
          {favorited ? 'במועדפים' : 'שמור למועדפים'}
        </Button>
      </div>
    </div>
  );
}
