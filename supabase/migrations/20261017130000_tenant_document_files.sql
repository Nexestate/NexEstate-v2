-- Tenant document vault metadata (files in storage bucket tenant-documents)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS document_files jsonb NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-documents',
  'tenant-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "tenant_documents_select_own" ON storage.objects;
DROP POLICY IF EXISTS "tenant_documents_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "tenant_documents_delete_own" ON storage.objects;

CREATE POLICY "tenant_documents_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "tenant_documents_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "tenant_documents_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
