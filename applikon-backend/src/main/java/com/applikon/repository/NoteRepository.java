package com.applikon.repository;

import com.applikon.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);

    List<Note> findByApplicationIdAndApplicationUserIdOrderByCreatedAtDesc(Long applicationId, UUID userId);

    Optional<Note> findByIdAndApplicationUserId(Long id, UUID userId);

    boolean existsByIdAndApplicationUserId(Long id, UUID userId);

    void deleteByApplicationId(Long applicationId);

    void deleteByApplicationIdAndApplicationUserId(Long applicationId, UUID userId);
}
