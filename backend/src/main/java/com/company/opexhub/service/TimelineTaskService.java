package com.company.opexhub.service;

import com.company.opexhub.entity.TimelineTask;
import com.company.opexhub.repository.TimelineTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TimelineTaskService {

    @Autowired
    private TimelineTaskRepository timelineTaskRepository;

    public List<TimelineTask> getTasksByInitiative(Long initiativeId) {
        return timelineTaskRepository.findByInitiativeIdOrderByStartDate(initiativeId);
    }

    public Optional<TimelineTask> getTaskById(Long id) {
        return timelineTaskRepository.findById(id);
    }

    @Transactional
    public TimelineTask createTask(TimelineTask task) {
        return timelineTaskRepository.save(task);
    }

    @Transactional
    public TimelineTask updateTask(Long id, TimelineTask taskDetails) {
        TimelineTask task = timelineTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setTitle(taskDetails.getTitle());
        task.setDescription(taskDetails.getDescription());
        task.setStartDate(taskDetails.getStartDate());
        task.setEndDate(taskDetails.getEndDate());
        task.setStatus(taskDetails.getStatus());
        task.setProgressPercentage(taskDetails.getProgressPercentage());
        task.setResponsible(taskDetails.getResponsible());
        task.setAccountable(taskDetails.getAccountable());
        task.setConsulted(taskDetails.getConsulted());
        task.setInformed(taskDetails.getInformed());
        task.setComments(taskDetails.getComments());

        return timelineTaskRepository.save(task);
    }

    @Transactional
    public TimelineTask updateProgress(Long id, Integer progress) {
        TimelineTask task = timelineTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setProgressPercentage(progress);
        
        // Auto-update status based on progress
        if (progress == 0) {
            task.setStatus("Not Started");
        } else if (progress < 100) {
            task.setStatus("In Progress");
        } else {
            task.setStatus("Completed");
        }

        return timelineTaskRepository.save(task);
    }

    public void deleteTask(Long id) {
        timelineTaskRepository.deleteById(id);
    }

    public List<TimelineTask> getTasksByStatus(String status) {
        return timelineTaskRepository.findByStatus(status);
    }

    public List<TimelineTask> getOverdueTasks() {
        return timelineTaskRepository.findOverdueTasks(java.time.LocalDate.now());
    }
}