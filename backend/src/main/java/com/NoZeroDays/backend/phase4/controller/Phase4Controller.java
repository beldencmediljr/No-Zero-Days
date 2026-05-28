package com.NoZeroDays.backend.phase4.controller;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.phase4.service.Phase4Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/phase4")
@CrossOrigin(origins = "http://localhost:3000")
public class Phase4Controller {

    @Autowired
    private Phase4Service phase4Service;

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validate(@RequestBody ValidationRequest request) {
        if (request.getModule() == null) {
            request.setModule("M2_MULTIPLIERS");
        }
        if (request.getPhase() == null) {
            request.setPhase(2);
        }
        
        ValidationResponse response = phase4Service.validate(request);
        return ResponseEntity.ok(response);
    }
}
