package com.NoZeroDays.backend.phase3.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.service.ValidationService;
import com.NoZeroDays.backend.phase3.model.Phase3Attempt;
import com.NoZeroDays.backend.phase3.repository.Phase3AttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class Phase3Service {

    @Autowired
    private Phase3AttemptRepository attemptRepository;

    @Autowired
    private ValidationService validationService;

    public ValidationResponse validate(ValidationRequest request) {
        ValidationResponse response = validationService.validate(request);

        Phase3Attempt attempt = new Phase3Attempt();
        attempt.setSubmittedHourlyRate(request.getHourlyRate());
        attempt.setSubmittedOtHours(request.getOtHours());
        attempt.setSubmittedUnpaidLunch(request.getUnpaidLunchHours());
        attempt.setSuccessful(response.isSuccess());
        attempt.setFeedbackMessage(response.getMessage());
        attemptRepository.save(attempt);

        return response;
    }
}
