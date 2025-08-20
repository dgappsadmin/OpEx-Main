package com.company.opexhub.controller;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.opexhub.dto.ApiResponse;
import com.company.opexhub.dto.InitiativeRequest;
import com.company.opexhub.dto.InitiativeResponse;
import com.company.opexhub.entity.Initiative;
import com.company.opexhub.security.UserPrincipal;
import com.company.opexhub.service.InitiativeService;

@RestController
@RequestMapping("/api/initiatives")
public class InitiativeController {

    @Autowired
    private InitiativeService initiativeService;

    @GetMapping
    public Page<InitiativeResponse> getAllInitiatives(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String site,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        
        Page<Initiative> initiatives = initiativeService.searchInitiatives(status, site, search, pageable);
        return initiatives.map(this::convertToResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InitiativeResponse> getInitiativeById(@PathVariable Long id) {
        return initiativeService.getInitiativeById(id)
                .map(initiative -> ResponseEntity.ok(convertToResponse(initiative)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createInitiative(@Valid @RequestBody InitiativeRequest request,
                                            @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            Initiative initiative = initiativeService.createInitiative(request, currentUser.getId());
            InitiativeResponse response = convertToResponse(initiative);
            
            return ResponseEntity.ok(new ApiResponse(true, "Initiative created successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInitiative(@PathVariable Long id,
                                            @Valid @RequestBody InitiativeRequest request) {
        try {
            Initiative initiative = initiativeService.updateInitiative(id, request);
            InitiativeResponse response = convertToResponse(initiative);
            return ResponseEntity.ok(new ApiResponse(true, "Initiative updated successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInitiative(@PathVariable Long id) {
        try {
            initiativeService.deleteInitiative(id);
            return ResponseEntity.ok(new ApiResponse(true, "Initiative deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Helper method to convert Initiative entity to InitiativeResponse DTO
    private InitiativeResponse convertToResponse(Initiative initiative) {
        InitiativeResponse response = new InitiativeResponse();
        response.setId(initiative.getId());
        response.setTitle(initiative.getTitle());
        response.setDescription(initiative.getDescription());
        response.setStatus(initiative.getStatus());
        response.setPriority(initiative.getPriority());
        response.setExpectedSavings(initiative.getExpectedSavings());
        response.setActualSavings(initiative.getActualSavings());
        response.setSite(initiative.getSite());
        response.setDiscipline(initiative.getDiscipline());
        response.setInitiativeNumber(initiative.getInitiativeNumber());
        response.setStartDate(initiative.getStartDate());
        response.setEndDate(initiative.getEndDate());
        response.setProgressPercentage(initiative.getProgressPercentage());
        response.setCurrentStage(initiative.getCurrentStage()); // This will auto-set currentStageName
        response.setRequiresMoc(initiative.getRequiresMoc());
        response.setRequiresCapex(initiative.getRequiresCapex());
        response.setCreatedAt(initiative.getCreatedAt());
        response.setUpdatedAt(initiative.getUpdatedAt());
        
        // Set creator information
        if (initiative.getCreatedBy() != null) {
            response.setCreatedByName(initiative.getCreatedBy().getFullName());
            response.setCreatedByEmail(initiative.getCreatedBy().getEmail());
        }
        
        // Set new fields for assumptions and additional form data
        response.setAssumption1(initiative.getAssumption1());
        response.setAssumption2(initiative.getAssumption2());
        response.setAssumption3(initiative.getAssumption3());
        response.setBaselineData(initiative.getBaselineData());
        response.setTargetOutcome(initiative.getTargetOutcome());
        response.setTargetValue(initiative.getTargetValue());
        response.setConfidenceLevel(initiative.getConfidenceLevel());
        response.setEstimatedCapex(initiative.getEstimatedCapex());
        response.setBudgetType(initiative.getBudgetType());
        response.setInitiatorName(initiative.getInitiatorName());
        
        return response;
    }
}