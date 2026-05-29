package com.NoZeroDays.backend.phase5.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.service.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Phase 5 Validation Service — Module: M3_BUREAUCRACY, phase == 1
 * Topic: SSS EE Share, Pag-IBIG, and Personal Salary Loan Deductions.
 *
 * Steps: EXTRACT → PAGIBIG_DEDUCTION → IDENTIFY_RULE → EXECUTE / SYNTHESIS
 */
@Service
public class Phase5ValidationService {

    @Autowired
    private ValidationService validationService;

    public ValidationResponse validate(ValidationRequest request) {
        StudentProfile student = validationService.resolveStudent(request.getStudentNumber());

        double sssEe        = request.getSssEeShare()         != null ? request.getSssEeShare()         : 0.0;
        double sssEr        = request.getSssErShare()         != null ? request.getSssErShare()         : 0.0;
        double personalLoan = request.getPersonalSalaryLoan() != null ? request.getPersonalSalaryLoan() : 0.0;
        double spouseLoan   = request.getSpouseLoan()         != null ? request.getSpouseLoan()         : 0.0;

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

            // Red Herring: SSS Employer (ER) Share and Spouse Loans cannot be deducted
            if (Math.abs(valA - sssEr) < epsilon || Math.abs(valB - spouseLoan) < epsilon) {
                isRedHerring = true;
                message = "ERROR: SSS Employer (ER) Share and Spouse Loans cannot be deducted from this employee's basic pay ledger. Extract SSS EE Share and Personal Salary Loan.";
            } else if (Math.abs(valA - sssEe) < epsilon && Math.abs(valB - personalLoan) < epsilon) {
                success = true;
                message = "Extraction Verified! SSS EE share and Personal Salary Loan extracted successfully. Proceed to Step 2.";
            } else {
                message = "Extraction Failed. Extract the employee SSS EE share and Personal Salary Loan.";
            }

        } else if ("PAGIBIG_DEDUCTION".equalsIgnoreCase(step)) {
            double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;

            // Red herring: Employer Pag-IBIG share is 300.00
            if (Math.abs(valA - 300.00) < epsilon) {
                isRedHerring = true;
                message = "RED HERRING DETECTED: The Employer (ER) Pag-IBIG share is paid fully by the employer and must never be subtracted from the employee's basic pay ledger.";
            } else if (Math.abs(valA - 200.00) < epsilon) {
                success = true;
                message = "Pag-IBIG deduction verified at ₱200.00! Proceed to Step 3.";
            } else {
                message = "Incorrect Pag-IBIG deduction. Refer to the HDMF Pag-IBIG Circular memo on the notice board to identify the employee contribution share cap.";
            }

        } else if ("IDENTIFY_RULE".equalsIgnoreCase(step)) {
            String rule = request.getSubmittedRule();
            if ("SSS_PERSONAL_PAGIBIG_FORMULA".equalsIgnoreCase(rule)
                    || "EE_SHARE_ADD_PAGIBIG".equalsIgnoreCase(rule)
                    || "ADDITION".equalsIgnoreCase(rule)) {
                success = true;
                message = "Rule Verified! The core equation is SSS EE Share + Personal Salary Loan + Pag-ibig Deduction. Proceed to Step 4.";
            } else {
                message = "Incorrect Rule! Choose the formula that adds SSS EE Share, Personal Salary Loan, and Pag-ibig Deduction together.";
            }

        } else if ("EXECUTE".equalsIgnoreCase(step) || "SYNTHESIS".equalsIgnoreCase(step)) {
            double result   = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
            double expected = sssEe + personalLoan + 200.00;

            if (Math.abs(result - expected) < epsilon) {
                success = true;
                message = "Phase 5 Complete! Total Deductions verified successfully at ₱"
                        + String.format("%.2f", expected);
                validationService.updateProgress(student, "M3_BUREAUCRACY", 1);
            } else {
                message = "Arithmetic Error! Calculate SSS EE Share (₱" + sssEe + ") + Personal Salary Loan (₱"
                        + personalLoan + ") + Pag-ibig Deduction (₱200.00) again.";
            }
        }

        return validationService.runDrillEngineAndLog(
                student, request, success, isRedHerring, message, auditExpected, auditReceived);
    }
}
