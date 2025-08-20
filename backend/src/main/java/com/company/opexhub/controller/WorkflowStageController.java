package com.company.opexhub.controller;

import com.company.opexhub.entity.WorkflowStage;
import com.company.opexhub.service.WorkflowStageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/workflow-stages")
@CrossOrigin(origins = "*")
public class WorkflowStageController {

    @Autowired
    private WorkflowStageService workflowStageService;

    @GetMapping("/site/{site}")
    public ResponseEntity<List<WorkflowStage>> getStagesBySite(@PathVariable String site) {
        List<WorkflowStage> stages = workflowStageService.getAllStagesBySite(site);
        return ResponseEntity.ok(stages);
    }

    @GetMapping("/site/{site}/stage/{stageNumber}")
    public ResponseEntity<WorkflowStage> getStageByNumber(@PathVariable String site, @PathVariable Integer stageNumber) {
        Optional<WorkflowStage> stage = workflowStageService.getStageByNumber(site, stageNumber);
        return stage.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<WorkflowStage>> getStagesByRole(@PathVariable String role) {
        List<WorkflowStage> stages = workflowStageService.getStagesByRole(role);
        return ResponseEntity.ok(stages);
    }

    @GetMapping("/site/{site}/role/{role}")
    public ResponseEntity<List<WorkflowStage>> getStagesBySiteAndRole(@PathVariable String site, @PathVariable String role) {
        List<WorkflowStage> stages = workflowStageService.getStagesBySiteAndRole(site, role);
        return ResponseEntity.ok(stages);
    }
}