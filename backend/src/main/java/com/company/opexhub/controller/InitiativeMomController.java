package com.company.opexhub.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
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
import com.company.opexhub.service.InitiativeMomService;
import com.company.opexhub.service.InitiativeMomService.InitiativeMomDTO;
import com.company.opexhub.service.InitiativeMomService.MomCreateRequest;
import com.company.opexhub.service.InitiativeMomService.MomUpdateRequest;

@RestController
@RequestMapping("/opexhub/api/initiatives/{initiativeId}/moms")
@CrossOrigin(origins = "*")
public class InitiativeMomController {

    @Autowired
    private InitiativeMomService momService;

    /**
     * Get all MOM entries for an initiative
     */
    @GetMapping
    public ResponseEntity<List<InitiativeMomDTO>> getMomsByInitiative(@PathVariable Long initiativeId) {
        try {
            List<InitiativeMomDTO> moms = momService.getMomsByInitiativeId(initiativeId);
            return ResponseEntity.ok(moms);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get MOM entries for an initiative filtered by month
     */
    @GetMapping("/filter")
    public ResponseEntity<List<InitiativeMomDTO>> getMomsByInitiativeAndMonth(
            @PathVariable Long initiativeId,
            @RequestParam int year,
            @RequestParam int month) {
        try {
            List<InitiativeMomDTO> moms = momService.getMomsByInitiativeIdAndMonth(initiativeId, year, month);
            return ResponseEntity.ok(moms);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get available months for an initiative's MOM entries
     */
    @GetMapping("/months")
    public ResponseEntity<List<Map<String, Object>>> getAvailableMonths(@PathVariable Long initiativeId) {
        try {
            List<Map<String, Object>> months = momService.getAvailableMonths(initiativeId);
            return ResponseEntity.ok(months);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get a specific MOM entry by ID
     */
    @GetMapping("/{momId}")
    public ResponseEntity<InitiativeMomDTO> getMomById(@PathVariable Long initiativeId, @PathVariable Long momId) {
        try {
            InitiativeMomDTO mom = momService.getMomById(momId, initiativeId);
            return ResponseEntity.ok(mom);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Create a new MOM entry
     */
    @PostMapping
    public ResponseEntity<?> createMom(@PathVariable Long initiativeId, 
                                      @Valid @RequestBody MomCreateRequest request, 
                                      Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "User not authenticated"));
            }

            InitiativeMomDTO mom = momService.createMom(initiativeId, request, principal.getName());
            return ResponseEntity.ok(mom);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Failed to create MOM entry"));
        }
    }

    /**
     * Update an existing MOM entry
     */
    @PutMapping("/{momId}")
    public ResponseEntity<?> updateMom(@PathVariable Long initiativeId,
                                      @PathVariable Long momId,
                                      @Valid @RequestBody MomUpdateRequest request,
                                      Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "User not authenticated"));
            }

            InitiativeMomDTO mom = momService.updateMom(momId, initiativeId, request, principal.getName());
            return ResponseEntity.ok(mom);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Failed to update MOM entry"));
        }
    }

    /**
     * Delete a MOM entry
     */
    @DeleteMapping("/{momId}")
    public ResponseEntity<ApiResponse> deleteMom(@PathVariable Long initiativeId,
                                               @PathVariable Long momId,
                                               Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(401).body(new ApiResponse(false, "User not authenticated"));
            }

            ApiResponse response = momService.deleteMom(momId, initiativeId, principal.getName());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Failed to delete MOM entry"));
        }
    }
}