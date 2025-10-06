package com.company.opexhub.service;

import com.company.opexhub.entity.Initiative;
import com.company.opexhub.entity.MonthlyMonitoringEntry;
import com.company.opexhub.repository.InitiativeRepository;
import com.company.opexhub.repository.MonthlyMonitoringEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;

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
        
        // Track initiatives that need actualSavings sync
        java.util.Set<Long> initiativeIdsToSync = new java.util.HashSet<>();
        
        for (MonthlyMonitoringEntry entry : entries) {
            // Only approve entries that are finalized but not yet F&A approved
            if ("Y".equals(entry.getIsFinalized()) && !"Y".equals(entry.getFaApproval())) {
                entry.setFaApproval("Y");
                entry.setFaComments(faComments);
                initiativeIdsToSync.add(entry.getInitiative().getId());
            }
        }
        
        List<MonthlyMonitoringEntry> savedEntries = monthlyMonitoringRepository.saveAll(entries);
        
        // Sync actualSavings for all affected initiatives
        for (Long initiativeId : initiativeIdsToSync) {
            try {
                syncInitiativeActualSavings(initiativeId);
            } catch (Exception e) {
                // Log error but don't fail the whole transaction
                System.err.println("Error syncing actual savings for initiative " + initiativeId + ": " + e.getMessage());
            }
        }
        
        return savedEntries;
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

    // Get monthly actual savings data for reporting (backward compatibility)
    public Map<String, Object> getMonthlyActualSavings(String site, String year, String budgetType) {
        List<MonthlyMonitoringEntry> entries = monthlyMonitoringRepository.findAll();
        
        // Filter by criteria if provided
        entries = filterEntriesByCriteria(entries, site, year, budgetType);
        
        // Group by month and calculate achieved values only
        Map<String, Object> monthlyData = new HashMap<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        
        // Initialize all months with 0
        for (String month : months) {
            monthlyData.put(month, 0.0);
        }
        
        // Calculate achieved values by month
        entries.stream()
            .collect(Collectors.groupingBy(this::getMonthFromEntry))
            .forEach((month, monthEntries) -> {
                if (!month.equals("Unknown")) {
                    double totalAchieved = monthEntries.stream()
                        .mapToDouble(entry -> entry.getAchievedValue() != null ? 
                            entry.getAchievedValue().doubleValue() : 0.0)
                        .sum();
                    monthlyData.put(month, totalAchieved);
                }
            });
        
        return monthlyData;
    }

    // Get monthly target vs achieved data for reporting
    public Map<String, Object> getMonthlyTargetAchievedData(String site, String year, String budgetType) {
        List<MonthlyMonitoringEntry> entries = monthlyMonitoringRepository.findAll();
        
        // Filter by criteria if provided
        entries = filterEntriesByCriteria(entries, site, year, budgetType);
        
        // Group by month and calculate totals
        Map<String, Object> monthlyData = new HashMap<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        
        // Initialize all months with target and achieved values
        for (String month : months) {
            Map<String, Double> monthData = new HashMap<>();
            monthData.put("target", 0.0);
            monthData.put("achieved", 0.0);
            monthlyData.put(month, monthData);
        }
        
        // Calculate target and achieved values by month
        entries.stream()
            .collect(Collectors.groupingBy(this::getMonthFromEntry))
            .forEach((month, monthEntries) -> {
                if (!month.equals("Unknown")) {
                    double totalTarget = monthEntries.stream()
                        .mapToDouble(entry -> entry.getTargetValue() != null ? 
                            entry.getTargetValue().doubleValue() : 0.0)
                        .sum();
                    
                    double totalAchieved = monthEntries.stream()
                        .mapToDouble(entry -> entry.getAchievedValue() != null ? 
                            entry.getAchievedValue().doubleValue() : 0.0)
                        .sum();
                    
                    Map<String, Double> monthData = new HashMap<>();
                    monthData.put("target", totalTarget);
                    monthData.put("achieved", totalAchieved);
                    monthlyData.put(month, monthData);
                }
            });
        
        return monthlyData;
    }

    // Helper method to filter entries by criteria
    private List<MonthlyMonitoringEntry> filterEntriesByCriteria(List<MonthlyMonitoringEntry> entries, 
                                                                String site, String year, String budgetType) {
        return entries.stream()
            .filter(entry -> {
                // Filter by site
                if (site != null && !site.isEmpty()) {
                    if (!site.equals(entry.getInitiative().getSite())) {
                        return false;
                    }
                }
                
                // Filter by year
                if (year != null && !year.isEmpty()) {
                    if (entry.getMonitoringMonth() == null || 
                        !entry.getMonitoringMonth().startsWith(year)) {
                        return false;
                    }
                }
                
                // Filter by budget type
                if (budgetType != null && !budgetType.isEmpty()) {
                    String initiativeBudgetType = entry.getInitiative().getBudgetType();
                    if (budgetType.equals("budgeted")) {
                        return initiativeBudgetType == null || "budgeted".equalsIgnoreCase(initiativeBudgetType);
                    } else if (budgetType.equals("non-budgeted")) {
                        return "non-budgeted".equalsIgnoreCase(initiativeBudgetType);
                    }
                }
                
                return true;
            })
            .collect(Collectors.toList());
    }

    // Helper method to get month name from monitoring entry
    private String getMonthFromEntry(MonthlyMonitoringEntry entry) {
        if (entry.getMonitoringMonth() != null && entry.getMonitoringMonth().length() >= 7) {
            String[] parts = entry.getMonitoringMonth().split("-");
            if (parts.length >= 2) {
                try {
                    int month = Integer.parseInt(parts[1]);
                    String[] months = {"", "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
                    if (month >= 1 && month <= 12) {
                        return months[month];
                    }
                } catch (NumberFormatException e) {
                    // Invalid month format
                }
            }
        }
        return "Unknown";
    }

    // Get total achieved value for a particular initiative
    public BigDecimal getTotalAchievedValueForInitiative(Long initiativeId) {
        BigDecimal total = monthlyMonitoringRepository.sumAchievedValueByInitiativeId(initiativeId);
        return total != null ? total : BigDecimal.ZERO;
    }

    // Update Initiative's actualSavings field with total achieved value from monthly monitoring
    @Transactional
    public BigDecimal syncInitiativeActualSavings(Long initiativeId) {
        Initiative initiative = initiativeRepository.findById(initiativeId)
                .orElseThrow(() -> new RuntimeException("Initiative not found"));
        
        BigDecimal totalAchievedValue = getTotalAchievedValueForInitiative(initiativeId);
        initiative.setActualSavings(totalAchievedValue);
        initiativeRepository.save(initiative);
        
        return totalAchievedValue;
    }
}