import { Building2, Heart, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import { useFavorites } from '../../hooks/useFavorites';
import { usePropertySearch } from '../../hooks/usePropertySearch';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { formatCurrency } from '../../lib/utils';

export function BuyerSearchPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'sale' | 'rent'>('sale');
  const { results, loading, error, search } = usePropertySearch();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleSearch = () => {
    void search({ query: query.trim(), listingType: type });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="חיפוש נכסים" description="מצא את הנכס המושלם עבורך" />

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex gap-2">
            {(['sale', 'rent'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  type === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {t === 'sale' ? 'למכירה' : 'להשכרה'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="עיר, שכונה, כתובת..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4" />
              {loading ? 'מחפש...' : 'חיפוש'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && <PageLoader />}

      {results && !loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.length === 0 ? (
            <p className="col-span-2 py-12 text-center text-muted-foreground">לא נמצאו תוצאות</p>
          ) : (
            results.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                  <Building2 className="h-10 w-10 text-primary/40" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{r.title}</h3>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {r.city}
                      </p>
                    </div>
                    <button type="button" onClick={() => void toggleFavorite(r.id)}>
                      <Heart
                        className={`h-5 w-5 ${
                          isFavorite(r.id)
                            ? 'fill-destructive text-destructive'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{formatCurrency(r.price)}</span>
                    <div className="flex gap-1">
                      <Badge variant="outline">{r.kind}</Badge>
                      {r.statusLabel && <Badge variant="primary">{r.statusLabel}</Badge>}
                      {r.rooms != null && r.rooms > 0 && (
                        <Badge variant="primary">{r.rooms} חדרים</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
