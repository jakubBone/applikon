package com.applikon.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "notification_outbox")
public class NotificationOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private NotificationType type;

    @Column(nullable = false)
    private String recipient;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(name = "idempotency_key", nullable = false, unique = true)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private OutboxStatus status = OutboxStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    public NotificationOutbox(UUID userId, NotificationType type, String recipient, String payload, String idempotencyKey) {
        this.userId = userId;
        this.type = type;
        this.recipient = recipient;
        this.payload = payload;
        this.idempotencyKey = idempotencyKey;
    }

    // The payload holds the IP and User-Agent, so it does not outlive the delivery.
    public void markSent() {
        this.status = OutboxStatus.SENT;
        this.sentAt = LocalDateTime.now();
        this.payload = null;
    }

    public void markFailed() {
        this.status = OutboxStatus.FAILED;
    }
}
