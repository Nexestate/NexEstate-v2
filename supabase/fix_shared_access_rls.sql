-- Run once in Supabase SQL Editor (paste claim_invites_rpc.sql first if RPC missing).
-- Partners / shared users can read leases, tenants, and related profiles.

-- Leases: shared users can read via property share
DROP POLICY IF EXISTS "Shared users can read leases" ON public.leases;
CREATE POLICY "Shared users can read leases" ON public.leases
  FOR SELECT USING (public.can_read_property(property_id));

-- Tenants: readable when linked to a lease on a shared property
DROP POLICY IF EXISTS "Shared users can read tenants" ON public.tenants;
CREATE POLICY "Shared users can read tenants" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leases l
      WHERE l.tenant_id = tenants.id
        AND public.can_read_property(l.property_id)
    )
  );

-- Profiles: sharer name visible to share participants
DROP POLICY IF EXISTS "Share participants can view related profiles" ON public.profiles;
CREATE POLICY "Share participants can view related profiles" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.property_shares ps
      WHERE (ps.shared_with = auth.uid() AND ps.shared_by = profiles.id)
         OR (ps.shared_by = auth.uid() AND ps.shared_with = profiles.id)
    )
  );

-- Lease payments: shared users can read via property share
DROP POLICY IF EXISTS "Shared users can read lease payments" ON public.lease_payments;
CREATE POLICY "Shared users can read lease payments" ON public.lease_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leases l
      WHERE l.id = lease_payments.lease_id
        AND public.can_read_property(l.property_id)
    )
  );

-- INSERT INTO property_shares (property_id, shared_with, shared_by, permission_level)
-- SELECT 'a0000001-0000-0000-0000-000000000001', p.id, pr.broker_id, 'view'
-- FROM profiles p
-- JOIN properties pr ON pr.id = 'a0000001-0000-0000-0000-000000000001'
-- WHERE lower(p.email) = 'viner.michael@gmail.com'
-- ON CONFLICT (property_id, shared_with) DO NOTHING;
