CREATE TABLE service_requests (
  id BINARY(16) NOT NULL PRIMARY KEY,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  service_name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requester_id VARCHAR(128) NOT NULL,
  requested_for_id VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  service_now_number VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL
);
CREATE TABLE outbox_messages (
  id BINARY(16) NOT NULL PRIMARY KEY,
  aggregate_id VARCHAR(36) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  payload LONGTEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP(6) NOT NULL,
  published_at TIMESTAMP(6) NULL,
  next_attempt_at TIMESTAMP(6) NOT NULL,
  locked_until TIMESTAMP(6) NULL,
  dead_lettered_at TIMESTAMP(6) NULL
);
CREATE INDEX idx_outbox_pending ON outbox_messages (published_at, next_attempt_at, created_at);
