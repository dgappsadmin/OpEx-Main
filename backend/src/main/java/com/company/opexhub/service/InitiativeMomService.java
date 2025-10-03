// package com.company.opexhub.service;

// import java.util.List;
// import java.util.stream.Collectors;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional;

// import com.company.opexhub.dto.ApiResponse;
// import com.company.opexhub.entity.Initiative;
// import com.company.opexhub.entity.InitiativeMom;
// import com.company.opexhub.entity.User;
// import com.company.opexhub.repository.InitiativeMomRepository;
// import com.company.opexhub.repository.InitiativeRepository;
// import com.company.opexhub.repository.UserRepository;

// @Service
// @Transactional
// public class InitiativeMomService {

//     @Autowired
//     private InitiativeMomRepository momRepository;
    
//     @Autowired
//     private InitiativeRepository initiativeRepository;
    
//     @Autowired
//     private UserRepository userRepository;

//     /**
//      * Get all MOM entries for an initiative
//      */
//     public List<InitiativeMomDTO> getMomsByInitiativeId(Long initiativeId) {
//         List<InitiativeMom> moms = momRepository.findByInitiativeIdOrderByCreatedAtDesc(initiativeId);
//         return moms.stream()
//                    .map(this::convertToDTO)
//                    .collect(Collectors.toList());
//     }

//     /**
//      * Create a new MOM entry
//      */
//     public InitiativeMomDTO createMom(Long initiativeId, String content, String userEmail) {
//         // Validate initiative exists
//         Initiative initiative = initiativeRepository.findById(initiativeId)
//             .orElseThrow(() -> new RuntimeException("Initiative not found"));
        
//         // Validate user exists
//         User user = userRepository.findByEmail(userEmail)
//             .orElseThrow(() -> new RuntimeException("User not found"));
        
//         // Validate user has permission to add MOM (same as initiative edit permission)
//         if (!canUserModifyInitiative(user, initiative)) {
//             throw new RuntimeException("User does not have permission to add MOM for this initiative");
//         }

//         InitiativeMom mom = new InitiativeMom(initiative, content, user);
//         mom = momRepository.save(mom);
        
//         return convertToDTO(mom);
//     }

//     /**
//      * Update an existing MOM entry
//      */
//     public InitiativeMomDTO updateMom(Long momId, Long initiativeId, String content, String userEmail) {
//         // Find MOM entry
//         InitiativeMom mom = momRepository.findByIdAndInitiativeId(momId, initiativeId)
//             .orElseThrow(() -> new RuntimeException("MOM entry not found"));
        
//         // Validate user exists
//         User user = userRepository.findByEmail(userEmail)
//             .orElseThrow(() -> new RuntimeException("User not found"));
        
//         // Check if user can modify (same as initiative edit permission)
//         if (!canUserModifyInitiative(user, mom.getInitiative())) {
//             throw new RuntimeException("User does not have permission to edit this MOM entry");
//         }

//         mom.setContent(content);
//         mom = momRepository.save(mom);
        
//         return convertToDTO(mom);
//     }

//     /**
//      * Delete a MOM entry
//      */
//     public ApiResponse deleteMom(Long momId, Long initiativeId, String userEmail) {
//         // Find MOM entry
//         InitiativeMom mom = momRepository.findByIdAndInitiativeId(momId, initiativeId)
//             .orElseThrow(() -> new RuntimeException("MOM entry not found"));
        
//         // Validate user exists
//         User user = userRepository.findByEmail(userEmail)
//             .orElseThrow(() -> new RuntimeException("User not found"));
        
//         // Check if user can modify (same as initiative edit permission)
//         if (!canUserModifyInitiative(user, mom.getInitiative())) {
//             throw new RuntimeException("User does not have permission to delete this MOM entry");
//         }

//         momRepository.delete(mom);
        
//         return new ApiResponse(true, "MOM entry deleted successfully");
//     }

//     /**
//      * Get a specific MOM entry by ID
//      */
//     public InitiativeMomDTO getMomById(Long momId, Long initiativeId) {
//         InitiativeMom mom = momRepository.findByIdAndInitiativeId(momId, initiativeId)
//             .orElseThrow(() -> new RuntimeException("MOM entry not found"));
        
//         return convertToDTO(mom);
//     }

//     /**
//      * Check if user can modify the initiative (same permission logic as initiative editing)
//      */
//     private boolean canUserModifyInitiative(User user, Initiative initiative) {
//         // VIEWER role cannot modify
//         if ("VIEWER".equals(user.getRole())) {
//             return false;
//         }
        
//         // Must be same site as initiative
//         return user.getSite().equals(initiative.getSite());
//     }

//     /**
//      * Convert InitiativeMom entity to DTO
//      */
//     private InitiativeMomDTO convertToDTO(InitiativeMom mom) {
//         InitiativeMomDTO dto = new InitiativeMomDTO();
//         dto.setId(mom.getId());
//         dto.setInitiativeId(mom.getInitiative().getId());
//         dto.setContent(mom.getContent());
//         dto.setCreatedAt(mom.getCreatedAt());
//         dto.setUpdatedAt(mom.getUpdatedAt());
//         dto.setCreatedBy(mom.getCreatedBy().getFullName());
//         dto.setCreatedByEmail(mom.getCreatedBy().getEmail());
//         return dto;
//     }

//     /**
//      * DTO class for MOM responses
//      */
//     public static class InitiativeMomDTO {
//         private Long id;
//         private Long initiativeId;
//         private String content;
//         private java.time.LocalDateTime createdAt;
//         private java.time.LocalDateTime updatedAt;
//         private String createdBy;
//         private String createdByEmail;

//         // Getters and setters
//         public Long getId() { return id; }
//         public void setId(Long id) { this.id = id; }

//         public Long getInitiativeId() { return initiativeId; }
//         public void setInitiativeId(Long initiativeId) { this.initiativeId = initiativeId; }

//         public String getContent() { return content; }
//         public void setContent(String content) { this.content = content; }

//         public java.time.LocalDateTime getCreatedAt() { return createdAt; }
//         public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }

//         public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
//         public void setUpdatedAt(java.time.LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

//         public String getCreatedBy() { return createdBy; }
//         public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

//         public String getCreatedByEmail() { return createdByEmail; }
//         public void setCreatedByEmail(String createdByEmail) { this.createdByEmail = createdByEmail; }
//     }
// }