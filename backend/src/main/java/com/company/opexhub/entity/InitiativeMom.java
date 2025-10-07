package com.company.opexhub.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "OPEX_INITIATIVE_MOM")
public class InitiativeMom {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "initiative_mom_seq")
    @SequenceGenerator(name = "initiative_mom_seq", sequenceName = "OPEX_INITIATIVE_MOM_SEQ", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiative_id", nullable = false)
    @JsonBackReference("initiative-moms")
    private Initiative initiative;

    @NotBlank
    @Column(name = "meeting_title", nullable = false)
    private String meetingTitle;

    @NotNull
    @Column(name = "meeting_date", nullable = false)
    private LocalDate meetingDate;

    @NotBlank
    @Column(name = "responsible_person", nullable = false)
    private String responsiblePerson;

    @NotBlank
    @Column(name = "content", columnDefinition = "CLOB")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MomStatus status = MomStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private MomPriority priority = MomPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "meeting_type", nullable = false)
    private MeetingType meetingType = MeetingType.MONTHLY_REVIEW;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "attendees", columnDefinition = "CLOB")
    private String attendees;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @JsonIgnore
    private User createdBy;

    // Enums
    public enum MomStatus {
        OPEN, IN_PROGRESS, COMPLETED
    }

    public enum MomPriority {
        HIGH, MEDIUM, LOW
    }

    public enum MeetingType {
        MONTHLY_REVIEW, AD_HOC, PLANNING, PROGRESS_REVIEW, CLOSURE, OTHER
    }

    // Constructors
    public InitiativeMom() {}

    public InitiativeMom(Initiative initiative, String meetingTitle, LocalDate meetingDate, 
                        String responsiblePerson, String content, User createdBy) {
        this.initiative = initiative;
        this.meetingTitle = meetingTitle;
        this.meetingDate = meetingDate;
        this.responsiblePerson = responsiblePerson;
        this.content = content;
        this.createdBy = createdBy;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Initiative getInitiative() { return initiative; }
    public void setInitiative(Initiative initiative) { this.initiative = initiative; }

    public String getMeetingTitle() { return meetingTitle; }
    public void setMeetingTitle(String meetingTitle) { this.meetingTitle = meetingTitle; }

    public LocalDate getMeetingDate() { return meetingDate; }
    public void setMeetingDate(LocalDate meetingDate) { this.meetingDate = meetingDate; }

    public String getResponsiblePerson() { return responsiblePerson; }
    public void setResponsiblePerson(String responsiblePerson) { this.responsiblePerson = responsiblePerson; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public MomStatus getStatus() { return status; }
    public void setStatus(MomStatus status) { this.status = status; }

    public MomPriority getPriority() { return priority; }
    public void setPriority(MomPriority priority) { this.priority = priority; }

    public MeetingType getMeetingType() { return meetingType; }
    public void setMeetingType(MeetingType meetingType) { this.meetingType = meetingType; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getAttendees() { return attendees; }
    public void setAttendees(String attendees) { this.attendees = attendees; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
}