package com.NoZeroDays.backend.phase2.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.phase2.model.Phase2Attempt;
import com.NoZeroDays.backend.phase2.repository.Phase2AttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class Phase2Service {

    @Autowired
    private Phase2AttemptRepository attemptRepository;

    @Autowired
    private Phase2ValidationService phase2ValidationService;

    public ValidationResponse validate(ValidationRequest request) {
        // Delegate to the dedicated phase validation service
        ValidationResponse response = phase2ValidationService.validate(request);

        // Map and save to phase-specific table for structural scaffolding and database auditing
        Phase2Attempt attempt = new Phase2Attempt();
        attempt.setSubmittedHourlyRate(request.getHourlyRate());
        attempt.setSubmittedLateMinutes(request.getLateMinutes());
        attempt.setSuccessful(response.isSuccess());
        attempt.setFeedbackMessage(response.getMessage());
        attemptRepository.save(attempt);

        return response;
    }
}
