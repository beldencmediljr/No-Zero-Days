package com.NoZeroDays.backend.phase5.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.service.ValidationService;
import com.NoZeroDays.backend.phase5.model.Phase5Attempt;
import com.NoZeroDays.backend.phase5.repository.Phase5AttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class Phase5Service {

    @Autowired
    private Phase5AttemptRepository attemptRepository;

    @Autowired
    private ValidationService validationService;

    public ValidationResponse validate(ValidationRequest request) {
        ValidationResponse response = validationService.validate(request);

        Phase5Attempt attempt = new Phase5Attempt();
        attempt.setSubmittedSssEe(request.getSssEeShare());
        attempt.setSubmittedPersonalLoan(request.getPersonalSalaryLoan());
        attempt.setSuccessful(response.isSuccess());
        attempt.setFeedbackMessage(response.getMessage());
        attemptRepository.save(attempt);

        return response;
    }
}
