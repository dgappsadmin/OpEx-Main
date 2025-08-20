package com.company.opexhub.repository;

import com.company.opexhub.entity.TimelineEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimelineEntryRepository extends JpaRepository<TimelineEntry, Long> {
    
    List<TimelineEntry> findByInitiative_IdOrderByPlannedStartDate(Long initiativeId);
    
    List<TimelineEntry> findByStatus(TimelineEntry.TimelineStatus status);
    
    List<TimelineEntry> findByResponsiblePerson(String responsiblePerson);
    
    @Query("SELECT t FROM TimelineEntry t WHERE t.initiative.id = :initiativeId AND t.status = :status")
    List<TimelineEntry> findByInitiativeIdAndStatus(@Param("initiativeId") Long initiativeId, 
                                                   @Param("status") TimelineEntry.TimelineStatus status);
    
    @Query("SELECT t FROM TimelineEntry t WHERE t.initiative.id = :initiativeId AND " +
           "(t.siteLeadApproval = false OR t.initiativeLeadApproval = false)")
    List<TimelineEntry> findPendingApprovalsForInitiative(@Param("initiativeId") Long initiativeId);
}