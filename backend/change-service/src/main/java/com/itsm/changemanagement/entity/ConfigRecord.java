package com.itsm.changemanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA entity representing generic JSON configuration/customization data stored in {@code configuration_records}.
 *
 * <p><b>Purpose:</b> Stores application customizations, custom forms, workflows, or lookup lists by configType and configKey.
 *
 * <p><b>Downstream / Workflow:</b> Managed by {@link com.itsm.changemanagement.repository.ConfigRecordRepository}
 * and accessed by {@link com.itsm.changemanagement.controller.CustomizationController}.
 */
@Entity
@Table(name = "configuration_records", uniqueConstraints = @UniqueConstraint(columnNames = {"config_type", "config_key"}))
public class ConfigRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "config_type", nullable = false)
    private String configType;

    @Column(name = "config_key", nullable = false)
    private String configKey;

    @Column(nullable = false, columnDefinition = "longtext")
    private String payload;

    private boolean active = true;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    /** Default constructor for JPA. */
    public ConfigRecord() {}

    /**
     * Constructs a new ConfigRecord with type, key, and JSON payload.
     *
     * @param t Config type.
     * @param k Config key.
     * @param p JSON payload string.
     */
    public ConfigRecord(String t, String k, String p) {
        this.configType = t;
        this.configKey = k;
        this.payload = p;
    }

    public Long getId() { return id; }
    public String getConfigType() { return configType; }
    public String getConfigKey() { return configKey; }
    public String getPayload() { return payload; }
    public void setPayload(String p) { payload = p; updatedAt = LocalDateTime.now(); }
    public boolean isActive() { return active; }
    public void setActive(boolean a) { active = a; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
