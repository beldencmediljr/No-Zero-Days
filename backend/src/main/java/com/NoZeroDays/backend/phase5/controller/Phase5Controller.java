package com.NoZeroDays.backend.phase5.controller;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.phase5.service.Phase5Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/phase5")
@CrossOrigin(origins = "http://localhost:3000")
public class Phase5Controller {

    @Autowired
    private Phase5Service phase5Service;

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validate(@RequestBody ValidationRequest request) {
        if (request.getModule() == null) {
            request.setModule("M3_BUREAUCRACY");
        }
        if (request.getPhase() == null) {
            request.setPhase(1);
        }
        
        ValidationResponse response = phase5Service.validate(request);
        return ResponseEntity.ok(response);
    }
}
