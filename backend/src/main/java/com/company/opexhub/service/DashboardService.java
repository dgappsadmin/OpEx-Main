package com.company.opexhub.service;

import com.company.opexhub.dto.DashboardStatsDTO;
import com.company.opexhub.dto.RecentInitiativeDTO;
import com.company.opexhub.entity.Initiative;
import com.company.opexhub.repository.InitiativeRepository;
import com.company.opexhub.repository.MonthlyMonitoringEntryRepository;
import com.company.opexhub.repository.WorkflowTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private InitiativeRepository initiativeRepository;

    @Autowired
    private MonthlyMonitoringEntryRepository monthlyMonitoringEntryRepository;

    @Autowired
    private WorkflowTransactionRepository workflowTransactionRepository;

    /**
     * Get dashboard statistics
     */
    public DashboardStatsDTO getDashboardStats() {
        // Total Initiatives
        Long totalInitiatives = initiativeRepository.count();

        // Actual Savings - Sum of ACHIEVED_VALUE from OPEX_MONTHLY_MONITORING_ENTRIES
        BigDecimal actualSavings = getTotalActualSavings();

        // Completed Initiatives
        Long completedInitiatives = initiativeRepository.countByStatus("Completed");

        // Pending Approvals - Count from OPEX_WORKFLOW_TRANSACTIONS where PENDING_WITH is not null
        Long pendingApprovals = workflowTransactionRepository.countByApproveStatusAndPendingWithIsNotNull("pending");

        return new DashboardStatsDTO(totalInitiatives, actualSavings, completedInitiatives, pendingApprovals);
    }

    /**
     * Get recent initiatives (latest 5)
     */
    public List<RecentInitiativeDTO> getRecentInitiatives() {
        Pageable pageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Initiative> recentInitiatives = initiativeRepository.findAll(pageable).getContent();

        return recentInitiatives.stream()
                .map(this::convertToRecentInitiativeDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get recent initiatives for a specific site
     */
    public List<RecentInitiativeDTO> getRecentInitiativesBySite(String site) {
        Pageable pageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Initiative> recentInitiatives = initiativeRepository.findBySite(site, pageable).getContent();

        return recentInitiatives.stream()
                .map(this::convertToRecentInitiativeDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get dashboard statistics for a specific site
     */
    public DashboardStatsDTO getDashboardStatsBySite(String site) {
        // Total Initiatives for site
        Long totalInitiatives = initiativeRepository.findBySite(site, Pageable.unpaged()).getTotalElements();

        // Actual Savings for site
        BigDecimal actualSavings = getTotalActualSavingsBySite(site);

        // Completed Initiatives for site
        Long completedInitiatives = initiativeRepository.countByStatus("Completed"); // Need to create query for site-specific

        // Pending Approvals for site
        Long pendingApprovals = workflowTransactionRepository.countBySiteAndApproveStatusAndPendingWithIsNotNull(site, "pending");

        return new DashboardStatsDTO(totalInitiatives, actualSavings, completedInitiatives, pendingApprovals);
    }

    /**
     * Calculate total actual savings from monthly monitoring entries
     */
    private BigDecimal getTotalActualSavings() {
        return monthlyMonitoringEntryRepository.findAll().stream()
                .filter(entry -> entry.getAchievedValue() != null)
                .map(entry -> entry.getAchievedValue())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calculate total actual savings for a specific site
     */
    private BigDecimal getTotalActualSavingsBySite(String site) {
        return monthlyMonitoringEntryRepository.findBySite(site).stream()
                .filter(entry -> entry.getAchievedValue() != null)
                .map(entry -> entry.getAchievedValue())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Convert Initiative to RecentInitiativeDTO
     */
    private RecentInitiativeDTO convertToRecentInitiativeDTO(Initiative initiative) {
        return new RecentInitiativeDTO(
                initiative.getId(),
                initiative.getTitle(),
                initiative.getInitiativeNumber(),
                initiative.getSite(),
                initiative.getStatus(),
                initiative.getPriority(),
                initiative.getExpectedSavings(),
                initiative.getProgressPercentage(),
                initiative.getCurrentStage(),
                initiative.getCreatedAt()
        );
    }
}