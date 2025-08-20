package com.company.opexhub.repository;

import com.company.opexhub.entity.TimelineTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TimelineTaskRepository extends JpaRepository<TimelineTask, Long> {
    
    List<TimelineTask> findByInitiative_Id(Long initiativeId);
    
    List<TimelineTask> findByStatus(String status);
    
    List<TimelineTask> findByResponsible(String responsible);
    
    @Query("SELECT t FROM TimelineTask t WHERE t.initiative.id = :initiativeId ORDER BY t.startDate")
    List<TimelineTask> findByInitiativeIdOrderByStartDate(@Param("initiativeId") Long initiativeId);
    
    @Query("SELECT t FROM TimelineTask t WHERE t.endDate < :date AND t.status != 'Completed'")
    List<TimelineTask> findOverdueTasks(@Param("date") LocalDate date);
    
    @Query("SELECT t FROM TimelineTask t WHERE t.startDate <= :date AND t.endDate >= :date")
    List<TimelineTask> findActiveTasksOnDate(@Param("date") LocalDate date);
}