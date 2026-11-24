-- ==============================================================================
-- Northstar ITSM Platform - Multi-Database Initialization Script
-- Executed on MySQL first container startup via /docker-entrypoint-initdb.d/
-- ==============================================================================

-- 1. Authentication & User Management Service
CREATE DATABASE IF NOT EXISTS `northstar_auth`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Incident Management Service
CREATE DATABASE IF NOT EXISTS `northstar_incident_service`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Service Request & Approvals Service
CREATE DATABASE IF NOT EXISTS `northstar_request_service`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Problem Management Service
CREATE DATABASE IF NOT EXISTS `problem_db`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Change Management & CAB Service
CREATE DATABASE IF NOT EXISTS `change_management`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant comprehensive access to root user across all databases
GRANT ALL PRIVILEGES ON `northstar_auth`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `northstar_incident_service`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `northstar_request_service`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `problem_db`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `change_management`.* TO 'root'@'%';

FLUSH PRIVILEGES;
