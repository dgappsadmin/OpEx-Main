package com.company.opexhub.service;

import java.util.List;
import java.util.Map;
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

    public Page<Initiative> searchInitiatives(String status, String site, String search, Pageable pageable) {
        // Determine if search term looks like initiative number (contains slash or alphanumeric pattern)
        boolean isInitiativeNumberSearch = search != null && 
            (search.contains("/") || search.matches(".*[A-Z]+.*[0-9]+.*") || search.matches(".*[0-9]+.*[A-Z]+.*"));
        
        if (status != null && site != null && search != null) {
            if (isInitiativeNumberSearch) {
                return initiativeRepository.findByStatusAndSiteAndInitiativeNumberContaining(status, site, search, pageable);
            } else {
                return initiativeRepository.findByStatusAndSiteAndTitleContaining(status, site, search, pageable);
            }
        } else if (search != null) {
            if (isInitiativeNumberSearch) {
                return initiativeRepository.findByInitiativeNumberContaining(search, pageable);
            } else {
                return initiativeRepository.findByTitleContaining(search, pageable);
            }
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
        initiative.setMocNumber(request.getMocNumber());
        initiative.setCapexNumber(request.getCapexNumber());
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
    
    // Add this method to handle MOC/CAPEX updates when Stage 6 is approved
    @Transactional
    public boolean updateMocCapexRequirements(Long initiativeId, Map<String, Object> mocCapexData) {
        System.out.println("=== UPDATING MOC/CAPEX REQUIREMENTS ===");
        System.out.println("Initiative ID: " + initiativeId);
        System.out.println("MOC/CAPEX Data: " + mocCapexData);
        
        Optional<Initiative> initiativeOpt = initiativeRepository.findById(initiativeId);
        
        if (initiativeOpt.isPresent()) {
            Initiative initiative = initiativeOpt.get();
            
            System.out.println("Found initiative: " + initiative.getId() + " - " + initiative.getTitle());
            System.out.println("Current MOC values - Requires: " + initiative.getRequiresMoc() + ", Number: " + initiative.getMocNumber());
            System.out.println("Current CAPEX values - Requires: " + initiative.getRequiresCapex() + ", Number: " + initiative.getCapexNumber());
            
            // Update MOC requirements - Handle String values ('Y'/'N')
            if (mocCapexData.containsKey("requiresMoc")) {
                String requiresMoc = (String) mocCapexData.get("requiresMoc");
                System.out.println("Setting requiresMoc to: " + requiresMoc);
                initiative.setRequiresMoc(requiresMoc); // Set as String 'Y' or 'N'
            }
            
            if (mocCapexData.containsKey("mocNumber")) {
                String mocNumber = (String) mocCapexData.get("mocNumber");
                System.out.println("Setting mocNumber to: " + mocNumber);
                initiative.setMocNumber(mocNumber);
            }
            
            // Update CAPEX requirements - Handle String values ('Y'/'N')
            if (mocCapexData.containsKey("requiresCapex")) {
                String requiresCapex = (String) mocCapexData.get("requiresCapex");
                System.out.println("Setting requiresCapex to: " + requiresCapex);
                initiative.setRequiresCapex(requiresCapex); // Set as String 'Y' or 'N'
            }
            
            if (mocCapexData.containsKey("capexNumber")) {
                String capexNumber = (String) mocCapexData.get("capexNumber");
                System.out.println("Setting capexNumber to: " + capexNumber);
                initiative.setCapexNumber(capexNumber);
            }
            
            try {
                // Save the updated initiative
                Initiative savedInitiative = initiativeRepository.save(initiative);
                System.out.println("Successfully saved initiative with updated MOC/CAPEX data");
                System.out.println("Updated MOC values - Requires: " + savedInitiative.getRequiresMoc() + ", Number: " + savedInitiative.getMocNumber());
                System.out.println("Updated CAPEX values - Requires: " + savedInitiative.getRequiresCapex() + ", Number: " + savedInitiative.getCapexNumber());
                
                // Log the update
                System.out.println("Updated OPEX_INITIATIVES ID " + initiativeId + " with MOC/CAPEX data: " + mocCapexData);
                
                return true;
            } catch (Exception e) {
                System.err.println("Error saving initiative: " + e.getMessage());
                e.printStackTrace();
                throw e;
            }
        } else {
            System.err.println("Initiative not found with ID: " + initiativeId);
        }
        
        return false;
    }
}