package com.company.opexhub.controller;

import com.company.opexhub.entity.WfMaster;
import com.company.opexhub.service.WfMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/wf-master")
@CrossOrigin(origins = "*")
public class WfMasterController {

    @Autowired
    private WfMasterService wfMasterService;

    @GetMapping("/site/{site}")
    public ResponseEntity<List<WfMaster>> getWorkflowConfigForSite(@PathVariable String site) {
        List<WfMaster> workflowConfig = wfMasterService.getWorkflowConfigForSite(site);
        return ResponseEntity.ok(workflowConfig);
    }

    @GetMapping("/site/{site}/stage/{stageNumber}")
    public ResponseEntity<WfMaster> getWorkflowUserForStage(@PathVariable String site, @PathVariable Integer stageNumber) {
        Optional<WfMaster> workflowUser = wfMasterService.getWorkflowUserForStage(site, stageNumber);
        return workflowUser.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/site/{site}/stage/{stageNumber}/next-user")
    public ResponseEntity<String> getNextPendingUserName(@PathVariable String site, @PathVariable Integer stageNumber) {
        String nextUser = wfMasterService.getNextPendingUserName(site, stageNumber);
        return ResponseEntity.ok(nextUser);
    }

    @GetMapping("/site/{site}/stage/{stageNumber}/next-stage")
    public ResponseEntity<String> getNextPendingStageName(@PathVariable String site, @PathVariable Integer stageNumber) {
        String nextStage = wfMasterService.getNextPendingStageName(site, stageNumber);
        return ResponseEntity.ok(nextStage);
    }

    @GetMapping("/stage/{stageNumber}/name")
    public ResponseEntity<String> getDynamicStageName(@PathVariable Integer stageNumber, 
                                                      @RequestParam(required = false, defaultValue = "NDS") String site) {
        String stageName = wfMasterService.getDynamicStageName(stageNumber, site);
        return ResponseEntity.ok(stageName);
    }

    @GetMapping("/all-stage-names")
    public ResponseEntity<Map<Integer, String>> getAllWorkflowStageNames() {
        Map<Integer, String> allStages = wfMasterService.getAllWorkflowStageNames();
        return ResponseEntity.ok(allStages);
    }

    @GetMapping("/all-role-descriptions")
    public ResponseEntity<Map<String, String>> getAllRoleDescriptions() {
        Map<String, String> roleDescriptions = wfMasterService.getAllRoleDescriptions();
        return ResponseEntity.ok(roleDescriptions);
    }
}