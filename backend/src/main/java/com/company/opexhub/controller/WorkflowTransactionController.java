package com.company.opexhub.controller;

import com.company.opexhub.dto.ApiResponse;
import com.company.opexhub.dto.WorkflowTransactionDetailDTO;
import com.company.opexhub.entity.WorkflowTransaction;
import com.company.opexhub.security.UserPrincipal;
import com.company.opexhub.service.WorkflowTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflow-transactions")
public class WorkflowTransactionController {

    @Autowired
    private WorkflowTransactionService workflowTransactionService;

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
            String action = (String) requestBody.get("action"); // "approved" or "rejected"
            String comment = (String) requestBody.get("comment");
            Long assignedUserId = requestBody.get("assignedUserId") != null ? 
                    Long.valueOf(requestBody.get("assignedUserId").toString()) : null;

            if (comment == null || comment.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "Comment is required"));
            }

            // Extract MOC/CAPEX data from request
            Boolean requiresMoc = requestBody.get("requiresMoc") != null ? 
                    (Boolean) requestBody.get("requiresMoc") : null;
            String mocNumber = (String) requestBody.get("mocNumber");
            Boolean requiresCapex = requestBody.get("requiresCapex") != null ? 
                    (Boolean) requestBody.get("requiresCapex") : null;
            String capexNumber = (String) requestBody.get("capexNumber");

            WorkflowTransaction transaction = workflowTransactionService.processStageAction(
                    transactionId, action, comment, currentUser.getFullName(), assignedUserId,
                    requiresMoc, mocNumber, requiresCapex, capexNumber);

            return ResponseEntity.ok(new ApiResponse<>(true, 
                    "Stage " + action + " successfully", transaction));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }
    
    @GetMapping("/ready-for-closure")
    public List<WorkflowTransactionDetailDTO> getInitiativesReadyForClosure() {
        return workflowTransactionService.getInitiativesReadyForClosure();
    }
}