package com.example.problem_service.service;
import org.springframework.stereotype.Service;
import com.example.problem_service.repository.ProblemRepository;
import com.example.problem_service.entity.Problem;
import com.example.problem_service.integration.ServiceNowProblemClient;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Business service orchestrating ITIL Problem Management operations.
 *
 * <p><b>Purpose:</b> Implements problem lifecycle management: initial intake, triage and assignment (manager),
 * root cause analysis and workaround documentation (analyst), resolution execution (engineer), status transitions,
 * and deletion.
 *
 * <p><b>Downstream / Workflow:</b> Called by {@link com.example.problem_service.controller.ProblemController} and
 * interacts with {@link ProblemRepository}.
 */
@Service
public class ProblemService {
    private final ProblemRepository repository;
    private final ServiceNowProblemClient serviceNowClient;

    /**
     * Constructs the ProblemService with injected repository and ServiceNow client.
     *
     * @param repository Problem entity repository.
     * @param serviceNowClient ServiceNow problem client.
     */
    public ProblemService(ProblemRepository repository, ServiceNowProblemClient serviceNowClient) {
        this.repository = repository;
        this.serviceNowClient = serviceNowClient;
    }

    /**
     * Creates a new problem record, setting initial status to OPEN and default priority.
     * Synchronizes directly with external ServiceNow instance to obtain an official PRB ticket number.
     *
     * @param p Problem entity to persist.
     * @return Saved Problem entity.
     */
    public Problem createProblem(Problem p) {
        p.setStatus("OPEN");
        p.setPriority(p.getPriority() == null ? "MEDIUM" : p.getPriority().toUpperCase());

        try {
            Map<String, Object> snPayload = new HashMap<>();
            snPayload.put("short_description", p.getTitle());
            snPayload.put("description", p.getDescription() != null ? p.getDescription() : p.getTitle());
            snPayload.put("category", p.getCategory() != null ? p.getCategory() : "Software");
            Map<String, Object> snResponse = serviceNowClient.createProblem(snPayload);
            if (snResponse != null && snResponse.get("number") != null) {
                p.setProblemNumber(String.valueOf(snResponse.get("number")));
            }
        } catch (Exception ignored) {
            // Graceful fallback to local PRB numbering
        }

        return repository.save(p);
    }

    /**
     * Retrieves all problems across the platform.
     *
     * @return List of all problems.
     */
    public List<Problem> getAllProblems() {
        return repository.findAll();
    }

    /**
     * Retrieves problems created by a specific user.
     *
     * @param email User email.
     * @return Matching problems.
     */
    public List<Problem> getProblemsByCreator(String email) {
        return repository.findByCreatedBy(email);
    }

    /**
     * Retrieves problems assigned to a specific analyst.
     *
     * @param email Analyst email.
     * @return Matching problems.
     */
    public List<Problem> getProblemsByAnalyst(String email) {
        return repository.findByAssignedAnalyst(email);
    }

    /**
     * Retrieves problems assigned to a specific engineer.
     *
     * @param email Engineer email.
     * @return Matching problems.
     */
    public List<Problem> getProblemsByEngineer(String email) {
        return repository.findByAssignedEngineer(email);
    }

    /**
     * Finds a problem by ID or throws {@link ProblemNotFoundException}.
     *
     * @param id Problem ID.
     * @return Located Problem entity.
     */
    public Problem getProblemById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ProblemNotFoundException("Problem not found with ID: " + id));
    }

    /**
     * Applies manager-level triage: sets category, priority, assigned analyst, and assigned engineer.
     *
     * @param id Problem ID.
     * @param category Category string.
     * @param priority Priority string.
     * @param analyst Assigned analyst email.
     * @param engineer Assigned engineer email.
     * @return Updated Problem entity.
     */
    public Problem managerUpdate(Long id, String category, String priority, String analyst, String engineer) {
        Problem p = getProblemById(id);
        if (category != null) p.setCategory(category);
        if (priority != null) p.setPriority(priority.toUpperCase());
        if (analyst != null) p.setAssignedAnalyst(analyst);
        if (engineer != null) p.setAssignedEngineer(engineer);
        if (p.getStatus().equals("OPEN")) p.setStatus("ASSIGNED");
        return repository.save(p);
    }

    /**
     * Applies analyst investigation updates: notes, root cause, workaround, known error, and status.
     *
     * @param id Problem ID.
     * @param notes Investigation notes.
     * @param rootCause Root cause description.
     * @param workaround Workaround steps.
     * @param knownError Known error documentation.
     * @param status Transitioned status.
     * @return Updated Problem entity.
     */
    public Problem analystUpdate(Long id, String notes, String rootCause, String workaround, String knownError, String status) {
        Problem p = getProblemById(id);
        if (notes != null) p.setInvestigationNotes(notes);
        if (rootCause != null) p.setRootCause(rootCause);
        if (workaround != null) p.setWorkaround(workaround);
        if (knownError != null) p.setKnownError(knownError);
        if (status != null) p.setStatus(status.toUpperCase());
        return repository.save(p);
    }

    /**
     * Applies technical engineer resolution updates: technical notes, resolution details, and status.
     *
     * @param id Problem ID.
     * @param notes Technical work notes.
     * @param resolution Resolution description.
     * @param status Transitioned status.
     * @return Updated Problem entity.
     */
    public Problem engineerUpdate(Long id, String notes, String resolution, String status) {
        Problem p = getProblemById(id);
        if (notes != null) p.setTechnicalNotes(notes);
        if (resolution != null) p.setResolution(resolution);
        if (status != null) p.setStatus(status.toUpperCase());
        return repository.save(p);
    }

    /**
     * Transitions problem status by a manager.
     *
     * @param id Problem ID.
     * @param status Target status string.
     * @return Updated Problem entity.
     */
    public Problem managerStatus(Long id, String status) {
        Problem p = getProblemById(id);
        p.setStatus(status.toUpperCase());
        return repository.save(p);
    }

    /**
     * Updates general problem fields.
     *
     * @param id Problem ID.
     * @param updated Problem entity containing updated fields.
     * @return Updated Problem entity.
     */
    public Problem updateProblem(Long id, Problem updated) {
        Problem p = getProblemById(id);
        p.setTitle(updated.getTitle());
        p.setDescription(updated.getDescription());
        p.setCategory(updated.getCategory());
        p.setPriority(updated.getPriority());
        p.setStatus(updated.getStatus());
        p.setAssignedTo(updated.getAssignedTo());
        return repository.save(p);
    }

    /**
     * Permanently deletes a problem entity.
     *
     * @param id Problem ID.
     */
    public void deleteProblem(Long id) {
        repository.delete(getProblemById(id));
    }
}
