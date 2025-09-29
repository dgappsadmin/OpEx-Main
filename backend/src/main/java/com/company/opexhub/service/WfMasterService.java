package com.company.opexhub.service;

import com.company.opexhub.entity.WfMaster;
import com.company.opexhub.repository.WfMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
public class WfMasterService {

    @Autowired
    private WfMasterRepository wfMasterRepository;

    public List<WfMaster> getWorkflowConfigForSite(String site) {
        return wfMasterRepository.findBySiteAndIsActiveOrderByStageNumber(site, "Y");
    }

    public Optional<WfMaster> getWorkflowUserForStage(String site, Integer stageNumber) {
        return wfMasterRepository.findWorkflowUserForStage(site, stageNumber);
    }

    public String getNextPendingUserName(String site, Integer currentStageNumber) {
        Optional<WfMaster> nextStage = wfMasterRepository.findWorkflowUserForStage(site, currentStageNumber + 1);
        return nextStage.map(WfMaster::getUserEmail).orElse("No next stage");
    }

    public String getNextPendingStageName(String site, Integer currentStageNumber) {
        Optional<WfMaster> nextStage = wfMasterRepository.findWorkflowUserForStage(site, currentStageNumber + 1);
        return nextStage.map(WfMaster::getStageName).orElse("No next stage");
    }
    
    /**
     * Get dynamic stage name by stage number - includes both WfMaster and dynamic IL stages
     * This method provides frontend with flexible, database-driven stage names
     */
    public String getDynamicStageName(Integer stageNumber, String site) {
        // First check WfMaster table for predefined stages
        Optional<WfMaster> wfMasterStage = wfMasterRepository.findWorkflowUserForStage(site, stageNumber);
        if (wfMasterStage.isPresent()) {
            return wfMasterStage.get().getStageName();
        }
        
        // For dynamic IL stages not in WfMaster, return standard names
        Map<Integer, String> dynamicStageNames = new HashMap<>();
        dynamicStageNames.put(5, "MOC-CAPEX Evaluation");
        dynamicStageNames.put(6, "Initiative Timeline Tracker");
        dynamicStageNames.put(9, "Savings Monitoring (Monthly)");
        dynamicStageNames.put(11, "Initiative Closure");
        
        return dynamicStageNames.getOrDefault(stageNumber, "Stage " + stageNumber);
    }
    
    /**
     * Get all possible stage names for the new 11-stage workflow
     * This provides frontend with complete stage information without hardcoding
     */
    public Map<Integer, String> getAllWorkflowStageNames() {
        Map<Integer, String> allStages = new HashMap<>();
        allStages.put(1, "Initiative Registered");
        allStages.put(2, "Evaluation and Approval");
        allStages.put(3, "Initiative assessment and approval");
        allStages.put(4, "Define Responsibilities");
        allStages.put(5, "MOC-CAPEX Evaluation");
        allStages.put(6, "Initiative Timeline Tracker");
        allStages.put(7, "Progress monitoring");
        allStages.put(8, "Periodic Status Review with CMO");
        allStages.put(9, "Savings Monitoring (Monthly)");
        allStages.put(10, "Saving Validation with F&A (Monthly)");
        allStages.put(11, "Initiative Closure");
        return allStages;
    }
    
    /**
     * Get all possible role descriptions for workflow stages
     * This provides frontend with role information without hardcoding
     */
    public Map<String, String> getAllRoleDescriptions() {
        Map<String, String> roleDescriptions = new HashMap<>();
        roleDescriptions.put("HOD", "Head of Department");
        roleDescriptions.put("STLD", "Site TSD Lead");
        roleDescriptions.put("CTSD", "Corporate TSD");
        roleDescriptions.put("SH", "Site Head");
        roleDescriptions.put("IL", "Initiative Lead");
        roleDescriptions.put("F&A", "Site F&A");
        roleDescriptions.put("ANYONE", "Any User");
        return roleDescriptions;
    }
}