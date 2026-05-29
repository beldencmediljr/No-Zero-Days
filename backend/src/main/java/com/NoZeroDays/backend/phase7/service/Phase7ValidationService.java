package com.NoZeroDays.backend.phase7.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.service.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Phase 7 Validation Service — Module: M4_TRIBUNAL
 * Topic: Final Boss net payroll audit — all components combined.
 *
 * The student submits:
 *   submittedValueA  → Total Gross Earnings
 *   submittedValueB  → Total Deductions
 *   submittedResult  → Net Pay
 */
@Service
public class Phase7ValidationService {

    @Autowired
    private ValidationService validationService;

    public ValidationResponse validate(ValidationRequest request) {
        StudentProfile student = validationService.resolveStudent(request.getStudentNumber());

        double dailyRate    = request.getDailyRate()          != null ? request.getDailyRate()          : 0.0;
        int    daysPresent  = request.getDaysPresent()        != null ? request.getDaysPresent()        : 0;
        double hourlyRate   = request.getHourlyRate()         != null ? request.getHourlyRate()         : 0.0;
        int    lateMinutes  = request.getLateMinutes()        != null ? request.getLateMinutes()        : 0;
        double otHours      = request.getOtHours()            != null ? request.getOtHours()            : 0.0;
        double unpaidLunch  = request.getUnpaidLunchHours()   != null ? request.getUnpaidLunchHours()   : 0.0;
        boolean holiday     = request.getWorkedOnHoliday()   != null ? request.getWorkedOnHoliday()    : false;
        double sssEe        = request.getSssEeShare()         != null ? request.getSssEeShare()         : 0.0;
        double personalLoan = request.getPersonalSalaryLoan() != null ? request.getPersonalSalaryLoan() : 0.0;
        double basicSalary  = request.getBasicSalary()        != null ? request.getBasicSalary()        : (dailyRate * daysPresent);

        // Compute target values
        double grossBasicPay = dailyRate * daysPresent;
        double otPay         = hourlyRate * (otHours - unpaidLunch) * 1.25;
        double holidayPay    = holiday ? (dailyRate * 2.0) : 0.0;
        double expectedGross = grossBasicPay + otPay + holidayPay;

        double tardinessDeduction = (hourlyRate / 60.0) * lateMinutes;
        double sssDeductions      = sssEe + personalLoan + 200.00;
        double phDeduction        = basicSalary * 0.025;

        // Cumulative Withholding Tax (learned in Phase 6)
        double taxableIncome = basicSalary - sssEe - 200.00 - phDeduction;
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

        double expectedDeductions = tardinessDeduction + sssDeductions + phDeduction + expectedTax;

        double expectedNet = expectedGross - expectedDeductions;

        // Student-submitted answers
        double userGross      = request.getSubmittedValueA()  != null ? request.getSubmittedValueA()  : 0.0;
        double userDeductions = request.getSubmittedValueB()  != null ? request.getSubmittedValueB()  : 0.0;
        double userNet        = request.getSubmittedResult()  != null ? request.getSubmittedResult()  : 0.0;

        boolean grossMatch      = Math.abs(userGross      - expectedGross)      < 1.0;
        boolean deductionsMatch = Math.abs(userDeductions - expectedDeductions) < 1.0;
        boolean netMatch        = Math.abs(userNet        - expectedNet)        < 1.0;

        boolean success      = false;
        boolean isRedHerring = false;
        String  message;

        if (grossMatch && deductionsMatch && netMatch) {
            success = true;
            message = "CONGRATULATIONS AUDITOR! Net Payroll audit is clean and 100% correct. You are a payroll champion!";
            validationService.updateProgress(student, "M4_TRIBUNAL", 1);
        } else {
            // Determine diagnostic remediation routing
            if (!grossMatch) {
                message = "AUDIT FAILED (DIAGNOSTIC): Gross Earnings mismatch. Re-studying Module 2 (Overtime & Holiday multipliers) is recommended.";
            } else if (!deductionsMatch) {
                message = "AUDIT FAILED (DIAGNOSTIC): Total Deductions mismatch. Re-studying Module 3 (Statutory Deductions - SSS/PhilHealth) is recommended.";
            } else {
                message = "AUDIT FAILED (DIAGNOSTIC): Net Pay calculation discrepancy (Gross - Deductions). Please re-calculate.";
            }
        }

        return validationService.runDrillEngineAndLog(
                student, request, success, isRedHerring, message, null, null);
    }
}
