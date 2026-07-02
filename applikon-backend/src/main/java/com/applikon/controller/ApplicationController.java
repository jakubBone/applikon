package com.applikon.controller;

import com.applikon.dto.ApplicationRequest;
import com.applikon.dto.ApplicationResponse;
import com.applikon.dto.StageUpdateRequest;
import com.applikon.dto.StatusUpdateRequest;
import com.applikon.security.AuthenticatedUser;
import com.applikon.service.ApplicationService;
import com.applikon.service.CVService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Applications", description = "CRUD and duplicate detection for job applications")
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final CVService cvService;

    public ApplicationController(ApplicationService applicationService, CVService cvService) {
        this.applicationService = applicationService;
        this.cvService = cvService;
    }

    @PostMapping
    public ResponseEntity<ApplicationResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ApplicationRequest request) {
        ApplicationResponse response = applicationService.create(request, user.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ApplicationResponse>> findAll(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(applicationService.findAllByUserId(user.id()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationResponse> findById(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id) {
        return ResponseEntity.ok(applicationService.findById(id, user.id()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApplicationResponse> updateStatus(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(applicationService.updateStatus(id, request.status(), user.id()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApplicationResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @Valid @RequestBody ApplicationRequest request) {
        return ResponseEntity.ok(applicationService.update(id, request, user.id()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id) {
        applicationService.delete(id, user.id());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check-duplicate")
    public ResponseEntity<List<ApplicationResponse>> checkDuplicate(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam String company,
            @RequestParam String position) {
        return ResponseEntity.ok(applicationService.findDuplicates(user.id(), company, position));
    }

    @PatchMapping("/{id}/cv")
    public ResponseEntity<ApplicationResponse> assignCV(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @Valid @RequestBody AssignCVRequest request) {
        if (request.cvId() == null) {
            cvService.removeCVFromApplication(id, user.id());
        } else {
            cvService.assignCVToApplication(id, request.cvId(), user.id());
        }
        return ResponseEntity.ok(applicationService.findById(id, user.id()));
    }

    @PatchMapping("/{id}/stage")
    public ResponseEntity<ApplicationResponse> updateStage(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @Valid @RequestBody StageUpdateRequest request) {
        return ResponseEntity.ok(applicationService.updateStage(id, request, user.id()));
    }

    @PostMapping("/{id}/stage")
    public ResponseEntity<ApplicationResponse> addStage(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @Valid @RequestBody AddStageRequest request) {
        return ResponseEntity.ok(applicationService.addStage(id, request.stageName(), user.id()));
    }

    public record AssignCVRequest(Long cvId) {}
    public record AddStageRequest(@NotBlank(message = "{validation.stage.required}") String stageName) {}
}
