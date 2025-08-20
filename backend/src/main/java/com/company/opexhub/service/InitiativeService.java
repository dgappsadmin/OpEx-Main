package com.company.opexhub.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.opexhub.dto.InitiativeRequest;
import com.company.opexhub.entity.Initiative;
import com.company.opexhub.entity.User;
import com.company.opexhub.repository.InitiativeRepository;
import com.company.opexhub.repository.UserRepository;

@Service
public class InitiativeService {

    @Autowired
    private InitiativeRepository initiativeRepository;

    @Autowired
    private UserRepository userRepository;


    @Autowired
    private WorkflowTransactionService workflowTransactionService;

    public Page<Initiative> getAllInitiatives(Pageable pageable) {
        return initiativeRepository.findAll(pageable);
    }

    public Page<Initiative> getInitiativesByStatus(String status, Pageable pageable) {
        return initiativeRepository.findByStatus(status, pageable);
    }

    public Page<Initiative> getInitiativesBySite(String site, Pageable pageable) {
        return initiativeRepository.findBySite(site, pageable);
    }

    public Page<Initiative> searchInitiatives(String status, String site, String title, Pageable pageable) {
        if (status != null && site != null && title != null) {
            return initiativeRepository.findByStatusAndSiteAndTitleContaining(status, site, title, pageable);
        } else if (title != null) {
            return initiativeRepository.findByTitleContaining(title, pageable);
        } else if (status != null && site != null) {
            return initiativeRepository.findByStatusAndSite(status, site, pageable);
        } else if (status != null) {
            return initiativeRepository.findByStatus(status, pageable);
        } else if (site != null) {
            return initiativeRepository.findBySite(site, pageable);
        } else {
            return initiativeRepository.findAll(pageable);
        }
    }

    public Optional<Initiative> getInitiativeById(Long id) {
        return initiativeRepository.findById(id);
    }

    @Transactional
    public Initiative createInitiative(InitiativeRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Initiative initiative = new Initiative(
                request.getTitle(),
                request.getDescription(),
                request.getPriority(),
                request.getExpectedSavings(),
                request.getSite(),
                request.getDiscipline(),
                request.getStartDate(),
                request.getEndDate(),
                user,
                request.getInitiatorName()
        );

        initiative.setRequiresMoc(request.getRequiresMoc());
        initiative.setRequiresCapex(request.getRequiresCapex());
        
        // Set new fields for assumptions and additional form data
        initiative.setAssumption1(request.getAssumption1());
        initiative.setAssumption2(request.getAssumption2());
        initiative.setAssumption3(request.getAssumption3());
        initiative.setBaselineData(request.getBaselineData());
        initiative.setTargetOutcome(request.getTargetOutcome());
        initiative.setTargetValue(request.getTargetValue());
        initiative.setConfidenceLevel(request.getConfidenceLevel());
        initiative.setEstimatedCapex(request.getEstimatedCapex());
        initiative.setBudgetType(request.getBudgetType());
        
        // Generate initiative number
        String initiativeNumber = generateInitiativeNumber(request.getSite(), request.getDiscipline());
        initiative.setInitiativeNumber(initiativeNumber);

        Initiative savedInitiative = initiativeRepository.save(initiative);

        // Create initial workflow stages and transactions
        createInitialWorkflowStages(savedInitiative);
        workflowTransactionService.createInitialWorkflowTransactions(savedInitiative);

        return savedInitiative;
    }

    private void createInitialWorkflowStages(Initiative initiative) {
        // New workflow stages as per the requirements
        String[] stageNames = {
            "Register Initiative",                    // Step 1
            "Approval",                              // Step 2
            "Define Responsibilities",               // Step 3
            "MOC Stage",                            // Step 4
            "CAPEX Stage",                          // Step 5
            "Initiative Timeline Tracker",          // Step 6
            "Trial Implementation & Performance Check", // Step 7
            "Periodic Status Review with CMO",      // Step 8
            "Savings Monitoring (1 Month)",         // Step 9
            "Saving Validation with F&A",          // Step 10
            "Initiative Closure"                    // Step 11
        };

        String[] requiredRoles = {
            "STLD",    // Site TSD Lead
            "SH",      // Site Head
            "EH",      // Engineering Head
            "IL",      // Initiative Lead
            "IL",      // Initiative Lead
            "IL",      // Initiative Lead
            "STLD",    // Site TSD Lead
            "CTSD",    // Corp TSD
            "STLD",    // Site TSD Lead
            "STLD",    // Site TSD Lead
            "STLD"     // Site TSD Lead
        };

        // WorkflowStage is now a master table - we don't create stages per initiative
        // WorkflowTransactionService will handle creating all necessary transactions
        // This is handled by the createInitialWorkflowTransactions call in the createInitiative method
    }

    @Transactional
    public Initiative updateInitiative(Long id, InitiativeRequest request) {
        Initiative initiative = initiativeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Initiative not found"));

        initiative.setTitle(request.getTitle());
        initiative.setDescription(request.getDescription());
        initiative.setPriority(request.getPriority());
        initiative.setExpectedSavings(request.getExpectedSavings());
        initiative.setSite(request.getSite());
        initiative.setDiscipline(request.getDiscipline());
        initiative.setStartDate(request.getStartDate());
        initiative.setEndDate(request.getEndDate());
        initiative.setRequiresMoc(request.getRequiresMoc());
        initiative.setRequiresCapex(request.getRequiresCapex());
        initiative.setInitiatorName(request.getInitiatorName());

        // Update new fields for assumptions and additional form data
        initiative.setAssumption1(request.getAssumption1());
        initiative.setAssumption2(request.getAssumption2());
        initiative.setAssumption3(request.getAssumption3());
        initiative.setBaselineData(request.getBaselineData());
        initiative.setTargetOutcome(request.getTargetOutcome());
        initiative.setTargetValue(request.getTargetValue());
        initiative.setConfidenceLevel(request.getConfidenceLevel());
        initiative.setEstimatedCapex(request.getEstimatedCapex());
        initiative.setBudgetType(request.getBudgetType());

        return initiativeRepository.save(initiative);
    }

    public void deleteInitiative(Long id) {
        initiativeRepository.deleteById(id);
    }

    public Long countByStatus(String status) {
        return initiativeRepository.countByStatus(status);
    }

    public List<Initiative> getInitiativesByPriority(String priority) {
        return initiativeRepository.findByPriority(priority);
    }

    private String generateInitiativeNumber(String site, String discipline) {
        // Get current year (2-digit format)
        int currentYear = java.time.LocalDate.now().getYear();
        String yearCode = String.format("%02d", currentYear % 100);
        
        // Map discipline to category code
        String categoryCode = getDisciplineCategoryCode(discipline);
        
        // Get discipline-specific sequential number for the site
        Long disciplineCount = initiativeRepository.countBySiteAndDisciplineAndYear(site, discipline, currentYear);
        String disciplineSequential = String.format("%02d", disciplineCount + 1);
        
        // Get overall site-specific initiative number
        Long siteCount = initiativeRepository.countBySiteAndYear(site, currentYear);
        String overallSequential = String.format("%03d", siteCount + 1);
        
        // Format: ZZZ/YY/XX/AB/123
        return String.format("%s/%s/%s/%s/%s", 
                site, yearCode, categoryCode, disciplineSequential, overallSequential);
    }
    
    private String getDisciplineCategoryCode(String discipline) {
        switch (discipline.toLowerCase()) {
            case "operation":
                return "OP";
            case "engineering & utility":
            case "engineering":
                return "EG";
            case "environment":
                return "EV";
            case "safety":
                return "SF";
            case "quality":
                return "QA";
            case "others":
                return "OT";
            default:
                return "OT"; // Default to Others
        }
    }
}