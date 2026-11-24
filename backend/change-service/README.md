# Change Management Backend (`change-service`)

Standalone Spring Boot 3.4 / Java 21 service for an ITSM Change Management module.

## Important implementation boundaries

This ZIP is a runnable backend foundation, not a claim of full ServiceNow-equivalent behavior. The core change lifecycle, persisted audit events, scheduling/implementation/validation/rollback/closure operations, pageable search, summary counts, typed/validated create DTO, DTO contracts for the remaining operations, and database-backed customization-definition APIs are implemented. Several advanced items are intentionally configuration-storage foundations and are **not yet wired into runtime behavior**:

- Custom workflow definitions are stored and can be activated/deactivated, but do not replace the hard-coded safe lifecycle transition graph.
- Approval-rule definitions are stored, but the current approval path does not dynamically evaluate their conditions or perform multi-level/parallel approvals. The core path conservatively requires a recorded approval before scheduling for every change type; this is stricter than a standard-change pre-approval policy.
- CAB meeting/member/agenda/decision records are persisted as configuration records, but CAB decisions are not automatically reconciled with the change approval record. Use the explicit change approval endpoint for lifecycle approval.
- Custom field definitions are stored separately from the JSON `customValues` on a change. The backend currently stores submitted custom values but does not yet perform complete per-field type/required/reference validation or render form UI.
- Notification templates are stored; no SMTP/email delivery or in-app delivery worker is configured. SMTP credentials are deliberately not hard-coded.
- Attachment records currently fit the generic configuration store; binary upload/storage is not included.
- Role names are an integration contract, not a local user/role database. Production verifies JWT signatures/issuer, but fine-grained role-to-operation authorization and ownership checks must be mapped to your Auth Service claims before production exposure.

These boundaries are documented so stored configuration is not misrepresented as an active policy engine.

## Architecture

`Controller -> Service -> Spring Data Repository -> MySQL`.

- `ChangeRequest`: current operational state and implementation/risk/closure fields.
- `ChangeHistory`: append-only lifecycle event history (separate table).
- `ConfigRecord`: JSON configuration store, keyed by resource type and unique key, used by custom fields, forms, workflows, approval rules, categories, notification templates and CAB records.
- Flyway creates the schema on startup.

## Requirements

- Java 21
- Maven 3.9+
- MySQL 8.x
- Postman (optional)

## Run locally with Maven

Create a MySQL database (or allow the configured URL to create it):

```sql
CREATE DATABASE change_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

PowerShell:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/change_management?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your-local-password"
$env:SPRING_PROFILES_ACTIVE="dev"
mvn clean package
mvn spring-boot:run
```

Linux/macOS: export the same variables, then run `mvn clean package` and `mvn spring-boot:run`.

## Access / Security

All endpoints are reachable by default (`OPEN_ACCESS=true`): no token is needed, and CORS allows browser front-ends (`CORS_ALLOWED_ORIGINS`, default `*`).

- Swagger UI: `http://localhost:8091/swagger-ui.html` (OpenAPI JSON at `/v3/api-docs`)
- Health: `http://localhost:8091/actuator/health`
- To require JWTs instead: set `OPEN_ACCESS=false`, `SPRING_PROFILES_ACTIVE=prod` and `JWT_ISSUER_URI` from your Auth Service. Health and Swagger stay public; everything else needs a bearer token.
- Open access is for local development and demos only. Restrict `CORS_ALLOWED_ORIGINS` and turn it off before exposing the service to a network.

## Change lifecycle

Normal example: create (`DRAFT`) -> submit -> start assessment -> assessment complete (`UNDER_REVIEW`) -> review (`PENDING_APPROVAL`) -> approve (`APPROVED`) -> schedule (`SCHEDULED`) -> start implementation (`IN_PROGRESS`) -> complete (`IMPLEMENTED`) -> test (`PENDING_VALIDATION` then `VALIDATED`) -> close (`CLOSED`). Invalid transitions return HTTP 409. A failed implementation or failed validation can enter rollback; rollback completion is recorded separately and then can be closed. Cancellation is permitted only where the transition graph allows it, before implementation.

Emergency approval requires a justification in the approval request. Emergency changes still use the same recorded approval endpoint; post-implementation review is captured at closure.

## Core APIs

Base: `http://localhost:8091/api/changes`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/changes` | Create DRAFT change |
| GET | `/api/changes` | Pageable search/filter (`search`, `status`, `type`, `page`, `size`, `sort`) |
| GET/PUT/DELETE | `/api/changes/{id}` | Read/update DRAFT/delete eligible DRAFT |
| GET | `/api/changes/my-changes?email=...` | Requester's changes |
| POST | `/{id}/submit` | Submit |
| POST | `/{id}/start-assessment`, `/{id}/assess` | Start/complete assessment |
| POST | `/{id}/assign` | Assign analyst/teams/manager |
| POST | `/{id}/review`, `/{id}/request-information` | Review or request information |
| POST | `/{id}/approve`, `/{id}/reject` | Record decision, actor, timestamp and comments |
| POST | `/{id}/schedule` | Schedule approved change |
| POST | `/{id}/start-implementation` | Start scheduled change |
| PUT | `/{id}/implementation-progress` | Update progress |
| POST | `/{id}/complete-implementation` | Record success/failure |
| POST/GET | `/{id}/test-results` | Record/read validation |
| POST/PUT | `/{id}/rollback`, `/{id}/rollback/complete` | Record rollback lifecycle |
| POST | `/{id}/close`, `/{id}/cancel` | Close/cancel under policy |
| GET | `/{id}/history` | Audit trail |
| GET | `/dashboard/summary` | Counts by status/type/risk |

Additional routes include `/api/cab/meetings` and `/api/{custom-fields,custom-forms,custom-workflows,approval-rules,change-categories,notifications}`. The Postman collection contains example calls for the core lifecycle and customization endpoints.

## Example create request

```json
{
  "shortDescription": "Upgrade application server",
  "detailedDescription": "Upgrade to the approved application release",
  "requestedBy": "Alex Employee",
  "requesterEmail": "alex@example.com",
  "department": "IT",
  "changeType": "NORMAL",
  "category": "APPLICATION",
  "priority": "MEDIUM",
  "riskLevel": "MEDIUM",
  "impact": "Brief application restart",
  "affectedCi": "APP-SERVER-01",
  "businessJustification": "Security and performance updates",
  "implementationPlan": "Deploy during approved maintenance window",
  "rollbackPlan": "Restore the previous release",
  "testPlan": "Run smoke and regression tests"
}
```

## Postman setup and recommended sequence

1. Import `Change-Management-Postman-Collection.json`.
2. Import `Change-Management-Postman-Environment.json` and select **Change Management Local**.
3. Run Create change. Its test script saves `changeId` and `changeNumber` when the response is 201.
4. Run in order: Submit -> Start assessment -> Complete assessment -> Assign -> Review -> Approve -> Schedule -> Start implementation -> Update progress (optional) -> Complete implementation -> Submit test results -> Close.
5. For rollback testing, create a separate change and use the failure/rollback requests instead of the success/close path.
6. Create a CAB meeting separately. Save its returned `id` into the environment variable `meetingId` if you want to test the CAB routes. The generic configuration collection also saves a `configId`; because several resource groups use that variable, run each configuration flow sequentially.

The collection is a set of examples; not every request can be run in one straight line because rejection, cancellation, information-request, rollback and success paths are mutually exclusive branches.

## Database / configuration

Database credentials are supplied through `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`. Flyway migration: `src/main/resources/db/migration/V1__create_core_tables.sql`. Hibernate uses schema validation; do not switch to `ddl-auto=create` for shared environments.

## Tests performed for this ZIP

- Project and Postman JSON files are generated and structurally checked by the packaging script.
- Java runtime availability was confirmed (OpenJDK 21).
- Update (open access, CORS, Swagger UI, actuator health) was edited but **not compiled or run**: the build sandbox has no Maven and cannot reach Maven Central.
- **Maven compilation/package was not run:** Maven is not installed in the build environment. No application startup, MySQL integration test, HTTP API test, or Docker test is claimed. Run `mvn clean package` and the Postman lifecycle after extraction in an environment with Maven and MySQL/Docker.
