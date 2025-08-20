package com.company.opexhub.controller;

import com.company.opexhub.dto.ApiResponse;
import com.company.opexhub.entity.TimelineTask;
import com.company.opexhub.service.TimelineTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/timeline-tasks")
public class TimelineTaskController {

    @Autowired
    private TimelineTaskService timelineTaskService;

    @GetMapping("/initiative/{initiativeId}")
    public List<TimelineTask> getTasksByInitiative(@PathVariable Long initiativeId) {
        return timelineTaskService.getTasksByInitiative(initiativeId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TimelineTask> getTaskById(@PathVariable Long id) {
        return timelineTaskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createTask(@Valid @RequestBody TimelineTask task) {
        try {
            TimelineTask savedTask = timelineTaskService.createTask(task);
            return ResponseEntity.ok(new ApiResponse(true, "Task created successfully", savedTask));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @Valid @RequestBody TimelineTask task) {
        try {
            TimelineTask updatedTask = timelineTaskService.updateTask(id, task);
            return ResponseEntity.ok(new ApiResponse(true, "Task updated successfully", updatedTask));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        try {
            timelineTaskService.deleteTask(id);
            return ResponseEntity.ok(new ApiResponse(true, "Task deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}/progress")
    public ResponseEntity<?> updateProgress(@PathVariable Long id, @RequestParam Integer progress) {
        try {
            TimelineTask task = timelineTaskService.updateProgress(id, progress);
            return ResponseEntity.ok(new ApiResponse(true, "Progress updated successfully", task));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}