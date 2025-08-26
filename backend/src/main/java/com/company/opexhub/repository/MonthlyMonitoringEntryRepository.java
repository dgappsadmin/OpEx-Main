package com.company.opexhub.repository;

import com.company.opexhub.entity.MonthlyMonitoringEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MonthlyMonitoringEntryRepository extends JpaRepository<MonthlyMonitoringEntry, Long> {
    
    List<MonthlyMonitoringEntry> findByInitiative_IdOrderByMonitoringMonth(Long initiativeId);
    
    List<MonthlyMonitoringEntry> findByInitiative_IdAndMonitoringMonth(Long initiativeId, String monthYear);
    
    List<MonthlyMonitoringEntry> findByMonitoringMonth(String monthYear);
    
    List<MonthlyMonitoringEntry> findByIsFinalized(String isFinalized);
    
    List<MonthlyMonitoringEntry> findByFaApproval(String faApproval);
    
    @Query("SELECT m FROM MonthlyMonitoringEntry m WHERE m.initiative.id = :initiativeId AND m.faApproval = 'N'")
    List<MonthlyMonitoringEntry> findPendingFAApprovalsForInitiative(@Param("initiativeId") Long initiativeId);
    
    @Query("SELECT m FROM MonthlyMonitoringEntry m WHERE m.enteredBy = :userRole")
    List<MonthlyMonitoringEntry> findByEnteredBy(@Param("userRole") String userRole);
     
    List<MonthlyMonitoringEntry> findByInitiativeIdOrderByMonitoringMonthDesc(Long initiativeId);
    
    List<MonthlyMonitoringEntry> findByInitiativeIdAndMonitoringMonth(Long initiativeId, String monthYear);
    
    @Query("SELECT mme FROM MonthlyMonitoringEntry mme WHERE mme.initiative.id = :initiativeId AND mme.monitoringMonth = :monthYear")
    List<MonthlyMonitoringEntry> findByInitiativeAndMonth(@Param("initiativeId") Long initiativeId, @Param("monthYear") String monthYear);
    
    @Query("SELECT mme FROM MonthlyMonitoringEntry mme WHERE mme.initiative.site = :site")
    List<MonthlyMonitoringEntry> findBySite(@Param("site") String site);
    
    List<MonthlyMonitoringEntry> findByIsFinalizedOrderByMonitoringMonthDesc(String isFinalized);
    
    List<MonthlyMonitoringEntry> findByFaApprovalOrderByMonitoringMonthDesc(String faApproval);
    
    // DNL Plant Initiatives Report - Aggregate data by category and budget type
    @Query("SELECT mme.category, i.budgetType, " +
           "SUM(CASE WHEN mme.achievedValue IS NOT NULL THEN mme.achievedValue ELSE 0 END) as totalSavings, " +
           "COUNT(mme) as entryCount " +
           "FROM MonthlyMonitoringEntry mme " +
           "JOIN mme.initiative i " +
           "WHERE mme.category IN ('RMC', 'Spent Acid', 'Environment') " +
           "AND (:site IS NULL OR :site = 'all' OR i.site = :site) " +
           "AND (:startDate IS NULL OR mme.monitoringMonth >= :startDate) " +
           "AND (:endDate IS NULL OR mme.monitoringMonth <= :endDate) " +
           "GROUP BY mme.category, i.budgetType")
    List<Object[]> findDNLPlantInitiativesData(@Param("site") String site, 
                                               @Param("startDate") String startDate, 
                                               @Param("endDate") String endDate);
                                               
    // Additional query for total budget targets from initiatives
    @Query("SELECT i.budgetType, SUM(i.expectedSavings) as totalTarget " +
           "FROM Initiative i " +
           "WHERE (:site IS NULL OR :site = 'all' OR i.site = :site) " +
           "AND i.budgetType IN ('budgeted', 'non-budgeted') " +
           "GROUP BY i.budgetType")
    List<Object[]> findBudgetTargetsByType(@Param("site") String site);
}