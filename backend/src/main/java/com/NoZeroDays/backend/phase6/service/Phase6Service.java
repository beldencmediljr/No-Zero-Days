package com.NoZeroDays.backend.phase6.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.service.ValidationService;
import com.NoZeroDays.backend.phase6.model.Phase6Attempt;
import com.NoZeroDays.backend.phase6.repository.Phase6AttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class Phase6Service {

    @Autowired
    private Phase6AttemptRepository attemptRepository;

    @Autowired
    private ValidationService validationService;

    public ValidationResponse validate(ValidationRequest request) {
        ValidationResponse response = validationService.validate(request);

        Phase6Attempt attempt = new Phase6Attempt();
        attempt.setSubmittedBasicSalary(request.getBasicSalary());
        attempt.setSuccessful(response.isSuccess());
        attempt.setFeedbackMessage(response.getMessage());
        attemptRepository.save(attempt);

        return response;
    }
}
