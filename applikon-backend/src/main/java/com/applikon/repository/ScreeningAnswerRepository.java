package com.applikon.repository;

import com.applikon.entity.ScreeningAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ScreeningAnswerRepository extends JpaRepository<ScreeningAnswer, Long> {

    List<ScreeningAnswer> findByUserIdOrderBySortOrder(UUID userId);

    void deleteByUserId(UUID userId);
}
