package com.company.opexhub.controller;

import com.company.opexhub.dto.ApiResponse;
import com.company.opexhub.entity.MonthlyMonitoringEntry;
import com.company.opexhub.service.MonthlyMonitoringService;
import com.company.opexhub.service.WorkflowTransactionService;
import com.company.opexhub.dto.WorkflowTransactionDetailDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/monthly-monitoring")

public class MonthlyMonitoringController {

    @Autowired
    private MonthlyMonitoringService monthlyMonitoringService;
    
    @Autowired
    private WorkflowTransactionService workflowTransactionService;

    /**
     * Get initiatives where Stage 8 is approved and current stage is 9 (Savings Monitoring)
     */
    @GetMapping("/approved-initiatives/{userEmail}/{site}")
    public ResponseEntity<ApiResponse<List<WorkflowTransactionDetailDTO>>> getApprovedInitiativesForUser(
            @PathVariable String userEmail, @PathVariable String site) {
        try {
            List<WorkflowTransactionDetailDTO> initiatives = workflowTransactionService
                    .getInitiativesWithApprovedStage9ForUser(userEmail, site);
            return ResponseEntity.ok(new ApiResponse<>(true, "Approved initiatives retrieved successfully", initiatives));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving approved initiatives: " + e.getMessage(), null));
        }
    }

    /**
     * Get initiatives assigned to a specific user as Initiative Lead where Stage 8 is approved
     */
    @GetMapping("/assigned-initiatives/{userEmail}")
    public ResponseEntity<ApiResponse<List<WorkflowTransactionDetailDTO>>> getAssignedInitiatives(
            @PathVariable String userEmail) {
        try {
            List<WorkflowTransactionDetailDTO> initiatives = workflowTransactionService
                    .getAssignedInitiativesForMonthlyMonitoring(userEmail);
            return ResponseEntity.ok(new ApiResponse<>(true, "Assigned initiatives retrieved successfully", initiatives));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving assigned initiatives: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{initiativeId}")
    public ResponseEntity<ApiResponse<List<MonthlyMonitoringEntry>>> getMonitoringEntries(
            @PathVariable Long initiativeId,
            HttpServletRequest request) {
        try {
            // Get user email and role from request (assuming they're set in authentication)
            String userEmail = (String) request.getAttribute("userEmail");
            String userRole = (String) request.getAttribute("userRole");
            
            // Check if user has view access to this initiative's savings monitoring
            if (userEmail != null && !workflowTransactionService.hasSavingsMonitoringViewAccess(initiativeId, userEmail, userRole)) {
              return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(new ApiResponse<>(false, "Access denied: Stage 9 not approved", null));
            }
            
            List<MonthlyMonitoringEntry> entries = monthlyMonitoringService.getMonitoringEntriesByInitiative(initiativeId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Monitoring entries retrieved successfully", entries));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving monitoring entries: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{initiativeId}/month/{monthYear}")
    public ResponseEntity<ApiResponse<List<MonthlyMonitoringEntry>>> getMonitoringEntriesByMonth(
            @PathVariable Long initiativeId,
            @PathVariable String monthYear,
            HttpServletRequest request) {
        try {
            // Get user email and role from request
            String userEmail = (String) request.getAttribute("userEmail");
            String userRole = (String) request.getAttribute("userRole");
            
            // Check if user has view access to this initiative's savings monitoring
            if (userEmail != null && !workflowTransactionService.hasSavingsMonitoringViewAccess(initiativeId, userEmail, userRole)) {
              return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(new ApiResponse<>(false, "Access denied: Stage 9 not approved", null));
            }
            
            // Validate month format - accepts YYYY-MM format
            if (!monthYear.matches("\\d{4}-(0[1-9]|1[0-2])")) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Invalid month format. Expected YYYY-MM format (e.g., 2024-01).", null));
            }
            
            List<MonthlyMonitoringEntry> entries = monthlyMonitoringService.getMonitoringEntriesByInitiativeAndMonth(initiativeId, monthYear);
            return ResponseEntity.ok(new ApiResponse<>(true, "Monitoring entries retrieved successfully", entries));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving monitoring entries: " + e.getMessage(), null));
        }
    }

    @GetMapping("/entry/{id}")
    public ResponseEntity<ApiResponse<MonthlyMonitoringEntry>> getMonitoringEntryById(@PathVariable Long id) {
        try {
            Optional<MonthlyMonitoringEntry> entry = monthlyMonitoringService.getMonitoringEntryById(id);
            if (entry.isPresent()) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Monitoring entry retrieved successfully", entry.get()));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving monitoring entry: " + e.getMessage(), null));
        }
    }

    @PostMapping("/{initiativeId}")
    public ResponseEntity<ApiResponse<MonthlyMonitoringEntry>> createMonitoringEntry(
            @PathVariable Long initiativeId,
            @RequestBody MonthlyMonitoringEntry monitoringEntry,
            HttpServletRequest request) {
        try {
            // Get user email and role from request
            String userEmail = (String) request.getAttribute("userEmail");
            String userRole = (String) request.getAttribute("userRole");
            
            // Check if user has access to create monitoring entries for this initiative
            if (userEmail != null && !workflowTransactionService.hasSavingsMonitoringAccess(initiativeId, userEmail, userRole)) {
               return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(new ApiResponse<>(false, "Access denied: Stage 9 not approved or user not assigned as STLD", null));
            }
            
            // Validate required fields and format
            if (monitoringEntry.getMonitoringMonth() == null || 
                !monitoringEntry.getMonitoringMonth().matches("\\d{4}-(0[1-9]|1[0-2])")) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Invalid monitoring month format. Expected YYYY-MM format (e.g., 2024-01).", null));
            }
            
            MonthlyMonitoringEntry createdEntry = monthlyMonitoringService.createMonitoringEntry(initiativeId, monitoringEntry);
            return ResponseEntity.ok(new ApiResponse<>(true, "Monitoring entry created successfully", createdEntry));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error creating monitoring entry: " + e.getMessage(), null));
        }
    }

    @PutMapping("/entry/{id}")
    public ResponseEntity<ApiResponse<MonthlyMonitoringEntry>> updateMonitoringEntry(
            @PathVariable Long id,
            @RequestBody MonthlyMonitoringEntry monitoringEntry,
            HttpServletRequest request) {
        try {
            // Get the existing entry to check initiative access
            Optional<MonthlyMonitoringEntry> existingEntry = monthlyMonitoringService.getMonitoringEntryById(id);
            if (existingEntry.isPresent()) {
                String userEmail = (String) request.getAttribute("userEmail");
                String userRole = (String) request.getAttribute("userRole");
                Long initiativeId = existingEntry.get().getInitiative().getId();
                
                // Check if user has access
                if (userEmail != null && !workflowTransactionService.hasSavingsMonitoringAccess(initiativeId, userEmail, userRole)) {
                   return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(new ApiResponse<>(false, "Access denied: Stage 9 not approved or user not assigned as STLD", null));
                }
            }
            
            MonthlyMonitoringEntry updatedEntry = monthlyMonitoringService.updateMonitoringEntry(id, monitoringEntry);
            return ResponseEntity.ok(new ApiResponse<>(true, "Monitoring entry updated successfully", updatedEntry));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error updating monitoring entry: " + e.getMessage(), null));
        }
    }

    @PutMapping("/entry/{id}/finalize")
    public ResponseEntity<ApiResponse<MonthlyMonitoringEntry>> updateFinalizationStatus(
            @PathVariable Long id,
            @RequestParam String isFinalized) {
        try {
            // Validate Y/N parameter
            if (!"Y".equals(isFinalized) && !"N".equals(isFinalized)) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Invalid finalization status. Must be 'Y' or 'N'.", null));
            }
            
            MonthlyMonitoringEntry updatedEntry = monthlyMonitoringService.updateFinalizationStatus(id, isFinalized);
            return ResponseEntity.ok(new ApiResponse<>(true, "Finalization status updated successfully", updatedEntry));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error updating finalization status: " + e.getMessage(), null));
        }
    }

    @PutMapping("/entry/{id}/fa-approval")
    public ResponseEntity<ApiResponse<MonthlyMonitoringEntry>> updateFAApproval(
            @PathVariable Long id,
            @RequestParam String faApproval,
            @RequestParam(required = false) String faComments) {
        try {
            // Validate Y/N parameter
            if (!"Y".equals(faApproval) && !"N".equals(faApproval)) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Invalid FA approval status. Must be 'Y' or 'N'.", null));
            }
            
            MonthlyMonitoringEntry updatedEntry = monthlyMonitoringService.updateFAApproval(id, faApproval, faComments);
            return ResponseEntity.ok(new ApiResponse<>(true, "F&A approval updated successfully", updatedEntry));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error updating F&A approval: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/entry/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMonitoringEntry(
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            // Get the existing entry to check initiative access
            Optional<MonthlyMonitoringEntry> existingEntry = monthlyMonitoringService.getMonitoringEntryById(id);
            if (existingEntry.isPresent()) {
                String userEmail = (String) request.getAttribute("userEmail");
                String userRole = (String) request.getAttribute("userRole");
                Long initiativeId = existingEntry.get().getInitiative().getId();
                
                // Check if user has access
                if (userEmail != null && !workflowTransactionService.hasSavingsMonitoringAccess(initiativeId, userEmail, userRole)) {
                   return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(new ApiResponse<>(false, "Access denied: Stage 9 not approved or user not assigned as STLD", null));
                }
            }
            
            monthlyMonitoringService.deleteMonitoringEntry(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Monitoring entry deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error deleting monitoring entry: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{initiativeId}/pending-fa-approvals")
    public ResponseEntity<ApiResponse<List<MonthlyMonitoringEntry>>> getPendingFAApprovals(@PathVariable Long initiativeId) {
        try {
            List<MonthlyMonitoringEntry> entries = monthlyMonitoringService.getPendingFAApprovalsForInitiative(initiativeId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Pending F&A approvals retrieved successfully", entries));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving pending F&A approvals: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{initiativeId}/finalized-pending-fa")
    public ResponseEntity<ApiResponse<List<MonthlyMonitoringEntry>>> getFinalizedPendingFAEntries(@PathVariable Long initiativeId) {
        try {
            List<MonthlyMonitoringEntry> entries = monthlyMonitoringService.getFinalizedPendingFAEntries(initiativeId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Finalized pending F&A entries retrieved successfully", entries));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving finalized pending F&A entries: " + e.getMessage(), null));
        }
    }

    @PostMapping("/batch-fa-approval")
    public ResponseEntity<ApiResponse<List<MonthlyMonitoringEntry>>> batchFAApproval(
            @RequestBody Map<String, Object> requestBody) {
        try {
            @SuppressWarnings("unchecked")
            List<Object> entryIdsRaw = (List<Object>) requestBody.get("entryIds");
            String faComments = (String) requestBody.get("faComments");
            
            if (entryIdsRaw == null || entryIdsRaw.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Entry IDs are required for batch approval", null));
            }
            
            // Convert Object list to Long list with proper type handling
            List<Long> entryIds = new ArrayList<>();
            for (Object idObj : entryIdsRaw) {
                try {
                    if (idObj instanceof Number) {
                        entryIds.add(((Number) idObj).longValue());
                    } else if (idObj instanceof String) {
                        entryIds.add(Long.parseLong((String) idObj));
                    } else {
                        throw new IllegalArgumentException("Invalid entry ID format: " + idObj);
                    }
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest()
                            .body(new ApiResponse<>(false, "Invalid entry ID format: " + idObj, null));
                }
            }
            
            List<MonthlyMonitoringEntry> updatedEntries = monthlyMonitoringService.batchFAApproval(entryIds, faComments);
            return ResponseEntity.ok(new ApiResponse<>(true, "Batch F&A approval completed successfully", updatedEntries));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error processing batch F&A approval: " + e.getMessage(), null));
        }
    }

    /**
     * Check if all monthly monitoring entries for an initiative are finalized
     */
    @GetMapping("/validation/{initiativeId}/all-finalized")
    public ResponseEntity<ApiResponse<Boolean>> areAllEntriesFinalized(@PathVariable Long initiativeId) {
        try {
            boolean allFinalized = monthlyMonitoringService.areAllEntriesFinalized(initiativeId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Validation completed", allFinalized));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error validating entries: " + e.getMessage(), false));
        }
    }

    /**
     * Get monthly actual savings data for reporting
     */
    @GetMapping("/monthly-actual-savings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMonthlyActualSavings(
            @RequestParam(required = false) String site,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String budgetType) {
        try {
            Map<String, Object> data = monthlyMonitoringService.getMonthlyActualSavings(site, year, budgetType);
            return ResponseEntity.ok(new ApiResponse<>(true, "Monthly actual savings data retrieved successfully", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving monthly actual savings data: " + e.getMessage(), null));
        }
    }

    /**
     * Get monthly target vs achieved savings data for reporting
     */
    @GetMapping("/monthly-target-achieved")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMonthlyTargetAchievedData(
            @RequestParam(required = false) String site,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String budgetType) {
        try {
            Map<String, Object> data = monthlyMonitoringService.getMonthlyTargetAchievedData(site, year, budgetType);
            return ResponseEntity.ok(new ApiResponse<>(true, "Monthly target vs achieved data retrieved successfully", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving monthly target vs achieved data: " + e.getMessage(), null));
        }
    }
}