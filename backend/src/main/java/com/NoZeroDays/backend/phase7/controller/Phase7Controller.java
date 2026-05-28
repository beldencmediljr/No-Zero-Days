package com.NoZeroDays.backend.phase7.controller;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.phase7.service.Phase7Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/phase7")
@CrossOrigin(origins = "http://localhost:3000")
public class Phase7Controller {

    @Autowired
    private Phase7Service phase7Service;

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validate(@RequestBody ValidationRequest request) {
        if (request.getModule() == null) {
            request.setModule("M4_TRIBUNAL");
        }
        if (request.getPhase() == null) {
            request.setPhase(1);
        }
        
        ValidationResponse response = phase7Service.validate(request);
        return ResponseEntity.ok(response);
    }
}
