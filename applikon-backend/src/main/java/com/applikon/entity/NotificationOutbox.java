package com.applikon.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "notification_outbox")
@NoArgsConstructor
public class NotificationOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    private NotificationType type;

    @Column(name = "recipient", nullable = false, length = 255)
    private String recipient;

    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload;

    @Column(name = "idempotency_key", nullable = false, length = 255)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OutboxStatus status = OutboxStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    public NotificationOutbox(
            UUID userId,
            NotificationType notificationType,
            String recipient,
            String payload,
            String idempotencyKey) {
        this.userId = userId;
        this.type = notificationType;
        this.recipient = recipient;
        this.payload = payload;
        this.idempotencyKey = idempotencyKey;
        this.createdAt = LocalDateTime.now();
    }
}
