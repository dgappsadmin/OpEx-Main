package com.company.opexhub.repository;

import com.company.opexhub.entity.WorkflowStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowStageRepository extends JpaRepository<WorkflowStage, Long> {
    
    List<WorkflowStage> findBySiteOrderByStageNumber(String site);
    
    List<WorkflowStage> findByRequiredRole(String requiredRole);
    
    List<WorkflowStage> findBySiteAndRequiredRole(String site, String requiredRole);
    
    Optional<WorkflowStage> findBySiteAndStageNumber(String site, Integer stageNumber);
    
    @Query("SELECT w FROM WorkflowStage w WHERE w.site = :site ORDER BY w.stageNumber")
    List<WorkflowStage> findAllStagesBySite(@Param("site") String site);
}