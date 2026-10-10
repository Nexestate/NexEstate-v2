SELECT count(*)::int AS leftover_test_tickets
FROM support_tickets
WHERE subject LIKE 'PHASE1_RLS_TEST%';
