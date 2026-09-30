package com.applikon.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "known_devices",
        uniqueConstraints = @UniqueConstraint(name = "uq_known_device", columnNames = {"user_id", "fingerprint_hash"}))
public class KnownDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "fingerprint_hash", nullable = false, length = 64)
    private String fingerprintHash;

    @Column(name = "first_seen_at", nullable = false)
    private LocalDateTime firstSeenAt;

    public KnownDevice(UUID userId, String fingerprintHash) {
        this.userId = userId;
        this.fingerprintHash = fingerprintHash;
        this.firstSeenAt = LocalDateTime.now();
    }
}
