DELETE FROM properties WHERE title LIKE 'PHASE1_QA_IMPORT_%';
SELECT count(*)::int AS leftover_qa_properties
FROM properties
WHERE title LIKE 'PHASE1_QA_IMPORT_%';
