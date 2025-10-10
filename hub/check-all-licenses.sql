SELECT 
  l.id,
  l.tenantId,
  l.planKey,
  l.status,
  l.maxSeats,
  l.expiry,
  l.graceDays,
  l.createdAt,
  l.updatedAt,
  t.slug as tenantSlug
FROM License l
LEFT JOIN Tenant t ON l.tenantId = t.id
ORDER BY l.createdAt DESC;