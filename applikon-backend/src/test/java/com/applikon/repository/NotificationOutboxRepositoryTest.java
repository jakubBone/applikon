package com.applikon.repository;

import com.applikon.entity.NotificationOutbox;
import com.applikon.entity.NotificationType;
import com.applikon.entity.OutboxStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@ActiveProfiles("test")
public class NotificationOutboxRepositoryTest {

    @Autowired
    NotificationOutboxRepository notificationOutboxRepository;

    @Test
    void duplicateIdempotencyKey_isRejected() {
        UUID userId = UUID.randomUUID();
        String key = "WELCOME:"+userId;

        notificationOutboxRepository.saveAndFlush(
                new NotificationOutbox(userId, NotificationType.WELCOME, "a@b.c", "{}", key));

        assertThrows(DataIntegrityViolationException.class, () ->
                notificationOutboxRepository.saveAndFlush(
                        new NotificationOutbox(userId, NotificationType.WELCOME, "a@b.c", "{}", key)));
    }
}
