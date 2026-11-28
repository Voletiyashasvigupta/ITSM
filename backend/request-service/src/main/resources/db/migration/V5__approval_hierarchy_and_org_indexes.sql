ALTER TABLE service_requests ADD COLUMN org_group VARCHAR(60) NULL;
CREATE INDEX idx_service_requests_org_group ON service_requests (org_group);
CREATE INDEX idx_approvals_decision ON approvals (decision, created_at);
