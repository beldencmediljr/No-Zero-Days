package com.NoZeroDays.backend.phase1.controller;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.service.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/phase1")
@CrossOrigin(origins = "http://localhost:3000")
public class Phase1Controller {

    @Autowired
    private ValidationService validationService;

    @PostMapping("/validate-extraction")
    public ResponseEntity<ValidationResponse> validate(@RequestBody ValidationRequest request) {
        // Set fallback values for Phase 1 Step 1 extraction requests
        if (request.getModule() == null) {
            request.setModule("M1_MATH");
        }
        if (request.getPhase() == null) {
            request.setPhase(1);
        }
        if (request.getStep() == null) {
            request.setStep("EXTRACT");
        }
        
        ValidationResponse response = validationService.validate(request);
        return ResponseEntity.ok(response);
    }
}