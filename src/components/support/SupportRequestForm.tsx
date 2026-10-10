import { LifeBuoy } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createSupportTicket } from '../../lib/services/supportTicketsService';
import { ServiceError } from '../../lib/services/serviceHelpers';
import { Button } from '../ui/Button';
import { Card, CardContent, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';

export function SupportRequestForm() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await createSupportTicket(user.id, { subject, message });
      setSuccess(true);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'לא הצלחנו לשלוח את הפנייה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">פנייה לתמיכה</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          תארו בקצרה את הבעיה — צוות NexEstate יעדכן את הסטטוס בלוח הניהול.
        </p>
        <Input
          label="נושא"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="לדוגמה: בעיה בהתחברות"
        />
        <label className="block text-sm">
          <span className="text-muted-foreground">הודעה</span>
          <textarea
            className="mt-1 w-full min-h-28 rounded-lg border border-border bg-background px-3 py-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="פרטים נוספים..."
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <p className="text-sm text-success">הפנייה נשלחה. נחזור אליכם בהקדם האפשרי.</p>
        )}
        <Button onClick={submit} disabled={loading || !subject.trim() || !message.trim()}>
          {loading ? 'שולח...' : 'שלח פנייה'}
        </Button>
      </CardContent>
    </Card>
  );
}
