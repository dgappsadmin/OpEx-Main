package com.company.opexhub.controller;

import com.company.opexhub.dto.ApiResponse;
import com.company.opexhub.entity.Comment;
import com.company.opexhub.security.UserPrincipal;
import com.company.opexhub.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @GetMapping("/initiative/{initiativeId}")
    public List<Comment> getCommentsByInitiative(@PathVariable Long initiativeId) {
        return commentService.getCommentsByInitiative(initiativeId);
    }

    @PostMapping
    public ResponseEntity<?> createComment(@Valid @RequestBody Comment comment,
                                         @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            Comment savedComment = commentService.createComment(comment, currentUser.getId());
            return ResponseEntity.ok(new ApiResponse(true, "Comment added successfully", savedComment));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateComment(@PathVariable Long id,
                                         @Valid @RequestBody Comment comment,
                                         @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            Comment updatedComment = commentService.updateComment(id, comment, currentUser.getId());
            return ResponseEntity.ok(new ApiResponse(true, "Comment updated successfully", updatedComment));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable Long id,
                                         @AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            commentService.deleteComment(id, currentUser.getId());
            return ResponseEntity.ok(new ApiResponse(true, "Comment deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}