package com.company.opexhub.repository;

import com.company.opexhub.entity.InitiativeFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InitiativeFileRepository extends JpaRepository<InitiativeFile, Long> {
    List<InitiativeFile> findByInitiativeId(Long initiativeId);
    void deleteByInitiativeId(Long initiativeId);
}