package com.company.opexhub.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.company.opexhub.entity.InitiativeMom;

@Repository
public interface InitiativeMomRepository extends JpaRepository<InitiativeMom, Long> {
    
    /**
     * Find all MOM entries for a specific initiative ordered by meeting date (newest first)
     */
    @Query("SELECT m FROM InitiativeMom m WHERE m.initiative.id = :initiativeId ORDER BY m.meetingDate DESC, m.createdAt DESC")
    List<InitiativeMom> findByInitiativeIdOrderByMeetingDateDesc(@Param("initiativeId") Long initiativeId);
    
    /**
     * Find MOM entries for a specific initiative and month
     */
    @Query("SELECT m FROM InitiativeMom m WHERE m.initiative.id = :initiativeId " +
           "AND YEAR(m.meetingDate) = :year AND MONTH(m.meetingDate) = :month " +
           "ORDER BY m.meetingDate DESC, m.createdAt DESC")
    List<InitiativeMom> findByInitiativeIdAndMonth(@Param("initiativeId") Long initiativeId, 
                                                   @Param("year") int year, 
                                                   @Param("month") int month);
    
    /**
     * Find MOM entries for a specific initiative within date range
     */
    @Query("SELECT m FROM InitiativeMom m WHERE m.initiative.id = :initiativeId " +
           "AND m.meetingDate BETWEEN :startDate AND :endDate " +
           "ORDER BY m.meetingDate DESC, m.createdAt DESC")
    List<InitiativeMom> findByInitiativeIdAndDateRange(@Param("initiativeId") Long initiativeId,
                                                       @Param("startDate") LocalDate startDate,
                                                       @Param("endDate") LocalDate endDate);
    
    /**
     * Find MOM entry by ID and initiative ID (for security)
     */
    @Query("SELECT m FROM InitiativeMom m WHERE m.id = :id AND m.initiative.id = :initiativeId")
    Optional<InitiativeMom> findByIdAndInitiativeId(@Param("id") Long id, @Param("initiativeId") Long initiativeId);
    
    /**
     * Count MOM entries for a specific initiative
     */
    @Query("SELECT COUNT(m) FROM InitiativeMom m WHERE m.initiative.id = :initiativeId")
    Long countByInitiativeId(@Param("initiativeId") Long initiativeId);
    
    /**
     * Find MOM entries created by a specific user for an initiative
     */
    @Query("SELECT m FROM InitiativeMom m WHERE m.initiative.id = :initiativeId AND m.createdBy.id = :userId ORDER BY m.meetingDate DESC, m.createdAt DESC")
    List<InitiativeMom> findByInitiativeIdAndCreatedByIdOrderByMeetingDateDesc(@Param("initiativeId") Long initiativeId, @Param("userId") Long userId);
    
    /**
     * Get distinct years and months for an initiative's MOM entries
     */
    @Query("SELECT DISTINCT YEAR(m.meetingDate) as year, MONTH(m.meetingDate) as month " +
           "FROM InitiativeMom m WHERE m.initiative.id = :initiativeId " +
           "ORDER BY year DESC, month DESC")
    List<Object[]> findDistinctMonthsByInitiativeId(@Param("initiativeId") Long initiativeId);
}