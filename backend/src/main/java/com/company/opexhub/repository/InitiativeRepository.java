package com.company.opexhub.repository;

import com.company.opexhub.entity.Initiative;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InitiativeRepository extends JpaRepository<Initiative, Long> {
    
    Page<Initiative> findByStatus(String status, Pageable pageable);
    
    Page<Initiative> findBySite(String site, Pageable pageable);
    
    Page<Initiative> findByStatusAndSite(String status, String site, Pageable pageable);
    
    Page<Initiative> findByCreatedBy_Id(Long userId, Pageable pageable);
    
    @Query("SELECT i FROM Initiative i WHERE i.title LIKE %:title%")
    Page<Initiative> findByTitleContaining(@Param("title") String title, Pageable pageable);
    
    @Query("SELECT i FROM Initiative i WHERE i.status = :status AND i.site = :site AND i.title LIKE %:title%")
    Page<Initiative> findByStatusAndSiteAndTitleContaining(@Param("status") String status, 
                                                          @Param("site") String site, 
                                                          @Param("title") String title, 
                                                          Pageable pageable);
    
    List<Initiative> findByPriority(String priority);
    
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.status = :status")
    Long countByStatus(@Param("status") String status);
    
    @Query("SELECT i FROM Initiative i WHERE i.createdAt >= :startDate AND i.createdAt <= :endDate")
    List<Initiative> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                           @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT i FROM Initiative i WHERE i.currentStage = :stage")
    List<Initiative> findByCurrentStage(@Param("stage") Integer stage);
    
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.site = :site AND i.discipline = :discipline AND YEAR(i.createdAt) = :year")
    Long countBySiteAndDisciplineAndYear(@Param("site") String site, @Param("discipline") String discipline, @Param("year") Integer year);
    
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.site = :site AND YEAR(i.createdAt) = :year")
    Long countBySiteAndYear(@Param("site") String site, @Param("year") Integer year);
}