package com.example.problem_service.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.problem_service.entity.Problem;
import java.util.List;
public interface ProblemRepository extends JpaRepository<Problem,Long> {
 List<Problem> findByCreatedBy(String email);
 List<Problem> findByAssignedAnalyst(String email);
 List<Problem> findByAssignedEngineer(String email);
}
