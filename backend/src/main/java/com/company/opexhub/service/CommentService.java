package com.company.opexhub.service;

import com.company.opexhub.entity.Comment;
import com.company.opexhub.entity.User;
import com.company.opexhub.repository.CommentRepository;
import com.company.opexhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Comment> getCommentsByInitiative(Long initiativeId) {
        return commentRepository.findByInitiativeIdOrderByCreatedAtDesc(initiativeId);
    }

    @Transactional
    public Comment createComment(Comment comment, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        comment.setUser(user);
        return commentRepository.save(comment);
    }

    @Transactional
    public Comment updateComment(Long commentId, Comment commentDetails, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        // Check if user owns the comment
        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to update this comment");
        }

        comment.setContent(commentDetails.getContent());
        return commentRepository.save(comment);
    }

    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        // Check if user owns the comment
        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this comment");
        }

        commentRepository.deleteById(commentId);
    }

    public List<Comment> getCommentsByUser(Long userId) {
        return commentRepository.findByUser_Id(userId);
    }
}