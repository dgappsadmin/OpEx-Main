package com.company.opexhub.controller;

import com.company.opexhub.dto.ApiResponse;
import com.company.opexhub.entity.TimelineEntry;
import com.company.opexhub.service.TimelineEntryService;
import com.company.opexhub.service.WorkflowTransactionService;
import com.company.opexhub.dto.WorkflowTransactionDetailDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/timeline-tracker")

public class TimelineTrackerController {

    @Autowired
    private TimelineEntryService timelineEntryService;
    
    @Autowired
    private WorkflowTransactionService workflowTransactionService;

    /**
     * Get initiatives where Stage 6 is approved and user has access
     */
    @GetMapping("/approved-initiatives/{userEmail}/{site}")
    public ResponseEntity<ApiResponse<List<WorkflowTransactionDetailDTO>>> getApprovedInitiativesForUser(
            @PathVariable String userEmail, @PathVariable String site) {
        try {
            List<WorkflowTransactionDetailDTO> initiatives = workflowTransactionService
                    .getInitiativesWithApprovedStage6ForUser(userEmail, site);
            return ResponseEntity.ok(new ApiResponse<>(true, "Approved initiatives retrieved successfully", initiatives));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving approved initiatives: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{initiativeId}")
    public ResponseEntity<ApiResponse<List<TimelineEntry>>> getTimelineEntries(
            @PathVariable Long initiativeId,
            HttpServletRequest request) {
        try {
            // Get user email from request (assuming it's set in authentication)
            String userEmail = (String) request.getAttribute("userEmail");
            
            // Check if user has access to this initiative's timeline tracker
            if (userEmail != null && !workflowTransactionService.hasTimelineTrackerAccess(initiativeId, userEmail)) {
              return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(new ApiResponse<>(false, "Access denied: Stage 6 not approved or user not assigned", null));
            }
            
            List<TimelineEntry> entries = timelineEntryService.getTimelineEntriesByInitiative(initiativeId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Timeline entries retrieved successfully", entries));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving timeline entries: " + e.getMessage(), null));
        }
    }

    @GetMapping("/entry/{id}")
    public ResponseEntity<ApiResponse<TimelineEntry>> getTimelineEntryById(@PathVariable Long id) {
        try {
            Optional<TimelineEntry> entry = timelineEntryService.getTimelineEntryById(id);
            if (entry.isPresent()) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Timeline entry retrieved successfully", entry.get()));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving timeline entry: " + e.getMessage(), null));
        }
    }

    @PostMapping("/{initiativeId}")
    public ResponseEntity<ApiResponse<TimelineEntry>> createTimelineEntry(
            @PathVariable Long initiativeId,
            @RequestBody TimelineEntry timelineEntry,
            HttpServletRequest request) {
        try {
            // Get user email from request
            String userEmail = (String) request.getAttribute("userEmail");
            
            // Check if user has access to create timeline entries for this initiative
            if (userEmail != null && !workflowTransactionService.hasTimelineTrackerAccess(initiativeId, userEmail)) {
              return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(new ApiResponse<>(false, "Access denied: Stage 6 not approved or user not assigned", null));
            }
            
            TimelineEntry createdEntry = timelineEntryService.createTimelineEntry(initiativeId, timelineEntry);
            return ResponseEntity.ok(new ApiResponse<>(true, "Timeline entry created successfully", createdEntry));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error creating timeline entry: " + e.getMessage(), null));
        }
    }

    @PutMapping("/entry/{id}")
    public ResponseEntity<ApiResponse<TimelineEntry>> updateTimelineEntry(
            @PathVariable Long id,
            @RequestBody TimelineEntry timelineEntry,
            HttpServletRequest request) {
        try {
            // Get the existing entry to check initiative access
            Optional<TimelineEntry> existingEntry = timelineEntryService.getTimelineEntryById(id);
            if (existingEntry.isPresent()) {
                String userEmail = (String) request.getAttribute("userEmail");
                Long initiativeId = existingEntry.get().getInitiative().getId();
                
                // Check if user has access
                if (userEmail != null && !workflowTransactionService.hasTimelineTrackerAccess(initiativeId, userEmail)) {
                  return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(new ApiResponse<>(false, "Access denied: Stage 6 not approved or user not assigned", null));
                }
            }
            
            TimelineEntry updatedEntry = timelineEntryService.updateTimelineEntry(id, timelineEntry);
            return ResponseEntity.ok(new ApiResponse<>(true, "Timeline entry updated successfully", updatedEntry));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error updating timeline entry: " + e.getMessage(), null));
        }
    }

    @PutMapping("/entry/{id}/approvals")
    public ResponseEntity<ApiResponse<TimelineEntry>> updateApprovals(
            @PathVariable Long id,
            @RequestParam(required = false) Boolean siteLeadApproval,
            @RequestParam(required = false) Boolean initiativeLeadApproval) {
        try {
            TimelineEntry updatedEntry = timelineEntryService.updateApprovals(id, siteLeadApproval, initiativeLeadApproval);
            return ResponseEntity.ok(new ApiResponse<>(true, "Approvals updated successfully", updatedEntry));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error updating approvals: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/entry/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTimelineEntry(
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            // Get the existing entry to check initiative access
            Optional<TimelineEntry> existingEntry = timelineEntryService.getTimelineEntryById(id);
            if (existingEntry.isPresent()) {
                String userEmail = (String) request.getAttribute("userEmail");
                Long initiativeId = existingEntry.get().getInitiative().getId();
                
                // Check if user has access
                if (userEmail != null && !workflowTransactionService.hasTimelineTrackerAccess(initiativeId, userEmail)) {
              return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(new ApiResponse<>(false, "Access denied: Stage 6 not approved or user not assigned", null));
                }
            }
            
            timelineEntryService.deleteTimelineEntry(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Timeline entry deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error deleting timeline entry: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{initiativeId}/pending-approvals")
    public ResponseEntity<ApiResponse<List<TimelineEntry>>> getPendingApprovals(@PathVariable Long initiativeId) {
        try {
            List<TimelineEntry> entries = timelineEntryService.getPendingApprovalsForInitiative(initiativeId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Pending approvals retrieved successfully", entries));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Error retrieving pending approvals: " + e.getMessage(), null));
        }
    }
}