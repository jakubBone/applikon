package com.applikon.dto;

import jakarta.validation.constraints.Size;

/**
 * A single answer in a "My answers" save request. Server assigns ordering by position,
 * so no sortOrder is accepted from the client.
 */
public record ScreeningAnswerRequest(
        String questionKey,
        String label,
        @Size(max = 1000, message = "{validation.screeningAnswer.answer.tooLong}") String answer,
        boolean custom) {}
