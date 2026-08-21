import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatedSearchInput } from '../../components/landing/AnimatedSearchInput';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { PageHero } from '../../components/market/PageHero';
import { PropertyCard } from '../../components/market/PropertyCard';
import { Button } from '../../components/ui/Button';
import { FilterBar } from '../../components/ui/FilterBar';
import { MARKET_CATEGORIES, MARKET_LISTINGS } from '../../data/marketDemo';
import { cn } from '../../lib/utils';

export function MarketPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCategory = searchParams.get('category') ?? 'הכל';
  const initialQuery = searchParams.get('q') ?? '';
  const initialType = searchParams.get('type');
  const [category, setCategory] = useState(initialCategory);
  const [type, setType] = useState<'all' | 'sale' | 'rent'>(
    initialType === 'rent' ? 'rent' : initialType === 'sale' ? 'sale' : 'all',
  );
  const [search, setSearch] = useState(initialQuery);

  const filtered = useMemo(
    () =>
      MARKET_LISTINGS.filter((l) => {
        const matchCat = category === 'הכל' || l.category === category;
        const matchType = type === 'all' || l.type === type;
        const matchSearch =
          !search ||
          l.title.includes(search) ||
          l.city.includes(search) ||
          l.address.includes(search);
        return matchCat && matchType && matchSearch;
      }),
    [category, type, search],
  );

  return (
    <PublicLayout>
      <PageHero
        title="שוק נכסים"
        subtitle="אלפי נכסים למכירה ולהשכרה — דירות, משרדים, מסחרי ועוד"
      >
        <div className="search-bar-glow flex flex-col gap-2 rounded-2xl border border-primary/20 bg-card/80 p-2 backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full sm:ps-4">
          <AnimatedSearchInput
            value={search}
            onChange={setSearch}
            onSubmit={() => navigate('/market')}
          />
          <Button className="h-11 w-full shrink-0 rounded-xl px-6 sm:h-12 sm:w-auto sm:rounded-full">
            <Search className="h-4 w-4 shrink-0" />
            חיפוש
          </Button>
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <div className="flex flex-wrap gap-2">
          {(['all', 'sale', 'rent'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                type === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {t === 'all' ? 'הכל' : t === 'sale' ? 'למכירה' : 'להשכרה'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {MARKET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm transition-colors',
                category === cat
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <FilterBar search={search} onSearchChange={setSearch} placeholder="סינון נוסף..." />

        <p className="text-sm text-muted-foreground">{filtered.length} נכסים נמצאו</p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
