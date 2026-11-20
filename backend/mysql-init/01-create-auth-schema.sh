#!/bin/sh
set -eu
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS northstar_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS northstar_incident_service CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
GRANT ALL PRIVILEGES ON northstar_auth.* TO '${MYSQL_USER}'@'%';
GRANT ALL PRIVILEGES ON northstar_incident_service.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL