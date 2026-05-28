package com.NoZeroDays.backend.phase6.controller;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.phase6.service.Phase6Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/phase6")
@CrossOrigin(origins = "http://localhost:3000")
public class Phase6Controller {

    @Autowired
    private Phase6Service phase6Service;

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validate(@RequestBody ValidationRequest request) {
        if (request.getModule() == null) {
            request.setModule("M3_BUREAUCRACY");
        }
        if (request.getPhase() == null) {
            request.setPhase(2);
        }
        
        ValidationResponse response = phase6Service.validate(request);
        return ResponseEntity.ok(response);
    }
}
