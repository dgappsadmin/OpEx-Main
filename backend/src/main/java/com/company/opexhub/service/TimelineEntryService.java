package com.company.opexhub.service;

import com.company.opexhub.entity.Initiative;
import com.company.opexhub.entity.TimelineEntry;
import com.company.opexhub.repository.InitiativeRepository;
import com.company.opexhub.repository.TimelineEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TimelineEntryService {

    @Autowired
    private TimelineEntryRepository timelineEntryRepository;
    
    @Autowired
    private InitiativeRepository initiativeRepository;

    public List<TimelineEntry> getTimelineEntriesByInitiative(Long initiativeId) {
        // Use native query to avoid Oracle SQL generation issues
        return timelineEntryRepository.findByInitiativeIdNative(initiativeId);
    }

    public Optional<TimelineEntry> getTimelineEntryById(Long id) {
        return timelineEntryRepository.findById(id);
    }

    @Transactional
    public TimelineEntry createTimelineEntry(Long initiativeId, TimelineEntry timelineEntry) {
        Initiative initiative = initiativeRepository.findById(initiativeId)
                .orElseThrow(() -> new RuntimeException("Initiative not found"));
        
        timelineEntry.setInitiative(initiative);
        return timelineEntryRepository.save(timelineEntry);
    }

    @Transactional
    public TimelineEntry updateTimelineEntry(Long id, TimelineEntry entryDetails) {
        TimelineEntry entry = timelineEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Timeline entry not found"));

        entry.setStageName(entryDetails.getStageName());
        entry.setPlannedStartDate(entryDetails.getPlannedStartDate());
        entry.setPlannedEndDate(entryDetails.getPlannedEndDate());
        entry.setActualStartDate(entryDetails.getActualStartDate());
        entry.setActualEndDate(entryDetails.getActualEndDate());
        entry.setResponsiblePerson(entryDetails.getResponsiblePerson());
        entry.setRemarks(entryDetails.getRemarks());
        entry.setDocumentPath(entryDetails.getDocumentPath());
        
        // Set status if provided, otherwise it will be auto-calculated in @PreUpdate
        if (entryDetails.getStatus() != null) {
            entry.setStatus(entryDetails.getStatus());
        }
        
        // Validate date logic
        validateDates(entry);
        
        return timelineEntryRepository.save(entry);
    }

    @Transactional
    public TimelineEntry updateApprovals(Long id, String siteLeadApproval, String initiativeLeadApproval) {
        TimelineEntry entry = timelineEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Timeline entry not found"));

        if (siteLeadApproval != null) {
            entry.setSiteLeadApproval(siteLeadApproval);
        }
        if (initiativeLeadApproval != null) {
            entry.setInitiativeLeadApproval(initiativeLeadApproval);
        }

        return timelineEntryRepository.save(entry);
    }

    public void deleteTimelineEntry(Long id) {
        timelineEntryRepository.deleteById(id);
    }

    public List<TimelineEntry> getEntriesByStatus(TimelineEntry.TimelineStatus status) {
        return timelineEntryRepository.findByStatus(status);
    }

    public List<TimelineEntry> getPendingApprovalsForInitiative(Long initiativeId) {
        return timelineEntryRepository.findPendingApprovalsForInitiative(initiativeId);
    }
    
    @Transactional
    public TimelineEntry updateStatus(Long id, TimelineEntry.TimelineStatus status) {
        TimelineEntry entry = timelineEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Timeline entry not found"));
        
        entry.setStatus(status);
        return timelineEntryRepository.save(entry);
    }

    private void validateDates(TimelineEntry entry) {
        // Actual start can't precede planned start
        if (entry.getActualStartDate() != null && entry.getPlannedStartDate() != null) {
            if (entry.getActualStartDate().isBefore(entry.getPlannedStartDate())) {
                throw new RuntimeException("Actual start date cannot precede planned start date");
            }
        }
        
        // Planned end must be after planned start
        if (entry.getPlannedEndDate() != null && entry.getPlannedStartDate() != null) {
            if (entry.getPlannedEndDate().isBefore(entry.getPlannedStartDate()) || 
                entry.getPlannedEndDate().equals(entry.getPlannedStartDate())) {
                throw new RuntimeException("Planned end date must be after planned start date");
            }
        }
        
        // Actual end must be after actual start
        if (entry.getActualEndDate() != null && entry.getActualStartDate() != null) {
            if (entry.getActualEndDate().isBefore(entry.getActualStartDate()) ||
                entry.getActualEndDate().equals(entry.getActualStartDate())) {
                throw new RuntimeException("Actual end date must be after actual start date");
            }
        }
    }
}