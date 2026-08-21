import { MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { PageHero } from '../../components/market/PageHero';
import { FilterBar } from '../../components/ui/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { MARKET_DEALS } from '../../data/marketDemo';
import { formatCurrency } from '../../lib/utils';

export function DealsPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      MARKET_DEALS.filter(
        (d) =>
          d.city.includes(search) ||
          d.type.includes(search) ||
          d.address.includes(search),
      ),
    [search],
  );

  return (
    <PublicLayout>
      <PageHero
        title="מפת עסקאות"
        subtitle="עסקאות שנסגרו לאחרונה ברחבי הארץ — נתונים בזמן אמת"
      />

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/30">
          <div className="relative flex h-72 items-center justify-center bg-gradient-to-br from-primary/5 via-card to-accent/5 sm:h-96">
            <div className="absolute inset-0 opacity-20">
              {MARKET_DEALS.map((deal) => (
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
              <p className="text-sm text-muted-foreground">{MARKET_DEALS.length} עסקאות מוצגות על המפה</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold">עסקאות אחרונות</h2>
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
              {filtered.map((deal) => (
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
