package com.applikon.repository;

import com.applikon.entity.NotificationOutbox;
import com.applikon.entity.OutboxStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, Long> {

    List<NotificationOutbox> findByStatusOrderByCreatedAtAsc(OutboxStatus status, Pageable pageable);
}
