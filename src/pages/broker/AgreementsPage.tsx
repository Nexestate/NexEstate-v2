import { Copy, ExternalLink, Plus } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { CreateSigningLinkModal, type SigningLinkFormValues } from '../../components/property/CreateSigningLinkModal';
import { useAuth } from '../../contexts/AuthContext';
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
  const { user } = useAuth();
  const { links, loading, createLink, fetchLinks } = useSigningLinks();
  const [createOpen, setCreateOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/sign/${token}`;
    void navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = async (values: SigningLinkFormValues) => {
    const created = await createLink({
      client_name: values.client_name,
      client_phone: values.client_phone,
      client_email: values.client_email || undefined,
      deal_type: values.deal_type,
      agreement_type: values.agreement_type,
      property_description: values.property_description || undefined,
      exact_address: values.exact_address || undefined,
      show_address_before_signing: values.show_address_before_signing,
      price: values.price ? Number(values.price) : undefined,
      commission_type: values.commission_type,
      commission_percent: Number(values.commission_percent),
      minimum_commission: values.minimum_commission
        ? Number(values.minimum_commission)
        : undefined,
      valid_days: Number(values.valid_days),
      payment_days: Number(values.payment_days),
      broker_name: user?.full_name,
    });
    if (!created) throw new Error('create failed');
    await fetchLinks();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="הסכמים וחתימה דיגיטלית"
        description="יצירה וניהול קישורי חתימה ללקוחות"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            קישור חדש
          </Button>
        }
      />

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
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
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
                </div>
                {copied === link.token && <span className="text-xs text-success">הועתק!</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CreateSigningLinkModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
