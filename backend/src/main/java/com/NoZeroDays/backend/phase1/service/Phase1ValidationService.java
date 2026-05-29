package com.NoZeroDays.backend.phase1.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.service.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Phase 1 Validation Service — Module: M1_MATH, phase == 1
 * Topic: Gross Basic Pay computation.
 *
 * Steps: EXTRACT → IDENTIFY_RULE → EXECUTE
 */
@Service
public class Phase1ValidationService {

    @Autowired
    private ValidationService validationService;

    public ValidationResponse validate(ValidationRequest request) {
        StudentProfile student = validationService.resolveStudent(request.getStudentNumber());

        double targetDailyRate   = request.getDailyRate()    != null ? request.getDailyRate()    : 0.0;
        int    targetDaysPresent = request.getDaysPresent()  != null ? request.getDaysPresent()  : 0;
        double rice              = request.getRiceSubsidy()  != null ? request.getRiceSubsidy()  : 0.0;
        double uniform           = request.getUniformAllowance() != null ? request.getUniformAllowance() : 0.0;

        double epsilon = 0.01;

        boolean success      = false;
        boolean isRedHerring = false;
        String  message      = "";
        Double  auditExpected = null;
        Double  auditReceived = null;

        String step = request.getStep() != null ? request.getStep() : "EXTRACT";

        if ("EXTRACT".equalsIgnoreCase(step)) {
            double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;
            double valB = request.getSubmittedValueB() != null ? request.getSubmittedValueB() : 0.0;

            // Red Herring check: student extracted allowances instead of the base daily rate
            if (Math.abs(valA - rice) < epsilon || Math.abs(valA - uniform) < epsilon ||
                Math.abs(valB - rice) < epsilon || Math.abs(valB - uniform) < epsilon) {
                isRedHerring = true;
                message = "ERROR: You extracted non-statutory allowances (Rice/Uniform). Gross Basic Pay strictly requires the base Daily Rate.";
            } else if (Math.abs(valA - targetDailyRate) < epsilon && Math.abs(valB - targetDaysPresent) < epsilon) {
                success = true;
                message = "Extraction Verified! Proceed to Step 2.";
            } else {
                message = "Extraction Failed. Review the HR Contract and the Calendar carefully.";
            }

        } else if ("IDENTIFY_RULE".equalsIgnoreCase(step)) {
            String rule = request.getSubmittedRule();
            if ("MULTIPLICATION".equalsIgnoreCase(rule)
                    || "DAILY_RATE_X_DAYS".equalsIgnoreCase(rule)
                    || "*".equals(rule)) {
                success = true;
                message = "Rule Identified! The core equation is Daily Rate × Days Present. Proceed to Step 3.";
            } else {
                message = "Incorrect Rule! How do you compute Gross Pay from a Daily Rate and Days Present?";
            }

        } else if ("EXECUTE".equalsIgnoreCase(step)) {
            double result   = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
            double expected = targetDailyRate * targetDaysPresent;

            if (Math.abs(result - expected) < epsilon) {
                success = true;
                message = "Phase 1 Complete! Gross Basic Pay verified successfully at ₱" + expected;
                validationService.updateProgress(student, "M1_MATH", 1);
            } else {
                message = "Arithmetic Error! Calculate Daily Rate (₱" + targetDailyRate + ") × Days Present (" + targetDaysPresent + ") again.";
            }
        }

        return validationService.runDrillEngineAndLog(
                student, request, success, isRedHerring, message, auditExpected, auditReceived);
    }
}
