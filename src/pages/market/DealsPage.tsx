import { MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { PageHero } from '../../components/market/PageHero';
import { FilterBar } from '../../components/ui/FilterBar';
import { Tabs } from '../../components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { MARKET_DEALS } from '../../data/marketDemo';
import { formatCurrency } from '../../lib/utils';

const ENDED_CUTOFF = '2026-08-10';

export function DealsPage() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'recent' | 'ended'>(statusParam === 'ended' ? 'ended' : 'recent');

  useEffect(() => {
    setTab(statusParam === 'ended' ? 'ended' : 'recent');
  }, [statusParam]);

  useEffect(() => {
    if (searchParams.get('status') === 'ended') return;
    if (searchParams.has('status')) {
      const next = new URLSearchParams(searchParams);
      next.delete('status');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const scoped = useMemo(
    () =>
      MARKET_DEALS.filter((deal) =>
        status === 'ended' ? deal.date < ENDED_CUTOFF : deal.date >= ENDED_CUTOFF,
      ),
    [status],
  );

  const filtered = useMemo(
    () =>
      scoped.filter(
        (d) =>
          d.city.includes(search) ||
          d.type.includes(search) ||
          d.address.includes(search),
      ),
    [scoped, search],
  );

  const displayDeals = useMemo(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    if (tab === 'ended') return sorted.slice(Math.ceil(sorted.length / 2));
    return sorted.slice(0, Math.ceil(sorted.length / 2) || sorted.length);
  }, [filtered, tab]);

  return (
    <PublicLayout>
      <PageHero
        title="מפת עסקאות"
        subtitle={
          tab === 'ended'
            ? 'עסקאות שהסתיימו — ארכיון עסקאות אחרונות'
            : 'עסקאות שנסגרו לאחרונה ברחבי הארץ — נתונים בזמן אמת'
        }
      />

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
        <Tabs
          tabs={[
            { id: 'recent', label: 'עסקאות אחרונות', count: MARKET_DEALS.filter((d) => d.date >= ENDED_CUTOFF).length },
            { id: 'ended', label: 'מכירות שהסתיימו', count: MARKET_DEALS.filter((d) => d.date < ENDED_CUTOFF).length },
          ]}
          active={status}
          onChange={setStatus}
        />

        <div className="overflow-hidden rounded-2xl border border-border bg-card/30">
          <div className="relative flex h-72 items-center justify-center bg-gradient-to-br from-primary/5 via-card to-accent/5 sm:h-96">
            <div className="absolute inset-0 opacity-20">
              {filtered.map((deal) => (
                <div
                  key={deal.id}
                  className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-lg shadow-primary/50"
                  style={{
                    left: `${((deal.lng - 34.5) / 1.5) * 80 + 10}%`,
                    top: `${((deal.lat - 31.5) / 1.5) * 80 + 10}%`,
                  }}
                  title={`${deal.city} — ${formatCurrency(deal.price)}`}
                />
              ))}
            </div>
            <div className="relative z-10 rounded-2xl border border-border bg-card/90 px-6 py-4 text-center backdrop-blur-sm">
              <MapPin className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="font-semibold">מפת עסקאות אינטראקטיבית</p>
              <p className="text-sm text-muted-foreground">{filtered.length} עסקאות מוצגות על המפה</p>
            </div>
          </div>
        </div>

        <div>
          <Tabs
            tabs={[
              { id: 'recent', label: 'עסקאות אחרונות' },
              { id: 'ended', label: 'עסקאות שהסתיימו' },
            ]}
            active={tab}
            onChange={(id) => setTab(id as 'recent' | 'ended')}
          />
          <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש לפי עיר או סוג..." />
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>סוג</TableHead>
                <TableHead>עיר</TableHead>
                <TableHead>כתובת</TableHead>
                <TableHead>מחיר</TableHead>
                <TableHead>תאריך</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{deal.type}</TableCell>
                  <TableCell>{deal.city}</TableCell>
                  <TableCell className="text-muted-foreground">{deal.address}</TableCell>
                  <TableCell className="font-bold text-primary">{formatCurrency(deal.price)}</TableCell>
                  <TableCell>{new Date(deal.date).toLocaleDateString('he-IL')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PublicLayout>
  );
}
