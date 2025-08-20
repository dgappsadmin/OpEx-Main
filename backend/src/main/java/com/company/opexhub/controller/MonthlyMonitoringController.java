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
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/monthly-monitoring")

public class MonthlyMonitoringController {

    @Autowired
    private MonthlyMonitoringService monthlyMonitoringService;
    
    @Autowired
    private WorkflowTransactionService workflowTransactionService;

    /**
     * Get initiatives where Stage 9 is approved and user has access
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

    @GetMapping("/{initiativeId}")
    public ResponseEntity<ApiResponse<List<MonthlyMonitoringEntry>>> getMonitoringEntries(
            @PathVariable Long initiativeId,
            HttpServletRequest request) {
        try {
            // Get user email and role from request (assuming they're set in authentication)
            String userEmail = (String) request.getAttribute("userEmail");
            String userRole = (String) request.getAttribute("userRole");
            
            // Check if user has access to this initiative's savings monitoring
            if (userEmail != null && !workflowTransactionService.hasSavingsMonitoringAccess(initiativeId, userEmail, userRole)) {
              return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(new ApiResponse<>(false, "Access denied: Stage 9 not approved or user not assigned as STLD", null));
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
            
            // Check if user has access to this initiative's savings monitoring
            if (userEmail != null && !workflowTransactionService.hasSavingsMonitoringAccess(initiativeId, userEmail, userRole)) {
              return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(new ApiResponse<>(false, "Access denied: Stage 9 not approved or user not assigned as STLD", null));
            }
            
            YearMonth month = YearMonth.parse(monthYear, DateTimeFormatter.ofPattern("yyyy-MM"));
            List<MonthlyMonitoringEntry> entries = monthlyMonitoringService.getMonitoringEntriesByInitiativeAndMonth(initiativeId, month);
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
            @RequestParam Boolean isFinalized) {
        try {
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
            @RequestParam Boolean faApproval,
            @RequestParam(required = false) String faComments) {
        try {
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
}