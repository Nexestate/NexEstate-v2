import { Copy, ExternalLink, FileDown, FileSignature, MoreHorizontal, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AgreementLinkActionsMenu } from '../../components/broker/AgreementLinkActionsMenu';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const propertyFilter = searchParams.get('property');
  const { links, loading, fetchLinks, cancelLink, deleteLink, markAsSent, emailSigningLink } =
    useSigningLinks();
  const filteredLinks = useMemo(
    () => (propertyFilter ? links.filter((l) => l.property_id === propertyFilter) : links),
    [links, propertyFilter],
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const openMenuLink = menuOpen ? filteredLinks.find((l) => l.id === menuOpen) : undefined;

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
        title="הסכמי חתימה (CRM)"
        description={
          propertyFilter
            ? 'קישורי חתימה דיגיטליים לנכס שנבחר — לא לבלבל עם חוזי שכירות'
            : 'יצירה וניהול קישורי חתימה ללקוחות (נפרד מחוזי שכירות בנכסים מנוהלים)'
        }
        action={
          <Button onClick={() => openQuickAdd('agreement', propertyFilter ? { propertyId: propertyFilter } : undefined)}>
            <Plus className="h-4 w-4" />
            קישור חדש
          </Button>
        }
      />

      {filteredLinks.length === 0 ? (
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
            {filteredLinks.map((link: SigningLink) => (
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
                    <Button
                      variant="ghost"
                      size="icon"
                      title="עוד"
                      onClick={(e) => {
                        if (menuOpen === link.id) {
                          setMenuOpen(null);
                          setMenuAnchor(null);
                        } else {
                          setMenuOpen(link.id);
                          setMenuAnchor(e.currentTarget);
                        }
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  {copied === link.token && <span className="text-xs text-success">הועתק!</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {openMenuLink && (
        <AgreementLinkActionsMenu
          link={openMenuLink}
          open={Boolean(menuOpen)}
          anchorEl={menuAnchor}
          onClose={() => {
            setMenuOpen(null);
            setMenuAnchor(null);
          }}
          loading={actionLoading === openMenuLink.id}
          onMarkSent={() => void runAction(openMenuLink.id, () => markAsSent(openMenuLink.id))}
          onSendEmail={() =>
            void (async () => {
              setActionLoading(openMenuLink.id);
              await emailSigningLink(openMenuLink);
              setActionLoading(null);
              setMenuOpen(null);
              setMenuAnchor(null);
            })()
          }
          onCancel={() => void runAction(openMenuLink.id, () => cancelLink(openMenuLink.id))}
          onDelete={() => {
            if (!window.confirm('למחוק את קישור החתימה?')) return;
            void runAction(openMenuLink.id, () => deleteLink(openMenuLink.id));
          }}
        />
      )}
    </div>
  );
}
