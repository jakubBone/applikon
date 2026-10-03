package com.applikon.repository;

import com.applikon.entity.NotificationOutbox;
import com.applikon.entity.NotificationType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("NotificationOutboxRepository tests")
class NotificationOutboxRepositoryTest {

    @Autowired
    private NotificationOutboxRepository outboxRepository;

    @Test
    @DisplayName("Second row with the same idempotency key is rejected by the database")
    void duplicateIdempotencyKey_isRejected() {
        UUID userId = UUID.randomUUID();
        String key = "WELCOME:" + userId;
        outboxRepository.saveAndFlush(new NotificationOutbox(userId, NotificationType.WELCOME, "a@b.c", "{}", key));

        assertThrows(DataIntegrityViolationException.class, () ->
                outboxRepository.saveAndFlush(new NotificationOutbox(userId, NotificationType.WELCOME, "a@b.c", "{}", key)));
    }
}
