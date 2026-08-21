import {
  Briefcase,
  Building2,
  Home,
  Scale,
  Settings,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UserRole } from '../../types';

export const REGISTER_ROLES: {
  value: UserRole;
  label: string;
  icon: typeof Briefcase;
}[] = [
  { value: 'broker', label: 'סוכן נדל"ן', icon: Briefcase },
  { value: 'developer', label: 'יזם / קבלן', icon: Building2 },
  { value: 'owner', label: 'בעל נכס', icon: Home },
  { value: 'buyer', label: 'קונה / שוכר', icon: ShoppingCart },
  { value: 'investor', label: 'משקיע', icon: TrendingUp },
  { value: 'manager', label: 'חברת ניהול', icon: Settings },
  { value: 'receiver', label: 'כונס / עו"ד', icon: Scale },
];

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">אני...</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {REGISTER_ROLES.map(({ value: roleValue, label, icon: Icon }) => {
          const selected = value === roleValue;
          return (
            <button
              key={roleValue}
              type="button"
              onClick={() => onChange(roleValue)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border px-2 py-4 text-center transition-all',
                selected
                  ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
                  : 'border-border bg-card/50 text-muted-foreground hover:border-primary/40 hover:bg-card hover:text-foreground',
              )}
            >
              <Icon className={cn('h-6 w-6', selected && 'text-primary')} strokeWidth={1.75} />
              <span className="text-[11px] font-medium leading-tight sm:text-xs">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
