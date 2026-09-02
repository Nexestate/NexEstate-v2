import { Copy, ExternalLink, FileDown, FileSignature, MoreHorizontal, Plus, Send, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { useQuickAdd } from '../../contexts/QuickAddContext';
import { useEntityCreated } from '../../hooks/useEntityCreated';
import { useSigningLinks } from '../../hooks/useSigningLinks';
import type { SigningLink } from '../../types/domain';
import { SIGNING_STATUS_LABELS } from '../../types/domain';
import { AGREEMENT_TYPE_LABELS } from '../../lib/constants';

const STATUS_VARIANT: Record<string, 'primary' | 'success' | 'warning' | 'outline'> = {
  pending: 'outline',
  sent: 'primary',
  signed: 'success',
  expired: 'warning',
};

export function AgreementsPage() {
  const { openQuickAdd } = useQuickAdd();
  const { links, loading, fetchLinks, cancelLink, deleteLink, markAsSent } = useSigningLinks();
  const [copied, setCopied] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEntityCreated('agreement', fetchLinks);

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/sign/${token}`;
    void navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const runAction = async (id: string, action: () => Promise<boolean>) => {
    setActionLoading(id);
    await action();
    setActionLoading(null);
    setMenuOpen(null);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="הסכמים וחתימה דיגיטלית"
        description="יצירה וניהול קישורי חתימה ללקוחות"
        action={
          <Button onClick={() => openQuickAdd('agreement')}>
            <Plus className="h-4 w-4" />
            קישור חדש
          </Button>
        }
      />

      {links.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="אין קישורי חתימה"
          description="צור קישור חדש ושלוח ללקוח לחתימה דיגיטלית"
          actionLabel="קישור חדש"
          onAction={() => openQuickAdd('agreement')}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>לקוח</TableHead>
              <TableHead>נכס</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>עמלה</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link: SigningLink) => (
              <TableRow key={link.id}>
                <TableCell>
                  <p className="font-medium">{link.client_name}</p>
                  <p className="text-xs text-muted-foreground">{link.client_phone}</p>
                  {link.client_email && (
                    <p className="text-xs text-muted-foreground">{link.client_email}</p>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {link.property_title ?? link.property_description ?? '—'}
                </TableCell>
                <TableCell>
                  {AGREEMENT_TYPE_LABELS[link.agreement_type] ?? link.agreement_type}
                </TableCell>
                <TableCell>
                  {link.commission_percent != null ? `${link.commission_percent}%` : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[link.status] ?? 'outline'}>
                    {SIGNING_STATUS_LABELS[link.status]}
                  </Badge>
                  {link.signed_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(link.signed_at).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyLink(link.token)}
                      title="העתק קישור"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <a href={`/sign/${link.token}`} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon" title="פתח">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                    {link.pdf_url && (
                      <a href={link.pdf_url} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="icon" title="הורד PDF">
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="עוד"
                        onClick={() => setMenuOpen(menuOpen === link.id ? null : link.id)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      {menuOpen === link.id && (
                        <div className="absolute end-0 top-full z-20 mt-1 min-w-40 rounded-xl border border-border bg-card p-1 shadow-lg">
                          {link.status === 'pending' && (
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                              disabled={actionLoading === link.id}
                              onClick={() => void runAction(link.id, () => markAsSent(link.id))}
                            >
                              <Send className="h-4 w-4" />
                              סמן כנשלח
                            </button>
                          )}
                          {(link.status === 'pending' || link.status === 'sent') && (
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                              disabled={actionLoading === link.id}
                              onClick={() => void runAction(link.id, () => cancelLink(link.id))}
                            >
                              <XCircle className="h-4 w-4" />
                              בטל / פג תוקף
                            </button>
                          )}
                          {link.status !== 'signed' && (
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                              disabled={actionLoading === link.id}
                              onClick={() => {
                                if (!window.confirm('למחוק את קישור החתימה?')) return;
                                void runAction(link.id, () => deleteLink(link.id));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              מחק
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {copied === link.token && <span className="text-xs text-success">הועתק!</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
