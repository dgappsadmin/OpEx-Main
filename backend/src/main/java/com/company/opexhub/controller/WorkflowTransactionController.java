package com.company.opexhub.controller;

import com.company.opexhub.dto.ApiResponse;
import com.company.opexhub.dto.WorkflowTransactionDetailDTO;
import com.company.opexhub.entity.WorkflowTransaction;
import com.company.opexhub.security.UserPrincipal;
import com.company.opexhub.service.WorkflowTransactionService;
import com.company.opexhub.service.InitiativeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/workflow-transactions")
public class WorkflowTransactionController {

    @Autowired
    private WorkflowTransactionService workflowTransactionService;

    @Autowired
    private InitiativeService initiativeService;

    @GetMapping("/initiative/{initiativeId}")
    public List<WorkflowTransaction> getWorkflowTransactions(@PathVariable Long initiativeId) {
        return workflowTransactionService.getWorkflowTransactions(initiativeId);
    }
    
    @GetMapping("/visible/{initiativeId}")
    public List<WorkflowTransactionDetailDTO> getVisibleWorkflowTransactions(@PathVariable Long initiativeId) {
        return workflowTransactionService.getVisibleWorkflowTransactions(initiativeId);
    }

    @GetMapping("/pending/{roleCode}")
    public List<WorkflowTransaction> getPendingTransactionsByRole(@PathVariable String roleCode) {
        return workflowTransactionService.getPendingTransactionsByRole(roleCode);
    }

    @GetMapping("/pending/{site}/{roleCode}")
    public List<WorkflowTransaction> getPendingTransactionsBySiteAndRole(@PathVariable String site, 
                                                                        @PathVariable String roleCode) {
        return workflowTransactionService.getPendingTransactionsBySiteAndRole(site, roleCode);
    }

    @GetMapping("/current-pending/{initiativeId}")
    public ResponseEntity<?> getCurrentPendingStage(@PathVariable Long initiativeId) {
        return workflowTransactionService.getCurrentPendingStage(initiativeId)
                .map(transaction -> ResponseEntity.ok(transaction))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/progress/{initiativeId}")
    public ResponseEntity<Integer> getProgressPercentage(@PathVariable Long initiativeId) {
        Integer progress = workflowTransactionService.getProgressPercentage(initiativeId);
        return ResponseEntity.ok(progress);
    }

    @PostMapping("/{transactionId}/process")
    public ResponseEntity<?> processStageAction(@PathVariable Long transactionId,
                                              @RequestBody Map<String, Object> requestBody,
                                              @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            System.out.println("=== WORKFLOW TRANSACTION PROCESSING ===");
            System.out.println("Transaction ID: " + transactionId);
            System.out.println("Request Body: " + requestBody);
            System.out.println("Current User: " + currentUser.getUsername()); // getUsername() returns email
            
            String action = (String) requestBody.get("action"); // "approved" or "rejected"
            String comment = (String) requestBody.get("remarks");
            Long assignedUserId = requestBody.get("assignedUserId") != null ? 
                    Long.valueOf(requestBody.get("assignedUserId").toString()) : null;

            if (comment == null || comment.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Remarks are required"));
            }

            // Extract MOC/CAPEX data from request for Initiative table update
            String requiresMoc = requestBody.get("requiresMoc") != null ? 
                    (String) requestBody.get("requiresMoc") : null;
            String mocNumber = (String) requestBody.get("mocNumber");
            String requiresCapex = requestBody.get("requiresCapex") != null ? 
                    (String) requestBody.get("requiresCapex") : null;
            String capexNumber = (String) requestBody.get("capexNumber");

            System.out.println("MOC/CAPEX Data Extracted:");
            System.out.println("requiresMoc: " + requiresMoc);
            System.out.println("mocNumber: " + mocNumber);
            System.out.println("requiresCapex: " + requiresCapex);
            System.out.println("capexNumber: " + capexNumber);

            // Process the workflow transaction with user authorization check
            WorkflowTransaction transaction = workflowTransactionService.processStageAction(
                    transactionId, action, comment, currentUser.getFullName(), assignedUserId, currentUser.getUsername());

            System.out.println("Processed transaction ID: " + transaction.getId() + " for initiative ID: " + transaction.getInitiativeId());

            // If approved and this is the combined MOC-CAPEX stage, update the Initiative table
            if ("approved".equals(action) && transaction.getStageNumber() == 5) {
                System.out.println("Processing MOC/CAPEX update for approved stage " + transaction.getStageNumber() + "...");
                
                Map<String, Object> mocCapexData = new HashMap<>();
                
                // Save both MOC and CAPEX data for combined Stage 5 (was Stage 4)
                if (requiresMoc != null) {
                    mocCapexData.put("requiresMoc", requiresMoc);
                }
                if (mocNumber != null && !mocNumber.trim().isEmpty()) {
                    mocCapexData.put("mocNumber", mocNumber);
                }
                if (requiresCapex != null) {
                    mocCapexData.put("requiresCapex", requiresCapex);
                }
                if (capexNumber != null && !capexNumber.trim().isEmpty()) {
                    mocCapexData.put("capexNumber", capexNumber);
                }
                
                System.out.println("MOC/CAPEX data to update: " + mocCapexData);
                
                // Update Initiative with MOC/CAPEX data
                if (!mocCapexData.isEmpty()) {
                    boolean updated = initiativeService.updateMocCapexRequirements(transaction.getInitiativeId(), mocCapexData);
                    System.out.println("Initiative MOC/CAPEX update result: " + updated);
                } else {
                    System.out.println("No MOC/CAPEX data to update (empty map)");
                }
            } else {
                System.out.println("Skipping MOC/CAPEX update - Action: " + action + ", Stage: " + (transaction != null ? transaction.getStageNumber() : "null"));
            }

            return ResponseEntity.ok(new ApiResponse<>(true, 
                    "Stage " + action + " successfully", transaction));

        } catch (Exception e) {
            System.err.println("Error in processStageAction: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }
    // ADD THIS METHOD TO THE EXISTING WorkflowTransactionController.java

// Add this method to fetch workflow transactions by initiative ID
@GetMapping("/{initiativeId}")
public ResponseEntity<List<WorkflowTransactionDetailDTO>> getWorkflowTransactionsByInitiative(
        @PathVariable Long initiativeId) {
    
    try {
        List<WorkflowTransactionDetailDTO> transactions = workflowTransactionService
                .getVisibleWorkflowTransactions(initiativeId);
        return ResponseEntity.ok(transactions);
    } catch (Exception e) {
        return ResponseEntity.badRequest().build();
    }
}
    @GetMapping("/ready-for-closure")
    public List<WorkflowTransactionDetailDTO> getInitiativesReadyForClosure() {
        return workflowTransactionService.getInitiativesReadyForClosure();
    }
}