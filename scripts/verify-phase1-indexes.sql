SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('support_tickets', 'import_batches')
ORDER BY tablename, indexname;
