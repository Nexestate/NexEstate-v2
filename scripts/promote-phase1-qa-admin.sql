-- Promote only the controlled Phase 1 QA user. Do not touch other profiles.
UPDATE profiles
SET role = 'admin'
WHERE id = 'bf54e99b-e84f-403a-90c2-d0ab4f4126cb'
  AND email = 'phase1.qa.admin@nexestate.co';

SELECT id, role,
  (email = 'phase1.qa.admin@nexestate.co') AS is_qa_admin
FROM profiles
WHERE id = 'bf54e99b-e84f-403a-90c2-d0ab4f4126cb';

SELECT role, count(*)::int AS n FROM profiles GROUP BY role ORDER BY role;
