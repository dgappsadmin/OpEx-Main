package com.company.opexhub.service;

import com.company.opexhub.dto.DashboardStatsDTO;
import com.company.opexhub.dto.PerformanceAnalysisDTO;
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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
     * Get Performance Analysis Dashboard Data
     */
    public PerformanceAnalysisDTO getPerformanceAnalysis() {
        String currentFY = getCurrentFinancialYear();
        LocalDateTime[] fyRange = getFinancialYearRange();
        LocalDateTime fyStart = fyRange[0];
        LocalDateTime fyEnd = fyRange[1];
        String[] monthRange = getFinancialYearMonthRange();
        String startMonth = monthRange[0];
        String endMonth = monthRange[1];
        
        // Calculate Overall Metrics
        PerformanceAnalysisDTO.PerformanceMetrics overall = calculatePerformanceMetrics(
                null, fyStart, fyEnd, startMonth, endMonth);
        
        // Calculate Budget Metrics
        PerformanceAnalysisDTO.PerformanceMetrics budget = calculatePerformanceMetrics(
                "budgeted", fyStart, fyEnd, startMonth, endMonth);
        
        // Calculate Non-Budget Metrics
        PerformanceAnalysisDTO.PerformanceMetrics nonBudget = calculatePerformanceMetrics(
                "non-budgeted", fyStart, fyEnd, startMonth, endMonth);
        
        return new PerformanceAnalysisDTO(overall, budget, nonBudget, currentFY);
    }
    
    /**
     * Calculate performance metrics for a specific budget type
     */
    private PerformanceAnalysisDTO.PerformanceMetrics calculatePerformanceMetrics(
            String budgetType, LocalDateTime fyStart, LocalDateTime fyEnd, 
            String startMonth, String endMonth) {
        
        Long totalInitiatives;
        BigDecimal potentialSavingsAnnualized;
        BigDecimal potentialSavingsCurrentFY;
        BigDecimal actualSavingsCurrentFY;
        BigDecimal savingsProjectionCurrentFY;
        
        if (budgetType == null) {
            // Overall metrics
            totalInitiatives = initiativeRepository.count();
            BigDecimal totalExpectedSavings = initiativeRepository.sumAllExpectedSavings();
            // Fix: Don't multiply by 12 for annualized - use the total expected savings as is
            // The expected savings in the database already represents the full potential
            potentialSavingsAnnualized = totalExpectedSavings != null ? totalExpectedSavings : BigDecimal.ZERO;
            potentialSavingsCurrentFY = initiativeRepository.sumExpectedSavingsByCreatedAtBetween(fyStart, fyEnd);
            actualSavingsCurrentFY = monthlyMonitoringEntryRepository.sumAchievedValueByMonitoringMonthBetween(startMonth, endMonth);
            savingsProjectionCurrentFY = monthlyMonitoringEntryRepository.sumTargetValueByMonitoringMonthBetween(startMonth, endMonth);
        } else {
            // Budget type specific metrics
            totalInitiatives = initiativeRepository.countByBudgetType(budgetType);
            BigDecimal totalExpectedSavings = initiativeRepository.sumExpectedSavingsByBudgetType(budgetType);
            // Fix: Don't multiply by 12 for annualized - use the total expected savings as is
            // The expected savings in the database already represents the full potential
            potentialSavingsAnnualized = totalExpectedSavings != null ? totalExpectedSavings : BigDecimal.ZERO;
            potentialSavingsCurrentFY = initiativeRepository.sumExpectedSavingsByCreatedAtBetweenAndBudgetType(fyStart, fyEnd, budgetType);
            actualSavingsCurrentFY = monthlyMonitoringEntryRepository.sumAchievedValueByMonitoringMonthBetweenAndBudgetType(startMonth, endMonth, budgetType);
            savingsProjectionCurrentFY = monthlyMonitoringEntryRepository.sumTargetValueByMonitoringMonthBetweenAndBudgetType(startMonth, endMonth, budgetType);
        }
        
        // Ensure non-null values
        potentialSavingsCurrentFY = potentialSavingsCurrentFY != null ? potentialSavingsCurrentFY : BigDecimal.ZERO;
        actualSavingsCurrentFY = actualSavingsCurrentFY != null ? actualSavingsCurrentFY : BigDecimal.ZERO;
        savingsProjectionCurrentFY = savingsProjectionCurrentFY != null ? savingsProjectionCurrentFY : BigDecimal.ZERO;
        
        // Calculate progress percentage: (Savings Projection / Potential Savings) * 100
        BigDecimal progressPercentage = BigDecimal.ZERO;
        if (potentialSavingsCurrentFY.compareTo(BigDecimal.ZERO) > 0) {
            progressPercentage = savingsProjectionCurrentFY
                .divide(potentialSavingsCurrentFY, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        }
        
        return new PerformanceAnalysisDTO.PerformanceMetrics(
                totalInitiatives, 
                potentialSavingsAnnualized, 
                potentialSavingsCurrentFY, 
                actualSavingsCurrentFY, 
                savingsProjectionCurrentFY, 
                progressPercentage
        );
    }
    
    /**
     * Get current financial year string (e.g., "2025-26")
     */
    private String getCurrentFinancialYear() {
        LocalDate today = LocalDate.now();
        int year = today.getYear(); // 2025
        
        if (today.getMonthValue() >= 4) {
            // April 2025 to March 2026 → "2025-26"
            return year + "-" + String.format("%02d", (year + 1) % 100);
        } else {
            // January to March 2025 (belongs to previous FY) → "2024-25"
            return (year - 1) + "-" + String.format("%02d", year % 100);
        }
    }
    
    /**
     * Get financial year date range as LocalDateTime array [start, end]
     * For 2025: April 1, 2025 to March 31, 2026
     */
    private LocalDateTime[] getFinancialYearRange() {
        LocalDate today = LocalDate.now();
        int year = today.getYear(); // 2025
        
        LocalDate fyStart, fyEnd;
        if (today.getMonthValue() >= 4) {
            // Current FY: April 1st 2025 to March 31st 2026
            fyStart = LocalDate.of(year, 4, 1);       // 2025-04-01
            fyEnd = LocalDate.of(year + 1, 3, 31);    // 2026-03-31
        } else {
            // Current FY: April 1st 2024 to March 31st 2025
            fyStart = LocalDate.of(year - 1, 4, 1);   // 2024-04-01
            fyEnd = LocalDate.of(year, 3, 31);        // 2025-03-31
        }
        
        return new LocalDateTime[]{
            fyStart.atStartOfDay(),
            fyEnd.atTime(23, 59, 59)
        };
    }
    
    /**
     * Get financial year month range as string array [startMonth, endMonth] in YYYY-MM format
     * For 2025: "2025-04" to "2026-03"
     */
    private String[] getFinancialYearMonthRange() {
        LocalDate today = LocalDate.now();
        int year = today.getYear(); // 2025
        
        String startMonth, endMonth;
        if (today.getMonthValue() >= 4) {
            // Current FY: 2025-04 to 2026-03
            startMonth = year + "-04";        // "2025-04"
            endMonth = (year + 1) + "-03";    // "2026-03"
        } else {
            // Current FY: 2024-04 to 2025-03
            startMonth = (year - 1) + "-04";  // "2024-04"
            endMonth = year + "-03";          // "2025-03"
        }
        
        return new String[]{startMonth, endMonth};
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