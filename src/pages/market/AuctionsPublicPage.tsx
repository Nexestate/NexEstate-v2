import { Clock, Gavel, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { PublishAdLink } from '../../components/landing/PublishAdLink';
import { PageHero } from '../../components/market/PageHero';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { PUBLIC_AUCTIONS } from '../../data/marketDemo';
import { formatCurrency } from '../../lib/utils';

function useCountdown(target: number) {
  const [left, setLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(`${d}י ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

function AuctionCard({ auction }: { auction: typeof PUBLIC_AUCTIONS[0] }) {
  const countdown = useCountdown(auction.endsAt);
  return (
    <Card className="overflow-hidden transition-all hover:border-warning/50 hover:shadow-lg hover:shadow-warning/10">
      <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-warning/20 via-card to-primary/10">
        <Gavel className="h-14 w-14 text-warning/50" />
        {auction.status === 'active' && (
          <div className="absolute top-3 start-3 flex items-center gap-1 rounded-full bg-destructive/90 px-2.5 py-1 text-[10px] font-bold text-white">
            <Clock className="h-3 w-3" />
            {countdown}
          </div>
        )}
        <Badge variant={auction.status === 'active' ? 'warning' : 'outline'} className="absolute top-3 end-3">
          {auction.status === 'active' ? 'פעיל' : 'מתוכנן'}
        </Badge>
      </div>
      <CardContent className="space-y-3 p-5">
        <h3 className="font-semibold">{auction.title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {auction.city}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">מחיר פתיחה</p>
            <p className="font-bold text-muted-foreground">{formatCurrency(auction.startPrice)}</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-muted-foreground">הצעה נוכחית</p>
            <p className="text-xl font-bold text-warning">{formatCurrency(auction.currentBid)}</p>
          </div>
        </div>
        <Link to="/login">
          <Button className="w-full" variant="outline">השתתף במכרז</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function AuctionsPublicPage() {
  return (
    <PublicLayout>
      <PageHero
        title="מכירות פומביות"
        subtitle="מכרזים חיים עם טיימר בזמן אמת — דירות, משרדים ומגרשים"
      />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_AUCTIONS.map((a) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-border bg-card/50 p-6 text-center">
          <p className="text-muted-foreground">רוצה לפרסם מכירה פומבית?</p>
          <PublishAdLink className="mt-4 inline-block">
            <Button className="rounded-full px-8">פרסם מודעה</Button>
          </PublishAdLink>
        </div>
      </div>
    </PublicLayout>
  );
}
