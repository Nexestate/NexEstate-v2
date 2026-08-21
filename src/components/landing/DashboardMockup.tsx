import {
  Bell,
  Building2,
  ClipboardList,
  Layers,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn, formatCurrency } from '../../lib/utils';

interface DashboardMockupProps {
  className?: string;
}

export function DashboardMockup({ className }: DashboardMockupProps) {
  const stats = [
    { label: 'לידים פעילים', value: '124', icon: TrendingUp, color: '#ec4899' },
    { label: 'יחידות פעילות', value: '12', icon: Layers, color: '#10b981' },
    { label: 'חוזים חדשים', value: '23', icon: ClipboardList, color: '#06b6d4' },
    { label: 'הכנסות', value: '₪25K', icon: Building2, color: '#3b82f6' },
  ];

  const leads = [
    { name: 'דני לוי', status: 'חדש', color: 'primary' as const },
    { name: 'שרה אברהם', status: 'בתהליך', color: 'warning' as const },
    { name: 'רון מזרחי', status: 'מוכשר', color: 'success' as const },
  ];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-card/90 shadow-2xl shadow-primary/10',
        className,
      )}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-destructive/60" />
          <span className="h-3 w-3 rounded-full bg-warning/60" />
          <span className="h-3 w-3 rounded-full bg-success/60" />
        </div>
        <span className="flex-1 text-center text-xs text-muted-foreground">NexEstate — לוח בקרה</span>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold">שלום, מיכאל 👋</p>
            <p className="text-xs text-muted-foreground">הנה סקירה של מה קורה אצלך</p>
          </div>
          <Badge variant="primary" className="text-[10px]">BETA</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg"
                  style={{ backgroundColor: `${color}1f`, color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-sm font-bold leading-none">{value}</p>
                  <p className="text-[9px] text-muted-foreground">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold">לידים אחרונים</p>
            <span className="text-[10px] text-primary">הכל ←</span>
          </div>
          <div className="space-y-1.5">
            {leads.map((lead) => (
              <div key={lead.name} className="flex items-center justify-between rounded-lg bg-card/50 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">{lead.name}</span>
                </div>
                <Badge variant={lead.color} className="text-[9px] px-1.5 py-0">{lead.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-success/10 px-3 py-2">
          <span className="text-xs text-muted-foreground">הכנסות חודשיות</span>
          <span className="text-sm font-bold text-success">{formatCurrency(105_633)}</span>
        </div>
      </div>

      {/* Decorative glow */}
      <div className="pointer-events-none absolute -bottom-20 -start-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
    </div>
  );
}
