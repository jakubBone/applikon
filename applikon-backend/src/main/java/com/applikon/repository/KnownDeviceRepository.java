package com.applikon.repository;

import com.applikon.entity.KnownDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface KnownDeviceRepository extends JpaRepository<KnownDevice, Long> {

    boolean existsByUserIdAndFingerprintHash(UUID userId, String fingerprintHash);

    boolean existsByUserId(UUID userId);
}
