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
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        DashboardStatsDTO stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get dashboard statistics for a specific site
     */
    @GetMapping("/stats/{site}")
    public ResponseEntity<DashboardStatsDTO> getDashboardStatsBySite(@PathVariable String site) {
        DashboardStatsDTO stats = dashboardService.getDashboardStatsBySite(site);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get recent initiatives (latest 5)
     */
    @GetMapping("/recent-initiatives")
    public ResponseEntity<List<RecentInitiativeDTO>> getRecentInitiatives() {
        List<RecentInitiativeDTO> recentInitiatives = dashboardService.getRecentInitiatives();
        return ResponseEntity.ok(recentInitiatives);
    }

    /**
     * Get recent initiatives for a specific site
     */
    @GetMapping("/recent-initiatives/{site}")
    public ResponseEntity<List<RecentInitiativeDTO>> getRecentInitiativesBySite(@PathVariable String site) {
        List<RecentInitiativeDTO> recentInitiatives = dashboardService.getRecentInitiativesBySite(site);
        return ResponseEntity.ok(recentInitiatives);
    }
    
    /**
     * Get performance analysis dashboard data
     */
    @GetMapping("/performance-analysis")
    public ResponseEntity<PerformanceAnalysisDTO> getPerformanceAnalysis() {
        PerformanceAnalysisDTO performanceAnalysis = dashboardService.getPerformanceAnalysis();
        return ResponseEntity.ok(performanceAnalysis);
    }
}