package com.company.opexhub.security;

import com.company.opexhub.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Objects;

public class UserPrincipal implements UserDetails {
    private Long id;
    private String fullName;
    private String email;
    private String password;
    private String site;
    private String discipline;
    private String role;
    private String roleName;
    private Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(Long id, String fullName, String email, String password, 
                        String site, String discipline, String role, String roleName,
                        Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.site = site;
        this.discipline = discipline;
        this.role = role;
        this.roleName = roleName;
        this.authorities = authorities;
    }

    public static UserPrincipal create(User user) {
        List<GrantedAuthority> authorities = Arrays.asList(new SimpleGrantedAuthority("ROLE_" + user.getRole()));

        return new UserPrincipal(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPassword(),
                user.getSite(),
                user.getDiscipline(),
                user.getRole(),
                user.getRoleName(),
                authorities
        );
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getSite() { return site; }
    public String getDiscipline() { return discipline; }
    public String getRole() { return role; }
    public String getRoleName() { return roleName; }

    @Override
    public String getUsername() { return email; }

    @Override
    public String getPassword() { return password; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserPrincipal that = (UserPrincipal) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}