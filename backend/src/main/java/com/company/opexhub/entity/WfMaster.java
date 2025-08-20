package com.company.opexhub.entity;

import javax.persistence.*;

@Entity
@Table(name = "wf_master")
public class WfMaster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stage_number", nullable = false)
    private Integer stageNumber;

    @Column(name = "stage_name", nullable = false)
    private String stageName;

    @Column(name = "role_code", nullable = false)
    private String roleCode;

    @Column(name = "site", nullable = false)
    private String site;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Constructors
    public WfMaster() {}

    public WfMaster(Integer stageNumber, String stageName, String roleCode, String site, String userEmail) {
        this.stageNumber = stageNumber;
        this.stageName = stageName;
        this.roleCode = roleCode;
        this.site = site;
        this.userEmail = userEmail;
        this.isActive = true;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getStageNumber() {
        return stageNumber;
    }

    public void setStageNumber(Integer stageNumber) {
        this.stageNumber = stageNumber;
    }

    public String getStageName() {
        return stageName;
    }

    public void setStageName(String stageName) {
        this.stageName = stageName;
    }

    public String getRoleCode() {
        return roleCode;
    }

    public void setRoleCode(String roleCode) {
        this.roleCode = roleCode;
    }

    public String getSite() {
        return site;
    }

    public void setSite(String site) {
        this.site = site;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}