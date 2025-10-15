-- Atualizar senha do usuário fernando@2fsolutions.com.br com hash correto
UPDATE "User" 
SET password = '$2b$10$ZcAwhvSU97ZW6Cw1WTa6huiPSgwOzS1kouPy/D58kh9WJacBKMKxW', 
    updatedAt = datetime('now')
WHERE email = 'fernando@2fsolutions.com.br';