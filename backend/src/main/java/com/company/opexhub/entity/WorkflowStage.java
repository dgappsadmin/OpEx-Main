package com.company.opexhub.entity;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Entity
@Table(name = "workflow_stages")
public class WorkflowStage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stage_number")
    private Integer stageNumber;

    @NotBlank
    @Size(max = 100)
    private String stageName;

    @Size(max = 20)
    private String requiredRole;

    @Size(max = 10)
    private String site;

    // Constructors
    public WorkflowStage() {}

    public WorkflowStage(Integer stageNumber, String stageName, String requiredRole, String site) {
        this.stageNumber = stageNumber;
        this.stageName = stageName;
        this.requiredRole = requiredRole;
        this.site = site;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getStageNumber() { return stageNumber; }
    public void setStageNumber(Integer stageNumber) { this.stageNumber = stageNumber; }

    public String getStageName() { return stageName; }
    public void setStageName(String stageName) { this.stageName = stageName; }

    public String getRequiredRole() { return requiredRole; }
    public void setRequiredRole(String requiredRole) { this.requiredRole = requiredRole; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }
}