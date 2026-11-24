# Northstar Bank Service Hub

Northstar is a local-first employee portal for IT, Facilities, and People support requests. The React + TypeScript frontend uses Material UI and React Router (no Redux). Spring Boot microservices provide authentication, catalog reads, requests, approvals, and incident tracking. The request, approval, incident, and comment records are stored in the Request Service’s MySQL schema; the Auth Service owns a separate schema.

## What works locally

- Employee registration/login with JWT authentication and manager/administrator combined access.
- Service catalog reads through the existing ServiceNow integration path, with an explicit sample catalog warning if unavailable.
- Structured request submission, idempotency, requester-scoped listing, request detail and history, approval/rejection with comments, and manager/admin request status transitions.
- Incident creation, own/support listing, details, status updates, and comments through the Request Service.
- Request/approval/incident records remain in MySQL across reloads. Optional `external_id` and `external_system` columns are reserved for a later synchronization adapter.
- RabbitMQ outbox events are retried with logged attempts. RabbitMQ and ServiceNow are not required for local request/approval/incident data to persist.

ServiceNow integration behavior and its existing catalog read path were not changed. Local request submission currently persists a portal record and a RabbitMQ outbox message; it does not create a ServiceNow RITM or SCTASK. ServiceNow fulfillment synchronization remains future work.

## Run without Docker

Prerequisites: Java 25, Maven, Node.js 22, MySQL 8+, and (optionally) RabbitMQ. Configure local settings in your shell or `application-local.yml`; never commit real credentials.

Create the databases and grant the local application user access:

```sql
CREATE DATABASE northstar_auth;
CREATE DATABASE northstar_request_service;
GRANT ALL PRIVILEGES ON northstar_auth.* TO 'root'@'localhost';
GRANT ALL PRIVILEGES ON northstar_request_service.* TO 'root'@'localhost';
```

In PowerShell, set the signing secret to the same value for Auth, Gateway, and Request Service (at least 32 bytes), then run each backend module in its own terminal. Use the configured local root password for `MYSQL_PASSWORD`:

```powershell
$env:MYSQL_USER = 'root'
$env:MYSQL_PASSWORD = 'root'
$env:JWT_SIGNING_SECRET = 'replace-with-a-local-secret-at-least-32-bytes'
$env:JWT_ISSUER_URI = 'northstar-auth'
$env:JWT_AUDIENCE = 'northstar-portal'
# Optional local-only feature: allow manager/admin accounts to test as another active portal user.
$env:PORTAL_IMPERSONATION_ENABLED = 'true'
```

For an existing local installation with users in the legacy Auth table, migrate a copy of those accounts into the new Auth schema (the source table stays intact):

```sql
CREATE TABLE IF NOT EXISTS northstar_auth.portal_users LIKE northstar_requests.portal_users;
INSERT IGNORE INTO northstar_auth.portal_users SELECT * FROM northstar_requests.portal_users;
```

Start the services in separate PowerShell terminals from `D:\capstone\backend`:

```powershell
mvn -f service-registry/pom.xml spring-boot:run
mvn -f auth-service/pom.xml spring-boot:run
mvn -f catalog-service/pom.xml spring-boot:run
mvn -f request-service/pom.xml spring-boot:run
$env:SPRING_PROFILES_ACTIVE = 'local'
mvn -f api-gateway/pom.xml spring-boot:run
```

Service ports and configuration are in each module’s `src/main/resources/application.yml`. For this local run, the Gateway's `local` profile listens on port `7777`; Auth Service uses `northstar_auth`, and Request Service uses `northstar_request_service`. The old `northstar_requests` schema from earlier local runs is left untouched. MySQL migrations run automatically for the new Request Service schema. RabbitMQ may be omitted; outbox failures are retried and logged, while portal data remains local.

Start the portal:

```powershell
cd D:\capstone\frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The Vite proxy forwards `/api` calls to `http://localhost:7777`.
With `PORTAL_IMPERSONATION_ENABLED=true` set for the Auth Service, managers/administrators can choose **Test as user** from the account menu. A warning banner identifies the selected account; **Stop testing** restores the original session. Actions made during the session are real and saved as that user. Impersonation is disabled by default and should only be enabled in a local test environment.

## Docker Compose

Compose configuration is in `backend/compose.yaml`. For a **new MySQL volume**, the init script creates separate `northstar_auth` and `northstar_request_service` schemas and grants the configured app user access. For a previously initialized volume, MySQL does not rerun init scripts: back up the database, create/grant the two new schemas manually, then start services. Do not remove database volumes to apply schema changes. Configure the required values in an untracked `backend/.env` using `backend/.env.example`.

## API references

With a service running, Springdoc serves OpenAPI at `/v3/api-docs` and Swagger UI at `/swagger-ui.html`. The Gateway routes `/api/requests/**`, `/api/approvals/**`, and `/api/incidents/**` to the Request Service. Protected API documentation may require a valid JWT.

## Verify changes

```powershell
cd D:\capstone\frontend
npm test
npm run build
cd D:\capstone\backend
mvn -B verify
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for service boundaries, data ownership, and current integration limitations.
