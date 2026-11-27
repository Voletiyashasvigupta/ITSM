package com.example.problem_service.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.problem_service.entity.Problem;
import java.util.List;
/**
 * Spring Data JPA repository for {@link Problem} entities.
 *
 * <p><b>Purpose:</b> Exposes database operations and derived queries for filtering problems by creator,
 * assigned analyst, or assigned engineer.
 *
 * <p><b>Downstream / Workflow:</b> Injected into {@link com.example.problem_service.service.ProblemService}.
 */
public interface ProblemRepository extends JpaRepository<Problem,Long> {

    /**
     * Finds problems created by a specific user email.
     *
     * @param email User email.
     * @return List of matching problems.
     */
    List<Problem> findByCreatedBy(String email);

    /**
     * Finds problems assigned to a specific problem analyst.
     *
     * @param email Analyst email.
     * @return List of matching problems.
     */
    List<Problem> findByAssignedAnalyst(String email);

    /**
     * Finds problems assigned to a technical support engineer.
     *
     * @param email Engineer email.
     * @return List of matching problems.
     */
    List<Problem> findByAssignedEngineer(String email);
}
