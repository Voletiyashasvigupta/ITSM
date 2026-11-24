CREATE TABLE change_requests (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, change_number VARCHAR(32) NOT NULL UNIQUE, short_description VARCHAR(180) NOT NULL,
 detailed_description TEXT NOT NULL, requested_by VARCHAR(160) NOT NULL, requester_email VARCHAR(190) NOT NULL, department VARCHAR(120) NOT NULL,
 change_type VARCHAR(30) NOT NULL, category VARCHAR(40) NOT NULL, priority VARCHAR(20) NOT NULL, risk_level VARCHAR(20) NOT NULL,
 impact TEXT, affected_ci VARCHAR(180), business_justification TEXT, implementation_plan TEXT, rollback_plan TEXT, test_plan TEXT,
 planned_start_date DATETIME(6), planned_end_date DATETIME(6), status VARCHAR(50) NOT NULL,
 risk_description TEXT,business_impact TEXT,technical_impact TEXT,service_downtime_expected BOOLEAN DEFAULT FALSE,risk_mitigation_plan TEXT,
 assigned_analyst VARCHAR(160),technical_team VARCHAR(160),implementation_team VARCHAR(160),change_manager VARCHAR(160),assigned_at DATETIME(6),
 reviewer VARCHAR(160),review_comments TEXT,reviewed_at DATETIME(6),approved_by VARCHAR(160),approval_comments TEXT,approved_at DATETIME(6),emergency_justification TEXT,
 maintenance_window VARCHAR(255),scheduled_by VARCHAR(160),scheduled_at DATETIME(6),implementation_progress INT DEFAULT 0,implementation_notes TEXT,implementation_started_at DATETIME(6),implementation_ended_at DATETIME(6),implementation_outcome VARCHAR(40),
 test_results TEXT,tester_name VARCHAR(160),testing_date DATETIME(6),validation_comments TEXT,validation_status VARCHAR(20),rollback_required BOOLEAN DEFAULT FALSE,rollback_reason TEXT,rollback_notes TEXT,rollback_started_at DATETIME(6),rollback_completed_at DATETIME(6),rollback_status VARCHAR(40),
 closure_notes TEXT,closed_by VARCHAR(160),closed_date DATETIME(6),final_outcome VARCHAR(100),post_implementation_review TEXT,cancellation_reason TEXT,cancelled_by VARCHAR(160),cancelled_at DATETIME(6),custom_values LONGTEXT,
 created_at DATETIME(6),updated_at DATETIME(6), INDEX idx_change_status(status),INDEX idx_change_requester(requester_email),INDEX idx_change_type(change_type)
);
CREATE TABLE change_history (id BIGINT AUTO_INCREMENT PRIMARY KEY,change_id BIGINT NOT NULL,previous_status VARCHAR(50),new_status VARCHAR(50),action_performed VARCHAR(100),performed_by VARCHAR(160),comments TEXT,event_time DATETIME(6),INDEX idx_history_change(change_id),CONSTRAINT fk_history_change FOREIGN KEY(change_id) REFERENCES change_requests(id));
CREATE TABLE configuration_records (id BIGINT AUTO_INCREMENT PRIMARY KEY,config_type VARCHAR(60) NOT NULL,config_key VARCHAR(180) NOT NULL,payload LONGTEXT NOT NULL,active BOOLEAN NOT NULL DEFAULT TRUE,created_at DATETIME(6),updated_at DATETIME(6),UNIQUE KEY uq_config_type_key(config_type,config_key));
