// package com.company.opexhub.entity;

// import java.time.LocalDateTime;

// import javax.persistence.Column;
// import javax.persistence.Entity;
// import javax.persistence.FetchType;
// import javax.persistence.GeneratedValue;
// import javax.persistence.GenerationType;
// import javax.persistence.Id;
// import javax.persistence.JoinColumn;
// import javax.persistence.ManyToOne;
// import javax.persistence.PrePersist;
// import javax.persistence.PreUpdate;
// import javax.persistence.SequenceGenerator;
// import javax.persistence.Table;
// import javax.validation.constraints.NotBlank;

// import com.fasterxml.jackson.annotation.JsonBackReference;
// import com.fasterxml.jackson.annotation.JsonIgnore;

// @Entity
// @Table(name = "OPEX_INITIATIVE_MOM")
// public class InitiativeMom {
//     @Id
//     @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "initiative_mom_seq")
//     @SequenceGenerator(name = "initiative_mom_seq", sequenceName = "OPEX_INITIATIVE_MOM_SEQ", allocationSize = 1)
//     private Long id;

//     @ManyToOne(fetch = FetchType.LAZY)
//     @JoinColumn(name = "initiative_id", nullable = false)
//     @JsonBackReference("initiative-moms")
//     private Initiative initiative;

//     @NotBlank
//     @Column(name = "content", columnDefinition = "CLOB")
//     private String content;

//     @Column(name = "created_at")
//     private LocalDateTime createdAt;

//     @Column(name = "updated_at")
//     private LocalDateTime updatedAt;

//     @ManyToOne(fetch = FetchType.LAZY)
//     @JoinColumn(name = "created_by", nullable = false)
//     @JsonIgnore
//     private User createdBy;

//     // Constructors
//     public InitiativeMom() {}

//     public InitiativeMom(Initiative initiative, String content, User createdBy) {
//         this.initiative = initiative;
//         this.content = content;
//         this.createdBy = createdBy;
//         this.createdAt = LocalDateTime.now();
//         this.updatedAt = LocalDateTime.now();
//     }

//     @PrePersist
//     protected void onCreate() {
//         createdAt = LocalDateTime.now();
//         updatedAt = LocalDateTime.now();
//     }

//     @PreUpdate
//     protected void onUpdate() {
//         updatedAt = LocalDateTime.now();
//     }

//     // Getters and Setters
//     public Long getId() { return id; }
//     public void setId(Long id) { this.id = id; }

//     public Initiative getInitiative() { return initiative; }
//     public void setInitiative(Initiative initiative) { this.initiative = initiative; }

//     public String getContent() { return content; }
//     public void setContent(String content) { this.content = content; }

//     public LocalDateTime getCreatedAt() { return createdAt; }
//     public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

//     public LocalDateTime getUpdatedAt() { return updatedAt; }
//     public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

//     public User getCreatedBy() { return createdBy; }
//     public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
// }