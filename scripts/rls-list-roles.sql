SELECT role, count(*)::int AS n
FROM profiles
GROUP BY role
ORDER BY n DESC;
