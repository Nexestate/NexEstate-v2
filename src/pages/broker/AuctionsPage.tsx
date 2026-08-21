import { Clock, Gavel, Plus, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { CreateAuctionModal, type AuctionFormValues } from '../../components/property/CreateAuctionModal';
import { useAuth } from '../../contexts/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { createAuction, fetchAuctions, fetchProperties } from '../../lib/services';
import { formatCurrency } from '../../lib/utils';
import { AUCTION_STATUS_LABELS } from '../../types/domain';

const STATUS_VARIANT: Record<string, 'primary' | 'success' | 'warning' | 'outline'> = {
  active: 'success',
  scheduled: 'primary',
  ended: 'outline',
  draft: 'outline',
  cancelled: 'warning',
};

function timeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'הסתיים';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return `${days} ימים ${hours} שעות`;
}

export function AuctionsPage() {
  const { user } = useAuth();
  const { data: auctions, loading, reload } = useAsyncData(() => fetchAuctions(), []);
  const { data: properties } = useAsyncData(() => fetchProperties(user?.id), [user?.id]);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (values: AuctionFormValues) => {
    if (!user) throw new Error('not auth');
    await createAuction({
      title: values.title,
      description: values.description || null,
      start_price: Number(values.start_price),
      reserve_price: values.reserve_price ? Number(values.reserve_price) : null,
      min_increment: values.min_increment ? Number(values.min_increment) : null,
      starts_at: new Date(values.starts_at).toISOString(),
      ends_at: new Date(values.ends_at).toISOString(),
      property_id: values.property_id || null,
      creator_id: user.id,
      status: 'scheduled',
    });
    reload();
  };

  if (loading || !auctions) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="מכירות פומביות"
        description="מכרזים פעילים ומתוכננים"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            מכרז חדש
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {auctions.map((auction) => (
          <Card key={auction.id} className="overflow-hidden">
            <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Gavel className="h-12 w-12 text-primary/50" />
            </div>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{auction.title}</h3>
                <Badge variant={STATUS_VARIANT[auction.status] ?? 'outline'}>
                  {AUCTION_STATUS_LABELS[auction.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{auction.property_title}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">מחיר התחלה</p>
                  <p className="font-bold text-primary">{formatCurrency(auction.start_price)}</p>
                </div>
                {auction.current_bid != null && (
                  <div className="text-end">
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" /> הצעה נוכחית
                    </p>
                    <p className="font-bold text-success">{formatCurrency(auction.current_bid)}</p>
                  </div>
                )}
              </div>
              {auction.status === 'active' && (
                <p className="flex items-center gap-1 text-xs text-warning">
                  <Clock className="h-3 w-3" />
                  נותר: {timeLeft(auction.ends_at)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateAuctionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        propertyOptions={(properties ?? []).map((p) => ({ id: p.id, title: p.title }))}
      />
    </div>
  );
}
