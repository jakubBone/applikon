package com.applikon.repository;

import com.applikon.entity.CompanyBriefField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompanyBriefFieldRepository extends JpaRepository<CompanyBriefField, Long> {

    List<CompanyBriefField> findByBriefId(Long briefId);

    void deleteByBriefId(Long briefId);
}
