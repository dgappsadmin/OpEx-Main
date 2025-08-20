package com.company.opexhub.repository;

import com.company.opexhub.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    List<Comment> findByInitiative_Id(Long initiativeId);
    
    List<Comment> findByUser_Id(Long userId);
    
    List<Comment> findByType(String type);
    
    @Query("SELECT c FROM Comment c WHERE c.initiative.id = :initiativeId ORDER BY c.createdAt DESC")
    List<Comment> findByInitiativeIdOrderByCreatedAtDesc(@Param("initiativeId") Long initiativeId);
    
    @Query("SELECT c FROM Comment c WHERE c.initiative.id = :initiativeId AND c.stageNumber = :stageNumber")
    List<Comment> findByInitiativeIdAndStageNumber(@Param("initiativeId") Long initiativeId, 
                                                  @Param("stageNumber") Integer stageNumber);
}