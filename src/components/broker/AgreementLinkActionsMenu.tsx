import { Send, Trash2, XCircle } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SigningLink } from '../../types/domain';

type AgreementLinkActionsMenuProps = {
  link: SigningLink;
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  loading: boolean;
  onMarkSent: () => void;
  onSendEmail: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

export function AgreementLinkActionsMenu({
  link,
  open,
  anchorEl,
  onClose,
  loading,
  onMarkSent,
  onSendEmail,
  onCancel,
  onDelete,
}: AgreementLinkActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorEl) {
      setStyle(null);
      return;
    }
    const rect = anchorEl.getBoundingClientRect();
    const menuWidth = 176;
    const left = Math.min(Math.max(8, rect.right - menuWidth), window.innerWidth - menuWidth - 8);
    const top = rect.bottom + 6;
    setStyle({ top, left });
  }, [open, anchorEl]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || anchorEl?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorEl]);

  if (!open || !style) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[200] min-w-44 rounded-xl border border-border bg-card p-1 shadow-xl"
      style={{ top: style.top, left: style.left }}
      role="menu"
    >
      {link.client_email && link.status !== 'signed' && link.status !== 'expired' && (
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
          disabled={loading}
          onClick={onSendEmail}
        >
          <Send className="h-4 w-4" />
          שלח במייל ללקוח
        </button>
      )}
      {link.status === 'pending' && (
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
          disabled={loading}
          onClick={onMarkSent}
        >
          <Send className="h-4 w-4 opacity-60" />
          סמן כנשלח
        </button>
      )}
      {(link.status === 'pending' || link.status === 'sent') && (
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
          disabled={loading}
          onClick={onCancel}
        >
          <XCircle className="h-4 w-4" />
          בטל / פג תוקף
        </button>
      )}
      {link.status !== 'signed' && (
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
          disabled={loading}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          מחק
        </button>
      )}
    </div>,
    document.body,
  );
}
