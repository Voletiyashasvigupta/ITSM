# seed-data.ps1: Seed rich, realistic ITSM demo data across all modules

$baseUrl = "http://127.0.0.1:3001"
$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ITSM Platform Demo Data Seeder" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Authenticate as Admin
Write-Host "`n[1/6] Authenticating as Admin..." -ForegroundColor Yellow
$loginPayload = @{
    email = "admin@northstar.local"
    password = "NorthstarLocal2026!"
} | ConvertTo-Json

try {
    $auth = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
    $token = $auth.accessToken
    $adminId = $auth.user.id
    Write-Host "  -> Logged in as: $($auth.user.email) (ID: $adminId)" -ForegroundColor Green
} catch {
    Write-Error "Failed to authenticate with admin credentials: $_"
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. Seed Users
Write-Host "`n[2/6] Seeding Users..." -ForegroundColor Yellow
$users = @(
    @{ fullName = "Alex Rivera"; email = "alex.rivera@northstar.local"; role = "MANAGER_ADMIN"; department = "SOFTWARE_ENGINEERING" },
    @{ fullName = "Sarah Jenkins"; email = "sarah.jenkins@northstar.local"; role = "MANAGER_ADMIN"; department = "IT" },
    @{ fullName = "Elena Rostova"; email = "elena.rostova@northstar.local"; role = "EMPLOYEE"; department = "CUSTOMER_SUPPORT" },
    @{ fullName = "David Kim"; email = "david.kim@northstar.local"; role = "EMPLOYEE"; department = "FINANCE" },
    @{ fullName = "Priya Patel"; email = "priya.patel@northstar.local"; role = "EMPLOYEE"; department = "HUMAN_RESOURCES" },
    @{ fullName = "Marcus Vance"; email = "marcus.vance@northstar.local"; role = "EMPLOYEE"; department = "OPERATIONS" }
)

foreach ($u in $users) {
    try {
        $body = @{
            fullName = $u.fullName
            email = $u.email
            temporaryPassword = "Password12345!"
            role = $u.role
            department = $u.department
        } | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$baseUrl/api/auth/admin/users" -Method Post -Headers $headers -Body $body
        Write-Host "  + Created user: $($u.fullName) ($($u.email)) [$($u.role)]" -ForegroundColor Green
    } catch {
        Write-Host "  . User already exists or active: $($u.email)" -ForegroundColor Gray
    }
}

# 3. Seed Service Requests & Approvals
Write-Host "`n[3/6] Seeding Service Requests & Approvals..." -ForegroundColor Yellow
$requests = @(
    @{
        serviceName = "Request a device"
        description = "MacBook Pro M3 Max 16-inch (36GB Unified Memory, 1TB SSD) for Elena Rostova."
        requestedFor = "elena.rostova@northstar.local"
        fields = @{
            item = "Laptop"
            workStyle = "Hybrid"
            location = "Austin Tech Center - Building B"
            neededBy = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
            reason = "Workstation replacement for customer support lead engineer."
        }
        action = "PENDING"
    },
    @{
        serviceName = "Access and accounts"
        description = "AWS Production ReadOnly IAM Role for David Kim."
        requestedFor = "david.kim@northstar.local"
        fields = @{
            accessType = "New access"
            application = "AWS Production Console"
            accessLevel = "Read only"
            duration = "Ongoing role requirement"
            reason = "Financial auditing and CloudWatch billing metric analytics."
        }
        action = "PENDING"
    },
    @{
        serviceName = "Access and accounts"
        description = "JetBrains All Products Pack Developer License for Alex Rivera."
        requestedFor = "alex.rivera@northstar.local"
        fields = @{
            accessType = "New access"
            application = "JetBrains Toolbox Enterprise"
            accessLevel = "Standard user"
            duration = "Ongoing role requirement"
            reason = "Primary IDE suite for microservice backend development."
        }
        action = "APPROVE"
        comment = "Approved as standard engineering toolset allocation."
    },
    @{
        serviceName = "Request a device"
        description = "Dual 4K Dell UltraSharp 27-inch Monitors and Thunderbolt 4 Dock."
        requestedFor = "priya.patel@northstar.local"
        fields = @{
            item = "Monitor"
            workStyle = "Office based"
            location = "New York HQ - Floor 12 (Desk 12-404)"
            neededBy = (Get-Date).AddDays(5).ToString("yyyy-MM-dd")
            reason = "Ergonomic dual screen setup for HR reporting and candidate interview screening."
        }
        action = "APPROVE"
        comment = "Facilities approved. Work order #NY-882 dispatched."
    },
    @{
        serviceName = "Access and accounts"
        description = "GlobalProtect VPN Dedicated 10Gbps Bypass Profile for Marcus Vance."
        requestedFor = "marcus.vance@northstar.local"
        fields = @{
            accessType = "Change existing access"
            application = "GlobalProtect VPN Gateway"
            accessLevel = "Contributor / editor"
            duration = "Temporary — up to 30 days"
            reason = "Requesting unlimited 10Gbps bypass tunnel for bulk video rendering sync."
        }
        action = "REJECT"
        comment = "Rejected. Bandwidth bypass requires VP approval. Please use standard 1Gbps profile."
    },
    @{
        serviceName = "Access and accounts"
        description = "Figma Enterprise Design Seat for Elena Rostova."
        requestedFor = "elena.rostova@northstar.local"
        fields = @{
            accessType = "New access"
            application = "Figma Enterprise Organization"
            accessLevel = "Contributor / editor"
            duration = "Ongoing role requirement"
            reason = "Collaborating with design team on customer portal service catalog redesign."
        }
        action = "APPROVE"
        comment = "License provisioned via Okta SAML auto-provisioning."
    }
)

foreach ($req in $requests) {
    try {
        $reqHeaders = @{
            Authorization = "Bearer $token"
            "Content-Type" = "application/json"
            "Idempotency-Key" = [System.Guid]::NewGuid().ToString()
        }
        $body = @{
            serviceName = $req.serviceName
            description = $req.description
            requestedForId = $req.requestedFor
            approverId = $adminId
            fields = $req.fields
        } | ConvertTo-Json

        $sub = Invoke-RestMethod -Uri "$baseUrl/api/requests" -Method Post -Headers $reqHeaders -Body $body
        Write-Host "  + Created request: $($sub.requestNumber) - $($sub.serviceName)" -ForegroundColor Green

        # Check if an approval was created and act on it
        Start-Sleep -Milliseconds 400
        $pendingApprovals = Invoke-RestMethod -Uri "$baseUrl/api/approvals/pending" -Headers $headers
        $match = $pendingApprovals | Where-Object { $_.requestId -eq $sub.id }

        if ($match) {
            if ($req.action -eq "APPROVE") {
                $decBody = @{ decision = "APPROVED"; approved = $true; comment = $req.comment } | ConvertTo-Json
                Invoke-RestMethod -Uri "$baseUrl/api/approvals/$($match.id)/approve" -Method Post -Headers $headers -Body $decBody | Out-Null
                Write-Host "    -> Approved request $($sub.requestNumber)" -ForegroundColor Cyan
            } elseif ($req.action -eq "REJECT") {
                $decBody = @{ decision = "REJECTED"; approved = $false; comment = $req.comment } | ConvertTo-Json
                Invoke-RestMethod -Uri "$baseUrl/api/approvals/$($match.id)/reject" -Method Post -Headers $headers -Body $decBody | Out-Null
                Write-Host "    -> Rejected request $($sub.requestNumber)" -ForegroundColor DarkYellow
            } else {
                Write-Host "    -> Kept pending for admin review in Approvals inbox" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Warning "  ! Failed to create request $($req.serviceName): $_"
    }
}

# 4. Seed Change Management Lifecycles
Write-Host "`n[4/6] Seeding Change Management Lifecycles..." -ForegroundColor Yellow
$now = Get-Date

$changes = @(
    @{
        shortDescription = "Upgrade Production Redis Cluster to v7.2.4 with tuned pool sizing"
        detailedDescription = "Apply security patch and increase connection limits on master-replica nodes to mitigate PRB3544289."
        requestedBy = "Alex Rivera"
        requesterEmail = "alex.rivera@northstar.local"
        department = "Infrastructure Engineering"
        changeType = "NORMAL"
        category = "DATABASE"
        priority = "HIGH"
        riskLevel = "MEDIUM"
        impact = "High availability failover during 5-minute rolling restart window"
        affectedCi = "prod-redis-cluster-us-east"
        businessJustification = "Resolves peak traffic checkout timeouts and patches CVE-2024-31449."
        implementationPlan = "1. Pre-warm replica nodes. 2. Failover master. 3. Upgrade primary. 4. Verify telemetry."
        rollbackPlan = "Demote upgraded node back to replica and revert client config."
        testPlan = "Run synthetic load test of 5000 req/sec in staging environment."
        plannedStartDate = $now.AddDays(2).ToString("yyyy-MM-ddTHH:mm:ss")
        plannedEndDate = $now.AddDays(2).AddHours(3).ToString("yyyy-MM-ddTHH:mm:ss")
        targetStatus = "SCHEDULED"
        changeAnalyst = "Sarah Jenkins"
        technicalTeam = "Database Reliability"
        implementationTeam = "Cloud Ops"
        changeManager = "Sarah Jenkins"
    },
    @{
        shortDescription = "Zero Trust Cloudflare Access Gateway rollout for corporate intranet"
        detailedDescription = "Transition VPN endpoints to Cloudflare Zero Trust WARP client with SAML/Okta device posture checks."
        requestedBy = "Sarah Jenkins"
        requesterEmail = "sarah.jenkins@northstar.local"
        department = "Security Operations"
        changeType = "NORMAL"
        category = "SECURITY"
        priority = "HIGH"
        riskLevel = "HIGH"
        impact = "Internal tool access will require WARP agent. Fallback VPN remains active for 14 days."
        affectedCi = "gw-access-prod-01"
        businessJustification = "SOC2 Type II compliance mandate and remote worker zero trust architecture."
        implementationPlan = "1. Deploy Cloudflare Access routes. 2. Enable mTLS certificate inspection. 3. Enable split-tunnel."
        rollbackPlan = "Disable Cloudflare Access DNS overrides and restore legacy VPN routing."
        testPlan = "Pilot test with 50 internal beta users completed with 100% success rate."
        plannedStartDate = $now.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ss")
        plannedEndDate = $now.AddDays(3).AddHours(6).ToString("yyyy-MM-ddTHH:mm:ss")
        targetStatus = "APPROVED"
        changeAnalyst = "Sarah Jenkins"
        technicalTeam = "SecOps"
        implementationTeam = "SecOps"
        changeManager = "Sarah Jenkins"
    },
    @{
        shortDescription = "Emergency hotfix for Kubernetes ingress controller OOMKill limits"
        detailedDescription = "Increase memory limit from 512Mi to 2048Mi on ingress-nginx-controller to stop crash loop."
        requestedBy = "Alex Rivera"
        requesterEmail = "alex.rivera@northstar.local"
        department = "Infrastructure"
        changeType = "EMERGENCY"
        category = "INFRASTRUCTURE"
        priority = "CRITICAL"
        riskLevel = "HIGH"
        impact = "Rolling restart of ingress pods. No customer-facing dropped connections."
        affectedCi = "k8s-prod-us-east-ingress"
        businessJustification = "Mitigate active P1 incident INC0010001 causing 502 Bad Gateway responses."
        implementationPlan = "kubectl set resources deployment/ingress-nginx-controller -n ingress-nginx --limits=memory=2Gi"
        rollbackPlan = "kubectl rollout undo deployment/ingress-nginx-controller -n ingress-nginx"
        testPlan = "Run healthcheck probe on ingress endpoint."
        plannedStartDate = $now.AddMinutes(5).ToString("yyyy-MM-ddTHH:mm:ss")
        plannedEndDate = $now.AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss")
        targetStatus = "IN_PROGRESS"
        changeAnalyst = "Sarah Jenkins"
        technicalTeam = "Cloud Ops"
        implementationTeam = "Cloud Ops"
        changeManager = "Sarah Jenkins"
    },
    @{
        shortDescription = "Migrate Billing Database Schema - Invoice Optimistic Locking"
        detailedDescription = "Add version BIGINT NOT NULL DEFAULT 0 column and index to customer_account and billing_invoice."
        requestedBy = "Alex Rivera"
        requesterEmail = "alex.rivera@northstar.local"
        department = "Software Engineering"
        changeType = "NORMAL"
        category = "DATABASE"
        priority = "HIGH"
        riskLevel = "MEDIUM"
        impact = "Zero downtime schema migration utilizing pt-online-schema-change."
        affectedCi = "prod-aurora-mysql-billing"
        businessJustification = "Permanently eliminates concurrent billing deadlock issues identified in PRB3553630."
        implementationPlan = "1. Run percona online schema change on replica. 2. Promote. 3. Deploy app release v2.4.1."
        rollbackPlan = "Deploy app v2.4.0 with backwards-compatible SQL."
        testPlan = "Passed 50,000 synthetic transaction deadlock test in staging."
        plannedStartDate = $now.AddDays(1).ToString("yyyy-MM-ddTHH:mm:ss")
        plannedEndDate = $now.AddDays(1).AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss")
        targetStatus = "VALIDATED"
        changeAnalyst = "Sarah Jenkins"
        technicalTeam = "Core Backend"
        implementationTeam = "Database Reliability"
        changeManager = "Sarah Jenkins"
    },
    @{
        shortDescription = "Routine monthly OS security patch cycle for Linux bastion hosts"
        detailedDescription = "Apply Ubuntu 24.04 LTS security updates including OpenSSL, systemd, and Linux kernel 6.8."
        requestedBy = "Marcus Vance"
        requesterEmail = "marcus.vance@northstar.local"
        department = "Operations"
        changeType = "STANDARD"
        category = "INFRASTRUCTURE"
        priority = "LOW"
        riskLevel = "LOW"
        impact = "Redundant bastion host handles active SSH sessions while secondary node is patched and rebooted."
        affectedCi = "bastion-us-east-01/02"
        businessJustification = "Standard monthly compliance and vulnerability mitigation SLA."
        implementationPlan = "Automated Ansible playbook patch-and-reboot.yml."
        rollbackPlan = "Restore EBS snapshot taken prior to patching."
        testPlan = "Verify SSH authentication, Duo MFA prompt, and bastion audit log forwarding."
        plannedStartDate = $now.AddDays(1).ToString("yyyy-MM-ddTHH:mm:ss")
        plannedEndDate = $now.AddDays(1).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss")
        targetStatus = "CLOSED"
        changeAnalyst = "Marcus Vance"
        technicalTeam = "Linux Systems"
        implementationTeam = "Operations"
        changeManager = "Sarah Jenkins"
    },
    @{
        shortDescription = "Deprecate legacy TLS 1.0/1.1 protocols on external API endpoints"
        detailedDescription = "Disable TLS 1.0 and 1.1 cipher suites on CloudFront and Application Load Balancers. Require TLS 1.2+."
        requestedBy = "Sarah Jenkins"
        requesterEmail = "sarah.jenkins@northstar.local"
        department = "Security Operations"
        changeType = "NORMAL"
        category = "SECURITY"
        priority = "MEDIUM"
        riskLevel = "MEDIUM"
        impact = "Any legacy client not supporting TLS 1.2 will receive handshake failure."
        affectedCi = "alb-external-api-prod"
        businessJustification = "PCI-DSS 4.0 requirement to retire weak cryptography."
        implementationPlan = "Update AWS ALB security policy to ELBSecurityPolicy-TLS13-1-2-2021-06."
        rollbackPlan = "Revert policy to ELBSecurityPolicy-2016-08."
        testPlan = "Vulnerability scan with testssl.sh verifying TLS 1.0/1.1 rejected."
        plannedStartDate = $now.AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss")
        plannedEndDate = $now.AddDays(7).AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss")
        targetStatus = "ASSESSMENT"
        changeAnalyst = "Sarah Jenkins"
        technicalTeam = "SecOps"
        implementationTeam = "SecOps"
        changeManager = "Sarah Jenkins"
    }
)

foreach ($chg in $changes) {
    try {
        $body = @{
            shortDescription = $chg.shortDescription
            detailedDescription = $chg.detailedDescription
            requestedBy = $chg.requestedBy
            requesterEmail = $chg.requesterEmail
            department = $chg.department
            changeType = $chg.changeType
            category = $chg.category
            priority = $chg.priority
            riskLevel = $chg.riskLevel
            impact = $chg.impact
            affectedCi = $chg.affectedCi
            businessJustification = $chg.businessJustification
            implementationPlan = $chg.implementationPlan
            rollbackPlan = $chg.rollbackPlan
            testPlan = $chg.testPlan
            plannedStartDate = $chg.plannedStartDate
            plannedEndDate = $chg.plannedEndDate
        } | ConvertTo-Json

        $created = Invoke-RestMethod -Uri "$baseUrl/api/changes" -Method Post -Headers $headers -Body $body
        $id = $created.id
        Write-Host "  + Created change: $($created.changeNumber) - $($created.shortDescription) (Draft)" -ForegroundColor Green

        # 1. Submit
        Invoke-RestMethod -Uri "$baseUrl/api/changes/$id/submit" -Method Post -Headers $headers -Body (@{ performedBy = $chg.requestedBy } | ConvertTo-Json) | Out-Null
        
        # 2. Start Assessment
        Invoke-RestMethod -Uri "$baseUrl/api/changes/$id/start-assessment" -Method Post -Headers $headers -Body (@{ performedBy = $chg.changeAnalyst } | ConvertTo-Json) | Out-Null
        
        # 3. Assign
        $assignBody = @{
            changeAnalyst = $chg.changeAnalyst
            technicalTeam = $chg.technicalTeam
            implementationTeam = $chg.implementationTeam
            changeManager = $chg.changeManager
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/api/changes/$id/assign" -Method Post -Headers $headers -Body $assignBody | Out-Null

        if ($chg.targetStatus -eq "ASSESSMENT") {
            Write-Host "    -> Status: ASSESSMENT" -ForegroundColor Cyan
            continue
        }

        # 4. Assess (moves to UNDER_REVIEW)
        $assBody = @{
            riskDescription = "Risk analysis completed. Impact scoped to $($chg.affectedCi)."
            businessImpact = $chg.impact
            technicalImpact = $chg.implementationPlan
            serviceDowntimeExpected = $false
            riskMitigationPlan = $chg.rollbackPlan
            performedBy = $chg.changeAnalyst
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/api/changes/$id/assess" -Method Post -Headers $headers -Body $assBody | Out-Null

        if ($chg.targetStatus -eq "UNDER_REVIEW") {
            Write-Host "    -> Status: UNDER_REVIEW" -ForegroundColor Cyan
            continue
        }

        # 5. Review (moves to PENDING_APPROVAL)
        $revBody = @{
            reviewer = $chg.changeAnalyst
            decision = "APPROVED"
            comments = "Technical review and blast radius analysis complete. Approved for CAB review."
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/api/changes/$id/review" -Method Post -Headers $headers -Body $revBody | Out-Null

        if ($chg.targetStatus -eq "PENDING_APPROVAL") {
            Write-Host "    -> Status: PENDING_APPROVAL" -ForegroundColor Cyan
            continue
        }

        # 6. Approve (moves to APPROVED)
        $appBody = @{
            approvedBy = $chg.changeManager
            comments = "CAB approval granted. Scheduled for designated maintenance window."
            justification = "Emergency incident mitigation and business continuity."
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/api/changes/$id/approve" -Method Post -Headers $headers -Body $appBody | Out-Null

        if ($chg.targetStatus -eq "APPROVED") {
            Write-Host "    -> Status: APPROVED" -ForegroundColor Cyan
            continue
        }

        # 7. Schedule (moves to SCHEDULED)
        $schBody = @{
            plannedStartDate = $chg.plannedStartDate
            plannedEndDate = $chg.plannedEndDate
            maintenanceWindow = "Standard Nightly Maintenance (02:00-05:00 UTC)"
            scheduledBy = $chg.changeManager
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/api/changes/$id/schedule" -Method Post -Headers $headers -Body $schBody | Out-Null

        if ($chg.targetStatus -eq "SCHEDULED") {
            Write-Host "    -> Status: SCHEDULED" -ForegroundColor Cyan
            continue
        }

        # 8. Start Implementation (moves to IN_PROGRESS)
        Invoke-RestMethod -Uri "$baseUrl/api/changes/$id/start-implementation" -Method Post -Headers $headers -Body (@{ performedBy = $chg.implementationTeam } | ConvertTo-Json) | Out-Null

        if ($chg.targetStatus -eq "IN_PROGRESS") {
            $progBody = @{ progress = "65"; notes = "Execution in progress. 2 of 3 nodes updated and verified healthy." } | ConvertTo-Json
            Invoke-RestMethod -Uri "$baseUrl/api/changes/$id/implementation-progress" -Method Put -Headers $headers -Body $progBody | Out-Null
            Write-Host "    -> Status: IN_PROGRESS (65% done)" -ForegroundColor Cyan
            continue
        }

        # 9. Complete Implementation (moves to IMPLEMENTED)
        $compBody = @{ outcome = "SUCCESS"; notes = "All implementation plan steps executed according to runbook." } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/api/changes/$id/complete-implementation" -Method Post -Headers $headers -Body $compBody | Out-Null

        if ($chg.targetStatus -eq "IMPLEMENTED") {
            Write-Host "    -> Status: IMPLEMENTED" -ForegroundColor Cyan
            continue
        }

        # 10. Test Results (moves to VALIDATED)
        $testBody = @{
            testResults = "Synthetic and end-to-end load tests passed with 100% assertions green."
            testerName = "QA Automated Pipeline"
            comments = "Verified latency metrics < 45ms and error rate = 0%."
            validationStatus = "PASSED"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/api/changes/$id/test-results" -Method Post -Headers $headers -Body $testBody | Out-Null

        if ($chg.targetStatus -eq "VALIDATED") {
            Write-Host "    -> Status: VALIDATED" -ForegroundColor Cyan
            continue
        }

        # 11. Close (moves to CLOSED)
        if ($chg.targetStatus -eq "CLOSED") {
            $closeBody = @{
                closureNotes = "Production verification passed over 24-hour monitoring period. Change closed."
                closedBy = $chg.changeManager
                finalOutcome = "SUCCESS"
                postImplementationReview = "Change completed within maintenance window without user disruption."
            } | ConvertTo-Json
            Invoke-RestMethod -Uri "$baseUrl/api/changes/$id/close" -Method Post -Headers $headers -Body $closeBody | Out-Null
            Write-Host "    -> Status: CLOSED" -ForegroundColor Cyan
        }
    } catch {
        Write-Warning "  ! Failed to process change $($chg.shortDescription): $_"
    }
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  Demo Data Seeding Completed Successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
