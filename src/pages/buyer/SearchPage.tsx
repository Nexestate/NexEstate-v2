import { Building2, Heart, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { DEMO_PROPERTIES } from '../../data/demoData';
import { formatCurrency } from '../../lib/utils';

const SEARCH_RESULTS = [
  ...DEMO_PROPERTIES.map((p) => ({
    id: p.id,
    title: p.title,
    city: p.city,
    address: p.address,
    price: p.monthlyIncome,
    kind: 'משרדים',
    rooms: null as number | null,
  })),
  {
    id: 'search-2',
    title: 'דירת 4 חדרים — נווה צedeק',
    city: 'תל אביב',
    address: 'שדה יehudah 12',
    price: 3_200_000,
    kind: 'מגורים',
    rooms: 4,
  },
  {
    id: 'search-3',
    title: 'מגרש בנייה — ראשון לציון',
    city: 'ראשון לציון',
    address: 'אזור התעשייה',
    price: 1_800_000,
    kind: 'מגרש',
    rooms: null,
  },
];

export function BuyerSearchPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'sale' | 'rent'>('sale');
  const [results, setResults] = useState<typeof SEARCH_RESULTS | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    const q = query.toLowerCase();
    setResults(
      SEARCH_RESULTS.filter(
        (r) =>
          !q ||
          r.title.includes(q) ||
          r.city.includes(q) ||
          r.address.includes(q),
      ),
    );
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="חיפוש נכסים" description="מצא את הנכס המושלם עבורך" />

      <Card>
        <CardContent className="p-4 space-y-3">
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
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4" />
              חיפוש
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.length === 0 ? (
            <p className="col-span-2 py-12 text-center text-muted-foreground">לא נמצאו תוצאות</p>
          ) : (
            results.map((r) => (
              <Card key={r.id} className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
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
                    <button type="button" onClick={() => toggleFavorite(r.id)}>
                      <Heart
                        className={`h-5 w-5 ${favorites.has(r.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`}
                      />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{formatCurrency(r.price)}</span>
                    <div className="flex gap-1">
                      <Badge variant="outline">{r.kind}</Badge>
                      {r.rooms && <Badge variant="primary">{r.rooms} חדרים</Badge>}
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
