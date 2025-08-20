package com.company.opexhub.repository;

import com.company.opexhub.entity.MonthlyMonitoringEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.YearMonth;
import java.util.List;

@Repository
public interface MonthlyMonitoringEntryRepository extends JpaRepository<MonthlyMonitoringEntry, Long> {
    
    List<MonthlyMonitoringEntry> findByInitiative_IdOrderByMonitoringMonth(Long initiativeId);
    
    List<MonthlyMonitoringEntry> findByInitiative_IdAndMonitoringMonth(Long initiativeId, YearMonth month);
    
    List<MonthlyMonitoringEntry> findByMonitoringMonth(YearMonth month);
    
    List<MonthlyMonitoringEntry> findByIsFinalized(Boolean isFinalized);
    
    List<MonthlyMonitoringEntry> findByFaApproval(Boolean faApproval);
    
    @Query("SELECT m FROM MonthlyMonitoringEntry m WHERE m.initiative.id = :initiativeId AND m.faApproval = false")
    List<MonthlyMonitoringEntry> findPendingFAApprovalsForInitiative(@Param("initiativeId") Long initiativeId);
    
    @Query("SELECT m FROM MonthlyMonitoringEntry m WHERE m.enteredBy = :userRole")
    List<MonthlyMonitoringEntry> findByEnteredBy(@Param("userRole") String userRole);

     
    List<MonthlyMonitoringEntry> findByInitiativeIdOrderByMonitoringMonthDesc(Long initiativeId);
    
    List<MonthlyMonitoringEntry> findByInitiativeIdAndMonitoringMonth(Long initiativeId, YearMonth monthYear);
    
    @Query("SELECT mme FROM MonthlyMonitoringEntry mme WHERE mme.initiative.id = :initiativeId AND mme.monitoringMonth = :monthYear")
    List<MonthlyMonitoringEntry> findByInitiativeAndMonth(@Param("initiativeId") Long initiativeId, @Param("monthYear") YearMonth monthYear);
    
    @Query("SELECT mme FROM MonthlyMonitoringEntry mme WHERE mme.initiative.site = :site")
    List<MonthlyMonitoringEntry> findBySite(@Param("site") String site);
    
    List<MonthlyMonitoringEntry> findByIsFinalizedTrue();
    
    List<MonthlyMonitoringEntry> findByFaApprovalTrue();
}