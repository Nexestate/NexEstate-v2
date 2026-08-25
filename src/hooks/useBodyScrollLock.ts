import { useEffect } from 'react';

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const roots = [
      document.documentElement,
      document.body,
      ...Array.from(document.querySelectorAll('main')),
    ];

    const prev = roots.map((el) => ({
      el,
      overflow: el.style.overflow,
      overscroll: el.style.overscrollBehavior,
    }));

    roots.forEach((el) => {
      el.style.overflow = 'hidden';
      el.style.overscrollBehavior = 'none';
    });

    return () => {
      prev.forEach(({ el, overflow, overscroll }) => {
        el.style.overflow = overflow;
        el.style.overscrollBehavior = overscroll;
      });
    };
  }, [locked]);
}
