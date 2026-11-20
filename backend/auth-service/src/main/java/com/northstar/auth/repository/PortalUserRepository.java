package com.northstar.auth.repository;

import com.northstar.auth.entity.PortalUser;
import com.northstar.auth.entity.PortalRole;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortalUserRepository extends JpaRepository<PortalUser, UUID> {
    Optional<PortalUser> findByEmail(String email);
    boolean existsByEmail(String email);
    List<PortalUser> findAllByOrderByCreatedAtAsc();
    List<PortalUser> findAllByRoleAndActiveTrueOrderByFullNameAsc(PortalRole role);
}
