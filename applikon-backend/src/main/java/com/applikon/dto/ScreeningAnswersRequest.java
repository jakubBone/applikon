package com.applikon.dto;

import jakarta.validation.Valid;

import java.util.List;

/**
 * Replace-all save request for a user's global "My answers" set.
 * {@code @Valid} cascades validation to each {@link ScreeningAnswerRequest}.
 */
public record ScreeningAnswersRequest(
        @Valid List<ScreeningAnswerRequest> answers) {

    public List<ScreeningAnswerRequest> answers() {
        return answers == null ? List.of() : answers;
    }
}
