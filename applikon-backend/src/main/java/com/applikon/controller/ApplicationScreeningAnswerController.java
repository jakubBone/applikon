package com.applikon.controller;

import com.applikon.dto.ScreeningAnswerResponse;
import com.applikon.dto.ScreeningAnswersRequest;
import com.applikon.security.AuthenticatedUser;
import com.applikon.service.ScreeningAnswerService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Application screening answers", description = "Per-application \"About the company\" prep")
@RestController
@RequestMapping("/api/applications/{applicationId}/screening-answers")
public class ApplicationScreeningAnswerController {

    private final ScreeningAnswerService screeningAnswerService;

    public ApplicationScreeningAnswerController(ScreeningAnswerService screeningAnswerService) {
        this.screeningAnswerService = screeningAnswerService;
    }

    @GetMapping
    public ResponseEntity<List<ScreeningAnswerResponse>> findMine(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long applicationId) {
        return ResponseEntity.ok(screeningAnswerService.findByUserAndApplication(user.id(), applicationId));
    }

    @PutMapping
    public ResponseEntity<List<ScreeningAnswerResponse>> save(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long applicationId,
            @Valid @RequestBody ScreeningAnswersRequest request) {
        return ResponseEntity.ok(screeningAnswerService.saveForApplication(user.id(), applicationId, request.answers()));
    }
}
