package com.company.opexhub.repository;

import com.company.opexhub.entity.WfMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WfMasterRepository extends JpaRepository<WfMaster, Long> {
    
    List<WfMaster> findBySiteAndIsActiveOrderByStageNumber(String site, Boolean isActive);
    
    Optional<WfMaster> findBySiteAndStageNumberAndIsActive(String site, Integer stageNumber, Boolean isActive);
    
    List<WfMaster> findBySiteAndRoleCodeAndIsActive(String site, String roleCode, Boolean isActive);
    
    @Query("SELECT wm FROM WfMaster wm WHERE wm.site = :site AND wm.stageNumber = :stageNumber AND wm.isActive = true")
    Optional<WfMaster> findWorkflowUserForStage(@Param("site") String site, @Param("stageNumber") Integer stageNumber);
}