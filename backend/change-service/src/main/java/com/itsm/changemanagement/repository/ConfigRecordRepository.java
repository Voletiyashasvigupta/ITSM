package com.itsm.changemanagement.repository;

import com.itsm.changemanagement.entity.ConfigRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

/**
 * Spring Data JPA repository for generic {@link ConfigRecord} customization entities.
 *
 * <p><b>Purpose:</b> Stores and retrieves UI form customizations and lookup configurations.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.itsm.changemanagement.controller.CustomizationController}.
 */
public interface ConfigRecordRepository extends JpaRepository<ConfigRecord, Long> {

    /**
     * Finds all config records of a given type.
     *
     * @param t Config type name.
     * @return List of config records.
     */
    List<ConfigRecord> findByConfigType(String t);

    /**
     * Finds active config records of a given type.
     *
     * @param t Config type name.
     * @return List of active config records.
     */
    List<ConfigRecord> findByConfigTypeAndActiveTrue(String t);

    /**
     * Finds a single configuration record by its type and unique key.
     *
     * @param t Config type.
     * @param k Config key.
     * @return Optional containing matching ConfigRecord.
     */
    Optional<ConfigRecord> findByConfigTypeAndConfigKey(String t, String k);
}
