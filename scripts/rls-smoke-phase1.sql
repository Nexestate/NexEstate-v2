CREATE TEMP TABLE rls_result (
  test text PRIMARY KEY,
  passed boolean,
  detail text
);

DO $$
DECLARE
  broker_id uuid;
  partner_id uuid;
  ticket_id uuid;
  n int;
BEGIN
  SELECT id INTO broker_id FROM profiles WHERE role = 'broker' LIMIT 1;
  SELECT id INTO partner_id FROM profiles WHERE role = 'partner' LIMIT 1;

  INSERT INTO rls_result VALUES (
    'have_broker_and_partner',
    broker_id IS NOT NULL AND partner_id IS NOT NULL AND broker_id <> partner_id,
    'ok'
  );
  IF broker_id IS NULL OR partner_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', broker_id::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', broker_id, 'role', 'authenticated')::text,
    true
  );
  PERFORM set_config('role', 'authenticated', true);

  BEGIN
    INSERT INTO support_tickets (user_id, subject, message)
    VALUES (broker_id, 'PHASE1_RLS_TEST_BROKER', 'rls smoke')
    RETURNING id INTO ticket_id;
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'none', true);
    INSERT INTO rls_result VALUES ('broker_insert_own', false, SQLERRM);
    ticket_id := NULL;
  END;

  PERFORM set_config('role', 'none', true);
  IF ticket_id IS NOT NULL THEN
    INSERT INTO rls_result VALUES ('broker_insert_own', true, 'inserted');
  END IF;

  PERFORM set_config('role', 'authenticated', true);
  BEGIN
    INSERT INTO support_tickets (user_id, subject, message)
    VALUES (partner_id, 'PHASE1_RLS_TEST_IMPERSONATE', 'should fail');
    PERFORM set_config('role', 'none', true);
    INSERT INTO rls_result VALUES ('broker_cannot_impersonate', false, 'insert succeeded');
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'none', true);
    INSERT INTO rls_result VALUES ('broker_cannot_impersonate', true, 'rejected');
  END;

  PERFORM set_config('role', 'authenticated', true);
  SELECT count(*) INTO n FROM support_tickets WHERE subject LIKE 'PHASE1_RLS_TEST%';
  PERFORM set_config('role', 'none', true);
  INSERT INTO rls_result VALUES ('broker_select_only_own_tickets', n <= 1, n::text);

  PERFORM set_config('role', 'authenticated', true);
  SELECT count(*) INTO n FROM import_batches;
  PERFORM set_config('role', 'none', true);
  INSERT INTO rls_result VALUES ('broker_cannot_see_import_batches', n = 0, n::text);

  PERFORM set_config('request.jwt.claim.sub', partner_id::text, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', partner_id, 'role', 'authenticated')::text,
    true
  );
  PERFORM set_config('role', 'authenticated', true);
  SELECT count(*) INTO n FROM support_tickets WHERE subject = 'PHASE1_RLS_TEST_BROKER';
  PERFORM set_config('role', 'none', true);
  INSERT INTO rls_result VALUES ('partner_cannot_read_broker_ticket', n = 0, n::text);

  PERFORM set_config('role', 'authenticated', true);
  SELECT count(*) INTO n FROM import_batches;
  PERFORM set_config('role', 'none', true);
  INSERT INTO rls_result VALUES ('partner_cannot_see_import_batches', n = 0, n::text);

  PERFORM set_config('role', 'authenticated', true);
  BEGIN
    INSERT INTO support_tickets (user_id, subject, message)
    VALUES (partner_id, 'PHASE1_RLS_TEST_PARTNER', 'own ticket');
    PERFORM set_config('role', 'none', true);
    INSERT INTO rls_result VALUES ('partner_insert_own', true, 'inserted');
  EXCEPTION WHEN others THEN
    PERFORM set_config('role', 'none', true);
    INSERT INTO rls_result VALUES ('partner_insert_own', false, SQLERRM);
  END;

  DELETE FROM support_tickets WHERE subject LIKE 'PHASE1_RLS_TEST%';
END $$;

SELECT test, passed, detail FROM rls_result ORDER BY test;
