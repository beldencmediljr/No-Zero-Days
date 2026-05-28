package com.NoZeroDays.backend.phase2.controller;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.phase2.service.Phase2Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/phase2")
@CrossOrigin(origins = "http://localhost:3000")
public class Phase2Controller {

    @Autowired
    private Phase2Service phase2Service;

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validate(@RequestBody ValidationRequest request) {
        if (request.getModule() == null) {
            request.setModule("M1_MATH");
        }
        if (request.getPhase() == null) {
            request.setPhase(2);
        }
        
        ValidationResponse response = phase2Service.validate(request);
        return ResponseEntity.ok(response);
    }
}
