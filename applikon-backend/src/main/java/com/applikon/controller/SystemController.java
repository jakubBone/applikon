package com.applikon.controller;

import com.applikon.dto.ServiceNoticeResponse;
import com.applikon.service.ServiceNoticeService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "System", description = "Active service notices shown to logged-in users")
@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final ServiceNoticeService service;

    public SystemController(ServiceNoticeService service) {
        this.service = service;
    }

    @GetMapping("/notices/active")
    public ResponseEntity<List<ServiceNoticeResponse>> getActiveNotices() {
        return ResponseEntity.ok(service.findActive());
    }
}
