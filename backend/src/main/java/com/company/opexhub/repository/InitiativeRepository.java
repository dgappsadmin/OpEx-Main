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
    
    @Query("SELECT i FROM Initiative i WHERE i.initiativeNumber LIKE %:initiativeNumber%")
    Page<Initiative> findByInitiativeNumberContaining(@Param("initiativeNumber") String initiativeNumber, Pageable pageable);
    
    @Query("SELECT i FROM Initiative i WHERE i.status = :status AND i.site = :site AND i.title LIKE %:title%")
    Page<Initiative> findByStatusAndSiteAndTitleContaining(@Param("status") String status, 
                                                          @Param("site") String site, 
                                                          @Param("title") String title, 
                                                          Pageable pageable);
    
    @Query("SELECT i FROM Initiative i WHERE i.status = :status AND i.site = :site AND i.initiativeNumber LIKE %:initiativeNumber%")
    Page<Initiative> findByStatusAndSiteAndInitiativeNumberContaining(@Param("status") String status, 
                                                                     @Param("site") String site, 
                                                                     @Param("initiativeNumber") String initiativeNumber, 
                                                                     Pageable pageable);
    
    @Query("SELECT i FROM Initiative i WHERE i.status = :status AND i.initiativeNumber LIKE %:initiativeNumber%")
    Page<Initiative> findByStatusAndInitiativeNumberContaining(@Param("status") String status, 
                                                              @Param("initiativeNumber") String initiativeNumber, 
                                                              Pageable pageable);
    
    @Query("SELECT i FROM Initiative i WHERE i.site = :site AND i.initiativeNumber LIKE %:initiativeNumber%")
    Page<Initiative> findBySiteAndInitiativeNumberContaining(@Param("site") String site, 
                                                            @Param("initiativeNumber") String initiativeNumber, 
                                                            Pageable pageable);
    
    List<Initiative> findByPriority(String priority);
    
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.status = :status")
    Long countByStatus(@Param("status") String status);
    
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.status = :status AND i.site = :site")
    Long countByStatusAndSite(@Param("status") String status, @Param("site") String site);
    
    @Query("SELECT i FROM Initiative i WHERE i.createdAt >= :startDate AND i.createdAt <= :endDate")
    List<Initiative> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                           @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT i FROM Initiative i WHERE i.currentStage = :stage")
    List<Initiative> findByCurrentStage(@Param("stage") Integer stage);
    
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.site = :site AND i.discipline = :discipline AND YEAR(i.createdAt) = :year")
    Long countBySiteAndDisciplineAndYear(@Param("site") String site, @Param("discipline") String discipline, @Param("year") Integer year);
    
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.site = :site AND YEAR(i.createdAt) = :year")
    Long countBySiteAndYear(@Param("site") String site, @Param("year") Integer year);
    
    // Performance Analysis Queries
    @Query("SELECT COUNT(i) FROM Initiative i WHERE LOWER(COALESCE(i.budgetType, 'budgeted')) = :budgetType")
    Long countByBudgetType(@Param("budgetType") String budgetType);
    
    @Query("SELECT SUM(i.expectedSavings) FROM Initiative i WHERE i.createdAt >= :startDate AND i.createdAt <= :endDate AND i.status NOT IN ('Rejected', 'Dropped')")
    java.math.BigDecimal sumExpectedSavingsByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                                             @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT SUM(i.expectedSavings) FROM Initiative i WHERE i.createdAt >= :startDate AND i.createdAt <= :endDate AND LOWER(COALESCE(i.budgetType, 'budgeted')) = :budgetType AND i.status NOT IN ('Rejected', 'Dropped')")
    java.math.BigDecimal sumExpectedSavingsByCreatedAtBetweenAndBudgetType(@Param("startDate") LocalDateTime startDate, 
                                                                          @Param("endDate") LocalDateTime endDate,
                                                                          @Param("budgetType") String budgetType);
    
    @Query("SELECT SUM(i.expectedSavings) FROM Initiative i WHERE i.status NOT IN ('Rejected', 'Dropped')")
    java.math.BigDecimal sumAllExpectedSavings();
    
    @Query("SELECT SUM(i.expectedSavings) FROM Initiative i WHERE LOWER(COALESCE(i.budgetType, 'budgeted')) = :budgetType AND i.status NOT IN ('Rejected', 'Dropped')")
    java.math.BigDecimal sumExpectedSavingsByBudgetType(@Param("budgetType") String budgetType);
    
    // Site-specific performance analysis queries
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.site = :site")
    Long countBySite(@Param("site") String site);
    
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.site = :site AND LOWER(COALESCE(i.budgetType, 'budgeted')) = :budgetType")
    Long countBySiteAndBudgetType(@Param("site") String site, @Param("budgetType") String budgetType);
    
    @Query("SELECT SUM(i.expectedSavings) FROM Initiative i WHERE i.site = :site AND i.status NOT IN ('Rejected', 'Dropped')")
    java.math.BigDecimal sumAllExpectedSavingsBySite(@Param("site") String site);
    
    @Query("SELECT SUM(i.expectedSavings) FROM Initiative i WHERE i.site = :site AND LOWER(COALESCE(i.budgetType, 'budgeted')) = :budgetType AND i.status NOT IN ('Rejected', 'Dropped')")
    java.math.BigDecimal sumExpectedSavingsBySiteAndBudgetType(@Param("site") String site, @Param("budgetType") String budgetType);
    
    @Query("SELECT SUM(i.expectedSavings) FROM Initiative i WHERE i.site = :site AND i.createdAt >= :startDate AND i.createdAt <= :endDate AND i.status NOT IN ('Rejected', 'Dropped')")
    java.math.BigDecimal sumExpectedSavingsBySiteAndCreatedAtBetween(@Param("site") String site, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT SUM(i.expectedSavings) FROM Initiative i WHERE i.site = :site AND i.createdAt >= :startDate AND i.createdAt <= :endDate AND LOWER(COALESCE(i.budgetType, 'budgeted')) = :budgetType AND i.status NOT IN ('Rejected', 'Dropped')")
    java.math.BigDecimal sumExpectedSavingsBySiteAndCreatedAtBetweenAndBudgetType(@Param("site") String site, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, @Param("budgetType") String budgetType);
    
    // Trend calculation queries - for previous month comparison
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.createdAt >= :startDate AND i.createdAt <= :endDate")
    Long countByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.site = :site AND i.createdAt >= :startDate AND i.createdAt <= :endDate")
    Long countBySiteAndCreatedAtBetween(@Param("site") String site, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.status = :status AND i.updatedAt >= :startDate AND i.updatedAt <= :endDate")
    Long countByStatusAndUpdatedAtBetween(@Param("status") String status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.status = :status AND i.site = :site AND i.updatedAt >= :startDate AND i.updatedAt <= :endDate")
    Long countByStatusAndSiteAndUpdatedAtBetween(@Param("status") String status, @Param("site") String site, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Additional queries for performance analysis trends
    @Query("SELECT COUNT(i) FROM Initiative i WHERE LOWER(COALESCE(i.budgetType, 'budgeted')) = :budgetType AND i.createdAt >= :startDate AND i.createdAt <= :endDate")
    Long countByBudgetTypeAndCreatedAtBetween(@Param("budgetType") String budgetType, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(i) FROM Initiative i WHERE i.site = :site AND LOWER(COALESCE(i.budgetType, 'budgeted')) = :budgetType AND i.createdAt >= :startDate AND i.createdAt <= :endDate")
    Long countBySiteAndBudgetTypeAndCreatedAtBetween(@Param("site") String site, @Param("budgetType") String budgetType, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}