package com.company.opexhub.service;

import com.company.opexhub.entity.Initiative;
import com.company.opexhub.entity.MonthlyMonitoringEntry;
import com.company.opexhub.repository.InitiativeRepository;
import com.company.opexhub.repository.MonthlyMonitoringEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
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

    public List<MonthlyMonitoringEntry> getMonitoringEntriesByInitiativeAndMonth(Long initiativeId, YearMonth month) {
        return monthlyMonitoringRepository.findByInitiative_IdAndMonitoringMonth(initiativeId, month);
    }

    public Optional<MonthlyMonitoringEntry> getMonitoringEntryById(Long id) {
        return monthlyMonitoringRepository.findById(id);
    }

    @Transactional
    public MonthlyMonitoringEntry createMonitoringEntry(Long initiativeId, MonthlyMonitoringEntry monitoringEntry) {
        Initiative initiative = initiativeRepository.findById(initiativeId)
                .orElseThrow(() -> new RuntimeException("Initiative not found"));
        
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
        
        return monthlyMonitoringRepository.save(entry);
    }

    @Transactional
    public MonthlyMonitoringEntry updateFinalizationStatus(Long id, Boolean isFinalized) {
        MonthlyMonitoringEntry entry = monthlyMonitoringRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly monitoring entry not found"));

        entry.setIsFinalized(isFinalized);
        return monthlyMonitoringRepository.save(entry);
    }

    @Transactional
    public MonthlyMonitoringEntry updateFAApproval(Long id, Boolean faApproval, String faComments) {
        MonthlyMonitoringEntry entry = monthlyMonitoringRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monthly monitoring entry not found"));

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

    public List<MonthlyMonitoringEntry> getEntriesByMonth(YearMonth month) {
        return monthlyMonitoringRepository.findByMonitoringMonth(month);
    }

    public List<MonthlyMonitoringEntry> getFinalizedEntries() {
        return monthlyMonitoringRepository.findByIsFinalized(true);
    }
}