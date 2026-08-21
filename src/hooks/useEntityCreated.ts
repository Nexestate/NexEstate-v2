import { useEffect } from 'react';
import { ENTITY_CREATED_EVENT, type QuickAddType } from '../contexts/QuickAddContext';

export function useEntityCreated(types: QuickAddType | QuickAddType[], onCreated: () => void) {
  useEffect(() => {
    const allowed = Array.isArray(types) ? types : [types];
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ type: QuickAddType }>).detail;
      if (allowed.includes(detail.type)) {
        onCreated();
      }
    };
    window.addEventListener(ENTITY_CREATED_EVENT, handler);
    return () => window.removeEventListener(ENTITY_CREATED_EVENT, handler);
  }, [types, onCreated]);
}
