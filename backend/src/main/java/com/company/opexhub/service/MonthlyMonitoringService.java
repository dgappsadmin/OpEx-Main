package com.company.opexhub.service;

import com.company.opexhub.entity.Initiative;
import com.company.opexhub.entity.MonthlyMonitoringEntry;
import com.company.opexhub.repository.InitiativeRepository;
import com.company.opexhub.repository.MonthlyMonitoringEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class MonthlyMonitoringService {

    @Autowired
    private MonthlyMonitoringEntryRepository monthlyMonitoringRepository;
    
    @Autowired
    private InitiativeRepository initiativeRepository;

    public List<MonthlyMonitoringEntry> getMonitoringEntriesByInitiative(Long initiativeId) {
        return monthlyMonitoringRepository.findByInitiative_IdOrderByMonitoringMonth(initiativeId);
    }

    public List<MonthlyMonitoringEntry> getMonitoringEntriesByInitiativeAndMonth(Long initiativeId, String monthYear) {
        return monthlyMonitoringRepository.findByInitiative_IdAndMonitoringMonth(initiativeId, monthYear);
    }

    public Optional<MonthlyMonitoringEntry> getMonitoringEntryById(Long id) {
        return monthlyMonitoringRepository.findById(id);
    }

    @Transactional
    public MonthlyMonitoringEntry createMonitoringEntry(Long initiativeId, MonthlyMonitoringEntry monitoringEntry) {
        Initiative initiative = initiativeRepository.findById(initiativeId)
                .orElseThrow(() -> new RuntimeException("Initiative not found"));
        
        // Ensure proper defaults for Y/N fields
        if (monitoringEntry.getIsFinalized() == null || (!monitoringEntry.isValidYNField(monitoringEntry.getIsFinalized()))) {
            monitoringEntry.setIsFinalized("N");
        }
        if (monitoringEntry.getFaApproval() == null || (!monitoringEntry.isValidYNField(monitoringEntry.getFaApproval()))) {
            monitoringEntry.setFaApproval("N");
        }
        
        monitoringEntry.setInitiative(initiative);
        return monthlyMonitoringRepository.save(monitoringEntry);
    }

    @Transactional
    public MonthlyMonitoringEntry updateMonitoringEntry(Long id, MonthlyMonitoringEntry entryDetails) {
        MonthlyMonitoringEntry entry = monthlyMonitoringRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly monitoring entry not found"));

        entry.setKpiDescription(entryDetails.getKpiDescription());
        entry.setTargetValue(entryDetails.getTargetValue());
        entry.setAchievedValue(entryDetails.getAchievedValue());
        entry.setRemarks(entryDetails.getRemarks());
        entry.setMonitoringMonth(entryDetails.getMonitoringMonth());
        entry.setCategory(entryDetails.getCategory());
        
        // Only update Y/N fields if they are provided and valid
        if (entryDetails.getIsFinalized() != null && entry.isValidYNField(entryDetails.getIsFinalized())) {
            entry.setIsFinalized(entryDetails.getIsFinalized());
        }
        if (entryDetails.getFaApproval() != null && entry.isValidYNField(entryDetails.getFaApproval())) {
            entry.setFaApproval(entryDetails.getFaApproval());
        }
        
        return monthlyMonitoringRepository.save(entry);
    }

    @Transactional
    public MonthlyMonitoringEntry updateFinalizationStatus(Long id, String isFinalized) {
        MonthlyMonitoringEntry entry = monthlyMonitoringRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly monitoring entry not found"));

        // Validate Y/N format
        if (!"Y".equals(isFinalized) && !"N".equals(isFinalized)) {
            throw new IllegalArgumentException("Finalization status must be 'Y' or 'N'");
        }
        
        entry.setIsFinalized(isFinalized);
        return monthlyMonitoringRepository.save(entry);
    }

    @Transactional
    public MonthlyMonitoringEntry updateFAApproval(Long id, String faApproval, String faComments) {
        MonthlyMonitoringEntry entry = monthlyMonitoringRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly monitoring entry not found"));

        // Validate Y/N format
        if (!"Y".equals(faApproval) && !"N".equals(faApproval)) {
            throw new IllegalArgumentException("FA approval status must be 'Y' or 'N'");
        }
        
        entry.setFaApproval(faApproval);
        entry.setFaComments(faComments);
        return monthlyMonitoringRepository.save(entry);
    }

    public void deleteMonitoringEntry(Long id) {
        monthlyMonitoringRepository.deleteById(id);
    }

    public List<MonthlyMonitoringEntry> getPendingFAApprovalsForInitiative(Long initiativeId) {
        return monthlyMonitoringRepository.findPendingFAApprovalsForInitiative(initiativeId);
    }

    public List<MonthlyMonitoringEntry> getEntriesByMonth(String monthYear) {
        return monthlyMonitoringRepository.findByMonitoringMonth(monthYear);
    }

    public List<MonthlyMonitoringEntry> getFinalizedEntries() {
        return monthlyMonitoringRepository.findByIsFinalized("Y");
    }

    public List<MonthlyMonitoringEntry> getFinalizedPendingFAEntries(Long initiativeId) {
        return monthlyMonitoringRepository.findFinalizedPendingFAEntries(initiativeId);
    }

    @Transactional
    public List<MonthlyMonitoringEntry> batchFAApproval(List<Long> entryIds, String faComments) {
        List<MonthlyMonitoringEntry> entries = monthlyMonitoringRepository.findAllById(entryIds);
        
        for (MonthlyMonitoringEntry entry : entries) {
            // Only approve entries that are finalized but not yet F&A approved
            if ("Y".equals(entry.getIsFinalized()) && !"Y".equals(entry.getFaApproval())) {
                entry.setFaApproval("Y");
                entry.setFaComments(faComments);
            }
        }
        
        return monthlyMonitoringRepository.saveAll(entries);
    }

    // Check if all monthly monitoring entries for an initiative are finalized
    public boolean areAllEntriesFinalized(Long initiativeId) {
        List<MonthlyMonitoringEntry> entries = monthlyMonitoringRepository.findByInitiative_IdOrderByMonitoringMonth(initiativeId);
        
        // If no entries exist, consider as not finalized (entries must exist to be considered complete)
        if (entries.isEmpty()) {
            return false;
        }
        
        // Check if all entries are finalized
        return entries.stream().allMatch(entry -> "Y".equals(entry.getIsFinalized()));
    }
}