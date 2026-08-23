import { ChevronDown, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { getAppOrigin, getSupabaseAuthCallbackUrl } from '../../lib/appUrl';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface GoogleOAuthHintProps {
  defaultOpen?: boolean;
}

export function GoogleOAuthHint({ defaultOpen = false }: GoogleOAuthHintProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  if (!isSupabaseConfigured) return null;

  const googleRedirectUri = getSupabaseAuthCallbackUrl();
  const appCallback = `${getAppOrigin()}/auth/callback`;

  const copyUri = async () => {
    try {
      await navigator.clipboard.writeText(googleRedirectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 text-start">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-warning"
      >
        <span>Google לא עובד? (redirect_uri_mismatch)</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-warning/20 px-4 py-3 text-xs text-muted-foreground">
          <p>
            ב-<strong>Google Cloud Console</strong> → Credentials → OAuth Client →{' '}
            <strong>Authorized redirect URIs</strong> הוסף <strong>רק</strong> את הכתובת הזו (לא
            nexestate.co):
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 font-mono text-[11px] break-all text-foreground">
            <span className="min-w-0 flex-1">{googleRedirectUri}</span>
            <Button type="button" size="sm" variant="outline" onClick={() => void copyUri()}>
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'הועתק' : 'העתק'}
            </Button>
          </div>
          <ol className="list-decimal space-y-1 ps-4">
            <li>
              JavaScript origins: <code className="text-foreground">{getAppOrigin()}</code> ו-
              <code className="text-foreground">http://localhost:5173</code>
            </li>
            <li>
              Supabase → Authentication → Providers → Google — Client ID + Secret מהקונסול
            </li>
            <li>
              Supabase → URL Configuration → Redirect URLs:{' '}
              <code className="text-foreground">{appCallback}</code>
            </li>
          </ol>
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            פתח Google Cloud Console
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
