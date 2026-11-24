# Architecture and service boundaries

## Running system versus target system

The current repository contains the Eureka Service Registry, API Gateway, Auth Service, Catalog Service, Request Service, and ServiceNow Integration service. The React + TypeScript portal uses Material UI and React Router; it does not use Redux. Approval and incident APIs currently live inside the Request Service as local modules. Notification, SLA, reporting, and a separately deployed Approval Service are architectural targets rather than current services.

## Current data ownership

| Service/module | Data and responsibility |
|---|---|
| Auth Service | Portal accounts, password hashes, departments, assigned `EMPLOYEE` / `MANAGER_ADMIN` roles, JWT issuance. Uses `northstar_auth`. |
| Catalog Service | Catalog projection/cache; existing catalog read path calls the ServiceNow integration boundary and can serve cached/sample fallback data. |
| Request Service | Local service requests, submitted form fields, requester/requested-for/approver IDs, status history, approval records, incidents and comments, plus an outbox. Uses `northstar_request_service`. |
| ServiceNow Integration | Existing OAuth and REST integration boundary. No request/approval/incident sync consumer is wired yet. |

The Request Service stores optional `external_id` and `external_system` columns for later synchronization. Request/approval/incident writes are behind service interfaces so an adapter can be added later. ServiceNow catalog behavior was left unchanged. MySQL is currently the source of truth for locally created requests, decisions, and incidents. No RITM, SCTASK, Incident, or Approval record is currently created in ServiceNow by submitting through the portal.

The API Gateway is the user-facing backend entry point; Eureka provides discovery. Request Service rejects missing or invalid JWTs even when called directly on port 8082. The Gateway removes caller-provided identity headers, forwards verified identity, and adds a correlation ID. Request Service uses the token subject for employee ownership. The combined Manager + Administrator role sees the general request queue, while People support request records remain scoped to their requester/requested-for/approver participants.

## Current workflow

1. The employee submits a validated catalog form and selects an approver.
2. Request Service persists the request, structured fields, pending approval row, audit/history row, and outbox event in one local database transaction.
3. The assigned approver can approve or reject. Rejection requires a comment. The request status and history are updated together.
4. Managers/administrators can progress eligible requests through the request status state machine.
5. RabbitMQ outbox events retry a bounded number of times. Failures are logged and surfaced as `SYNC_FAILED`; local approval actions can still be completed. There is no consumer that sends the event to ServiceNow yet.
6. Employees can report incidents, see their own incidents, view details/comments, and add comments. The combined Manager + Administrator role can see and update incident status/assignment.

## API paths

- `POST /api/requests`, `GET /api/requests?page=0&size=20`, `GET /api/requests/{id}`, `GET /api/requests/{id}/history`, and manager/admin `PATCH /api/requests/{id}/status`.
- `GET /api/approvals/pending`, `POST /api/approvals/{id}/approve`, `POST /api/approvals/{id}/reject`, and `GET /api/approvals/history`.
- `POST /api/incidents`, `GET /api/incidents`, `GET /api/incidents/{id}`, `PATCH /api/incidents/{id}/status`, and `POST /api/incidents/{id}/comments`.
- Springdoc generates OpenAPI/Swagger pages for each backend service.

## Database and local operation

The Auth and Request Services have separate MySQL schemas. Flyway manages the Request Service schema. The Compose MySQL init script creates both schemas on a fresh volume; it does not run on an existing MySQL volume, so existing databases must be backed up and the new schemas/grants created manually. The legacy local `northstar_requests` schema is not automatically altered or dropped.

Run local frontend tests/build with `npm test` and `npm run build`; run backend tests/build with `mvn -B verify`. Azure Pipelines executes those tests. Request Service tests cover JWT-required access, requester scoping, required form data, and state transitions; React tests cover conditional form validation and approval actions.

## Known scope limits

The following remain future work: ServiceNow request/incident/approval/task synchronization and inbound status sync; SCTASK assignment/fulfillment integration; RabbitMQ consumer; email/Teams notifications; dedicated SLA, Reporting, and Approval services; corporate SSO, MFA, email verification, password recovery and login throttling; per-user catalog entitlements; production Azure deployment, ACR/AKS rollout, and Azure Monitor setup; cross-service distributed tracing/log shipping; extensive integration/load testing and security scans. Do not treat the current local implementation as production-ready without the listed controls and an environment-specific security review.

## Platform versions

The backend reactor targets Java 25 and Spring Boot 4.1.1 with Spring Cloud 2025.1.4. These versions are pinned in the parent `backend/pom.xml`.
