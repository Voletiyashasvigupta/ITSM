CREATE TABLE incidents (
  id BINARY(16) NOT NULL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(16) NOT NULL,
  status VARCHAR(24) NOT NULL,
  reporter_id VARCHAR(128) NOT NULL,
  assignee_id VARCHAR(128) NULL,
  external_id VARCHAR(128) NULL,
  external_system VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL
);
CREATE INDEX idx_incident_reporter_created ON incidents (reporter_id, created_at);
CREATE INDEX idx_incident_assignee_status ON incidents (assignee_id, status);
CREATE TABLE incident_comments (
  id BINARY(16) NOT NULL PRIMARY KEY,
  incident_id BINARY(16) NOT NULL,
  author_id VARCHAR(128) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT fk_comment_incident FOREIGN KEY (incident_id) REFERENCES incidents(id)
);
CREATE INDEX idx_comment_incident_created ON incident_comments (incident_id, created_at);
