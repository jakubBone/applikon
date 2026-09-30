package com.applikon.repository;

import com.applikon.entity.KnownDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface KnownDeviceRepository extends JpaRepository<KnownDevice, Long> {

    boolean existsByUserId(UUID userId);

    boolean existsByUserIdAndFingerprintHash(UUID userId, String fingerprintHash);
}
