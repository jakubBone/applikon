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

@Tag(name = "Screening answers", description = "Global per-user \"My answers\" screening template")
@RestController
@RequestMapping("/api/screening-answers")
public class ScreeningAnswerController {

    private final ScreeningAnswerService screeningAnswerService;

    public ScreeningAnswerController(ScreeningAnswerService screeningAnswerService) {
        this.screeningAnswerService = screeningAnswerService;
    }

    @GetMapping
    public ResponseEntity<List<ScreeningAnswerResponse>> findMine(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(screeningAnswerService.findByUser(user.id()));
    }

    @PutMapping
    public ResponseEntity<List<ScreeningAnswerResponse>> save(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ScreeningAnswersRequest request) {
        return ResponseEntity.ok(screeningAnswerService.save(user.id(), request.answers()));
    }
}
