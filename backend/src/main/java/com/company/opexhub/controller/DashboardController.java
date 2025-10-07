package com.company.opexhub.controller;

import com.company.opexhub.dto.DashboardStatsDTO;
import com.company.opexhub.dto.PerformanceAnalysisDTO;
import com.company.opexhub.dto.RecentInitiativeDTO;
import com.company.opexhub.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    /**
     * Get overall dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(
            @RequestParam(value = "financialYear", required = false) String financialYear) {
        DashboardStatsDTO stats = dashboardService.getDashboardStats(financialYear);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get dashboard statistics for a specific site
     */
    @GetMapping("/stats/{site}")
    public ResponseEntity<DashboardStatsDTO> getDashboardStatsBySite(
            @PathVariable String site, 
            @RequestParam(value = "financialYear", required = false) String financialYear) {
        DashboardStatsDTO stats = dashboardService.getDashboardStatsBySite(site, financialYear);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get recent initiatives (latest 5)
     */
    @GetMapping("/recent-initiatives")
    public ResponseEntity<List<RecentInitiativeDTO>> getRecentInitiatives(
            @RequestParam(value = "financialYear", required = false) String financialYear) {
        List<RecentInitiativeDTO> recentInitiatives = dashboardService.getRecentInitiatives(financialYear);
        return ResponseEntity.ok(recentInitiatives);
    }

    /**
     * Get recent initiatives for a specific site
     */
    @GetMapping("/recent-initiatives/{site}")
    public ResponseEntity<List<RecentInitiativeDTO>> getRecentInitiativesBySite(
            @PathVariable String site, 
            @RequestParam(value = "financialYear", required = false) String financialYear) {
        List<RecentInitiativeDTO> recentInitiatives = dashboardService.getRecentInitiativesBySite(site, financialYear);
        return ResponseEntity.ok(recentInitiatives);
    }
    
    /**
     * Get performance analysis dashboard data
     */
    @GetMapping("/performance-analysis")
    public ResponseEntity<PerformanceAnalysisDTO> getPerformanceAnalysis(
            @RequestParam(value = "financialYear", required = false) String financialYear) {
        PerformanceAnalysisDTO performanceAnalysis = dashboardService.getPerformanceAnalysis(financialYear);
        return ResponseEntity.ok(performanceAnalysis);
    }

    /**
     * Get performance analysis dashboard data for a specific site
     */
    @GetMapping("/performance-analysis/{site}")
    public ResponseEntity<PerformanceAnalysisDTO> getPerformanceAnalysisBySite(
            @PathVariable String site, 
            @RequestParam(value = "financialYear", required = false) String financialYear) {
        PerformanceAnalysisDTO performanceAnalysis = dashboardService.getPerformanceAnalysisBySite(site, financialYear);
        return ResponseEntity.ok(performanceAnalysis);
    }

    /**
     * Get available sites for dashboard filter (excluding CORP)
     */
    @GetMapping("/sites")
    public ResponseEntity<List<String>> getAvailableSites() {
        List<String> sites = dashboardService.getAvailableSites();
        return ResponseEntity.ok(sites);
    }
}