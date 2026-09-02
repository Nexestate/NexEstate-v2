import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/utils';
import {
  MATCH_LEVEL_LABELS,
  MATCH_LEVEL_VARIANT,
  type MatchLevel,
  type ScoredMatch,
} from '../../lib/matching';
import { PROPERTY_KIND_LABELS } from '../../lib/constants';
import type { PropertyKind } from '../../types';

interface PropertyMatchListProps {
  matches: ScoredMatch<{ id: string; title: string; city: string; kind: string; price?: number }>[];
  emptyMessage?: string;
}

export function PropertyMatchList({ matches, emptyMessage = 'לא נמצאו נכסים מתאימים' }: PropertyMatchListProps) {
  if (!matches.length) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {matches.map(({ item, level, score }) => (
        <Link
          key={item.id}
          to={`/broker/properties/${item.id}`}
          className="flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:bg-muted/40"
        >
          <div>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {item.city} · {PROPERTY_KIND_LABELS[item.kind as PropertyKind] ?? item.kind}
              {item.price != null ? ` · ${formatCurrency(item.price)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{score}%</span>
            <MatchBadge level={level} />
          </div>
        </Link>
      ))}
    </div>
  );
}

interface ClientMatchListProps {
  matches: ScoredMatch<{ id: string; full_name: string; type: string; phone?: string }>[];
  emptyMessage?: string;
}

export function ClientMatchList({ matches, emptyMessage = 'לא נמצאו לקוחות מתאימים' }: ClientMatchListProps) {
  if (!matches.length) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {matches.map(({ item, level, score }) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-xl border border-border p-3"
        >
          <div>
            <p className="text-sm font-medium">{item.full_name}</p>
            {item.phone && (
              <a href={`tel:${item.phone}`} className="text-xs text-primary hover:underline">
                {item.phone}
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{score}%</span>
            <MatchBadge level={level} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MatchBadge({ level }: { level: MatchLevel }) {
  return (
    <Badge variant={MATCH_LEVEL_VARIANT[level]} className="shrink-0 text-xs">
      {MATCH_LEVEL_LABELS[level]}
    </Badge>
  );
}
