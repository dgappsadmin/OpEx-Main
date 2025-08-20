package com.company.opexhub.repository;

import com.company.opexhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    List<User> findByRoleAndSite(String role, String site);
    
    List<User> findByRole(String role);
    
    Boolean existsByEmail(String email);
    
    List<User> findBySite(String site);
    
    List<User> findBySiteAndRole(String site, String role);
    
    @Query("SELECT u FROM User u WHERE u.site = :site AND u.discipline = :discipline")
    List<User> findBySiteAndDiscipline(@Param("site") String site, @Param("discipline") String discipline);
    
    @Query("SELECT u FROM User u WHERE u.fullName LIKE %:name%")
    List<User> findByFullNameContaining(@Param("name") String name);
}