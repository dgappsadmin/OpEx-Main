package com.company.opexhub.service;

import com.company.opexhub.entity.WorkflowStage;
import com.company.opexhub.repository.WorkflowStageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Optional;

@Service
public class WorkflowStageService {

    @Autowired
    private WorkflowStageRepository workflowStageRepository;

    @PostConstruct
    public void initializeWorkflowStages() {
        // Only initialize if no stages exist
        if (workflowStageRepository.count() == 0) {
            createMasterStages();
        }
    }

    private void createMasterStages() {
        // Create master workflow stages for all sites
        String[] sites = {"NDS", "HSD1", "HSD2", "HSD3", "DHJ", "APL", "TCD"};
        
        for (String site : sites) {
            createStagesForSite(site);
        }
    }

    private void createStagesForSite(String site) {
        // Update sites to use correct codes
        String[] sites = {"NDS", "HSD1", "HSD2", "HSD3", "DHJ", "APL", "TCD"};
        
        for (String correctSite : sites) {
            if (!correctSite.equals(site)) continue;
            
            WorkflowStage[] stages = {
                new WorkflowStage(1, "Register Initiative", "STLD", correctSite),
                new WorkflowStage(2, "Approval", "SH", correctSite),
                new WorkflowStage(3, "Define Responsibilities", "EH", correctSite),
                new WorkflowStage(4, "MOC Stage", "IL", correctSite),
                new WorkflowStage(5, "CAPEX Stage", "IL", correctSite),
                new WorkflowStage(6, "Initiative Timeline Tracker", "IL", correctSite),
                new WorkflowStage(7, "Trial Implementation & Performance Check", "STLD", correctSite),
                new WorkflowStage(8, "Periodic Status Review with CMO", "CTSD", correctSite),
                new WorkflowStage(9, "Savings Monitoring (1 Month)", "STLD", correctSite),
                new WorkflowStage(10, "Saving Validation with F&A", "STLD", correctSite),
                new WorkflowStage(11, "Initiative Closure", "STLD", correctSite)
            };

            for (WorkflowStage stage : stages) {
                workflowStageRepository.save(stage);
            }
        }
    }

    public List<WorkflowStage> getAllStagesBySite(String site) {
        return workflowStageRepository.findBySiteOrderByStageNumber(site);
    }

    public Optional<WorkflowStage> getStageByNumber(String site, Integer stageNumber) {
        return workflowStageRepository.findBySiteAndStageNumber(site, stageNumber);
    }

    public List<WorkflowStage> getStagesByRole(String requiredRole) {
        return workflowStageRepository.findByRequiredRole(requiredRole);
    }

    public List<WorkflowStage> getStagesBySiteAndRole(String site, String requiredRole) {
        return workflowStageRepository.findBySiteAndRequiredRole(site, requiredRole);
    }
}