package com.applikon.service;

import com.applikon.dto.ScreeningAnswerRequest;
import com.applikon.dto.ScreeningAnswerResponse;
import com.applikon.entity.ScreeningAnswer;
import com.applikon.entity.User;
import com.applikon.repository.ScreeningAnswerRepository;
import com.applikon.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Manages a user's global "My answers" screening template.
 *
 * Saving is a replace-all upsert: the user's existing set is removed and the incoming
 * set is re-inserted. At this scale (a handful of rows per user) this is the simplest
 * correct strategy for debounced autosave.
 */
@Service
public class ScreeningAnswerService {

    private final ScreeningAnswerRepository screeningAnswerRepository;
    private final UserRepository userRepository;

    public ScreeningAnswerService(ScreeningAnswerRepository screeningAnswerRepository,
                                  UserRepository userRepository) {
        this.screeningAnswerRepository = screeningAnswerRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ScreeningAnswerResponse> findByUser(UUID userId) {
        return screeningAnswerRepository.findByUserIdOrderBySortOrder(userId).stream()
                .map(ScreeningAnswerResponse::fromEntity)
                .toList();
    }

    @Transactional
    public List<ScreeningAnswerResponse> save(UUID userId, List<ScreeningAnswerRequest> requests) {
        User userRef = userRepository.getReferenceById(userId);
        screeningAnswerRepository.deleteByUserId(userId);

        List<ScreeningAnswer> toSave = new ArrayList<>();
        int order = 0;
        for (ScreeningAnswerRequest request : requests) {
            // Custom questions with an empty label are dropped (US-1, edge case).
            if (request.custom() && (request.label() == null || request.label().isBlank())) {
                continue;
            }
            ScreeningAnswer entity = new ScreeningAnswer();
            entity.setUser(userRef);
            entity.setQuestionKey(request.questionKey());
            entity.setLabel(request.label());
            entity.setAnswer(request.answer());
            entity.setCustom(request.custom());
            entity.setSortOrder(order++);
            toSave.add(entity);
        }

        return screeningAnswerRepository.saveAll(toSave).stream()
                .map(ScreeningAnswerResponse::fromEntity)
                .toList();
    }
}
