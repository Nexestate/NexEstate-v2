import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHero({ title, subtitle, children, className }: PageHeroProps) {
  return (
    <section id="top" className={cn('relative overflow-hidden border-b border-border px-4 py-10 sm:py-14 md:py-16', className)} dir="rtl">
      <div className="pointer-events-none absolute inset-0 hero-gradient opacity-60" />
      <div className="relative mx-auto max-w-7xl">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
