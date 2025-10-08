-- Criar customer de teste
INSERT INTO Customer (id, name, email, phone, active, createdAt, updatedAt) 
VALUES ('test-customer-1', 'João Silva', 'joao@test.com', '11999999999', 1, datetime('now'), datetime('now'));

-- Criar pet de teste
INSERT INTO Pet (id, tutorId, name, species, breed, active, createdAt, updatedAt) 
VALUES ('test-pet-1', 'test-customer-1', 'Rex', 'dog', 'Golden Retriever', 1, datetime('now'), datetime('now'));

-- Criar serviço de teste
INSERT INTO Service (id, name, description, price, duration, active, createdAt, updatedAt) 
VALUES ('test-service-1', 'Banho e Tosa', 'Banho completo com tosa higiênica', 50.00, 60, 1, datetime('now'), datetime('now'));

-- Criar produto de teste
INSERT INTO Product (id, name, salePrice, stockQty, active, createdAt, updatedAt) 
VALUES ('test-product-1', 'Shampoo Pet', 25.00, 10, 1, datetime('now'), datetime('now'));