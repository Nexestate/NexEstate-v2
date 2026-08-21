import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type QuickAddType = 'client' | 'lead' | 'task' | 'agreement' | 'property' | 'tenant' | 'lease';

export interface QuickAddState {
  type: QuickAddType | null;
  propertyId?: string;
}

interface QuickAddContextValue {
  state: QuickAddState;
  openQuickAdd: (type: QuickAddType, options?: { propertyId?: string }) => void;
  closeQuickAdd: () => void;
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuickAddState>({ type: null });

  const openQuickAdd = useCallback((type: QuickAddType, options?: { propertyId?: string }) => {
    setState({ type, propertyId: options?.propertyId });
  }, []);

  const closeQuickAdd = useCallback(() => {
    setState({ type: null });
  }, []);

  return (
    <QuickAddContext.Provider value={{ state, openQuickAdd, closeQuickAdd }}>
      {children}
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext);
  if (!ctx) {
    throw new Error('useQuickAdd must be used within QuickAddProvider');
  }
  return ctx;
}

export const ENTITY_CREATED_EVENT = 'nexestate:entity-created';

export function notifyEntityCreated(type: QuickAddType) {
  window.dispatchEvent(new CustomEvent(ENTITY_CREATED_EVENT, { detail: { type } }));
}
