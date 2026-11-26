package com.applikon.service.notification;

import com.applikon.entity.KnownDevice;
import com.applikon.repository.KnownDeviceRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class DeviceFingerprintService {

    private static final int MAX_USER_AGENT_LENGTH = 255;

    private final KnownDeviceRepository knownDeviceRepository;

    public DeviceFingerprintService(KnownDeviceRepository knownDeviceRepository) {
        this.knownDeviceRepository = knownDeviceRepository;
    }

    /**
     * FIRST_DEVICE - the user had no known device at all (a new account, or an account from before
     * this release). Recorded, no alert.
     * NEW_DEVICE - the user has other known devices, this one is new. Recorded.
     * KNOWN - already recorded, nothing to do.
     * <p>
     * If two requests insert the same fingerprint at the same moment, the unique constraint rejects
     * the second insert; it is caught here and reported as KNOWN.
     */
    public DeviceCheckResult checkAndRecord(UUID userId, String userAgent, String ip) {
        String hash = hashFingerprint(userAgent, ip);

        if (knownDeviceRepository.existsByUserIdAndFingerprintHash(userId, hash)) {
            return DeviceCheckResult.KNOWN;
        }

        boolean hadDevices = knownDeviceRepository.existsByUserId(userId);
        try {
            knownDeviceRepository.save(new KnownDevice(userId, hash, LocalDateTime.now()));
        } catch (DataIntegrityViolationException e) {
            return DeviceCheckResult.KNOWN;
        }

        return hadDevices ? DeviceCheckResult.NEW_DEVICE : DeviceCheckResult.FIRST_DEVICE;
    }

    private String hashFingerprint(String userAgent, String ip) {
        String value = truncate(userAgent) + "|" + (ip == null ? "" : ip);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private String truncate(String userAgent) {
        if (userAgent == null) {
            return "";
        }
        return userAgent.length() <= MAX_USER_AGENT_LENGTH
                ? userAgent
                : userAgent.substring(0, MAX_USER_AGENT_LENGTH);
    }
}
