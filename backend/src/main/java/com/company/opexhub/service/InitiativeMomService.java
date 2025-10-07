package com.company.opexhub.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.opexhub.dto.ApiResponse;
import com.company.opexhub.entity.Initiative;
import com.company.opexhub.entity.InitiativeMom;
import com.company.opexhub.entity.User;
import com.company.opexhub.repository.InitiativeMomRepository;
import com.company.opexhub.repository.InitiativeRepository;
import com.company.opexhub.repository.UserRepository;

@Service
@Transactional
public class InitiativeMomService {

    @Autowired
    private InitiativeMomRepository momRepository;
    
    @Autowired
    private InitiativeRepository initiativeRepository;
    
    @Autowired
    private UserRepository userRepository;

    /**
     * Get all MOM entries for an initiative
     */
    public List<InitiativeMomDTO> getMomsByInitiativeId(Long initiativeId) {
        List<InitiativeMom> moms = momRepository.findByInitiativeIdOrderByMeetingDateDesc(initiativeId);
        return moms.stream()
                   .map(this::convertToDTO)
                   .collect(Collectors.toList());
    }

    /**
     * Get MOM entries for an initiative filtered by month
     */
    public List<InitiativeMomDTO> getMomsByInitiativeIdAndMonth(Long initiativeId, int year, int month) {
        List<InitiativeMom> moms = momRepository.findByInitiativeIdAndMonth(initiativeId, year, month);
        return moms.stream()
                   .map(this::convertToDTO)
                   .collect(Collectors.toList());
    }

    /**
     * Get available months for an initiative's MOM entries
     */
    public List<Map<String, Object>> getAvailableMonths(Long initiativeId) {
        List<Object[]> results = momRepository.findDistinctMonthsByInitiativeId(initiativeId);
        return results.stream().map(result -> {
            Map<String, Object> month = new HashMap<>();
            month.put("year", result[0]);
            month.put("month", result[1]);
            return month;
        }).collect(Collectors.toList());
    }

    /**
     * Create a new MOM entry
     */
    public InitiativeMomDTO createMom(Long initiativeId, MomCreateRequest request, String userEmail) {
        // Validate initiative exists
        Initiative initiative = initiativeRepository.findById(initiativeId)
            .orElseThrow(() -> new RuntimeException("Initiative not found"));
        
        // Validate user exists
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Validate user has permission to add MOM - IL role only for this initiative
        if (!canUserModifyMom(user, initiative)) {
            throw new RuntimeException("Only Initiative Lead can add MOM entries for this initiative");
        }

        InitiativeMom mom = new InitiativeMom(initiative, request.getMeetingTitle(), 
                                            request.getMeetingDate(), request.getResponsiblePerson(), 
                                            request.getContent(), user);
        
        // Set optional fields
        if (request.getStatus() != null) {
            mom.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            mom.setPriority(request.getPriority());
        }
        if (request.getMeetingType() != null) {
            mom.setMeetingType(request.getMeetingType());
        }
        if (request.getDueDate() != null) {
            mom.setDueDate(request.getDueDate());
        }
        if (request.getAttendees() != null) {
            mom.setAttendees(request.getAttendees());
        }

        mom = momRepository.save(mom);
        
        return convertToDTO(mom);
    }

    /**
     * Update an existing MOM entry
     */
    public InitiativeMomDTO updateMom(Long momId, Long initiativeId, MomUpdateRequest request, String userEmail) {
        // Find MOM entry
        InitiativeMom mom = momRepository.findByIdAndInitiativeId(momId, initiativeId)
            .orElseThrow(() -> new RuntimeException("MOM entry not found"));
        
        // Validate user exists
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user can modify - IL role only
        if (!canUserModifyMom(user, mom.getInitiative())) {
            throw new RuntimeException("Only Initiative Lead can edit MOM entries for this initiative");
        }

        // Update fields
        if (request.getMeetingTitle() != null) {
            mom.setMeetingTitle(request.getMeetingTitle());
        }
        if (request.getMeetingDate() != null) {
            mom.setMeetingDate(request.getMeetingDate());
        }
        if (request.getResponsiblePerson() != null) {
            mom.setResponsiblePerson(request.getResponsiblePerson());
        }
        if (request.getContent() != null) {
            mom.setContent(request.getContent());
        }
        if (request.getStatus() != null) {
            mom.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            mom.setPriority(request.getPriority());
        }
        if (request.getMeetingType() != null) {
            mom.setMeetingType(request.getMeetingType());
        }
        if (request.getDueDate() != null) {
            mom.setDueDate(request.getDueDate());
        }
        if (request.getAttendees() != null) {
            mom.setAttendees(request.getAttendees());
        }

        mom = momRepository.save(mom);
        
        return convertToDTO(mom);
    }

    /**
     * Delete a MOM entry
     */
    public ApiResponse deleteMom(Long momId, Long initiativeId, String userEmail) {
        // Find MOM entry
        InitiativeMom mom = momRepository.findByIdAndInitiativeId(momId, initiativeId)
            .orElseThrow(() -> new RuntimeException("MOM entry not found"));
        
        // Validate user exists
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user can modify - IL role only
        if (!canUserModifyMom(user, mom.getInitiative())) {
            throw new RuntimeException("Only Initiative Lead can delete MOM entries for this initiative");
        }

        momRepository.delete(mom);
        
        return new ApiResponse(true, "MOM entry deleted successfully");
    }

    /**
     * Get a specific MOM entry by ID
     */
    public InitiativeMomDTO getMomById(Long momId, Long initiativeId) {
        InitiativeMom mom = momRepository.findByIdAndInitiativeId(momId, initiativeId)
            .orElseThrow(() -> new RuntimeException("MOM entry not found"));
        
        return convertToDTO(mom);
    }

    /**
     * Check if user can modify MOM entries - IL role only for this initiative
     */
    private boolean canUserModifyMom(User user, Initiative initiative) {
        // Only IL (Initiative Lead) role can modify MOM entries
        if (!"IL".equals(user.getRole())) {
            return false;
        }
        
        // Must be same site as initiative
        return user.getSite().equals(initiative.getSite());
    }

    /**
     * Convert InitiativeMom entity to DTO
     */
    private InitiativeMomDTO convertToDTO(InitiativeMom mom) {
        InitiativeMomDTO dto = new InitiativeMomDTO();
        dto.setId(mom.getId());
        dto.setInitiativeId(mom.getInitiative().getId());
        dto.setMeetingTitle(mom.getMeetingTitle());
        dto.setMeetingDate(mom.getMeetingDate());
        dto.setResponsiblePerson(mom.getResponsiblePerson());
        dto.setContent(mom.getContent());
        dto.setStatus(mom.getStatus().name());
        dto.setPriority(mom.getPriority().name());
        dto.setMeetingType(mom.getMeetingType().name());
        dto.setDueDate(mom.getDueDate());
        dto.setAttendees(mom.getAttendees());
        dto.setCreatedAt(mom.getCreatedAt());
        dto.setUpdatedAt(mom.getUpdatedAt());
        dto.setCreatedBy(mom.getCreatedBy().getFullName());
        dto.setCreatedByEmail(mom.getCreatedBy().getEmail());
        return dto;
    }

    /**
     * DTO class for MOM responses
     */
    public static class InitiativeMomDTO {
        private Long id;
        private Long initiativeId;
        private String meetingTitle;
        private LocalDate meetingDate;
        private String responsiblePerson;
        private String content;
        private String status;
        private String priority;
        private String meetingType;
        private LocalDate dueDate;
        private String attendees;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime updatedAt;
        private String createdBy;
        private String createdByEmail;

        // Getters and setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getInitiativeId() { return initiativeId; }
        public void setInitiativeId(Long initiativeId) { this.initiativeId = initiativeId; }

        public String getMeetingTitle() { return meetingTitle; }
        public void setMeetingTitle(String meetingTitle) { this.meetingTitle = meetingTitle; }

        public LocalDate getMeetingDate() { return meetingDate; }
        public void setMeetingDate(LocalDate meetingDate) { this.meetingDate = meetingDate; }

        public String getResponsiblePerson() { return responsiblePerson; }
        public void setResponsiblePerson(String responsiblePerson) { this.responsiblePerson = responsiblePerson; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }

        public String getMeetingType() { return meetingType; }
        public void setMeetingType(String meetingType) { this.meetingType = meetingType; }

        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

        public String getAttendees() { return attendees; }
        public void setAttendees(String attendees) { this.attendees = attendees; }

        public java.time.LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }

        public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(java.time.LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

        public String getCreatedBy() { return createdBy; }
        public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

        public String getCreatedByEmail() { return createdByEmail; }
        public void setCreatedByEmail(String createdByEmail) { this.createdByEmail = createdByEmail; }
    }

    /**
     * Request class for creating MOM entries
     */
    public static class MomCreateRequest {
        private String meetingTitle;
        private LocalDate meetingDate;
        private String responsiblePerson;
        private String content;
        private InitiativeMom.MomStatus status;
        private InitiativeMom.MomPriority priority;
        private InitiativeMom.MeetingType meetingType;
        private LocalDate dueDate;
        private String attendees;

        // Getters and setters
        public String getMeetingTitle() { return meetingTitle; }
        public void setMeetingTitle(String meetingTitle) { this.meetingTitle = meetingTitle; }

        public LocalDate getMeetingDate() { return meetingDate; }
        public void setMeetingDate(LocalDate meetingDate) { this.meetingDate = meetingDate; }

        public String getResponsiblePerson() { return responsiblePerson; }
        public void setResponsiblePerson(String responsiblePerson) { this.responsiblePerson = responsiblePerson; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public InitiativeMom.MomStatus getStatus() { return status; }
        public void setStatus(InitiativeMom.MomStatus status) { this.status = status; }

        public InitiativeMom.MomPriority getPriority() { return priority; }
        public void setPriority(InitiativeMom.MomPriority priority) { this.priority = priority; }

        public InitiativeMom.MeetingType getMeetingType() { return meetingType; }
        public void setMeetingType(InitiativeMom.MeetingType meetingType) { this.meetingType = meetingType; }

        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

        public String getAttendees() { return attendees; }
        public void setAttendees(String attendees) { this.attendees = attendees; }
    }

    /**
     * Request class for updating MOM entries
     */
    public static class MomUpdateRequest {
        private String meetingTitle;
        private LocalDate meetingDate;
        private String responsiblePerson;
        private String content;
        private InitiativeMom.MomStatus status;
        private InitiativeMom.MomPriority priority;
        private InitiativeMom.MeetingType meetingType;
        private LocalDate dueDate;
        private String attendees;

        // Getters and setters
        public String getMeetingTitle() { return meetingTitle; }
        public void setMeetingTitle(String meetingTitle) { this.meetingTitle = meetingTitle; }

        public LocalDate getMeetingDate() { return meetingDate; }
        public void setMeetingDate(LocalDate meetingDate) { this.meetingDate = meetingDate; }

        public String getResponsiblePerson() { return responsiblePerson; }
        public void setResponsiblePerson(String responsiblePerson) { this.responsiblePerson = responsiblePerson; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }

        public InitiativeMom.MomStatus getStatus() { return status; }
        public void setStatus(InitiativeMom.MomStatus status) { this.status = status; }

        public InitiativeMom.MomPriority getPriority() { return priority; }
        public void setPriority(InitiativeMom.MomPriority priority) { this.priority = priority; }

        public InitiativeMom.MeetingType getMeetingType() { return meetingType; }
        public void setMeetingType(InitiativeMom.MeetingType meetingType) { this.meetingType = meetingType; }

        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

        public String getAttendees() { return attendees; }
        public void setAttendees(String attendees) { this.attendees = attendees; }
    }
}