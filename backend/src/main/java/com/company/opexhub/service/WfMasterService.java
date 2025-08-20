package com.company.opexhub.service;

import com.company.opexhub.entity.WfMaster;
import com.company.opexhub.repository.WfMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class WfMasterService {

    @Autowired
    private WfMasterRepository wfMasterRepository;

    public List<WfMaster> getWorkflowConfigForSite(String site) {
        return wfMasterRepository.findBySiteAndIsActiveOrderByStageNumber(site, true);
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
}