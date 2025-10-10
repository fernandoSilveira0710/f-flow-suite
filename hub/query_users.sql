SELECT 
  u.id,
  u.email,
  u.displayName,
  u.tenantId,
  u.active,
  u.createdAt,
  t.slug as tenantSlug,
  o.name as orgName
FROM User u
LEFT JOIN Tenant t ON u.tenantId = t.id
LEFT JOIN Org o ON t.orgId = o.id
ORDER BY u.createdAt DESC;