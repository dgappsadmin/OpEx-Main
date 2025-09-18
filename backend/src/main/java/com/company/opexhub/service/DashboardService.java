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
import java.util.Arrays;
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
        // Current month data
        LocalDateTime[] currentMonth = getCurrentMonthRange();
        LocalDateTime[] previousMonth = getPreviousMonthRange();
        String currentMonthStr = getCurrentMonthString();
        String previousMonthStr = getPreviousMonthString();
        
        // Total Initiatives
        Long totalInitiatives = initiativeRepository.count();
        Long previousTotalInitiatives = initiativeRepository.countByCreatedAtBetween(previousMonth[0], previousMonth[1]);

        // Actual Savings - Sum of ACHIEVED_VALUE from OPEX_MONTHLY_MON_ENTRIES
        BigDecimal actualSavings = getTotalActualSavings();
        BigDecimal previousActualSavings = monthlyMonitoringEntryRepository.sumAchievedValueByMonth(previousMonthStr);

        // Completed Initiatives
        Long completedInitiatives = initiativeRepository.countByStatus("Completed");
        Long previousCompletedInitiatives = initiativeRepository.countByStatusAndUpdatedAtBetween("Completed", previousMonth[0], previousMonth[1]);

        // Pending Approvals - Count from OPEX_WORKFLOW_TRANSACTIONS where PENDING_WITH is not null
        Long pendingApprovals = workflowTransactionRepository.countByApproveStatusAndPendingWithIsNotNull("pending");
        Long previousPendingApprovals = workflowTransactionRepository.countByApproveStatusAndPendingWithIsNotNullAndCreatedAtBetween("pending", previousMonth[0], previousMonth[1]);

        // Calculate trends
        Double totalInitiativesTrend = calculateTrend(totalInitiatives, previousTotalInitiatives);
        Double actualSavingsTrend = calculateTrend(actualSavings, previousActualSavings);
        Double completedInitiativesTrend = calculateTrend(completedInitiatives, previousCompletedInitiatives);
        Double pendingApprovalsTrend = calculateTrend(pendingApprovals, previousPendingApprovals);

        return new DashboardStatsDTO(totalInitiatives, actualSavings, completedInitiatives, pendingApprovals,
                                   totalInitiativesTrend, actualSavingsTrend, completedInitiativesTrend, pendingApprovalsTrend);
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
        // Current and previous month data
        LocalDateTime[] currentMonth = getCurrentMonthRange();
        LocalDateTime[] previousMonth = getPreviousMonthRange();
        String currentMonthStr = getCurrentMonthString();
        String previousMonthStr = getPreviousMonthString();
        
        // Total Initiatives for site
        Long totalInitiatives = initiativeRepository.findBySite(site, Pageable.unpaged()).getTotalElements();
        Long previousTotalInitiatives = initiativeRepository.countBySiteAndCreatedAtBetween(site, previousMonth[0], previousMonth[1]);

        // Actual Savings for site
        BigDecimal actualSavings = getTotalActualSavingsBySite(site);
        BigDecimal previousActualSavings = monthlyMonitoringEntryRepository.sumAchievedValueBySiteAndMonth(site, previousMonthStr);

        // Completed Initiatives for site
        Long completedInitiatives = initiativeRepository.countByStatusAndSite("Completed", site);
        Long previousCompletedInitiatives = initiativeRepository.countByStatusAndSiteAndUpdatedAtBetween("Completed", site, previousMonth[0], previousMonth[1]);

        // Pending Approvals for site
        Long pendingApprovals = workflowTransactionRepository.countBySiteAndApproveStatusAndPendingWithIsNotNull(site, "pending");
        Long previousPendingApprovals = workflowTransactionRepository.countBySiteAndApproveStatusAndPendingWithIsNotNullAndCreatedAtBetween(site, "pending", previousMonth[0], previousMonth[1]);

        // Calculate trends
        Double totalInitiativesTrend = calculateTrend(totalInitiatives, previousTotalInitiatives);
        Double actualSavingsTrend = calculateTrend(actualSavings, previousActualSavings);
        Double completedInitiativesTrend = calculateTrend(completedInitiatives, previousCompletedInitiatives);
        Double pendingApprovalsTrend = calculateTrend(pendingApprovals, previousPendingApprovals);

        return new DashboardStatsDTO(totalInitiatives, actualSavings, completedInitiatives, pendingApprovals,
                                   totalInitiativesTrend, actualSavingsTrend, completedInitiativesTrend, pendingApprovalsTrend);
    }

    /**
     * Get available sites for dashboard filtering (excluding CORP)
     */
    public List<String> getAvailableSites() {
        return Arrays.asList("NDS", "DHJ", "HSD", "APL", "TCD");
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
     * Get Performance Analysis Dashboard Data for a specific site
     */
    public PerformanceAnalysisDTO getPerformanceAnalysisBySite(String site) {
        String currentFY = getCurrentFinancialYear();
        LocalDateTime[] fyRange = getFinancialYearRange();
        LocalDateTime fyStart = fyRange[0];
        LocalDateTime fyEnd = fyRange[1];
        String[] monthRange = getFinancialYearMonthRange();
        String startMonth = monthRange[0];
        String endMonth = monthRange[1];
        
        // Calculate Overall Metrics for site
        PerformanceAnalysisDTO.PerformanceMetrics overall = calculatePerformanceMetricsBySite(
                site, null, fyStart, fyEnd, startMonth, endMonth);
        
        // Calculate Budget Metrics for site
        PerformanceAnalysisDTO.PerformanceMetrics budget = calculatePerformanceMetricsBySite(
                site, "budgeted", fyStart, fyEnd, startMonth, endMonth);
        
        // Calculate Non-Budget Metrics for site
        PerformanceAnalysisDTO.PerformanceMetrics nonBudget = calculatePerformanceMetricsBySite(
                site, "non-budgeted", fyStart, fyEnd, startMonth, endMonth);
        
        return new PerformanceAnalysisDTO(overall, budget, nonBudget, currentFY);
    }
    
    /**
     * Calculate performance metrics for a specific budget type
     */
    private PerformanceAnalysisDTO.PerformanceMetrics calculatePerformanceMetrics(
            String budgetType, LocalDateTime fyStart, LocalDateTime fyEnd, 
            String startMonth, String endMonth) {
        
        // Get previous financial year data for trend calculation
        LocalDateTime[] prevFyRange = getPreviousFinancialYearRange();
        LocalDateTime prevFyStart = prevFyRange[0];
        LocalDateTime prevFyEnd = prevFyRange[1];
        String[] prevMonthRange = getPreviousFinancialYearMonthRange();
        String prevStartMonth = prevMonthRange[0];
        String prevEndMonth = prevMonthRange[1];
        
        Long totalInitiatives;
        BigDecimal potentialSavingsAnnualized;
        BigDecimal potentialSavingsCurrentFY;
        BigDecimal actualSavingsCurrentFY;
        BigDecimal savingsProjectionCurrentFY;
        
        // Previous year data for trends
        Long prevTotalInitiatives;
        BigDecimal prevPotentialSavingsAnnualized;
        BigDecimal prevPotentialSavingsCurrentFY;
        BigDecimal prevActualSavingsCurrentFY;
        BigDecimal prevSavingsProjectionCurrentFY;
        
        if (budgetType == null) {
            // Overall metrics - current FY
            totalInitiatives = initiativeRepository.count();
            BigDecimal totalExpectedSavings = initiativeRepository.sumAllExpectedSavings();
            potentialSavingsAnnualized = totalExpectedSavings != null ? totalExpectedSavings : BigDecimal.ZERO;
            potentialSavingsCurrentFY = initiativeRepository.sumExpectedSavingsByCreatedAtBetween(fyStart, fyEnd);
            actualSavingsCurrentFY = monthlyMonitoringEntryRepository.sumAchievedValueByMonitoringMonthBetween(startMonth, endMonth);
            savingsProjectionCurrentFY = monthlyMonitoringEntryRepository.sumTargetValueByMonitoringMonthBetween(startMonth, endMonth);
            
            // Overall metrics - previous FY
            prevTotalInitiatives = initiativeRepository.countByCreatedAtBetween(prevFyStart, prevFyEnd);
            BigDecimal prevTotalExpectedSavings = initiativeRepository.sumExpectedSavingsByCreatedAtBetween(prevFyStart, prevFyEnd);
            prevPotentialSavingsAnnualized = prevTotalExpectedSavings != null ? prevTotalExpectedSavings : BigDecimal.ZERO;
            prevPotentialSavingsCurrentFY = prevPotentialSavingsAnnualized;
            prevActualSavingsCurrentFY = monthlyMonitoringEntryRepository.sumAchievedValueByMonitoringMonthBetween(prevStartMonth, prevEndMonth);
            prevSavingsProjectionCurrentFY = monthlyMonitoringEntryRepository.sumTargetValueByMonitoringMonthBetween(prevStartMonth, prevEndMonth);
        } else {
            // Budget type specific metrics - current FY
            totalInitiatives = initiativeRepository.countByBudgetType(budgetType);
            BigDecimal totalExpectedSavings = initiativeRepository.sumExpectedSavingsByBudgetType(budgetType);
            potentialSavingsAnnualized = totalExpectedSavings != null ? totalExpectedSavings : BigDecimal.ZERO;
            potentialSavingsCurrentFY = initiativeRepository.sumExpectedSavingsByCreatedAtBetweenAndBudgetType(fyStart, fyEnd, budgetType);
            actualSavingsCurrentFY = monthlyMonitoringEntryRepository.sumAchievedValueByMonitoringMonthBetweenAndBudgetType(startMonth, endMonth, budgetType);
            savingsProjectionCurrentFY = monthlyMonitoringEntryRepository.sumTargetValueByMonitoringMonthBetweenAndBudgetType(startMonth, endMonth, budgetType);
            
            // Budget type specific metrics - previous FY
            prevTotalInitiatives = initiativeRepository.countByBudgetTypeAndCreatedAtBetween(budgetType, prevFyStart, prevFyEnd);
            BigDecimal prevTotalExpectedSavings = initiativeRepository.sumExpectedSavingsByCreatedAtBetweenAndBudgetType(prevFyStart, prevFyEnd, budgetType);
            prevPotentialSavingsAnnualized = prevTotalExpectedSavings != null ? prevTotalExpectedSavings : BigDecimal.ZERO;
            prevPotentialSavingsCurrentFY = prevPotentialSavingsAnnualized;
            prevActualSavingsCurrentFY = monthlyMonitoringEntryRepository.sumAchievedValueByMonitoringMonthBetweenAndBudgetType(prevStartMonth, prevEndMonth, budgetType);
            prevSavingsProjectionCurrentFY = monthlyMonitoringEntryRepository.sumTargetValueByMonitoringMonthBetweenAndBudgetType(prevStartMonth, prevEndMonth, budgetType);
        }
        
        // Ensure non-null values
        potentialSavingsCurrentFY = potentialSavingsCurrentFY != null ? potentialSavingsCurrentFY : BigDecimal.ZERO;
        actualSavingsCurrentFY = actualSavingsCurrentFY != null ? actualSavingsCurrentFY : BigDecimal.ZERO;
        savingsProjectionCurrentFY = savingsProjectionCurrentFY != null ? savingsProjectionCurrentFY : BigDecimal.ZERO;
        
        prevPotentialSavingsCurrentFY = prevPotentialSavingsCurrentFY != null ? prevPotentialSavingsCurrentFY : BigDecimal.ZERO;
        prevActualSavingsCurrentFY = prevActualSavingsCurrentFY != null ? prevActualSavingsCurrentFY : BigDecimal.ZERO;
        prevSavingsProjectionCurrentFY = prevSavingsProjectionCurrentFY != null ? prevSavingsProjectionCurrentFY : BigDecimal.ZERO;
        
        // Calculate progress percentage: (Actual Savings / Projected Savings) * 100 - Real Performance Tracking
        BigDecimal progressPercentage = BigDecimal.ZERO;
        if (savingsProjectionCurrentFY.compareTo(BigDecimal.ZERO) > 0) {
            progressPercentage = actualSavingsCurrentFY
                .divide(savingsProjectionCurrentFY, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        }
        
        BigDecimal prevProgressPercentage = BigDecimal.ZERO;
        if (prevSavingsProjectionCurrentFY.compareTo(BigDecimal.ZERO) > 0) {
            prevProgressPercentage = prevActualSavingsCurrentFY
                .divide(prevSavingsProjectionCurrentFY, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        }
        
        // Calculate trends
        BigDecimal totalInitiativesTrend = BigDecimal.valueOf(calculateTrend(totalInitiatives, prevTotalInitiatives));
        BigDecimal potentialSavingsAnnualizedTrend = BigDecimal.valueOf(calculateTrend(potentialSavingsAnnualized, prevPotentialSavingsAnnualized));
        BigDecimal potentialSavingsCurrentFYTrend = BigDecimal.valueOf(calculateTrend(potentialSavingsCurrentFY, prevPotentialSavingsCurrentFY));
        BigDecimal actualSavingsCurrentFYTrend = BigDecimal.valueOf(calculateTrend(actualSavingsCurrentFY, prevActualSavingsCurrentFY));
        BigDecimal savingsProjectionCurrentFYTrend = BigDecimal.valueOf(calculateTrend(savingsProjectionCurrentFY, prevSavingsProjectionCurrentFY));
        BigDecimal progressPercentageTrend = BigDecimal.valueOf(calculateTrend(progressPercentage, prevProgressPercentage));
        
        return new PerformanceAnalysisDTO.PerformanceMetrics(
                totalInitiatives, 
                potentialSavingsAnnualized, 
                potentialSavingsCurrentFY, 
                actualSavingsCurrentFY, 
                savingsProjectionCurrentFY, 
                progressPercentage,
                totalInitiativesTrend,
                potentialSavingsAnnualizedTrend,
                potentialSavingsCurrentFYTrend,
                actualSavingsCurrentFYTrend,
                savingsProjectionCurrentFYTrend,
                progressPercentageTrend
        );
    }
    
    /**
     * Get current month date range as LocalDateTime array [start, end]
     */
    private LocalDateTime[] getCurrentMonthRange() {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());
        
        return new LocalDateTime[]{
            startOfMonth.atStartOfDay(),
            endOfMonth.atTime(23, 59, 59)
        };
    }
    
    /**
     * Get previous month date range as LocalDateTime array [start, end]
     */
    private LocalDateTime[] getPreviousMonthRange() {
        LocalDate today = LocalDate.now();
        LocalDate previousMonth = today.minusMonths(1);
        LocalDate startOfPreviousMonth = previousMonth.withDayOfMonth(1);
        LocalDate endOfPreviousMonth = previousMonth.withDayOfMonth(previousMonth.lengthOfMonth());
        
        return new LocalDateTime[]{
            startOfPreviousMonth.atStartOfDay(),
            endOfPreviousMonth.atTime(23, 59, 59)
        };
    }
    
    /**
     * Get current month string in YYYY-MM format
     */
    private String getCurrentMonthString() {
        LocalDate today = LocalDate.now();
        return today.format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }
    
    /**
     * Get previous month string in YYYY-MM format
     */
    private String getPreviousMonthString() {
        LocalDate today = LocalDate.now().minusMonths(1);
        return today.format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }
    
    /**
     * Calculate percentage trend between current and previous values
     */
    private Double calculateTrend(Number current, Number previous) {
        if (current == null || previous == null) {
            return 0.0;
        }
        
        double currentValue = current.doubleValue();
        double previousValue = previous.doubleValue();
        
        if (previousValue == 0) {
            return currentValue > 0 ? 100.0 : 0.0;
        }
        
        return ((currentValue - previousValue) / previousValue) * 100.0;
    }
    
    /**
     * Calculate percentage trend between current and previous BigDecimal values
     */
    private Double calculateTrend(BigDecimal current, BigDecimal previous) {
        if (current == null || previous == null) {
            return 0.0;
        }
        
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        
        BigDecimal trend = current.subtract(previous)
                                 .divide(previous, 4, RoundingMode.HALF_UP)
                                 .multiply(BigDecimal.valueOf(100));
        
        return trend.doubleValue();
    }
    
    /**
     * Calculate performance metrics for a specific site and budget type
     */
    private PerformanceAnalysisDTO.PerformanceMetrics calculatePerformanceMetricsBySite(
            String site, String budgetType, LocalDateTime fyStart, LocalDateTime fyEnd, 
            String startMonth, String endMonth) {
        
        // Get previous financial year data for trend calculation
        LocalDateTime[] prevFyRange = getPreviousFinancialYearRange();
        LocalDateTime prevFyStart = prevFyRange[0];
        LocalDateTime prevFyEnd = prevFyRange[1];
        String[] prevMonthRange = getPreviousFinancialYearMonthRange();
        String prevStartMonth = prevMonthRange[0];
        String prevEndMonth = prevMonthRange[1];
        
        Long totalInitiatives;
        BigDecimal potentialSavingsAnnualized;
        BigDecimal potentialSavingsCurrentFY;
        BigDecimal actualSavingsCurrentFY;
        BigDecimal savingsProjectionCurrentFY;
        
        // Previous year data for trends
        Long prevTotalInitiatives;
        BigDecimal prevPotentialSavingsAnnualized;
        BigDecimal prevPotentialSavingsCurrentFY;
        BigDecimal prevActualSavingsCurrentFY;
        BigDecimal prevSavingsProjectionCurrentFY;
        
        if (budgetType == null) {
            // Overall metrics for site - current FY
            totalInitiatives = initiativeRepository.countBySite(site);
            BigDecimal totalExpectedSavings = initiativeRepository.sumAllExpectedSavingsBySite(site);
            potentialSavingsAnnualized = totalExpectedSavings != null ? totalExpectedSavings : BigDecimal.ZERO;
            potentialSavingsCurrentFY = initiativeRepository.sumExpectedSavingsBySiteAndCreatedAtBetween(site, fyStart, fyEnd);
            actualSavingsCurrentFY = monthlyMonitoringEntryRepository.sumAchievedValueBySiteAndMonitoringMonthBetween(site, startMonth, endMonth);
            savingsProjectionCurrentFY = monthlyMonitoringEntryRepository.sumTargetValueBySiteAndMonitoringMonthBetween(site, startMonth, endMonth);
            
            // Overall metrics for site - previous FY
            prevTotalInitiatives = initiativeRepository.countBySiteAndCreatedAtBetween(site, prevFyStart, prevFyEnd);
            BigDecimal prevTotalExpectedSavings = initiativeRepository.sumExpectedSavingsBySiteAndCreatedAtBetween(site, prevFyStart, prevFyEnd);
            prevPotentialSavingsAnnualized = prevTotalExpectedSavings != null ? prevTotalExpectedSavings : BigDecimal.ZERO;
            prevPotentialSavingsCurrentFY = prevPotentialSavingsAnnualized;
            prevActualSavingsCurrentFY = monthlyMonitoringEntryRepository.sumAchievedValueBySiteAndMonitoringMonthBetween(site, prevStartMonth, prevEndMonth);
            prevSavingsProjectionCurrentFY = monthlyMonitoringEntryRepository.sumTargetValueBySiteAndMonitoringMonthBetween(site, prevStartMonth, prevEndMonth);
        } else {
            // Budget type specific metrics for site - current FY
            totalInitiatives = initiativeRepository.countBySiteAndBudgetType(site, budgetType);
            BigDecimal totalExpectedSavings = initiativeRepository.sumExpectedSavingsBySiteAndBudgetType(site, budgetType);
            potentialSavingsAnnualized = totalExpectedSavings != null ? totalExpectedSavings : BigDecimal.ZERO;
            potentialSavingsCurrentFY = initiativeRepository.sumExpectedSavingsBySiteAndCreatedAtBetweenAndBudgetType(site, fyStart, fyEnd, budgetType);
            actualSavingsCurrentFY = monthlyMonitoringEntryRepository.sumAchievedValueBySiteAndMonitoringMonthBetweenAndBudgetType(site, startMonth, endMonth, budgetType);
            savingsProjectionCurrentFY = monthlyMonitoringEntryRepository.sumTargetValueBySiteAndMonitoringMonthBetweenAndBudgetType(site, startMonth, endMonth, budgetType);
            
            // Budget type specific metrics for site - previous FY
            prevTotalInitiatives = initiativeRepository.countBySiteAndBudgetTypeAndCreatedAtBetween(site, budgetType, prevFyStart, prevFyEnd);
            BigDecimal prevTotalExpectedSavings = initiativeRepository.sumExpectedSavingsBySiteAndCreatedAtBetweenAndBudgetType(site, prevFyStart, prevFyEnd, budgetType);
            prevPotentialSavingsAnnualized = prevTotalExpectedSavings != null ? prevTotalExpectedSavings : BigDecimal.ZERO;
            prevPotentialSavingsCurrentFY = prevPotentialSavingsAnnualized;
            prevActualSavingsCurrentFY = monthlyMonitoringEntryRepository.sumAchievedValueBySiteAndMonitoringMonthBetweenAndBudgetType(site, prevStartMonth, prevEndMonth, budgetType);
            prevSavingsProjectionCurrentFY = monthlyMonitoringEntryRepository.sumTargetValueBySiteAndMonitoringMonthBetweenAndBudgetType(site, prevStartMonth, prevEndMonth, budgetType);
        }
        
        // Ensure non-null values
        potentialSavingsCurrentFY = potentialSavingsCurrentFY != null ? potentialSavingsCurrentFY : BigDecimal.ZERO;
        actualSavingsCurrentFY = actualSavingsCurrentFY != null ? actualSavingsCurrentFY : BigDecimal.ZERO;
        savingsProjectionCurrentFY = savingsProjectionCurrentFY != null ? savingsProjectionCurrentFY : BigDecimal.ZERO;
        
        prevPotentialSavingsCurrentFY = prevPotentialSavingsCurrentFY != null ? prevPotentialSavingsCurrentFY : BigDecimal.ZERO;
        prevActualSavingsCurrentFY = prevActualSavingsCurrentFY != null ? prevActualSavingsCurrentFY : BigDecimal.ZERO;
        prevSavingsProjectionCurrentFY = prevSavingsProjectionCurrentFY != null ? prevSavingsProjectionCurrentFY : BigDecimal.ZERO;
        
        // Calculate progress percentage: (Actual Savings / Projected Savings) * 100 - Real Performance Tracking
        BigDecimal progressPercentage = BigDecimal.ZERO;
        if (savingsProjectionCurrentFY.compareTo(BigDecimal.ZERO) > 0) {
            progressPercentage = actualSavingsCurrentFY
                .divide(savingsProjectionCurrentFY, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        }
        
        BigDecimal prevProgressPercentage = BigDecimal.ZERO;
        if (prevSavingsProjectionCurrentFY.compareTo(BigDecimal.ZERO) > 0) {
            prevProgressPercentage = prevActualSavingsCurrentFY
                .divide(prevSavingsProjectionCurrentFY, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        }
        
        // Calculate trends
        BigDecimal totalInitiativesTrend = BigDecimal.valueOf(calculateTrend(totalInitiatives, prevTotalInitiatives));
        BigDecimal potentialSavingsAnnualizedTrend = BigDecimal.valueOf(calculateTrend(potentialSavingsAnnualized, prevPotentialSavingsAnnualized));
        BigDecimal potentialSavingsCurrentFYTrend = BigDecimal.valueOf(calculateTrend(potentialSavingsCurrentFY, prevPotentialSavingsCurrentFY));
        BigDecimal actualSavingsCurrentFYTrend = BigDecimal.valueOf(calculateTrend(actualSavingsCurrentFY, prevActualSavingsCurrentFY));
        BigDecimal savingsProjectionCurrentFYTrend = BigDecimal.valueOf(calculateTrend(savingsProjectionCurrentFY, prevSavingsProjectionCurrentFY));
        BigDecimal progressPercentageTrend = BigDecimal.valueOf(calculateTrend(progressPercentage, prevProgressPercentage));
        
        return new PerformanceAnalysisDTO.PerformanceMetrics(
                totalInitiatives, 
                potentialSavingsAnnualized, 
                potentialSavingsCurrentFY, 
                actualSavingsCurrentFY, 
                savingsProjectionCurrentFY, 
                progressPercentage,
                totalInitiativesTrend,
                potentialSavingsAnnualizedTrend,
                potentialSavingsCurrentFYTrend,
                actualSavingsCurrentFYTrend,
                savingsProjectionCurrentFYTrend,
                progressPercentageTrend
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
     * Get previous financial year date range as LocalDateTime array [start, end]
     * For current FY 2025-26: returns 2024-25 (April 1, 2024 to March 31, 2025)
     */
    private LocalDateTime[] getPreviousFinancialYearRange() {
        LocalDate today = LocalDate.now();
        int year = today.getYear(); // 2025
        
        LocalDate fyStart, fyEnd;
        if (today.getMonthValue() >= 4) {
            // Previous FY: April 1st 2024 to March 31st 2025
            fyStart = LocalDate.of(year - 1, 4, 1);   // 2024-04-01
            fyEnd = LocalDate.of(year, 3, 31);        // 2025-03-31
        } else {
            // Previous FY: April 1st 2023 to March 31st 2024
            fyStart = LocalDate.of(year - 2, 4, 1);   // 2023-04-01
            fyEnd = LocalDate.of(year - 1, 3, 31);    // 2024-03-31
        }
        
        return new LocalDateTime[]{
            fyStart.atStartOfDay(),
            fyEnd.atTime(23, 59, 59)
        };
    }
    
    /**
     * Get previous financial year month range as string array [startMonth, endMonth] in YYYY-MM format
     * For current FY 2025-26: returns "2024-04" to "2025-03"
     */
    private String[] getPreviousFinancialYearMonthRange() {
        LocalDate today = LocalDate.now();
        int year = today.getYear(); // 2025
        
        String startMonth, endMonth;
        if (today.getMonthValue() >= 4) {
            // Previous FY: 2024-04 to 2025-03
            startMonth = (year - 1) + "-04";  // "2024-04"
            endMonth = year + "-03";          // "2025-03"
        } else {
            // Previous FY: 2023-04 to 2024-03
            startMonth = (year - 2) + "-04";  // "2023-04"
            endMonth = (year - 1) + "-03";    // "2024-03"
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