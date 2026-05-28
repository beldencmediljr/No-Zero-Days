package com.NoZeroDays.backend.phase3.controller;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.phase3.service.Phase3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/phase3")
@CrossOrigin(origins = "http://localhost:3000")
public class Phase3Controller {

    @Autowired
    private Phase3Service phase3Service;

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validate(@RequestBody ValidationRequest request) {
        if (request.getModule() == null) {
            request.setModule("M2_MULTIPLIERS");
        }
        if (request.getPhase() == null) {
            request.setPhase(1);
        }
        
        ValidationResponse response = phase3Service.validate(request);
        return ResponseEntity.ok(response);
    }
}
