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
 * Steps: EXTRACT → PHILHEALTH_EE → TAX_BRACKET → WITHHOLDING_TAX → SYNTHESIS
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
            double spouseLoan = request.getSpouseLoan() != null ? request.getSpouseLoan() : 1500.00;

            // Red herring: Spouse Loans cannot be deducted
            if (Math.abs(valB - spouseLoan) < epsilon) {
                isRedHerring = true;
                message = "RED HERRING DETECTED: Spouse loans are personal debts of a spouse and must never be subtracted from the employee's basic pay ledger.";
            } else if (Math.abs(valA - basicSalary) < epsilon && Math.abs(valB - personalLoan) < epsilon) {
                success = true;
                message = "Extraction Verified! Basic Salary and Personal Salary Loan extracted. Proceed to Step 2.";
            } else {
                message = "Extraction Failed. Extract the Basic Salary and Personal Salary Loan from the Employee contract and loan statement.";
            }

        } else if ("PHILHEALTH_EE".equalsIgnoreCase(step)) {
            double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;
            double valB = request.getSubmittedValueB() != null ? request.getSubmittedValueB() : 0.0;
            double expectedPhEe = basicSalary * 0.025;
            double expectedSssEe = sssEe;

            if (Math.abs(valA - (basicSalary * 0.05)) < epsilon) {
                isRedHerring = true;
                message = "RED HERRING DETECTED: You computed the total 5.0% PhilHealth rate instead of the Employee (EE) share rate of 2.5% (0.025). Only the Employee share is subtracted from the basic salary ledger.";
            } else if (Math.abs(valA - expectedPhEe) < epsilon && Math.abs(valB - expectedSssEe) < epsilon) {
                success = true;
                message = "Statutory Employee (EE) shares verified successfully: PhilHealth EE Share at ₱" + String.format("%.2f", expectedPhEe) + " and SSS EE Share at ₱" + String.format("%.2f", expectedSssEe) + "! Proceed to Step 3.";
            } else if (Math.abs(valA - expectedPhEe) >= epsilon) {
                message = "Incorrect PhilHealth Employee (EE) Share. Compute 2.5% (0.025) of the Basic Salary.";
            } else {
                message = "Incorrect SSS Employee (EE) Share. Compute 5.0% (0.05) of the Basic Salary.";
            }

        } else if ("TAX_BRACKET".equalsIgnoreCase(step)) {
            String rule = request.getSubmittedRule();
            double taxableIncome = basicSalary - sssEe - 200.00 - (basicSalary * 0.025);
            String expectedBracket;

            if (taxableIncome <= 20833.00) {
                expectedBracket = "BRACKET_1";
            } else if (taxableIncome <= 33333.00) {
                expectedBracket = "BRACKET_2";
            } else if (taxableIncome <= 66667.00) {
                expectedBracket = "BRACKET_3";
            } else if (taxableIncome <= 166667.00) {
                expectedBracket = "BRACKET_4";
            } else if (taxableIncome <= 666667.00) {
                expectedBracket = "BRACKET_5";
            } else {
                expectedBracket = "BRACKET_6";
            }

            if (expectedBracket.equalsIgnoreCase(rule)) {
                success = true;
                message = "Tax Bracket Verified! Taxable income of ₱" + String.format("%.2f", taxableIncome) + " falls into the selected bracket. Proceed to Step 4.";
            } else {
                message = "Incorrect Tax Bracket. Calculate taxable income (Basic Salary minus SSS EE, Pag-IBIG, and PhilHealth EE shares) and find its matching category.";
            }

        } else if ("WITHHOLDING_TAX".equalsIgnoreCase(step)) {
            double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
            double taxableIncome = basicSalary - sssEe - 200.00 - (basicSalary * 0.025);
            double expectedTax = 0.0;

            if (taxableIncome <= 20833.00) {
                expectedTax = 0.0;
            } else if (taxableIncome <= 33333.00) {
                expectedTax = (taxableIncome - 20833.00) * 0.15;
            } else if (taxableIncome <= 66667.00) {
                expectedTax = 1875.00 + (taxableIncome - 33333.00) * 0.20;
            } else if (taxableIncome <= 166667.00) {
                expectedTax = 8541.80 + (taxableIncome - 66667.00) * 0.25;
            } else if (taxableIncome <= 666667.00) {
                expectedTax = 33541.80 + (taxableIncome - 166667.00) * 0.30;
            } else {
                expectedTax = 153541.80 + (taxableIncome - 666667.00) * 0.35;
            }

            if (Math.abs(result - expectedTax) < epsilon) {
                success = true;
                message = "Withholding Tax verified successfully at ₱" + String.format("%.2f", expectedTax) + "! Proceed to Step 5.";
            } else {
                message = "Incorrect Withholding Tax amount. Apply the rate of the selected tax bracket on the excess over the bracket threshold.";
            }

        } else if ("SYNTHESIS".equalsIgnoreCase(step)) {
            double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
            double taxableIncome = basicSalary - sssEe - 200.00 - (basicSalary * 0.025);
            double expectedTax = 0.0;

            if (taxableIncome <= 20833.00) {
                expectedTax = 0.0;
            } else if (taxableIncome <= 33333.00) {
                expectedTax = (taxableIncome - 20833.00) * 0.15;
            } else if (taxableIncome <= 66667.00) {
                expectedTax = 1875.00 + (taxableIncome - 33333.00) * 0.20;
            } else if (taxableIncome <= 166667.00) {
                expectedTax = 8541.80 + (taxableIncome - 66667.00) * 0.25;
            } else if (taxableIncome <= 666667.00) {
                expectedTax = 33541.80 + (taxableIncome - 166667.00) * 0.30;
            } else {
                expectedTax = 153541.80 + (taxableIncome - 666667.00) * 0.35;
            }

            double expectedNetPay = basicSalary - sssEe - personalLoan - 200.00 - (basicSalary * 0.025) - expectedTax;

            if (Math.abs(result - expectedNetPay) < epsilon) {
                success = true;
                message = "Phase 6 Complete! Net Take-Home Pay verified successfully at ₱" + String.format("%.2f", expectedNetPay);
                validationService.updateProgress(student, "M3_BUREAUCRACY", 2);
            } else {
                message = "Arithmetic Error! Compute Net Pay: Basic Salary minus all statutory deductions (SSS EE, PhilHealth EE, Pag-IBIG), Personal Loan, and Withholding Tax.";
            }
        }

        return validationService.runDrillEngineAndLog(
                student, request, success, isRedHerring, message, auditExpected, auditReceived);
    }
}
