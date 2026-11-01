package com.applikon.repository;

import com.applikon.entity.CompanyBrief;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyBriefRepository extends JpaRepository<CompanyBrief, Long> {

    Optional<CompanyBrief> findByUserIdAndCompanyName(UUID userId, String companyName);

    List<CompanyBrief> findByUserId(UUID userId);

    void deleteByUserId(UUID userId);
}
