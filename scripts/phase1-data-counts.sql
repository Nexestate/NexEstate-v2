SELECT
  (SELECT count(*) FROM profiles) AS profiles,
  (SELECT count(*) FROM properties) AS properties,
  (SELECT count(*) FROM property_shares) AS property_shares,
  (SELECT count(*) FROM notifications) AS notifications,
  (SELECT count(*) FROM lease_payments) AS lease_payments,
  (SELECT count(*) FROM support_tickets) AS support_tickets,
  (SELECT count(*) FROM import_batches) AS import_batches,
  (SELECT count(*) FROM profiles WHERE role IN ('admin','superadmin')) AS admin_profiles;
