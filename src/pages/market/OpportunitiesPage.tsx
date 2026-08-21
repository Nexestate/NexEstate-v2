import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { PageHero } from '../../components/market/PageHero';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { MARKET_OPPORTUNITIES } from '../../data/marketDemo';
import { formatCurrency } from '../../lib/utils';

const RISK_LABELS = { low: 'סיכון נמוך', medium: 'סיכון בינוני', high: 'סיכון גבוה' };
const RISK_VARIANTS = { low: 'success', medium: 'warning', high: 'destructive' } as const;

export function OpportunitiesPage() {
  return (
    <PublicLayout>
      <PageHero
        title="הזדמנויות"
        subtitle="השקעות נדל&quot;ן עם תשואה צפויה — נבחרו על ידי מומחי NexEstate"
      />

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {MARKET_OPPORTUNITIES.map((opp) => (
            <Card key={opp.id} className="overflow-hidden transition-all hover:border-primary/40">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{opp.title}</h3>
                    <p className="text-sm text-muted-foreground">{opp.city} · {opp.type}</p>
                  </div>
                  <Badge variant={RISK_VARIANTS[opp.risk]}>{RISK_LABELS[opp.risk]}</Badge>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">מחיר</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(opp.price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">תשואה שנתית</p>
                    <p className="flex items-center gap-1 text-xl font-bold text-success">
                      <TrendingUp className="h-5 w-5" />
                      {opp.roi}%
                    </p>
                  </div>
                </div>
                <Link to="/login">
                  <Button className="w-full rounded-full">פרטים נוספים</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/calculator">
            <Button variant="outline" className="rounded-full px-8">
              חשב תשואה עם המחשבון שלנו
            </Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
