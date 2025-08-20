package com.company.opexhub.repository;

import com.company.opexhub.entity.WorkflowTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkflowTransactionRepository extends JpaRepository<WorkflowTransaction, Long> {
    
    List<WorkflowTransaction> findByInitiativeIdOrderByStageNumber(Long initiativeId);
    
    List<WorkflowTransaction> findByApproveStatus(String approveStatus);
    
    List<WorkflowTransaction> findByPendingWith(String pendingWith);
    
    List<WorkflowTransaction> findBySiteAndPendingWith(String site, String pendingWith);
    
    @Query("SELECT wt FROM WorkflowTransaction wt WHERE wt.initiativeId = :initiativeId AND wt.stageNumber = :stageNumber")
    Optional<WorkflowTransaction> findByInitiativeIdAndStageNumber(@Param("initiativeId") Long initiativeId, 
                                                                 @Param("stageNumber") Integer stageNumber);
    
    @Query("SELECT wt FROM WorkflowTransaction wt WHERE wt.approveStatus = 'pending' AND wt.pendingWith = :roleCode")
    List<WorkflowTransaction> findPendingTransactionsByRole(@Param("roleCode") String roleCode);
    
    @Query("SELECT wt FROM WorkflowTransaction wt WHERE wt.approveStatus = 'pending' AND wt.site = :site AND wt.pendingWith = :roleCode")
    List<WorkflowTransaction> findPendingTransactionsBySiteAndRole(@Param("site") String site, @Param("roleCode") String roleCode);
    
    @Query(value = "SELECT * FROM workflow_transactions wt WHERE wt.initiative_id = :initiativeId AND wt.approve_status = 'pending' ORDER BY wt.stage_number LIMIT 1", nativeQuery = true)
    Optional<WorkflowTransaction> findCurrentPendingStage(@Param("initiativeId") Long initiativeId);
    
    @Query("SELECT COUNT(wt) FROM WorkflowTransaction wt WHERE wt.initiativeId = :initiativeId AND wt.approveStatus = 'approved'")
    Integer countApprovedStages(@Param("initiativeId") Long initiativeId);
    
    @Query("SELECT COUNT(wt) FROM WorkflowTransaction wt WHERE wt.initiativeId = :initiativeId")
    Integer countTotalStages(@Param("initiativeId") Long initiativeId);
    
    
    @Query("SELECT wt FROM WorkflowTransaction wt WHERE wt.stageNumber = 10 AND wt.approveStatus = 'approved'")
    List<WorkflowTransaction> findInitiativesReadyForClosure();
    
    @Query("SELECT wt FROM WorkflowTransaction wt WHERE wt.stageNumber = :stageNumber AND wt.approveStatus = :approveStatus AND wt.site = :site")
    List<WorkflowTransaction> findByStageNumberAndApproveStatusAndSite(@Param("stageNumber") Integer stageNumber, 
                                                                      @Param("approveStatus") String approveStatus, 
                                                                      @Param("site") String site);
}