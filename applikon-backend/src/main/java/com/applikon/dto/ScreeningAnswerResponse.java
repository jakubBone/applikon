package com.applikon.dto;

import com.applikon.entity.ScreeningAnswer;

public record ScreeningAnswerResponse(
        Long id,
        String questionKey,
        String label,
        String answer,
        boolean custom,
        int sortOrder) {

    public static ScreeningAnswerResponse fromEntity(ScreeningAnswer entity) {
        return new ScreeningAnswerResponse(
                entity.getId(),
                entity.getQuestionKey(),
                entity.getLabel(),
                entity.getAnswer(),
                entity.isCustom(),
                entity.getSortOrder()
        );
    }
}
