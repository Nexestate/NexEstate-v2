import { Briefcase, MapPin, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { PageHero } from '../../components/market/PageHero';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { FilterBar } from '../../components/ui/FilterBar';
import { MARKET_PLAYERS } from '../../data/marketDemo';

const TYPE_ROLE_MAP: Record<string, string[]> = {
  sellers: ['בעל נכס'],
  receivers: ['כונס / עו"ד'],
  brokers: ['סוכן נדל"ן'],
  developers: ['יזם / קבלן'],
};

export function PlayersPage() {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('הכל');

  useEffect(() => {
    if (!typeParam || !TYPE_ROLE_MAP[typeParam]) {
      setRoleFilter('הכל');
      return;
    }
    const roles = TYPE_ROLE_MAP[typeParam];
    setRoleFilter(roles[0] ?? 'הכל');
  }, [typeParam]);

  const roles = ['הכל', ...new Set(MARKET_PLAYERS.map((p) => p.role))];

  const filtered = useMemo(
    () =>
      MARKET_PLAYERS.filter((p) => {
        const matchRole = roleFilter === 'הכל' || p.role === roleFilter;
        const matchSearch = p.name.includes(search) || p.city.includes(search) || p.role.includes(search);
        return matchRole && matchSearch;
      }),
    [search, roleFilter],
  );

  return (
    <PublicLayout>
      <PageHero
        title="שחקני שוק"
        subtitle="מתווכים, יזמים, חברות ניהול, משקיעים ועורכי דין — כולם במקום אחד"
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                roleFilter === role
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש שחקן..." />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((player) => (
            <Card key={player.id} className="transition-colors hover:border-primary/40">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Briefcase className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{player.name}</h3>
                    <Badge variant="primary" className="mt-1">{player.role}</Badge>
                    <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {player.city}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-lg bg-muted/50 py-2">
                    <p className="font-bold">{player.listings}</p>
                    <p className="text-xs text-muted-foreground">מודעות</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 py-2">
                    <p className="font-bold">{player.deals}</p>
                    <p className="text-xs text-muted-foreground">עסקאות</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 py-2">
                    <p className="flex items-center justify-center gap-1 font-bold">
                      <Star className="h-3.5 w-3.5 text-warning" />
                      {player.rating}
                    </p>
                    <p className="text-xs text-muted-foreground">דירוג</p>
                  </div>
                </div>
                <Link to="/register">
                  <Button variant="outline" className="w-full">צור קשר</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
