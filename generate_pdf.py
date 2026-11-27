# generate_pdf.py
import os
import subprocess
import time

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Northstar ITSM Platform - Technical Architecture & Viva Reference</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({
    startOnLoad: true,
    theme: 'neutral',
    fontFamily: 'Segoe UI, Arial, sans-serif'
  });
</script>
<style>
  @page {
    size: A4;
    margin: 1.6cm 1.4cm;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.55;
    font-size: 10pt;
    margin: 0;
    padding: 0;
  }

  h1, h2, h3, h4 {
    color: #0f172a;
    font-weight: 700;
  }

  h1 { font-size: 20pt; margin-top: 0; margin-bottom: 8pt; color: #1e3a8a; }
  h2 { font-size: 14pt; margin-top: 18pt; margin-bottom: 6pt; border-bottom: 1.5pt solid #e2e8f0; padding-bottom: 4pt; color: #1e3a8a; }
  h3 { font-size: 11.5pt; margin-top: 12pt; margin-bottom: 4pt; color: #0f766e; }
  h4 { font-size: 10pt; margin-top: 8pt; margin-bottom: 3pt; color: #334155; }

  p { margin-top: 0; margin-bottom: 7pt; }

  .page-break {
    page-break-after: always;
  }

  .avoid-break {
    page-break-inside: avoid;
  }

  /* Cover Page */
  .cover-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    height: 85vh;
    padding: 2cm 1cm;
  }

  .cover-badge {
    background: #e0e7ff;
    color: #3730a3;
    padding: 4px 14px;
    border-radius: 9999px;
    font-size: 9pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 14pt;
  }

  .cover-title {
    font-size: 26pt;
    font-weight: 800;
    color: #1e3a8a;
    line-height: 1.2;
    margin-bottom: 10pt;
  }

  .cover-subtitle {
    font-size: 13pt;
    color: #475569;
    max-width: 600px;
    margin-bottom: 30pt;
  }

  .cover-meta {
    background: #f8fafc;
    border: 1pt solid #cbd5e1;
    border-radius: 8pt;
    padding: 16pt 24pt;
    text-align: left;
    width: 80%;
    max-width: 450px;
    font-size: 9.5pt;
  }

  .cover-meta table {
    width: 100%;
    border-collapse: collapse;
  }

  .cover-meta td {
    padding: 4pt 0;
    border: none;
  }

  .cover-meta td.label {
    font-weight: 700;
    color: #475569;
    width: 40%;
  }

  .cover-meta td.val {
    color: #0f172a;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6pt;
    margin-bottom: 12pt;
    font-size: 8.5pt;
  }

  th, td {
    padding: 5.5pt 7pt;
    border: 0.75pt solid #cbd5e1;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #1e293b;
    color: #ffffff;
    font-weight: 600;
    font-size: 8.5pt;
  }

  tr:nth-child(even) {
    background: #f8fafc;
  }

  /* Code & Badges */
  code {
    font-family: "Consolas", "Courier New", monospace;
    font-size: 8.5pt;
    background: #f1f5f9;
    color: #0f172a;
    padding: 1.5pt 4pt;
    border-radius: 3pt;
  }

  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 8pt 10pt;
    border-radius: 5pt;
    font-family: "Consolas", "Courier New", monospace;
    font-size: 8.5pt;
    overflow-x: auto;
    margin-top: 4pt;
    margin-bottom: 8pt;
  }

  .badge {
    display: inline-block;
    padding: 1.5pt 4pt;
    border-radius: 3pt;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    font-family: "Consolas", monospace;
  }
  .badge-get { background: #dbeafe; color: #1e40af; }
  .badge-post { background: #dcfce7; color: #166534; }
  .badge-put { background: #fef3c7; color: #92400e; }
  .badge-patch { background: #ffedd5; color: #9a3412; }
  .badge-del { background: #fee2e2; color: #991b1b; }

  /* Diagram Box */
  .diagram-box {
    background: #ffffff;
    border: 1pt solid #cbd5e1;
    border-radius: 6pt;
    padding: 10pt;
    margin: 8pt 0 14pt 0;
    text-align: center;
  }

  .callout {
    background: #eff6ff;
    border-left: 3pt solid #2563eb;
    padding: 6pt 10pt;
    border-radius: 0 4pt 4pt 0;
    margin: 8pt 0;
    font-size: 9pt;
  }

  .callout-title {
    font-weight: 700;
    color: #1e40af;
    margin-bottom: 2pt;
  }

  .qa-card {
    background: #ffffff;
    border: 1pt solid #e2e8f0;
    border-radius: 5pt;
    padding: 8pt 10pt;
    margin-bottom: 8pt;
    border-left: 3.5pt solid #0f766e;
  }

  .qa-q {
    font-weight: 700;
    color: #0f766e;
    font-size: 9.5pt;
    margin-bottom: 4pt;
  }

  .qa-a {
    color: #334155;
    font-size: 9pt;
    margin-bottom: 0;
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover-page page-break">
  <div class="cover-badge">Academic Project Documentation</div>
  <div class="cover-title">Northstar ITSM Platform</div>
  <div class="cover-subtitle">Enterprise Microservices Architecture, REST Endpoints, Design Patterns & ITIL v4 Workflow Technical Reference</div>
  
  <div class="cover-meta">
    <table>
      <tr><td class="label">Project Title:</td><td class="val">Northstar IT Service Management Platform</td></tr>
      <tr><td class="label">Architecture:</td><td class="val">Microservices Architecture (Spring Boot & Cloud)</td></tr>
      <tr><td class="label">Backend Stack:</td><td class="val">Java 21/25, Spring Boot 3/4, Spring Cloud, JPA</td></tr>
      <tr><td class="label">Frontend Stack:</td><td class="val">React 19, TypeScript, Vite, Tailwind CSS</td></tr>
      <tr><td class="label">Middleware:</td><td class="val">MySQL 8.0, Redis 7.2, RabbitMQ 3.13, Eureka</td></tr>
      <tr><td class="label">Orchestration:</td><td class="val">Docker Compose (12 Isolated Containers)</td></tr>
      <tr><td class="label">Document Purpose:</td><td class="val">Lecturer Viva Defense & Technical Evaluation</td></tr>
      <tr><td class="label">Date / Version:</td><td class="val">November 2026 | Version 1.0 (Production)</td></tr>
    </table>
  </div>
</div>

<!-- SECTION 1 -->
<h2>1. Executive Architecture Overview</h2>
<p>The Northstar ITSM Platform implements an event-driven, polyglot persistence microservices architecture adhering to ITIL v4 standards. All incoming HTTP traffic passes through an Nginx reverse proxy to a centralized Spring Cloud API Gateway, which performs JWT validation and dynamically discovers downstream services via Netflix Eureka.</p>

<div class="diagram-box avoid-break">
  <div class="mermaid">
flowchart TD
    subgraph Client["Ingress Layer"]
        Browser["React 19 Frontend (:3001)"]
        Nginx["Nginx Reverse Proxy (:80)"]
        Browser --> Nginx
    end

    subgraph CoreGateway["Gateway & Discovery"]
        GW["Spring Cloud Gateway (:8080)"]
        Eureka["Netflix Eureka Server (:8761)"]
        Nginx -->|/api/*| GW
        GW <-->|Service Lookup| Eureka
    end

    subgraph Services["Core Microservices Layer"]
        Auth["Auth Service (:8088)"]
        Catalog["Catalog Service (:8081)"]
        Request["Request Service (:8082)"]
        Incident["Incident Service (:8087)"]
        Problem["Problem Service (:8089)"]
        Change["Change Service (:8091)"]
    end

    subgraph Storage["Data & Event Infrastructure"]
        MySQL[("MySQL 8.0<br/>5 Isolated DBs")]
        Redis[("Redis 7.2 Cache")]
        RabbitMQ[("RabbitMQ 3.13 Broker")]
    end

    GW --> Auth
    GW --> Catalog
    GW --> Request
    GW --> Incident
    GW --> Problem
    GW --> Change

    Auth <--> MySQL
    Request <--> MySQL
    Incident <--> MySQL
    Problem <--> MySQL
    Change <--> MySQL

    Catalog <--> Redis
    Request --> RabbitMQ
  </div>
</div>

<div class="avoid-break">
<h3>Infrastructure & Port Topology</h3>
<table>
  <thead>
    <tr>
      <th>Container Name</th>
      <th>Service Description</th>
      <th>Internal Port</th>
      <th>Host Port</th>
      <th>Persistence / Dependency</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><code>itsm-frontend</code></td><td>React 19 Single Page Application</td><td>80</td><td><strong>3001</strong></td><td>Proxies /api/* to Gateway</td></tr>
    <tr><td><code>itsm-api-gateway</code></td><td>Spring Cloud Gateway (WebFlux / Netty)</td><td>8080</td><td><strong>7777</strong></td><td>Eureka, JWT Verification</td></tr>
    <tr><td><code>itsm-service-registry</code></td><td>Netflix Eureka Discovery Server</td><td>8761</td><td><strong>8762</strong></td><td>In-memory registry</td></tr>
    <tr><td><code>itsm-auth-service</code></td><td>Authentication & RBAC User Management</td><td>8088</td><td><strong>8088</strong></td><td>MySQL (<code>northstar_auth</code>)</td></tr>
    <tr><td><code>itsm-catalog-service</code></td><td>Service Catalog & Dynamic Form Schemas</td><td>8081</td><td><strong>18081</strong></td><td>Redis 7.2 (5-min cache TTL)</td></tr>
    <tr><td><code>itsm-request-service</code></td><td>Service Requests & Approvals Engine</td><td>8082</td><td><strong>18082</strong></td><td>MySQL (<code>northstar_request_service</code>) & RabbitMQ</td></tr>
    <tr><td><code>itsm-incident-service</code></td><td>Incident Management & SLA Tracking</td><td>8087</td><td><strong>8087</strong></td><td>MySQL (<code>northstar_incident_service</code>)</td></tr>
    <tr><td><code>itsm-problem-service</code></td><td>Problem Management & Known Errors</td><td>8089</td><td><strong>8089</strong></td><td>MySQL (<code>problem_db</code>)</td></tr>
    <tr><td><code>itsm-change-service</code></td><td>Change Management & CAB Workflows</td><td>8091</td><td><strong>8091</strong></td><td>MySQL (<code>change_management</code>)</td></tr>
    <tr><td><code>itsm-mysql</code></td><td>MySQL 8.0 Community Database Server</td><td>3306</td><td><strong>3307</strong></td><td>Named Volume (<code>mysql-data</code>)</td></tr>
    <tr><td><code>itsm-redis</code></td><td>Redis 7.2 Cache Instance</td><td>6379</td><td><strong>6380</strong></td><td>Named Volume (<code>redis-data</code>)</td></tr>
    <tr><td><code>itsm-rabbitmq</code></td><td>RabbitMQ 3.13 Message Broker</td><td>5672 / 15672</td><td><strong>5673 / 15673</strong></td><td>Named Volume (<code>rabbitmq-data</code>)</td></tr>
  </tbody>
</table>
</div>

<div class="page-break"></div>

<!-- SECTION 2 -->
<h2>2. Microservice Component Directory & Endpoints</h2>

<!-- AUTH SERVICE -->
<div class="avoid-break">
<h3>2.1 Authentication Service (`auth-service`)</h3>
<p><strong>Database:</strong> <code>northstar_auth</code> | <strong>Port:</strong> 8088 | <strong>Role:</strong> Issues HMAC-SHA256 JWT tokens, performs BCrypt password hashing, and manages employee roles and departmental access.</p>

<p><strong>Key Source Files:</strong></p>
<ul>
  <li><strong>Controllers:</strong> <code>AuthController.java</code>, <code>AdminUsersController.java</code></li>
  <li><strong>Services:</strong> <code>AuthService.java</code>, <code>BootstrapAdmin.java</code></li>
  <li><strong>Repository (DAO):</strong> <code>PortalUserRepository.java</code></li>
  <li><strong>Entities:</strong> <code>PortalUser.java</code>, <code>PortalRole.java</code>, <code>EmployeeDepartment.java</code></li>
  <li><strong>DTOs:</strong> <code>AuthModels.java</code> (<code>LoginInput</code>, <code>RegisterInput</code>, <code>TokenResponse</code>, <code>UserSummary</code>, <code>AdminUserCreateInput</code>)</li>
</ul>

<table>
  <thead>
    <tr><th>Method</th><th>Endpoint</th><th>Role</th><th>Payload / Query</th><th>Response</th></tr>
  </thead>
  <tbody>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/auth/login</code></td><td>Public</td><td><code>{ email, password }</code></td><td>200 OK: <code>{ accessToken, user }</code></td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/auth/register</code></td><td>Public</td><td><code>{ fullName, email, password }</code></td><td>201 Created</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/auth/me</code></td><td>Authenticated</td><td>None</td><td>200 OK: Current user profile</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/auth/admin/users</code></td><td><code>MANAGER_ADMIN</code></td><td>None</td><td>200 OK: List of all users</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/auth/admin/users</code></td><td><code>MANAGER_ADMIN</code></td><td><code>{ fullName, email, temporaryPassword, role, department }</code></td><td>201 Created: UserSummary</td></tr>
    <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/auth/admin/users/{id}/role</code></td><td><code>MANAGER_ADMIN</code></td><td><code>{ role }</code></td><td>200 OK: Updated UserSummary</td></tr>
    <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/auth/admin/users/{id}/access</code></td><td><code>MANAGER_ADMIN</code></td><td><code>{ role, department }</code></td><td>200 OK: Updated UserSummary</td></tr>
  </tbody>
</table>
</div>

<!-- CATALOG SERVICE -->
<div class="avoid-break">
<h3>2.2 Service Catalog Service (`catalog-service`)</h3>
<p><strong>Storage:</strong> Redis 7.2 (5-min TTL) | <strong>Port:</strong> 8081 | <strong>Role:</strong> Serves dynamic service catalog categories, items, and form field specifications. Features resilient fallback when external integrations are unreachable.</p>

<p><strong>Key Source Files:</strong></p>
<ul>
  <li><strong>Controller:</strong> <code>CatalogController.java</code></li>
  <li><strong>Integration Client:</strong> <code>ServiceNowCatalogClient.java</code></li>
  <li><strong>DTOs:</strong> <code>CatalogResponse.java</code>, <code>CategoryDto.java</code>, <code>FormDefinitionDto.java</code></li>
</ul>

<table>
  <thead>
    <tr><th>Method</th><th>Endpoint</th><th>Role</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/catalog/categories</code></td><td>Authenticated</td><td>Returns list of categories (IT, Facilities, HR)</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/catalog/items</code></td><td>Authenticated</td><td>Returns catalog items with 5-minute Redis caching</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/catalog/items/{id}</code></td><td>Authenticated</td><td>Retrieves metadata for a specific item</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/catalog/items/{id}/form-definition</code></td><td>Authenticated</td><td>Returns dynamic JSON form fields and validation rules</td></tr>
  </tbody>
</table>
</div>

<!-- REQUEST SERVICE -->
<div class="avoid-break">
<h3>2.3 Request & Approval Service (`request-service`)</h3>
<p><strong>Database:</strong> <code>northstar_request_service</code> | <strong>Port:</strong> 8082 | <strong>Role:</strong> Manages service requests, manager approvals, state machine transitions, and asynchronous event publishing via the Transactional Outbox Pattern.</p>

<p><strong>Key Source Files:</strong></p>
<ul>
  <li><strong>Controllers:</strong> <code>RequestController.java</code>, <code>ApprovalsController.java</code>, <code>ApiErrorHandler.java</code></li>
  <li><strong>Services:</strong> <code>LocalRequestService.java</code>, <code>LocalApprovalService.java</code>, <code>RequestStateMachine.java</code>, <code>RequestSubmissionService.java</code>, <code>OutboxRelay.java</code></li>
  <li><strong>Repositories (DAO):</strong> <code>ServiceRequestRepository.java</code>, <code>ApprovalRepository.java</code>, <code>OutboxMessageRepository.java</code>, <code>RequestHistoryRepository.java</code></li>
  <li><strong>Entities:</strong> <code>ServiceRequestEntity.java</code>, <code>ApprovalEntity.java</code>, <code>OutboxMessageEntity.java</code>, <code>RequestHistoryEntity.java</code></li>
  <li><strong>DTOs:</strong> <code>RequestSubmission.java</code>, <code>RequestDetailsResponse.java</code>, <code>ApprovalResponse.java</code>, <code>DecisionInput.java</code></li>
</ul>

<table>
  <thead>
    <tr><th>Method</th><th>Endpoint</th><th>Role</th><th>Headers / Body</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/requests?page=0&size=20</code></td><td>Authenticated</td><td>None</td><td>Paginated request list (Users see own; Managers see all)</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/requests</code></td><td>Authenticated</td><td>Header: <code>Idempotency-Key</code><br/>Body: <code>RequestSubmission</code></td><td>Submits request; creates approval record atomically</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/requests/{id}</code></td><td>Authenticated</td><td>None</td><td>Full request record with dynamic form answers</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/requests/{id}/history</code></td><td>Authenticated</td><td>None</td><td>Immutable audit trail of request status transitions</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/requests/{id}/cancel</code></td><td>Requester / Admin</td><td>None</td><td>Cancels active pending request</td></tr>
    <tr><td><span class="badge badge-patch">PATCH</span></td><td><code>/api/requests/{id}/status</code></td><td><code>MANAGER_ADMIN</code></td><td><code>{ status }</code></td><td>Manual status transition via RequestStateMachine</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/approvals/pending</code></td><td>Authenticated</td><td>None</td><td>Approvals pending current user's decision</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/approvals/{id}/approve</code></td><td>Approver / Admin</td><td><code>{ comment }</code></td><td>Approves request; transitions request to APPROVED</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/approvals/{id}/reject</code></td><td>Approver / Admin</td><td><code>{ comment }</code></td><td>Rejects request with mandatory explanation</td></tr>
  </tbody>
</table>
</div>

<div class="page-break"></div>

<!-- INCIDENT SERVICE -->
<div class="avoid-break">
<h3>2.4 Incident Management Service (`incident-service`)</h3>
<p><strong>Database:</strong> <code>northstar_incident_service</code> | <strong>Port:</strong> 8087 | <strong>Role:</strong> Full ITIL incident tracking, P1–P4 priority calculation from Impact and Urgency, engineer assignment, and work note comment logging.</p>

<p><strong>Key Source Files:</strong></p>
<ul>
  <li><strong>Controller:</strong> <code>IncidentsController.java</code></li>
  <li><strong>Service:</strong> <code>LocalIncidentService.java</code></li>
  <li><strong>Repositories (DAO):</strong> <code>IncidentRepository.java</code>, <code>IncidentCommentRepository.java</code></li>
  <li><strong>Entities:</strong> <code>IncidentEntity.java</code>, <code>IncidentCommentEntity.java</code></li>
  <li><strong>DTOs:</strong> <code>IncidentInput.java</code>, <code>IncidentResponse.java</code>, <code>IncidentDetailResponse.java</code>, <code>IncidentStatusInput.java</code>, <code>IncidentCommentInput.java</code></li>
</ul>

<table>
  <thead>
    <tr><th>Method</th><th>Endpoint</th><th>Role</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/incidents</code></td><td>Authenticated</td><td>Lists incidents according to user's organizational scope</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/incidents</code></td><td>Authenticated</td><td>Logs new incident; generates <code>INC001XXXX</code> number</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/incidents/{id}</code></td><td>Authenticated</td><td>Retrieves incident details with complete comment history</td></tr>
    <tr><td><span class="badge badge-patch">PATCH</span></td><td><code>/api/incidents/{id}/status</code></td><td>Support / Admin</td><td>Updates lifecycle state (<code>NEW</code>, <code>IN_PROGRESS</code>, <code>RESOLVED</code>, <code>CLOSED</code>)</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/incidents/{id}/comments</code></td><td>Authenticated</td><td>Appends work note or customer update to incident thread</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/incidents/next-number</code></td><td>Authenticated</td><td>Pre-generates next sequence number for UI modal</td></tr>
  </tbody>
</table>
</div>

<!-- PROBLEM SERVICE -->
<div class="avoid-break">
<h3>2.5 Problem Management Service (`problem-service`)</h3>
<p><strong>Database:</strong> <code>problem_db</code> | <strong>Port:</strong> 8089 | <strong>Role:</strong> Manages root cause analysis (RCA), documents temporary workarounds for active incidents, and tracks Known Error records (<code>KE-YYYY-XXX</code>).</p>

<p><strong>Key Source Files:</strong></p>
<ul>
  <li><strong>Controller:</strong> <code>ProblemController.java</code></li>
  <li><strong>Service:</strong> <code>ProblemService.java</code></li>
  <li><strong>Repository (DAO):</strong> <code>ProblemRepository.java</code></li>
  <li><strong>Entity:</strong> <code>Problem.java</code></li>
  <li><strong>Security:</strong> <code>JwtAuthenticationFilter.java</code>, <code>JwtService.java</code></li>
</ul>

<table>
  <thead>
    <tr><th>Method</th><th>Endpoint</th><th>Role</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/problems</code></td><td>Authenticated</td><td>Lists all registered problem investigations</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/problems</code></td><td>Authenticated</td><td>Registers new problem ticket (<code>PRBXXXXXXX</code>)</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/problems/{id}</code></td><td>Authenticated</td><td>Returns problem details including root cause and workaround</td></tr>
    <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/problems/{id}/management</code></td><td>Lead Analyst</td><td>Assigns Analyst, Engineer, Category, and Priority</td></tr>
    <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/problems/{id}/investigation</code></td><td>Assigned Analyst</td><td>Records Investigation Notes, Root Cause, and Known Error ID</td></tr>
    <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/problems/{id}/technical-work</code></td><td>Assigned Engineer</td><td>Submits technical notes and definitive resolution</td></tr>
    <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/problems/{id}/status</code></td><td>Lead Analyst / Admin</td><td>Updates status (<code>OPEN</code>, <code>INVESTIGATION</code>, <code>RESOLVED</code>, <code>CLOSED</code>)</td></tr>
  </tbody>
</table>
</div>

<!-- CHANGE SERVICE -->
<div class="avoid-break">
<h3>2.6 Change Management & CAB Service (`change-service`)</h3>
<p><strong>Database:</strong> <code>change_management</code> | <strong>Port:</strong> 8091 | <strong>Role:</strong> Governs ITIL Change Control (Standard, Normal, Emergency), CAB meetings, risk assessments, maintenance scheduling, and automated rollback triggers.</p>

<p><strong>Key Source Files:</strong></p>
<ul>
  <li><strong>Controllers:</strong> <code>ChangeController.java</code>, <code>CustomizationController.java</code></li>
  <li><strong>Service:</strong> <code>ChangeService.java</code></li>
  <li><strong>Repositories (DAO):</strong> <code>ChangeRequestRepository.java</code>, <code>ChangeHistoryRepository.java</code>, <code>ConfigRecordRepository.java</code></li>
  <li><strong>Entities & Enums:</strong> <code>ChangeRequest.java</code>, <code>ChangeHistory.java</code>, <code>ConfigRecord.java</code>, <code>ChangeStatus.java</code>, <code>ChangeType.java</code>, <code>RiskLevel.java</code></li>
  <li><strong>DTOs:</strong> <code>CreateChangeRequestDTO.java</code>, <code>AssignChangeDTO.java</code>, <code>ChangeAssessmentDTO.java</code>, <code>ChangeReviewDTO.java</code>, <code>ChangeScheduleDTO.java</code>, <code>ChangeImplementationDTO.java</code>, <code>ChangeTestResultDTO.java</code>, <code>ChangeRollbackDTO.java</code>, <code>ChangeClosureDTO.java</code>, <code>CABMeetingDTO.java</code></li>
</ul>

<table>
  <thead>
    <tr><th>Method</th><th>Endpoint</th><th>Lifecycle Action</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/changes</code></td><td>Read</td><td>Search and filter changes by status, type, keyword</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/changes/dashboard/summary</code></td><td>Metrics</td><td>Total count grouped by status, type, and risk level</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes</code></td><td>$\rightarrow$ <code>DRAFT</code></td><td>Creates change request with plans and risk levels</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes/{id}/submit</code></td><td>$\rightarrow$ <code>SUBMITTED</code></td><td>Submits draft for formal change assessment</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes/{id}/start-assessment</code></td><td>$\rightarrow$ <code>ASSESSMENT</code></td><td>Analyst commences impact and blast radius assessment</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes/{id}/assign</code></td><td>Assignment</td><td>Assigns technical team, implementation team, CAB manager</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes/{id}/assess</code></td><td>$\rightarrow$ <code>UNDER_REVIEW</code></td><td>Records technical risk assessment and mitigation plan</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes/{id}/review</code></td><td>$\rightarrow$ <code>PENDING_APPROVAL</code></td><td>Peer technical review approval for CAB submission</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes/{id}/approve</code></td><td>$\rightarrow$ <code>APPROVED</code></td><td>CAB manager formal approval</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes/{id}/schedule</code></td><td>$\rightarrow$ <code>SCHEDULED</code></td><td>Locks planned start/end maintenance window dates</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes/{id}/start-implementation</code></td><td>$\rightarrow$ <code>IN_PROGRESS</code></td><td>Marks start of production rollout</td></tr>
    <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/changes/{id}/implementation-progress</code></td><td>In-Flight Progress</td><td>Updates real-time progress (0% to 100%) and notes</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes/{id}/complete-implementation</code></td><td>$\rightarrow$ <code>IMPLEMENTED</code></td><td>Signals deployment finished (triggers rollback if failed)</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes/{id}/test-results</code></td><td>$\rightarrow$ <code>VALIDATED</code></td><td>Records smoke and regression testing outcome</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes/{id}/rollback</code></td><td>$\rightarrow$ <code>ROLLBACK_IN_PROGRESS</code></td><td>Initiates backout procedure on test failure</td></tr>
    <tr><td><span class="badge badge-put">PUT</span></td><td><code>/api/changes/{id}/rollback/complete</code></td><td>$\rightarrow$ <code>ROLLED_BACK</code></td><td>Confirms system restored to prior state</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/changes/{id}/close</code></td><td>$\rightarrow$ <code>CLOSED</code></td><td>Final post-implementation review (PIR) and closure</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/changes/{id}/history</code></td><td>Audit</td><td>Immutable historical log of every state transition</td></tr>
    <tr><td><span class="badge badge-post">POST</span></td><td><code>/api/cab/meetings</code></td><td>CAB Meeting</td><td>Schedules Change Advisory Board agenda session</td></tr>
    <tr><td><span class="badge badge-get">GET</span></td><td><code>/api/cab/meetings</code></td><td>CAB Agenda</td><td>Lists scheduled CAB meetings and change agenda items</td></tr>
  </tbody>
</table>
</div>

<div class="page-break"></div>

<!-- SECTION 3 -->
<h2>3. Core ITIL Technical Flows Explained</h2>

<!-- FLOW: AUTH -->
<div class="avoid-break">
<h3>Flow 1: Authentication & Authorization Flow</h3>
<p>All authentication is stateless using signed JSON Web Tokens (JWT). Client requests never reach domain microservices without edge validation.</p>

<div class="diagram-box">
  <div class="mermaid">
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Nginx as Nginx Proxy (:3001)
    participant GW as API Gateway (:8080)
    participant Auth as Auth Service (:8088)
    participant DB as MySQL (northstar_auth)

    User->>Nginx: POST /api/auth/login {email, password}
    Nginx->>GW: Proxy to Gateway
    GW->>Auth: Forward to lb://AUTH-SERVICE
    Auth->>DB: findByEmail(email)
    DB-->>Auth: User record (BCrypt hash)
    Auth->>Auth: passwordEncoder.matches(password, hash)
    Auth->>Auth: Create JWT (Subject: userId, Roles: [MANAGER_ADMIN])
    Auth-->>GW: 200 OK {accessToken, user}
    GW-->>Nginx: 200 OK
    Nginx-->>User: 200 OK (JWT stored in client memory)
  </div>
</div>
</div>

<!-- FLOW: REQUEST OUTBOX -->
<div class="avoid-break">
<h3>Flow 2: Service Request Submission & Transactional Outbox Pattern</h3>
<p>To avoid distributed transaction failure between MySQL and RabbitMQ, the <code>request-service</code> implements the <strong>Transactional Outbox Pattern</strong>.</p>

<div class="diagram-box">
  <div class="mermaid">
sequenceDiagram
    autonumber
    actor Client as Employee Requester
    participant RS as Request Service (:8082)
    participant DB as MySQL (northstar_request_service)
    participant Relay as OutboxRelay (@Scheduled)
    participant MQ as RabbitMQ Broker (:5672)

    Client->>RS: POST /api/requests (Header: Idempotency-Key)
    RS->>RS: RequestStateMachine.require(DRAFT, PENDING_APPROVAL)
    
    critical Atomic Database Transaction
        RS->>DB: INSERT INTO service_requests (status: PENDING_APPROVAL)
        RS->>DB: INSERT INTO approvals (decision: PENDING)
        RS->>DB: INSERT INTO outbox_messages (payload: event_data)
    end

    RS-->>Client: 202 ACCEPTED (RequestNumber: NSR-20261124-XXXX)

    loop Polling Every 1000ms
        Relay->>DB: SELECT * FROM outbox_messages WHERE published_at IS NULL
        Relay->>MQ: rabbitTemplate.convertAndSend(exchange, routingKey, payload)
        Relay->>DB: UPDATE outbox_messages SET published_at = NOW()
    end
  </div>
</div>
</div>

<div class="page-break"></div>

<!-- FLOW: CHANGE STATE MACHINE -->
<div class="avoid-break">
<h3>Flow 3: Change Management 11-Step Finite State Machine</h3>
<p>Production changes strictly follow ITIL governance. The diagram below illustrates all permissible forward transitions, review gates, and emergency rollback paths enforced by <code>ChangeService.java</code>:</p>

<div class="diagram-box">
  <div class="mermaid">
stateDiagram-v2
    [*] --> DRAFT : POST /api/changes
    DRAFT --> SUBMITTED : submit()
    DRAFT --> CANCELLED : cancel()

    SUBMITTED --> ASSESSMENT : startAssessment()
    SUBMITTED --> CANCELLED : cancel()

    ASSESSMENT --> UNDER_REVIEW : assess() [Record Risk & Blast Radius]
    ASSESSMENT --> ON_HOLD

    UNDER_REVIEW --> PENDING_APPROVAL : review(decision=APPROVED)
    UNDER_REVIEW --> REJECTED : review(decision=REJECTED)

    PENDING_APPROVAL --> APPROVED : approve() [CAB Formal Signoff]
    PENDING_APPROVAL --> REJECTED : reject()

    APPROVED --> SCHEDULED : schedule() [Lock Maintenance Window]

    SCHEDULED --> IN_PROGRESS : startImplementation()

    IN_PROGRESS --> IMPLEMENTED : completeImplementation(outcome=SUCCESS)
    IN_PROGRESS --> ROLLBACK_IN_PROGRESS : completeImplementation(outcome=FAILED)

    IMPLEMENTED --> PENDING_VALIDATION : testResults()
    PENDING_VALIDATION --> VALIDATED : validationStatus=PASSED
    PENDING_VALIDATION --> ROLLBACK_IN_PROGRESS : validationStatus=FAILED

    ROLLBACK_IN_PROGRESS --> ROLLED_BACK : rollbackComplete()
    ROLLED_BACK --> CLOSED : close()

    VALIDATED --> CLOSED : close() [PIR Review & Final Signoff]
    CLOSED --> [*]
  </div>
</div>
</div>

<!-- SECTION 4 -->
<div class="avoid-break">
<h2>4. Key Software Architecture Patterns Implemented</h2>

<div class="callout">
  <div class="callout-title">1. Database-Per-Service Pattern</div>
  Each microservice owns its own isolated schema (<code>northstar_auth</code>, <code>northstar_request_service</code>, <code>northstar_incident_service</code>, <code>problem_db</code>, <code>change_management</code>). No cross-service SQL joins exist. Services communicate solely via REST APIs and RabbitMQ events.
</div>

<div class="callout">
  <div class="callout-title">2. Transactional Outbox Pattern</div>
  Guarantees dual-write consistency between relational databases and RabbitMQ. Business entity mutations and the outbox event are saved in a single ACID transaction. The <code>OutboxRelay</code> asynchronously polls and guarantees at-least-once message delivery with dead-letter queueing.
</div>

<div class="callout">
  <div class="callout-title">3. API Gateway & Reverse Proxy Pattern</div>
  The client communicates exclusively with port 3001. Nginx passes API calls to the Spring Cloud Gateway. The Gateway extracts JWT tokens, validates claims, strips caller-supplied headers, and injects verified <code>X-Authenticated-User</code> and <code>X-Correlation-ID</code> downstream.
</div>

<div class="callout">
  <div class="callout-title">4. Finite State Machine (FSM) Pattern</div>
  Enforces business process integrity. <code>RequestStateMachine.java</code> and <code>ChangeService.java</code> evaluate state transition graphs and reject illegal workflow jumps with HTTP <code>409 Conflict</code>.
</div>

<div class="callout">
  <div class="callout-title">5. Cache-Aside Pattern with Resilient Fallback</div>
  In <code>catalog-service</code>, catalog responses are cached in Redis with a 5-minute TTL. If an external service integration fails or times out, the service catches the exception and serves cached data or a reliable local fallback.
</div>
</div>

<div class="page-break"></div>

<!-- SECTION 5 -->
<h2>5. Lecturer & Viva Defense Comprehensive Q&A</h2>
<p>Study these questions and answers to confidently explain your technical decisions during your project examination.</p>

<div class="qa-card avoid-break">
  <div class="qa-q">Q1: Why did you build an event-driven microservices architecture instead of a monolith?</div>
  <div class="qa-a">
    <strong>Answer:</strong> An ITSM platform has completely different performance profiles across its modules. Incident submission is high-volume and critical during outages; the Service Catalog is read-heavy and heavily cached; Change Management requires strict, multi-day state machine governance with audit logging. Microservices allow independent scaling, decoupled deployments, and fault isolation: if the Problem or Change service undergoes maintenance, Incident and Request processing remain fully operational.
  </div>
</div>

<div class="qa-card avoid-break">
  <div class="qa-q">Q2: How do you prevent the Distributed Dual-Write problem when saving to MySQL and publishing to RabbitMQ?</div>
  <div class="qa-a">
    <strong>Answer:</strong> In distributed systems, publishing to a message broker immediately after a database commit is vulnerable to failure: if the network or broker drops, the database is committed but the event is lost. We implemented the <strong>Transactional Outbox Pattern</strong> in <code>request-service</code>. The request entity and an outbox message record are inserted in the <em>same local ACID transaction</em>. An asynchronous <code>OutboxRelay</code> polls pending messages, sends them to RabbitMQ, and records the timestamp. A Dead Letter Exchange (DLX) catches messages exceeding 4 failed attempts.
  </div>
</div>

<div class="qa-card avoid-break">
  <div class="qa-q">Q3: How does the API Gateway route requests if microservice container IP addresses change dynamically?</div>
  <div class="qa-a">
    <strong>Answer:</strong> We use <strong>Netflix Eureka Service Registry</strong>. When each Spring Boot microservice boots, it registers with Eureka using its application name (e.g., <code>REQUEST-SERVICE</code>) and sends periodic 30-second heartbeats. Spring Cloud Gateway routes use the load-balanced URI syntax: <code>uri: lb://REQUEST-SERVICE</code>. When a request arrives, Spring Cloud LoadBalancer queries the Eureka cache for active instance IPs and routes the request without any hardcoded IP addresses.
  </div>
</div>

<div class="qa-card avoid-break">
  <div class="qa-q">Q4: How does authentication and identity propagation work across microservices?</div>
  <div class="qa-a">
    <strong>Answer:</strong> Authentication uses stateless <strong>JSON Web Tokens (JWT)</strong> signed with HMAC-SHA256. Upon successful login at <code>auth-service</code>, a token containing the user's UUID and roles is issued. At the edge, the API Gateway's <code>RequestIdentityFilter</code> validates the token signature and expiration. To prevent header spoofing from external clients, the Gateway explicitly strips any client-provided <code>X-Authenticated-User</code> and sets the verified JWT subject, along with an <code>X-Correlation-ID</code> UUID for end-to-end distributed tracing.
  </div>
</div>

<div class="qa-card avoid-break">
  <div class="qa-q">Q5: What is the purpose of the Idempotency-Key header on request creation?</div>
  <div class="qa-a">
    <strong>Answer:</strong> In web applications, users can accidentally double-click submit buttons, or network retries can send duplicate POST requests. By requiring an <code>Idempotency-Key</code> header (a UUID generated on the client), the backend checks if a transaction with that key has already been received within a deduplication window. If it has, it returns the existing response without creating duplicate database rows or duplicate approval tasks.
  </div>
</div>

<div class="qa-card avoid-break">
  <div class="qa-q">Q6: How do you enforce strict ITIL Change Control lifecycles in the backend?</div>
  <div class="qa-a">
    <strong>Answer:</strong> In <code>change-service</code>, <code>ChangeService.java</code> maintains an explicit <code>Map&lt;ChangeStatus, Set&lt;ChangeStatus&gt;&gt;</code> transition graph. When an API call is made (e.g., <code>POST /api/changes/{id}/approve</code>), the service verifies that the current status is strictly <code>PENDING_APPROVAL</code>. If an unapproved change attempts to jump straight to <code>IN_PROGRESS</code>, the service throws a custom <code>409 Conflict</code> exception. Every valid transition is logged to an immutable <code>ChangeHistory</code> audit table.
  </div>
</div>

<div class="qa-card avoid-break">
  <div class="qa-q">Q7: How did you handle CORS and host port collisions during deployment?</div>
  <div class="qa-a">
    <strong>Answer:</strong> On developer machines, standard ports like 8080, 8761, 3306, and 3000 are often occupied by host services or WSL relays. In our <code>docker-compose.yml</code>, we mapped host ports to conflict-free ports (Eureka to 8762, MySQL to 3307, Redis to 6380, RabbitMQ to 5673/15673, Frontend to 3001). Furthermore, all browser requests route through Nginx on port 3001, which proxies <code>/api/*</code> internally to <code>api-gateway:8080</code> on Docker's private bridge network (<code>itsm-network</code>), eliminating cross-origin CORS preflight overhead.
  </div>
</div>

<!-- SECTION 6 -->
<div class="avoid-break">
<h2>6. Live Demonstration Runbook</h2>
<p>Follow these exact steps to start, verify, and demonstrate the platform live to your lecturer:</p>

<ol>
  <li><strong>Launch all 12 containers:</strong>
    <pre>docker compose up -d</pre>
  </li>
  <li><strong>Verify container status and health:</strong>
    <pre>docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"</pre>
  </li>
  <li><strong>Populate realistic demo data across all modules:</strong>
    <pre>powershell -ExecutionPolicy Bypass -File .\seed-data.ps1</pre>
  </li>
  <li><strong>Open the live application interfaces:</strong>
    <ul>
      <li><strong>ITSM User Portal:</strong> <a href="http://localhost:3001">http://localhost:3001</a> (Login: <code>admin@northstar.local</code> / <code>NorthstarLocal2026!</code>)</li>
      <li><strong>Eureka Service Registry:</strong> <a href="http://localhost:8762">http://localhost:8762</a> (Displays all 7 registered microservices)</li>
      <li><strong>RabbitMQ Management:</strong> <a href="http://localhost:15673">http://localhost:15673</a> (Credentials: <code>northstar</code> / <code>northstar</code>)</li>
    </ul>
  </li>
</ol>
</div>

</body>
</html>
"""

temp_html = "D:\\capstone\\temp_presentation.html"
output_pdf_1 = "D:\\capstone\\ITSM_Project_Architecture_and_Flows.pdf"
output_pdf_2 = "C:\\Users\\asus\\.gemini\\antigravity\\brain\\f26b4760-6d4c-457c-81a4-c048530a1ee3\\ITSM_Project_Architecture_and_Flows.pdf"

with open(temp_html, "w", encoding="utf-8") as f:
    f.write(html_content)

edge_path = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
args = [
    edge_path,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--virtual-time-budget=6000",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={output_pdf_1}",
    f"file:///{temp_html.replace(os.sep, '/')}"
]

print("Compiling PDF with Microsoft Edge headless...")
result = subprocess.run(args, capture_output=True)

if os.path.exists(output_pdf_1):
    file_size = os.path.getsize(output_pdf_1)
    print(f"Success! PDF created at: {output_pdf_1} ({file_size} bytes)")
    
    # Copy to artifacts directory as well
    import shutil
    shutil.copyfile(output_pdf_1, output_pdf_2)
    print(f"Copied to artifact directory: {output_pdf_2}")
else:
    print("Error: PDF was not generated. Return code:", result.returncode)

if os.path.exists(temp_html):
    os.remove(temp_html)
