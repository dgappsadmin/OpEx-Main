package com.company.opexhub.dto;

public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String email;
    private String fullName;
    private String site;
    private String discipline;
    private String role;
    private String roleName;

    public JwtResponse(String accessToken, Long id, String email, String fullName, 
                      String site, String discipline, String role, String roleName) {
        this.token = accessToken;
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.site = site;
        this.discipline = discipline;
        this.role = role;
        this.roleName = roleName;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getSite() { return site; }
    public void setSite(String site) { this.site = site; }

    public String getDiscipline() { return discipline; }
    public void setDiscipline(String discipline) { this.discipline = discipline; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
}