package com.applikon.repository;

import com.applikon.entity.NotificationOutbox;
import com.applikon.entity.OutboxStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationOutboxRepository NotificationOutboxRepository {
    List<OutboxStatus> findByStatusOrderByCreatedAtAsc(OutboxStatus status, LocalDateTime createdAt)
    Optional<NotificationOutbox> findByIdempotencyKey(String key);
}
