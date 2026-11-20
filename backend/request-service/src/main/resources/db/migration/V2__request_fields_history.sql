ALTER TABLE service_requests ADD COLUMN approver_id VARCHAR(128) NULL;
ALTER TABLE service_requests ADD COLUMN fields_json LONGTEXT NULL;
ALTER TABLE service_requests ADD COLUMN external_id VARCHAR(128) NULL;
ALTER TABLE service_requests ADD COLUMN external_system VARCHAR(64) NULL;
ALTER TABLE service_requests ADD COLUMN updated_at TIMESTAMP(6) NULL;
UPDATE service_requests SET updated_at = created_at WHERE updated_at IS NULL;
ALTER TABLE service_requests MODIFY updated_at TIMESTAMP(6) NOT NULL;
UPDATE service_requests SET status = 'SUBMITTED' WHERE status = 'PENDING_SYNC';
CREATE INDEX idx_request_requester_created ON service_requests (requester_id, created_at);
CREATE INDEX idx_request_approver_status ON service_requests (approver_id, status);
CREATE TABLE request_history (
  id BINARY(16) NOT NULL PRIMARY KEY,
  request_id BINARY(16) NOT NULL,
  actor_id VARCHAR(128) NOT NULL,
  action VARCHAR(64) NOT NULL,
  from_status VARCHAR(32) NULL,
  to_status VARCHAR(32) NULL,
  comment VARCHAR(2000) NULL,
  created_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT fk_history_request FOREIGN KEY (request_id) REFERENCES service_requests(id)
);
CREATE INDEX idx_history_request_created ON request_history (request_id, created_at);
