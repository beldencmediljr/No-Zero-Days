package com.NoZeroDays.backend.phase6.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.service.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Phase 6 Validation Service — Module: M3_BUREAUCRACY, phase == 2
 * Topic: PhilHealth Deductions.
 *
 * Steps: EXTRACT → PHILHEALTH_ER → IDENTIFY_RULE → EXECUTE → SYNTHESIS
 */
@Service
public class Phase6ValidationService {

    @Autowired
    private ValidationService validationService;

    public ValidationResponse validate(ValidationRequest request) {
        StudentProfile student = validationService.resolveStudent(request.getStudentNumber());

        double basicSalary  = request.getBasicSalary()        != null ? request.getBasicSalary()        : 0.0;
        double sssEe        = request.getSssEeShare()         != null ? request.getSssEeShare()         : 0.0;
        double personalLoan = request.getPersonalSalaryLoan() != null ? request.getPersonalSalaryLoan() : 0.0;

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

            // Red herring: Employer (ER) share rate is 0.10
            if (Math.abs(valB - 0.10) < epsilon) {
                isRedHerring = true;
                message = "RED HERRING DETECTED: You extracted the Employer (ER) share rate (10% / 0.10) instead of the Employee (EE) share rate (5% / 0.05). In payroll deduction synthesis, only the Employee share is subtracted from the basic salary ledger.";
            } else if (Math.abs(valA - basicSalary) < epsilon && Math.abs(valB - 0.05) < epsilon) {
                success = true;
                message = "Extraction Verified! Base salary and PhilHealth EE rate (5.0% / 0.05) extracted. Proceed to Step 2.";
            } else {
                message = "Extraction Failed. Extract Basic Salary and the current standard Employee (EE) rate of 5.0% (0.05) for PhilHealth.";
            }

        } else if ("PHILHEALTH_ER".equalsIgnoreCase(step)) {
            double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;

            // Red herring: Employee (EE) share rate is 0.05
            if (Math.abs(valA - 0.05) < epsilon) {
                isRedHerring = true;
                message = "RED HERRING DETECTED: That is the Employee (EE) share rate (5.0% / 0.05). Find the Employer (ER) share rate from the PhilHealth bulletin corkboard memo.";
            } else if (Math.abs(valA - 0.10) < epsilon || Math.abs(valA - 10.0) < epsilon) {
                success = true;
                message = "PhilHealth Employer (ER) share rate verified at 10.0% (0.10)! Proceed to Step 3.";
            } else {
                message = "Incorrect Employer share rate. Refer to the PhilHealth Contribution Bulletin memo on the notice board to identify the employer share rate.";
            }

        } else if ("IDENTIFY_RULE".equalsIgnoreCase(step)) {
            String rule = request.getSubmittedRule();
            if ("PHILHEALTH_FORMULA".equalsIgnoreCase(rule) || "BASIC_SALARY_X_0.05".equalsIgnoreCase(rule)) {
                success = true;
                message = "Rule Verified! PhilHealth Premium = Basic Salary × 5.0%. Proceed to Step 4.";
            } else {
                message = "Incorrect Rule! Multiplier rate should be 5% (0.05) of Basic Salary.";
            }

        } else if ("EXECUTE".equalsIgnoreCase(step)) {
            double result   = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
            double expected = basicSalary * 0.05;

            if (Math.abs(result - expected) < epsilon) {
                success = true;
                message = "PhilHealth Deduction verified successfully at ₱" + String.format("%.2f", expected);
            } else {
                message = "Arithmetic Error! Calculate Basic Salary (₱" + basicSalary + ") × 0.05.";
            }

        } else if ("SYNTHESIS".equalsIgnoreCase(step)) {
            double result       = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
            double expectedSss  = sssEe + personalLoan + 200.00; // SSS EE Share + Personal Salary Loan + Pag-IBIG EE Share (₱200.00)
            double expectedPh   = basicSalary * 0.05;
            double expected     = expectedSss + expectedPh;

            if (Math.abs(result - expected) < epsilon) {
                success = true;
                message = "Phase 6 Complete! Final Statutory Deductions verified successfully at ₱"
                        + String.format("%.2f", expected);
                validationService.updateProgress(student, "M3_BUREAUCRACY", 2);
            } else {
                message = "Arithmetic Error! Final Statutory Deductions = SSS/Pag-IBIG/Loan (₱"
                        + String.format("%.2f", expectedSss) + ") + PhilHealth (₱"
                        + String.format("%.2f", expectedPh) + ") again.";
            }
        }

        return validationService.runDrillEngineAndLog(
                student, request, success, isRedHerring, message, auditExpected, auditReceived);
    }
}
