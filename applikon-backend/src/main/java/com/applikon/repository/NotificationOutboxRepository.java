package com.applikon.repository;

import com.applikon.entity.NotificationOutbox;
import com.applikon.entity.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, Long> {

    List<NotificationOutbox> findTop50ByStatusOrderByCreatedAtAsc(OutboxStatus status);

    Optional<NotificationOutbox> findByIdempotencyKey(String key);
}
