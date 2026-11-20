CREATE TABLE approvals (
  id BINARY(16) NOT NULL PRIMARY KEY,
  request_id BINARY(16) NOT NULL,
  approver_id VARCHAR(128) NOT NULL,
  decision VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  comment VARCHAR(2000) NULL,
  created_at TIMESTAMP(6) NOT NULL,
  decided_at TIMESTAMP(6) NULL,
  CONSTRAINT fk_approval_request FOREIGN KEY (request_id) REFERENCES service_requests(id),
  CONSTRAINT uq_approval_request UNIQUE (request_id)
);
CREATE INDEX idx_approval_pending ON approvals (approver_id, decision, created_at);
