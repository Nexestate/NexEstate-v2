import { TrendingDown, TrendingUp } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { PageHero } from '../../components/market/PageHero';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { PRICE_TRENDS } from '../../data/marketDemo';
import { formatCurrency } from '../../lib/utils';

export function PricesPage() {
  const maxPrice = Math.max(...PRICE_TRENDS.map((t) => t.avgPrice));

  return (
    <PublicLayout>
      <PageHero
        title="מחירים"
        subtitle="מגמות מחירים לפי עיר — מחיר ממוצע, שינוי חודשי ומחיר למ&quot;ר"
      />

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRICE_TRENDS.map((trend) => (
            <Card key={trend.city}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{trend.city}</h3>
                  <Badge variant={trend.change >= 0 ? 'success' : 'destructive'}>
                    {trend.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {trend.change > 0 ? '+' : ''}{trend.change}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-primary">{formatCurrency(trend.avgPrice)}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(trend.perSqm)}/מ&quot;ר</p>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(trend.avgPrice / maxPrice) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>עיר</TableHead>
                  <TableHead>מחיר ממוצע</TableHead>
                  <TableHead>מחיר למ&quot;ר</TableHead>
                  <TableHead>שינוי חודשי</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PRICE_TRENDS.map((t) => (
                  <TableRow key={t.city}>
                    <TableCell className="font-medium">{t.city}</TableCell>
                    <TableCell>{formatCurrency(t.avgPrice)}</TableCell>
                    <TableCell>{formatCurrency(t.perSqm)}</TableCell>
                    <TableCell>
                      <span className={t.change >= 0 ? 'text-success' : 'text-destructive'}>
                        {t.change > 0 ? '+' : ''}{t.change}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
