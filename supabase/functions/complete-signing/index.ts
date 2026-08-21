import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { generateAndStoreAgreementPdf } from '../_shared/agreement-pdf.ts';
import {
  getSignedAgreementBrokerEmail,
  getSignedAgreementClientEmail,
} from '../_shared/email-templates.ts';
import { appBaseUrl, sendResendEmail } from '../_shared/resend.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

interface SignaturePayload {
  token: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  signature_data: string;
  signer_id_number?: string;
  signer_company_name?: string;
  signer_address?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    const payload: SignaturePayload = await req.json();
    const {
      token,
      client_name,
      client_phone,
      client_email,
      signature_data,
      signer_id_number,
      signer_company_name,
      signer_address,
    } = payload;

    if (!token || !client_name || !client_phone || !signature_data) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    const supabase = createAdminClient();

    const { data: link, error: fetchError } = await supabase
      .from('signing_links')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !link) {
      return jsonResponse({ error: 'Invalid or expired signing link' }, 404);
    }

    if (link.status === 'signed') {
      return jsonResponse({ error: 'This agreement has already been signed' }, 400);
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return jsonResponse({ error: 'Link expired' }, 410);
    }

    const signedAt = new Date().toISOString();
    const { data: updatedLink, error: updateError } = await supabase
      .from('signing_links')
      .update({
        status: 'signed',
        client_name,
        client_phone,
        client_email: client_email || null,
        signer_id_number: signer_id_number || null,
        signer_company_name: signer_company_name || null,
        signer_address: signer_address || null,
        signature_data: { image: signature_data },
        signed_at: signedAt,
      })
      .eq('id', link.id)
      .select()
      .single();

    if (updateError || !updatedLink) {
      return jsonResponse({ error: 'Failed to save signature' }, 500);
    }

    const pdfUrl = await generateAndStoreAgreementPdf(
      supabase,
      updatedLink as Record<string, unknown>,
    );
    const agreementLink = pdfUrl || `${appBaseUrl()}/sign/${token}`;

    const dealType = String(updatedLink.deal_type || 'sale');
    const propertyDescription = String(
      updatedLink.property_description ||
        updatedLink.exact_address ||
        updatedLink.property_address ||
        'נכס',
    );
    const signedAtDisplay = new Date(signedAt).toLocaleString('he-IL');

    let brokerEmail: string | null = null;
    let brokerName = updatedLink.broker_name || 'מתווך';
    if (updatedLink.broker_id) {
      const { data: broker } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', updatedLink.broker_id)
        .maybeSingle();
      brokerEmail = broker?.email ?? null;
      brokerName = broker?.full_name || brokerName;
    }

    if (brokerEmail) {
      await sendResendEmail({
        to: brokerEmail,
        subject: `הסכם נחתם — ${client_name}`,
        html: getSignedAgreementBrokerEmail({
          brokerName,
          clientName: client_name,
          clientPhone: client_phone,
          clientEmail: client_email,
          propertyDescription,
          dealType,
          signedAt: signedAtDisplay,
          agreementLink,
        }),
      });
    }

    if (client_email) {
      await sendResendEmail({
        to: client_email,
        subject: 'אישור חתימה — NexEstate',
        html: getSignedAgreementClientEmail({
          clientName: client_name,
          brokerName,
          propertyDescription,
          dealType,
          signedAt: signedAtDisplay,
          agreementLink,
        }),
      });
    }

    return jsonResponse({
      success: true,
      message: 'Agreement signed successfully',
      data: {
        id: updatedLink.id,
        status: updatedLink.status,
        signed_at: updatedLink.signed_at,
        pdf_url: pdfUrl,
        token,
      },
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
