package com.NoZeroDays.backend.phase7.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.service.ValidationService;
import com.NoZeroDays.backend.phase7.model.Phase7Attempt;
import com.NoZeroDays.backend.phase7.repository.Phase7AttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class Phase7Service {

    @Autowired
    private Phase7AttemptRepository attemptRepository;

    @Autowired
    private ValidationService validationService;

    public ValidationResponse validate(ValidationRequest request) {
        ValidationResponse response = validationService.validate(request);

        Phase7Attempt attempt = new Phase7Attempt();
        attempt.setSubmittedGross(request.getSubmittedValueA());
        attempt.setSubmittedDeductions(request.getSubmittedValueB());
        attempt.setSubmittedNet(request.getSubmittedResult());
        attempt.setSuccessful(response.isSuccess());
        attempt.setFeedbackMessage(response.getMessage());
        attemptRepository.save(attempt);

        return response;
    }
}
