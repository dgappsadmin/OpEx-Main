package com.company.opexhub.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private LoggingService loggingService;

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
        return searchInitiatives(status, site, search, null, pageable);
    }
    
    public Page<Initiative> searchInitiatives(String status, String site, String search, String financialYear, Pageable pageable) {
        // Removed unnecessary INFO log for search parameters
        
        // Determine if search term looks like initiative number (contains slash or alphanumeric pattern)
        boolean isInitiativeNumberSearch = search != null && 
            (search.contains("/") || search.matches(".*[A-Z]+.*[0-9]+.*") || search.matches(".*[0-9]+.*[A-Z]+.*"));
        
        // If financial year is provided, use the FY-specific repository methods
        if (financialYear != null) {
            return searchInitiativesWithFinancialYear(status, site, search, financialYear, isInitiativeNumberSearch, pageable);
        }
        
        // Original logic for non-FY searches
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
    
    private Page<Initiative> searchInitiativesWithFinancialYear(String status, String site, String search, 
                                                               String financialYear, boolean isInitiativeNumberSearch, 
                                                               Pageable pageable) {
        // Removed unnecessary INFO logs for financial year filtering
        
        // Calculate financial year date range (same logic as DashboardService)
        LocalDateTime[] fyRange = getFinancialYearRange(financialYear);
        LocalDateTime fyStart = fyRange[0];
        LocalDateTime fyEnd = fyRange[1];
        
        if (status != null && site != null && search != null) {
            if (isInitiativeNumberSearch) {
                return initiativeRepository.findByStatusAndSiteAndInitiativeNumberContainingAndFinancialYear(
                        status, site, search, fyStart, fyEnd, pageable);
            } else {
                return initiativeRepository.findByStatusAndSiteAndTitleContainingAndFinancialYear(
                        status, site, search, fyStart, fyEnd, pageable);
            }
        } else if (search != null) {
            if (isInitiativeNumberSearch) {
                return initiativeRepository.findByInitiativeNumberContainingAndFinancialYear(search, fyStart, fyEnd, pageable);
            } else {
                return initiativeRepository.findByTitleContainingAndFinancialYear(search, fyStart, fyEnd, pageable);
            }
        } else if (status != null && site != null) {
            return initiativeRepository.findByStatusAndSiteAndFinancialYear(status, site, fyStart, fyEnd, pageable);
        } else if (status != null) {
            return initiativeRepository.findByStatusAndFinancialYear(status, fyStart, fyEnd, pageable);
        } else if (site != null) {
            return initiativeRepository.findBySiteAndFinancialYear(site, fyStart, fyEnd, pageable);
        } else {
            return initiativeRepository.findByFinancialYear(fyStart, fyEnd, pageable);
        }
    }
    
    /**
     * Get financial year date range for a specific year as LocalDateTime array [start, end]
     * Same logic as DashboardService.getFinancialYearRange(String financialYear)
     */
    private LocalDateTime[] getFinancialYearRange(String financialYear) {
        int year = Integer.parseInt(financialYear); // e.g., 2025 for FY 2025-26
        
        LocalDate fyStart = LocalDate.of(year, 4, 1);       // April 1st, 2025
        LocalDate fyEnd = LocalDate.of(year + 1, 3, 31);    // March 31st, 2026
        
        return new LocalDateTime[]{
            fyStart.atStartOfDay(),
            fyEnd.atTime(23, 59, 59)
        };
    }

    public Optional<Initiative> getInitiativeById(Long id) {
        return initiativeRepository.findById(id);
    }

    @Transactional
    public Initiative createInitiative(InitiativeRequest request, Long userId) {
        loggingService.info("=== INITIATIVE CREATION STARTED ===");
        loggingService.info("User ID: " + userId + " | Site: " + request.getSite() + " | Discipline: " + request.getDiscipline());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    loggingService.error("Initiative creation failed - User not found: " + userId);
                    return new RuntimeException("User not found");
                });

        loggingService.info("Expected Savings: " + request.getExpectedSavings() + " | Target Value: " + request.getTargetValue() + 
            " | Estimated CAPEX: " + request.getEstimatedCapex());
        loggingService.info("Selected HOD ID: " + request.getSelectedHodId() + " | HOD Email: " + request.getSelectedHodEmail());

        Initiative initiative = new Initiative(
                request.getTitle(),
                request.getDescription(),
                request.getPriority(),
                request.getExpectedSavings(), // Allow zero values
                request.getSite(),
                request.getDiscipline(),
                request.getStartDate(),
                request.getEndDate(),
                user,
                request.getInitiatorName(),
                request.getSelectedHodId()
        );

        initiative.setRequiresMoc(request.getRequiresMoc());
        initiative.setRequiresCapex(request.getRequiresCapex());
        
        // Set new fields for assumptions and additional form data
        initiative.setAssumption1(request.getAssumption1());
        initiative.setAssumption2(request.getAssumption2());
        initiative.setAssumption3(request.getAssumption3());
        initiative.setBaselineData(request.getBaselineData());
        initiative.setTargetOutcome(request.getTargetOutcome());
        initiative.setTargetValue(request.getTargetValue()); // Allow zero values
        initiative.setConfidenceLevel(request.getConfidenceLevel());
        initiative.setEstimatedCapex(request.getEstimatedCapex()); // Allow zero values
        initiative.setBudgetType(request.getBudgetType());
        
        // Generate initiative number
        String initiativeNumber = generateInitiativeNumber(request.getSite(), request.getDiscipline());
        initiative.setInitiativeNumber(initiativeNumber);

        Initiative savedInitiative = initiativeRepository.save(initiative);
        loggingService.info("Initiative created successfully - ID: " + savedInitiative.getId() + 
            " | Number: " + savedInitiative.getInitiativeNumber() + " | Title: " + savedInitiative.getTitle());

        // Create initial workflow stages and transactions with HOD assignment
        // createInitialWorkflowStages(savedInitiative);
        workflowTransactionService.createInitialWorkflowTransactions(savedInitiative, request.getSelectedHodId(), request.getSelectedHodEmail());
        
        loggingService.info("=== INITIATIVE CREATION COMPLETED === Initiative: " + savedInitiative.getInitiativeNumber());

        return savedInitiative;
    }



    @Transactional
    public Initiative updateInitiative(Long id, InitiativeRequest request) {
        loggingService.info("Initiative update started - ID: " + id);
        
        Initiative initiative = initiativeRepository.findById(id)
                .orElseThrow(() -> {
                    loggingService.error("Initiative update failed - Initiative not found: " + id);
                    return new RuntimeException("Initiative not found");
                });

        initiative.setTitle(request.getTitle());
        initiative.setDescription(request.getDescription());
        initiative.setPriority(request.getPriority());
        initiative.setExpectedSavings(request.getExpectedSavings());
        initiative.setActualSavings(request.getActualSavings());
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

        Initiative updated = initiativeRepository.save(initiative);
        loggingService.info("Initiative updated successfully - ID: " + id + " | Number: " + updated.getInitiativeNumber());
        
        return updated;
    }

    public void deleteInitiative(Long id) {
        loggingService.warning("Initiative deletion requested - ID: " + id);
        initiativeRepository.deleteById(id);
        loggingService.info("Initiative deleted - ID: " + id);
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
        loggingService.info("=== MOC/CAPEX UPDATE STARTED === Initiative ID: " + initiativeId);
        
        Optional<Initiative> initiativeOpt = initiativeRepository.findById(initiativeId);
        
        if (initiativeOpt.isPresent()) {
            Initiative initiative = initiativeOpt.get();
            
            loggingService.info("Initiative: " + initiative.getInitiativeNumber() + " - " + initiative.getTitle());
            loggingService.info("Current MOC - Requires: " + initiative.getRequiresMoc() + " | Number: " + initiative.getMocNumber());
            loggingService.info("Current CAPEX - Requires: " + initiative.getRequiresCapex() + " | Number: " + initiative.getCapexNumber());
            
            // Update MOC requirements - Handle String values ('Y'/'N')
            if (mocCapexData.containsKey("requiresMoc")) {
                String requiresMoc = (String) mocCapexData.get("requiresMoc");
                loggingService.info("Updating requiresMoc to: " + requiresMoc);
                initiative.setRequiresMoc(requiresMoc); // Set as String 'Y' or 'N'
            }
            
            if (mocCapexData.containsKey("mocNumber")) {
                String mocNumber = (String) mocCapexData.get("mocNumber");
                loggingService.info("Updating mocNumber to: " + mocNumber);
                initiative.setMocNumber(mocNumber);
            }
            
            // Update CAPEX requirements - Handle String values ('Y'/'N')
            if (mocCapexData.containsKey("requiresCapex")) {
                String requiresCapex = (String) mocCapexData.get("requiresCapex");
                loggingService.info("Updating requiresCapex to: " + requiresCapex);
                initiative.setRequiresCapex(requiresCapex); // Set as String 'Y' or 'N'
            }
            
            if (mocCapexData.containsKey("capexNumber")) {
                String capexNumber = (String) mocCapexData.get("capexNumber");
                loggingService.info("Updating capexNumber to: " + capexNumber);
                initiative.setCapexNumber(capexNumber);
            }
            
            try {
                // Save the updated initiative
                Initiative savedInitiative = initiativeRepository.save(initiative);
                loggingService.info("MOC/CAPEX update successful");
                loggingService.info("Updated MOC - Requires: " + savedInitiative.getRequiresMoc() + " | Number: " + savedInitiative.getMocNumber());
                loggingService.info("Updated CAPEX - Requires: " + savedInitiative.getRequiresCapex() + " | Number: " + savedInitiative.getCapexNumber());
                loggingService.info("=== MOC/CAPEX UPDATE COMPLETED === Initiative: " + savedInitiative.getInitiativeNumber());
                
                return true;
            } catch (Exception e) {
                loggingService.error("MOC/CAPEX update failed - Initiative ID: " + initiativeId, e);
                throw e;
            }
        } else {
            loggingService.error("MOC/CAPEX update failed - Initiative not found: " + initiativeId);
        }
        
        return false;
    }
}