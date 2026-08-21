import { Building2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import type { MarketListing } from '../../data/marketDemo';
import { formatCurrency } from '../../lib/utils';

interface PropertyCardProps {
  listing: MarketListing;
}

export function PropertyCard({ listing }: PropertyCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-primary/10 via-card to-accent/10">
        <Building2 className="h-12 w-12 text-primary/30 transition-transform group-hover:scale-110" />
        {listing.featured && (
          <Badge variant="warning" className="absolute top-3 start-3">מומלץ</Badge>
        )}
        <Badge variant="outline" className="absolute top-3 end-3">
          {listing.type === 'sale' ? 'למכירה' : 'להשכרה'}
        </Badge>
      </div>
      <CardContent className="space-y-2 p-4">
        <h3 className="font-semibold leading-snug">{listing.title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {listing.city} · {listing.address}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold text-primary">
            {listing.type === 'rent'
              ? `${formatCurrency(listing.price)}/חודש`
              : formatCurrency(listing.price)}
          </span>
          <div className="flex gap-1">
            <Badge variant="primary">{listing.category}</Badge>
            {listing.rooms && <Badge variant="outline">{listing.rooms} חדרים</Badge>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{listing.area_sqm} מ&quot;ר</p>
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          צפייה בפרטים
          <span aria-hidden>←</span>
        </Link>
      </CardContent>
    </Card>
  );
}
