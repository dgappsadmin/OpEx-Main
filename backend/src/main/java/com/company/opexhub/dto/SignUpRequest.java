package com.company.opexhub.dto;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class SignUpRequest {
    @NotBlank
    @Size(max = 100)
    private String fullName;

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, max = 120)
    private String password;

    @NotBlank
    private String site;

    @NotBlank
    private String discipline;

    @NotBlank
    private String role;

    private String roleName;

    // Constructors
    public SignUpRequest() {}

    public SignUpRequest(String fullName, String email, String password, String site, 
                        String discipline, String role, String roleName) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.site = site;
        this.discipline = discipline;
        this.role = role;
        this.roleName = roleName;
    }

    // Getters and Setters
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public String getDiscipline() { return discipline; }
    public void setDiscipline(String discipline) { this.discipline = discipline; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
}