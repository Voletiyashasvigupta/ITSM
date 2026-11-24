package com.example.problem_service.service;
import org.springframework.stereotype.Service;
import com.example.problem_service.repository.ProblemRepository;
import com.example.problem_service.entity.Problem;
import java.util.List;
@Service public class ProblemService {
 private final ProblemRepository repository;
 public ProblemService(ProblemRepository repository){this.repository=repository;}
 public Problem createProblem(Problem p){p.setStatus("OPEN");p.setPriority(p.getPriority()==null?"MEDIUM":p.getPriority().toUpperCase());return repository.save(p);}
 public List<Problem> getAllProblems(){return repository.findAll();}
 public List<Problem> getProblemsByCreator(String email){return repository.findByCreatedBy(email);}
 public List<Problem> getProblemsByAnalyst(String email){return repository.findByAssignedAnalyst(email);}
 public List<Problem> getProblemsByEngineer(String email){return repository.findByAssignedEngineer(email);}
 public Problem getProblemById(Long id){return repository.findById(id).orElseThrow(()->new ProblemNotFoundException("Problem not found with ID: "+id));}
 public Problem managerUpdate(Long id,String category,String priority,String analyst,String engineer){Problem p=getProblemById(id);if(category!=null)p.setCategory(category);if(priority!=null)p.setPriority(priority.toUpperCase());if(analyst!=null)p.setAssignedAnalyst(analyst);if(engineer!=null)p.setAssignedEngineer(engineer);if(p.getStatus().equals("OPEN"))p.setStatus("ASSIGNED");return repository.save(p);}
 public Problem analystUpdate(Long id,String notes,String rootCause,String workaround,String knownError,String status){Problem p=getProblemById(id);if(notes!=null)p.setInvestigationNotes(notes);if(rootCause!=null)p.setRootCause(rootCause);if(workaround!=null)p.setWorkaround(workaround);if(knownError!=null)p.setKnownError(knownError);if(status!=null)p.setStatus(status.toUpperCase());return repository.save(p);}
 public Problem engineerUpdate(Long id,String notes,String resolution,String status){Problem p=getProblemById(id);if(notes!=null)p.setTechnicalNotes(notes);if(resolution!=null)p.setResolution(resolution);if(status!=null)p.setStatus(status.toUpperCase());return repository.save(p);}
 public Problem managerStatus(Long id,String status){Problem p=getProblemById(id);p.setStatus(status.toUpperCase());return repository.save(p);}
 public Problem updateProblem(Long id,Problem updated){Problem p=getProblemById(id);p.setTitle(updated.getTitle());p.setDescription(updated.getDescription());p.setCategory(updated.getCategory());p.setPriority(updated.getPriority());p.setStatus(updated.getStatus());p.setAssignedTo(updated.getAssignedTo());return repository.save(p);}
 public void deleteProblem(Long id){repository.delete(getProblemById(id));}
}
