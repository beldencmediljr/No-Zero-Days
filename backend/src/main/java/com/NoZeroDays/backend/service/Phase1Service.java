package com.NoZeroDays.backend.service;

import com.NoZeroDays.backend.dto.ValidationRequest;
import com.NoZeroDays.backend.dto.ValidationResponse;
import com.NoZeroDays.backend.model.Phase1Attempt;
import com.NoZeroDays.backend.repository.Phase1AttemptRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class Phase1Service {

    @Autowired
    private Phase1AttemptRepository attemptRepository;

    public ValidationResponse validateExtraction(ValidationRequest request) {
        Phase1Attempt attempt = new Phase1Attempt();
        attempt.setSubmittedDailyRate(request.getDailyRate());
        attempt.setSubmittedDaysPresent(request.getDaysPresent());
        
        ValidationResponse response;

        // RULE 1: Complete Success
        if (request.getDailyRate() != null && request.getDailyRate() == 800.0 && 
            request.getDaysPresent() != null && request.getDaysPresent() == 14) {
            
            response = new ValidationResponse(true, "Extraction Verified! Proceed to Step 2.", false, false);
            attempt.setSuccessful(true);
        
        // RULE 2: Red Herring Traps (Allowances)
        } else if (request.getDailyRate() != null && (request.getDailyRate() == 1200.0 || request.getDailyRate() == 1500.0)) {
            response = new ValidationResponse(false, "ERROR: You extracted non-statutory allowances (Rice/Uniform). Gross Basic Pay strictly requires the base Daily Rate.", true, true);
            attempt.setSuccessful(false);
            
        // RULE 3: General Failure (Infinite Drill)
        } else {
            response = new ValidationResponse(false, "Extraction Failed. Review the HR Contract and the Calendar carefully.", false, false);
            attempt.setSuccessful(false);
        }


        attempt.setFeedbackMessage(response.getMessage());
        attemptRepository.save(attempt); // Auto-saves to XAMPP!
        
        return response;
    }
}