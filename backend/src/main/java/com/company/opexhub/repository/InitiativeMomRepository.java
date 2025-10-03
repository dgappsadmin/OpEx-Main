// package com.company.opexhub.repository;

// import java.util.List;
// import java.util.Optional;

// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Query;
// import org.springframework.data.repository.query.Param;
// import org.springframework.stereotype.Repository;

// import com.company.opexhub.entity.InitiativeMom;

// @Repository
// public interface InitiativeMomRepository extends JpaRepository<InitiativeMom, Long> {
    
//     /**
//      * Find all MOM entries for a specific initiative
//      */
//     @Query("SELECT m FROM InitiativeMom m WHERE m.initiative.id = :initiativeId ORDER BY m.createdAt DESC")
//     List<InitiativeMom> findByInitiativeIdOrderByCreatedAtDesc(@Param("initiativeId") Long initiativeId);
    
//     /**
//      * Find MOM entry by ID and initiative ID (for security)
//      */
//     @Query("SELECT m FROM InitiativeMom m WHERE m.id = :id AND m.initiative.id = :initiativeId")
//     Optional<InitiativeMom> findByIdAndInitiativeId(@Param("id") Long id, @Param("initiativeId") Long initiativeId);
    
//     /**
//      * Count MOM entries for a specific initiative
//      */
//     @Query("SELECT COUNT(m) FROM InitiativeMom m WHERE m.initiative.id = :initiativeId")
//     Long countByInitiativeId(@Param("initiativeId") Long initiativeId);
    
//     /**
//      * Find MOM entries created by a specific user for an initiative
//      */
//     @Query("SELECT m FROM InitiativeMom m WHERE m.initiative.id = :initiativeId AND m.createdBy.id = :userId ORDER BY m.createdAt DESC")
//     List<InitiativeMom> findByInitiativeIdAndCreatedByIdOrderByCreatedAtDesc(@Param("initiativeId") Long initiativeId, @Param("userId") Long userId);
// }