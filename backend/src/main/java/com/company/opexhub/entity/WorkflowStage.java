package com.company.opexhub.entity;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Entity
@Table(name = "OPEX_WORKFLOW_STAGES")
public class WorkflowStage {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "workflow_stage_seq")
    @SequenceGenerator(name = "workflow_stage_seq", sequenceName = "OPEX_WF_STAGE_SEQ", allocationSize = 1)
    private Long id;

    @Column(name = "stage_number")
    private Integer stageNumber;

    @NotBlank
    @Size(max = 100)
    @Column(name = "stage_name")
    private String stageName;

    @Size(max = 20)
    @Column(name = "required_role")
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