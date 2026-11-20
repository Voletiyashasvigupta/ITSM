-- Seed sample managers and employees for testing if not already present
USE northstar_auth;

INSERT INTO portal_users (id, active, created_at, department, email, full_name, password_hash, role)
SELECT UUID_TO_BIN(UUID()), 1, NOW(6), 'FINANCE', 'manager.finance@northstar.local', 'Sarah Jenkins', '$2a$12$V.9iGqJra/YUfopM7R0VEu6FH8l7vLArj.p8zKA6pWYxZ0LN9oOR2', 'MANAGER_ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM portal_users WHERE email = 'manager.finance@northstar.local');

INSERT INTO portal_users (id, active, created_at, department, email, full_name, password_hash, role)
SELECT UUID_TO_BIN(UUID()), 1, NOW(6), 'IT', 'manager.it@northstar.local', 'David Chen', '$2a$12$V.9iGqJra/YUfopM7R0VEu6FH8l7vLArj.p8zKA6pWYxZ0LN9oOR2', 'MANAGER_ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM portal_users WHERE email = 'manager.it@northstar.local');

INSERT INTO portal_users (id, active, created_at, department, email, full_name, password_hash, role)
SELECT UUID_TO_BIN(UUID()), 1, NOW(6), 'SOFTWARE_ENGINEERING', 'alex.rivera@northstar.local', 'Alex Rivera', '$2a$12$V.9iGqJra/YUfopM7R0VEu6FH8l7vLArj.p8zKA6pWYxZ0LN9oOR2', 'EMPLOYEE'
WHERE NOT EXISTS (SELECT 1 FROM portal_users WHERE email = 'alex.rivera@northstar.local');

INSERT INTO portal_users (id, active, created_at, department, email, full_name, password_hash, role)
SELECT UUID_TO_BIN(UUID()), 1, NOW(6), 'OPERATIONS', 'emma.watson@northstar.local', 'Emma Watson', '$2a$12$V.9iGqJra/YUfopM7R0VEu6FH8l7vLArj.p8zKA6pWYxZ0LN9oOR2', 'EMPLOYEE'
WHERE NOT EXISTS (SELECT 1 FROM portal_users WHERE email = 'emma.watson@northstar.local');
