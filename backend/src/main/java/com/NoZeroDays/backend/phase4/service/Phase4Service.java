package com.NoZeroDays.backend.phase4.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.service.ValidationService;
import com.NoZeroDays.backend.phase4.model.Phase4Attempt;
import com.NoZeroDays.backend.phase4.repository.Phase4AttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class Phase4Service {

    @Autowired
    private Phase4AttemptRepository attemptRepository;

    @Autowired
    private ValidationService validationService;

    public ValidationResponse validate(ValidationRequest request) {
        ValidationResponse response = validationService.validate(request);

        Phase4Attempt attempt = new Phase4Attempt();
        attempt.setSubmittedDailyRate(request.getDailyRate());
        attempt.setSuccessful(response.isSuccess());
        attempt.setFeedbackMessage(response.getMessage());
        attemptRepository.save(attempt);

        return response;
    }
}
