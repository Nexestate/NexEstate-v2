CREATE TEMP TABLE rls_admin_result (
  test text PRIMARY KEY,
  passed boolean,
  detail text
);

DO $$
DECLARE
  admin_id uuid := 'bf54e99b-e84f-403a-90c2-d0ab4f4126cb';
  broker_id uuid;
  n int;
  ticket_id uuid;
BEGIN
  SELECT id INTO broker_id FROM profiles WHERE role = 'broker' LIMIT 1;

  PERFORM set_config('request.jwt.claim.sub', broker_id::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', broker_id, 'role', 'authenticated')::text,
    true
  );
  PERFORM set_config('role', 'authenticated', true);
  INSERT INTO support_tickets (user_id, subject, message)
  VALUES (broker_id, 'PHASE1_ADMIN_RLS_BROKER', 'visible to admin only besides owner');
  PERFORM set_config('role', 'none', true);

  PERFORM set_config('request.jwt.claim.sub', admin_id::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', admin_id, 'role', 'authenticated')::text,
    true
  );
  PERFORM set_config('role', 'authenticated', true);

  SELECT count(*) INTO n FROM support_tickets WHERE subject = 'PHASE1_ADMIN_RLS_BROKER';
  PERFORM set_config('role', 'none', true);
  INSERT INTO rls_admin_result VALUES ('admin_can_read_other_tickets', n = 1, n::text);

  PERFORM set_config('role', 'authenticated', true);
  UPDATE support_tickets
  SET status = 'in_progress', admin_notes = 'phase1 qa'
  WHERE subject = 'PHASE1_ADMIN_RLS_BROKER';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM set_config('role', 'none', true);
  INSERT INTO rls_admin_result VALUES ('admin_can_update_other_ticket', n = 1, n::text);

  PERFORM set_config('role', 'authenticated', true);
  BEGIN
    INSERT INTO import_batches (imported_by, filename, total_rows, imported_rows, failed_rows, status)
    VALUES (admin_id, 'phase1-rls.csv', 0, 0, 0, 'completed');
    PERFORM set_config('role', 'none', true);
    INSERT INTO rls_admin_result VALUES ('admin_can_insert_import_batch', true, 'inserted');
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'none', true);
    INSERT INTO rls_admin_result VALUES ('admin_can_insert_import_batch', false, SQLERRM);
  END;

  PERFORM set_config('role', 'authenticated', true);
  SELECT count(*) INTO n FROM import_batches WHERE filename = 'phase1-rls.csv';
  PERFORM set_config('role', 'none', true);
  INSERT INTO rls_admin_result VALUES ('admin_can_read_import_batches', n = 1, n::text);

  DELETE FROM support_tickets WHERE subject LIKE 'PHASE1_ADMIN_RLS%';
  DELETE FROM import_batches WHERE filename = 'phase1-rls.csv';
END $$;

SELECT test, passed, detail FROM rls_admin_result ORDER BY test;
