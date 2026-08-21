import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

const EXAMPLES = [
  'דירת 4 חדרים בתל אביב',
  'משרדים להשכרה ברמת גן',
  'מגרש בנייה בראשון לציון',
  'דירה להשכרה בחיפה',
  'בית פרטי בהרצליה פיתוח',
  'משרד 120 מ"ר בעזריאלי',
];

interface AnimatedSearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  onSubmit?: () => void;
}

export function AnimatedSearchInput({
  value = '',
  onChange,
  className,
  onSubmit,
}: AnimatedSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState('');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const showAnimation = !focused && !value;

  useEffect(() => {
    if (!showAnimation) return;

    const phrase = EXAMPLES[exampleIndex];
    const delay = deleting ? 35 : typed.length === phrase.length ? 1800 : 65;

    const timer = window.setTimeout(() => {
      if (!deleting) {
        if (typed.length < phrase.length) {
          setTyped(phrase.slice(0, typed.length + 1));
        } else {
          setDeleting(true);
        }
      } else if (typed.length > 0) {
        setTyped(typed.slice(0, -1));
      } else {
        setDeleting(false);
        setExampleIndex((i) => (i + 1) % EXAMPLES.length);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [typed, deleting, exampleIndex, showAnimation]);

  return (
    <div
      className={cn('relative min-w-0 flex-1 cursor-text', className)}
      onClick={() => inputRef.current?.focus()}
      role="search"
    >
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        aria-label="חיפוש נכסים"
        className="relative z-10 h-11 w-full bg-transparent px-4 text-start text-sm text-foreground outline-none sm:h-12 sm:text-base"
      />

      {showAnimation && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 flex items-center px-4 text-sm sm:text-base"
        >
          <span className="truncate text-muted-foreground">{typed}</span>
          <span className="typewriter-cursor ms-0.5 inline-block h-[1.15em] w-0.5 shrink-0 rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}
