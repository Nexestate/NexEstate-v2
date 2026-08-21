import { Building2, Heart, MapPin, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { DEMO_FAVORITES } from '../../data/demoData';
import { formatCurrency } from '../../lib/utils';
import { useState } from 'react';

export function FavoritesPage() {
  const [favorites, setFavorites] = useState(DEMO_FAVORITES);

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="מועדפים"
        description={favorites.length > 0 ? `${favorites.length} נכסים שמורים` : 'אין נכסים במועדפים'}
      />

      {favorites.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Heart}
              title="אין נכסים במועדפים"
              description="שמרו נכסים מהחיפוש או מנכסים ששותפו"
            />
            <div className="flex justify-center gap-3 pb-6">
              <Link to="/buyer/search">
                <Button>
                  <Search className="h-4 w-4" />
                  חיפוש נכסים
                </Button>
              </Link>
              <Link to="/buyer/shared">
                <Button variant="outline">נכסים ששותפו</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {favorites.map((fav) => (
            <Card key={fav.id} className="overflow-hidden">
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-destructive/10 to-primary/10">
                <Building2 className="h-10 w-10 text-primary/40" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{fav.title}</h3>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {fav.city}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFavorite(fav.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">{formatCurrency(fav.price)}</span>
                  <div className="flex gap-1">
                    <Badge variant="outline">{fav.kind}</Badge>
                    {fav.rooms && <Badge variant="primary">{fav.rooms} חדרים</Badge>}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  נוסף {new Date(fav.added_at).toLocaleDateString('he-IL')}
                </p>
                <Link to="/buyer/search" className="mt-3 inline-flex text-sm text-primary hover:underline">
                  צפייה בנכס ←
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
