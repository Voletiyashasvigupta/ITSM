# Backend services

This Maven reactor contains Eureka discovery, the authentication service, Spring Cloud Gateway, the Redis-backed Catalog Service, the isolated ServiceNow integration boundary, and the first Request Management submission path.

## Start locally

From this directory, start each application in a separate terminal. For local
user-flow testing, enable impersonation in the Auth Service terminal before
starting it (the feature remains disabled by default):

```powershell
mvn -pl service-registry spring-boot:run
$env:PORTAL_IMPERSONATION_ENABLED = 'true'
mvn -pl auth-service spring-boot:run
mvn -pl servicenow-integration spring-boot:run
mvn -pl catalog-service spring-boot:run
mvn -pl request-service spring-boot:run
`$env:SPRING_PROFILES_ACTIVE='local'; mvn -pl api-gateway spring-boot:run`
```

The Auth Service and Request Service require MySQL; the Request Service also requires RabbitMQ. The Catalog Service requires Redis. The Gateway validates the HS256 JWTs issued by the Auth Service; set the same `JWT_SIGNING_SECRET`, `JWT_ISSUER_URI`, and `JWT_AUDIENCE` on both services.

The Eureka registry listens on container port `8761` (published to host port `8762`), Auth Service on `8084`, integration service on `8081`, Catalog Service on `8082`, Request Service on `8083`, and Gateway on `7777`. Check the registry at `http://localhost:8762` and the portal at `http://localhost:3001`. Auth endpoints are `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, and `/api/auth/admin/users`. Catalog entries are cached in Redis for five minutes. During an upstream outage the service returns the last cached data with `stale: true`; if there is no cache it returns an unavailable response.

The Request Service accepts `POST /api/requests` with an `Idempotency-Key` header, a trusted `X-Authenticated-User` header, and a body containing `serviceName`, `description`, and `requestedForId`. It saves the portal submission and an outbox event in the same MySQL transaction, then returns `202 Accepted` with `PENDING_SYNC`. Reusing the same key and same payload returns the existing request; reusing it for a different payload returns `409 Conflict`. The outbox relay publishes confirmed, durable messages to RabbitMQ and retries broker delivery up to four times with backoff before routing repeated failures to a dead-letter queue.

New portal accounts are stored inactive without a role. A Manager/Administrator must assign `EMPLOYEE` or `MANAGER_ADMIN` before the account can sign in. Manager and Administrator names map to the same combined role. Passwords are BCrypt-hashed; the Auth Service issues 60-minute HS256 tokens and supports authenticated password changes. This local username/password flow is not corporate SSO and has no email verification or password recovery yet.

Request submissions are routed through the Gateway and bound to the signed-in user's JWT subject. The outbox and queue still have no ServiceNow consumer, so accepted submissions remain pending in RabbitMQ until that consumer and employee-to-ServiceNow mapping are added. Do not use this path with real or confidential employee data.

The Gateway validates signature, issuer, audience, and expiry on every protected API call, including in local Compose. Tokens contain an array claim named `roles`; `MANAGER`, `ADMIN`, `ADMINISTRATOR`, and `MANAGER_ADMIN` all map to the same `ROLE_MANAGER_ADMIN` authority. The Gateway removes any incoming `X-Authenticated-User` header and forwards only the verified JWT subject. Login and registration are the only public API routes.

To launch the local stack with Docker Compose:

```powershell
cd D:\capstone\backend
Copy-Item .env.example .env
# Fill the authorized instance values in .env, if available.
docker compose up --build
```

Configure `SERVICENOW_BASE_URL`, `SERVICENOW_CLIENT_ID`, `SERVICENOW_CLIENT_SECRET`, and `SERVICENOW_TOKEN_URI` through environment variables or a secret store. Never put real credentials in `application.yml`. The current catalog endpoint does not yet filter by each employee's ServiceNow entitlement; keep the live endpoint restricted to development until SSO and entitlement checks are implemented.

For the Compose demo, the default bootstrap Manager + Administrator is `admin@northstar.local` with password `NorthstarAdmin!ChangeMe25`. Change it after first sign-in. For any shared environment, set unique `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, and a random `JWT_SIGNING_SECRET` (at least 32 bytes) in a secret store; never use the Compose defaults in production.

The status endpoint only validates configuration presence. The catalog endpoint uses OAuth client credentials and reads the ServiceNow catalog table through the integration layer. Access tokens are cached in service memory until shortly before expiry. Resilience4j retries transient failures up to three times after the initial attempt and opens a circuit breaker after repeated failures. The Request Service currently uses Hibernate `ddl-auto: update` for local development; production schema migrations, identity-to-ServiceNow user mapping, the ServiceNow queue consumer, per-user catalog entitlements, and remaining domain services are still pending.
