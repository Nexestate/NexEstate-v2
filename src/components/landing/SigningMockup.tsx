import { CheckCircle, FileSignature } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SigningMockupProps {
  className?: string;
}

export function SigningMockup({ className }: SigningMockupProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 bg-card/90 shadow-2xl shadow-success/10',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-destructive/60" />
          <span className="h-3 w-3 rounded-full bg-warning/60" />
          <span className="h-3 w-3 rounded-full bg-success/60" />
        </div>
        <span className="flex-1 text-center text-xs text-muted-foreground">חתימה דיגיטלית</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="text-center">
          <FileSignature className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-2 font-bold text-sm">הסכם תיווך</p>
          <p className="text-xs text-muted-foreground">בניין שקטר 30, תל אביב</p>
        </div>

        <div className="rounded-xl bg-muted/30 p-3 space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">לקוח</span><span>יוסי כהן</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">עמלה</span><span>2%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">סוג</span><span>בלעדיות</span></div>
        </div>

        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-white/5 p-4">
          <svg viewBox="0 0 200 60" className="w-full h-12 text-primary">
            <path
              d="M10,45 Q40,10 70,35 T130,25 T190,40"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-center text-[10px] text-muted-foreground mt-1">חתימה דיגיטלית</p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-success">
          <CheckCircle className="h-4 w-4" />
          <span className="text-xs font-medium">מוכן לחתימה</span>
        </div>
      </div>
    </div>
  );
}
