package com.company.opexhub.repository;

import com.company.opexhub.entity.TimelineEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimelineEntryRepository extends JpaRepository<TimelineEntry, Long> {
    
    @Query("SELECT t FROM TimelineEntry t WHERE t.initiative.id = :initiativeId ORDER BY t.plannedStartDate ASC")
    List<TimelineEntry> findByInitiative_IdOrderByPlannedStartDate(@Param("initiativeId") Long initiativeId);
    
    @Query(value = "SELECT * FROM OPEX_TIMELINE_ENTRIES t WHERE t.initiative_id = :initiativeId ORDER BY t.planned_start_date ASC", nativeQuery = true)
    List<TimelineEntry> findByInitiativeIdNative(@Param("initiativeId") Long initiativeId);
    
    List<TimelineEntry> findByStatus(TimelineEntry.TimelineStatus status);
    
    List<TimelineEntry> findByResponsiblePerson(String responsiblePerson);
    
    @Query("SELECT t FROM TimelineEntry t WHERE t.initiative.id = :initiativeId AND t.status = :status")
    List<TimelineEntry> findByInitiativeIdAndStatus(@Param("initiativeId") Long initiativeId, 
                                                   @Param("status") TimelineEntry.TimelineStatus status);
    
    @Query("SELECT t FROM TimelineEntry t WHERE t.initiative.id = :initiativeId AND " +
           "(t.siteLeadApproval = 'N' OR t.initiativeLeadApproval = 'N')")
    List<TimelineEntry> findPendingApprovalsForInitiative(@Param("initiativeId") Long initiativeId);
}