package com.NoZeroDays.backend.phase4.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.service.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Phase 4 Validation Service — Module: M2_MULTIPLIERS, phase == 2
 * Topic: Regular Holiday Pay (Independence Day — 2.00x).
 *
 * Steps: EXTRACT → ESTABLISH_PREMIUM → ESTABLISH_FORMULA
 *        → EXECUTE → COMPUTE_GROSS → NET_PAY_FORMULA → SYNTHESIS
 */
@Service
public class Phase4ValidationService {

    @Autowired
    private ValidationService validationService;

    public ValidationResponse validate(ValidationRequest request) {
        StudentProfile student = validationService.resolveStudent(request.getStudentNumber());

        double dailyRate = request.getDailyRate() != null ? request.getDailyRate() : 0.0;
        double epsilon   = 0.01;

        boolean success      = false;
        boolean isRedHerring = false;
        String  message      = "";
        Double  auditExpected = null;
        Double  auditReceived = null;

        String step = request.getStep() != null ? request.getStep() : "EXTRACT";

        if ("EXTRACT".equalsIgnoreCase(step)) {
            String rule = request.getSubmittedRule();

            // Step 1: EXTRACT HOLIDAY TYPE → Dropdown mapping the calendar date
            if ("REGULAR_HOLIDAY".equalsIgnoreCase(rule)) {
                success = true;
                message = "Holiday type verified! Regular Holiday (2.00x) identified. Proceed to Step 2.";
            } else if ("SPECIAL_NON_WORKING".equalsIgnoreCase(rule)) {
                isRedHerring = true;
                message = "RED HERRING DETECTED: You selected Special Non-Working Holiday (1.30x). June 12 is Independence Day, which is a Regular Holiday (2.00x) under Philippine Labor standards.";
            } else if ("ORDINARY_WORKING".equalsIgnoreCase(rule)) {
                message = "Incorrect holiday classification. June 12 is Independence Day, which is a national holiday. Check the DOLE holiday poster on the wall.";
            } else {
                message = "Please select a Holiday Type from the dropdown.";
            }

        } else if ("ESTABLISH_PREMIUM".equalsIgnoreCase(step)) {
            double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;

            // Step 2: ESTABLISH DOLE PREMIUM → Dropdown to select the multiplier (2.00x)
            if (Math.abs(valA - 2.00) < epsilon) {
                success = true;
                message = "Regular Holiday pay multiplier verified at 2.00x (Double Pay)! Proceed to Step 3.";
            } else if (Math.abs(valA - 1.30) < epsilon) {
                message = "Incorrect multiplier. That is the premium rate for a Special Non-Working Holiday. June 12 is Independence Day (Regular Holiday).";
            } else {
                message = "Incorrect DOLE Premium multiplier. Regular Holiday pay requires a 2.00x multiplier (Double Pay). Check the DOLE poster on the wall.";
            }

        } else if ("ESTABLISH_FORMULA".equalsIgnoreCase(step)) {
            String rule = request.getSubmittedRule();

            // Step 3: ESTABLISH HOLIDAY FORMULA → Dropdown to select the formula
            if ("DAILY_X_2.0".equalsIgnoreCase(rule)) {
                success = true;
                message = "Holiday formula verified! Proceed to Step 4.";
            } else if ("HOURLY_X_2.0".equalsIgnoreCase(rule)) {
                message = "Incorrect formula. Holiday Pay is calculated using the Daily Rate, not the Hourly Rate. Review the Company Payroll Manual.";
            } else if ("DAILY_X_1.3".equalsIgnoreCase(rule)) {
                message = "Incorrect formula. Independence Day is a Regular Holiday and uses the 2.00x multiplier. Review the Company Payroll Manual.";
            } else {
                message = "Please select a Holiday Pay formula from the dropdown.";
            }

        } else if ("EXECUTE".equalsIgnoreCase(step)) {
            double result   = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
            double expected = dailyRate * 2.0;

            if (Math.abs(result - expected) < epsilon) {
                success = true;
                message = "Holiday Pay verified successfully at ₱" + String.format("%.2f", expected)
                        + ". Proceed to Step 5 — Compute Gross Basic Pay.";
            } else {
                message = "Arithmetic Error! Holiday Double Pay = Daily Rate (₱" + dailyRate + ") × 2.";
            }

        } else if ("COMPUTE_GROSS".equalsIgnoreCase(step)) {
            double  userGross        = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
            int     targetDaysPresent = request.getDaysPresent()    != null ? request.getDaysPresent()     : 0;
            double  expectedGross    = dailyRate * targetDaysPresent;
            BigDecimal expectedGrossBD = BigDecimal.valueOf(dailyRate)
                    .multiply(BigDecimal.valueOf(targetDaysPresent))
                    .setScale(2, RoundingMode.HALF_UP);
            double expectedRounded = expectedGrossBD.doubleValue();

            if (Math.abs(userGross - expectedGross) <= 0.02 || Math.abs(userGross - expectedRounded) <= 0.02) {
                success = true;
                message = "Gross Basic Pay verified at ₱" + String.format("%.2f", expectedRounded)
                        + ". Proceed to Step 6 — Establish Synthesis Formula.";
            } else {
                message = "Gross Pay is incorrect. Review the employee contract file for the correct Daily Rate and multiply by Days Present.";
                auditExpected = expectedRounded;
                auditReceived = userGross;
            }

        } else if ("NET_PAY_FORMULA".equalsIgnoreCase(step)) {
            String rule = request.getSubmittedRule();
            if ("GROSS_PLUS_HOLIDAY".equalsIgnoreCase(rule)) {
                success = true;
                message = "Synthesis formula verified! Proceed to Step 7 — Synthesize Total Earnings.";
            } else if ("GROSS_MINUS_HOLIDAY".equalsIgnoreCase(rule)) {
                message = "Incorrect formula. Holiday Pay must be ADDED to Gross Pay, not subtracted. Review the Company Payroll Manual.";
            } else if ("DAILY_PLUS_HOLIDAY".equalsIgnoreCase(rule)) {
                message = "Incorrect formula. Total Earnings are computed from the full Gross Basic Pay, not just the Daily Rate. Review the Company Payroll Manual.";
            } else {
                message = "Please select a Total Earnings formula from the dropdown.";
            }

        } else if ("SYNTHESIS".equalsIgnoreCase(step)) {
            double result            = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
            double targetDailyRate   = request.getDailyRate()       != null ? request.getDailyRate()       : 0.0;
            int    targetDaysPresent = request.getDaysPresent()     != null ? request.getDaysPresent()     : 0;

            double expectedGross      = targetDailyRate * targetDaysPresent;
            double expectedHolidayPay = targetDailyRate * 2.0;
            double expected           = expectedGross + expectedHolidayPay;

            System.out.println("Backend Expected (Phase 4 Synthesis): " + expected + " | Frontend Sent: " + result);

            BigDecimal grossPayBD    = BigDecimal.valueOf(targetDailyRate).multiply(BigDecimal.valueOf(targetDaysPresent)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal holidayPayBD  = BigDecimal.valueOf(targetDailyRate).multiply(BigDecimal.valueOf(2.0)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal expectedTotalBD = grossPayBD.add(holidayPayBD).setScale(2, RoundingMode.HALF_UP);
            double expectedRounded   = expectedTotalBD.doubleValue();

            boolean isCorrect = Math.abs(expected - result) <= 0.02 || Math.abs(expectedRounded - result) <= 0.02;

            if (isCorrect) {
                success = true;
                message = "Phase 4 Complete! Total Holiday-adjusted Earnings verified successfully at ₱"
                        + String.format("%.2f", expectedRounded);
                validationService.updateProgress(student, "M2_MULTIPLIERS", 2);
            } else {
                message = "Arithmetic Error! Total Earnings = Basic Gross Pay (₱"
                        + String.format("%.2f", grossPayBD.doubleValue()) + ") + Holiday Pay (₱"
                        + String.format("%.2f", holidayPayBD.doubleValue()) + ") again.";
                auditExpected = expectedRounded;
                auditReceived = result;
            }
        }

        return validationService.runDrillEngineAndLog(
                student, request, success, isRedHerring, message, auditExpected, auditReceived);
    }
}
