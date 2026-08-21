import { CheckCircle, FileSignature, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Logo } from '../../components/layout/Logo';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { SignaturePad } from '../../components/ui/SignaturePad';
import { completeSigning, fetchSigningLink } from '../../lib/services';
import type { SigningLink } from '../../types/domain';

export function SignPage() {
  const { token } = useParams<{ token: string }>();
  const [link, setLink] = useState<SigningLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signed, setSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('קישור לא תקין');
      setLoading(false);
      return;
    }
    fetchSigningLink(token).then((data) => {
      if (!data) {
        setError('קישור לא נמצא או שפג תוקפו');
      } else if (data.status === 'signed') {
        setLink(data);
        setSigned(true);
      } else if (data.status === 'expired') {
        setError('קישור זה פג תוקף');
      } else {
        setLink(data);
        setName(data.client_name);
        setPhone(data.client_phone ?? '');
        setEmail(data.client_email ?? '');
      }
      setLoading(false);
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      setError('נדרשת חתימה');
      return;
    }
    if (!token) return;

    setSubmitting(true);
    setError('');
    const result = await completeSigning(token, {
      client_name: name,
      client_phone: phone,
      client_email: email || undefined,
      signature_data: signature,
    });
    setSubmitting(false);

    if (result.ok) {
      if (result.pdfUrl) setPdfUrl(result.pdfUrl);
      setSigned(true);
    } else {
      setError('שגיאה בשמירת החתימה. נסה שוב.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !link) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <FileSignature className="mb-4 h-12 w-12 text-destructive" />
        <h1 className="text-xl font-bold">{error}</h1>
      </div>
    );
  }

  if (signed && link) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-lg text-center">
          <Logo className="mb-8 justify-center" showBeta={false} />
          <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-success/10 mx-auto">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold">החתימה הושלמה בהצלחה!</h1>
          <p className="mt-2 text-muted-foreground">תודה {link.client_name}, ההסכם נחתם.</p>

          {(pdfUrl || link.pdf_url) && (
            <a
              href={pdfUrl || link.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex text-sm font-medium text-primary hover:underline"
            >
              הורדת הסכם PDF
            </a>
          )}

          {link.property_address && (
            <Card className="mt-8 text-start">
              <CardHeader>
                <CardTitle className="text-base">פרטי הנכס</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {link.property_title && (
                  <p className="font-medium">{link.property_title}</p>
                )}
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {link.property_address}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        <Logo className="mb-6 justify-center" showBeta={false} />

        <Card>
          <CardHeader className="text-center">
            <div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 mx-auto">
              <FileSignature className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>הסכם תיווך</CardTitle>
            <p className="text-sm text-muted-foreground">
              {link?.agreement_type === 'exclusive' ? 'הסכם בלעדיות' : 'הסכם תיווך רגיל'}
              {link?.commission_percent && ` • עמלה ${link.commission_percent}%`}
            </p>
          </CardHeader>

          <CardContent>
            {link?.property_title && (
              <div className="mb-6 rounded-xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">נכס</p>
                <p className="font-medium">{link.property_title}</p>
                {link.property_address && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {link.property_address}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="שם מלא" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="טלפון" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <Input label='דוא"ל' type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

              <div>
                <p className="mb-2 text-sm font-medium">חתימה דיגיטלית *</p>
                <SignaturePad onChange={setSignature} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? 'שומר...' : 'חתום ושלח'}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              בחתימה על מסמך זה אני מאשר/ת את תנאי ההסכם
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
