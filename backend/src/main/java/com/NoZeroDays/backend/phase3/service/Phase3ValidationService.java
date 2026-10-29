package com.NoZeroDays.backend.phase3.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.model.ScenarioSnapshot;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.service.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

/**
 * Phase 3 Validation Service — Module: M2_MULTIPLIERS, phase == 1
 * Topic: Overtime Premiums.
 *
 * Steps: EXTRACT → FILTER_LUNCH → ESTABLISH_PREMIUM → ESTABLISH_FORMULA
 *        → EXECUTE → COMPUTE_GROSS → NET_PAY_FORMULA → SYNTHESIS
 */
@Service
public class Phase3ValidationService {

    @Autowired
    private ValidationService validationService;

    public ValidationResponse validate(ValidationRequest request) {
        StudentProfile student = validationService.resolveStudent(request.getStudentNumber());

        String scenarioMismatch = validationService.checkScenarioConsistency(student, request);
        if (scenarioMismatch != null) {
            return validationService.runDrillEngineAndLog(student, request, false, false, scenarioMismatch, null, null, false);
        }

        double hourlyRate        = request.getHourlyRate()        != null ? request.getHourlyRate()        : 0.0;
        double otHours           = request.getOtHours()           != null ? request.getOtHours()           : 0.0;
        double unpaidLunch       = request.getUnpaidLunchHours()  != null ? request.getUnpaidLunchHours()  : 0.0;
        double actualOt          = otHours - unpaidLunch;
        int    targetDaysPresent = request.getDaysPresent()       != null ? request.getDaysPresent()       : 0;

        // Failsafe hydration: recover missing parameters from registered ScenarioSnapshot
        if (hourlyRate <= 0.0 || targetDaysPresent <= 0 || otHours <= 0.0) {
            Optional<ScenarioSnapshot> snapOpt = validationService.getScenarioSnapshot(student, "M2_MULTIPLIERS", 1);
            if (snapOpt.isPresent()) {
                ScenarioSnapshot snap = snapOpt.get();
                if (hourlyRate <= 0.0 && snap.getHourlyRate() != null && snap.getHourlyRate() > 0.0) {
                    hourlyRate = snap.getHourlyRate();
                } else if (hourlyRate <= 0.0 && snap.getDailyRate() != null && snap.getDailyRate() > 0.0) {
                    hourlyRate = snap.getDailyRate() / 8.0;
                }
                if (targetDaysPresent <= 0 && snap.getDaysPresent() != null && snap.getDaysPresent() > 0) {
                    targetDaysPresent = snap.getDaysPresent();
                }
                if (otHours <= 0.0 && snap.getOtHours() != null && snap.getOtHours() > 0.0) {
                    otHours = snap.getOtHours();
                }
                if (unpaidLunch <= 0.0 && snap.getUnpaidLunchHours() != null) {
                    unpaidLunch = snap.getUnpaidLunchHours();
                }
                actualOt = otHours - unpaidLunch;
            }
        }

        String step = request.getStep() != null ? request.getStep() : "EXTRACT";

        boolean isFormulaOrGrossStep = "NET_PAY_FORMULA".equalsIgnoreCase(step)
                || "ESTABLISH_FORMULA".equalsIgnoreCase(step)
                || "ESTABLISH_PREMIUM".equalsIgnoreCase(step)
                || "COMPUTE_GROSS".equalsIgnoreCase(step);

        if (!isFormulaOrGrossStep && (hourlyRate <= 0.0 || otHours <= 0.0 || targetDaysPresent <= 0)) {
            return validationService.runDrillEngineAndLog(student, request, false, false,
                    "Validation Error: Scenario parameters were not received by the server. Please reload the phase.", null, null, false);
        } else if (isFormulaOrGrossStep && (hourlyRate <= 0.0 || targetDaysPresent <= 0)) {
            return validationService.runDrillEngineAndLog(student, request, false, false,
                    "Validation Error: Scenario parameters were not received by the server. Please reload the phase.", null, null, false);
        }

        double epsilon = 0.01;

        boolean success      = false;
        boolean isRedHerring = false;
        String  message      = "";
        Double  auditExpected = null;
        Double  auditReceived = null;
        boolean phaseJustCompleted = false;

        if ("EXTRACT".equalsIgnoreCase(step)) {
            double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;
            double valB = request.getSubmittedValueB() != null ? request.getSubmittedValueB() : 0.0;

            // Step 1: EXTRACT LOGS → Extract Hourly Rate and Total Recorded OT Hours
            if (Math.abs(valA - hourlyRate) < epsilon && Math.abs(valB - otHours) < epsilon) {
                success = true;
                message = "Extraction Verified! Total recorded OT hours and Hourly Rate extracted successfully. Proceed to Step 2.";
            } else {
                message = "Extraction Failed. Make sure to extract the base Hourly Rate from the employee contract and the total recorded OT hours from the timesheet terminal.";
            }

        } else if ("FILTER_LUNCH".equalsIgnoreCase(step)) {
            double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;

            // Step 2: FILTER UNPAID LUNCH → Numeric input for "True OT Hours"
            if (Math.abs(result - otHours) < epsilon) {
                isRedHerring = true;
                message = "RED HERRING DETECTED: Unpaid lunch hours must be deducted from recorded Overtime. Standard working hours do not credit rest intervals.";
            } else if (Math.abs(result - actualOt) < epsilon) {
                success = true;
                message = "True OT hours verified! Unpaid lunch hour deducted successfully. Proceed to Step 3.";
            } else {
                message = "Incorrect True OT Hours. Check the timesheet terminal for unpaid lunch break hours and deduct them from the total recorded hours.";
            }

        } else if ("ESTABLISH_PREMIUM".equalsIgnoreCase(step)) {
            double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;

            // Step 3: ESTABLISH DOLE PREMIUM → Dropdown to select the correct multiplier (1.25x)
            if (Math.abs(valA - 1.25) < epsilon) {
                success = true;
                message = "DOLE Overtime premium multiplier verified! Proceed to Step 4.";
            } else {
                message = "Incorrect DOLE Premium multiplier. Review the DOLE Overtime Poster in the room for the correct overtime premium rate.";
            }

        } else if ("ESTABLISH_FORMULA".equalsIgnoreCase(step)) {
            String rule = request.getSubmittedRule();

            // Step 4: ESTABLISH OT FORMULA → Dropdown to select the formula
            if ("HOURLY_X_1.25_X_TRUE_OT".equalsIgnoreCase(rule)) {
                success = true;
                message = "Overtime formula logic verified! Proceed to Step 5.";
            } else if ("DAILY_X_1.25".equalsIgnoreCase(rule)) {
                message = "Incorrect formula. Overtime pay is calculated from the Hourly Rate, not the Daily Rate. Review the Company Payroll Manual.";
            } else if ("HOURLY_PLUS_1.25".equalsIgnoreCase(rule)) {
                message = "Incorrect formula. The premium rate must be MULTIPLIED by the hourly rate and hours, not added. Review the Company Payroll Manual.";
            } else {
                message = "Please select an Overtime formula from the dropdown.";
            }

        } else if ("EXECUTE".equalsIgnoreCase(step)) {
            double result   = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
            double expected = hourlyRate * actualOt * 1.25;

            System.out.println("Backend Expected (Phase 3 Step 5): " + expected + " | Frontend Sent: " + result);

            BigDecimal hourlyRateBD = BigDecimal.valueOf(hourlyRate);
            BigDecimal actualOtBD   = BigDecimal.valueOf(actualOt);
            BigDecimal multiplierBD = BigDecimal.valueOf(1.25);
            BigDecimal expectedOtBD = hourlyRateBD.multiply(actualOtBD).multiply(multiplierBD).setScale(2, RoundingMode.HALF_UP);
            double expectedRounded  = expectedOtBD.doubleValue();

            boolean isCorrect = Math.abs(expected - result) <= 0.02 || Math.abs(expectedRounded - result) <= 0.02;

            if (isCorrect) {
                success = true;
                message = "Overtime premium pay verified successfully at ₱"
                        + String.format("%.2f", expectedRounded) + ". Proceed to Step 6 — Compute Gross Basic Pay.";
            } else {
                message = "Arithmetic Error! Calculate: Hourly Rate (₱" + hourlyRate
                        + ") × True OT Hours (" + actualOt + ") × 1.25 again.";
                auditExpected = expectedRounded;
                auditReceived = result;
            }

        } else if ("COMPUTE_GROSS".equalsIgnoreCase(step)) {
            Double fromGrossPay = request.getGrossPay();
            Double fromSubmittedResult = request.getSubmittedResult();
            double userGross = fromGrossPay != null ? fromGrossPay : (fromSubmittedResult != null ? fromSubmittedResult : 0.0);

            // Ground truth must come from the registered scenario snapshot.
            // Client-supplied rates pass checkScenarioConsistency only when the
            // snapshot holds the same values; legacy snapshots without registered
            // rates cannot validate gross pay, so force a phase restart instead
            // of trusting fabricated client parameters.
            Double snapHourly = null;
            Double snapDaily = null;
            Integer snapDays = null;
            Optional<ScenarioSnapshot> grossSnapOpt = validationService.getScenarioSnapshot(student, "M2_MULTIPLIERS", 1);
            if (grossSnapOpt.isPresent()) {
                ScenarioSnapshot grossSnap = grossSnapOpt.get();
                snapHourly = grossSnap.getHourlyRate();
                snapDaily = grossSnap.getDailyRate();
                snapDays = grossSnap.getDaysPresent();
            }
            double trustedHourly = (snapHourly != null && snapHourly > 0.0) ? snapHourly
                    : (snapDaily != null && snapDaily > 0.0) ? snapDaily / 8.0 : 0.0;
            if (trustedHourly <= 0.0 || snapDays == null || snapDays <= 0) {
                return validationService.runDrillEngineAndLog(student, request, false, false,
                        "Validation Error: This phase's registered scenario is missing rate parameters. Please restart the phase.", null, null, false);
            }

            double expectedGrossByHourly = trustedHourly * 8.0 * snapDays;
            BigDecimal expectedGrossBD = BigDecimal.valueOf(trustedHourly)
                    .multiply(BigDecimal.valueOf(8.0))
                    .multiply(BigDecimal.valueOf(snapDays))
                    .setScale(2, RoundingMode.HALF_UP);
            double expectedRounded = expectedGrossBD.doubleValue();

            if (Math.abs(userGross - expectedGrossByHourly) <= 0.02
                    || Math.abs(userGross - expectedRounded) <= 0.02) {
                success = true;
                message = "Gross Basic Pay verified at ₱" + String.format("%.2f", expectedRounded)
                        + ". Proceed to Step 7 — Establish Synthesis Formula.";
            } else {
                message = "Gross Pay is incorrect. Review the employee contract file for the correct hourly rate (₱"
                        + String.format("%.2f", trustedHourly) + ") and multiply by 8 hours and days present ("
                        + snapDays + ").";
                auditExpected = expectedRounded;
                auditReceived = userGross;
            }

        } else if ("NET_PAY_FORMULA".equalsIgnoreCase(step)) {
            String rule = request.getSubmittedRule();
            if ("GROSS_PLUS_OT".equalsIgnoreCase(rule)) {
                success = true;
                message = "Synthesis formula verified! Proceed to Step 8 — Synthesize Total Earnings.";
            } else if ("GROSS_MINUS_OT".equalsIgnoreCase(rule)) {
                message = "Incorrect formula. Overtime pay must be ADDED to Gross Pay, not subtracted. Review the Company Payroll Manual.";
            } else if ("HOURLY_PLUS_OT".equalsIgnoreCase(rule)) {
                message = "Incorrect formula. Total Earnings are computed from the full Gross Basic Pay, not just the Hourly Rate. Review the Company Payroll Manual.";
            } else {
                message = "Please select a Total Earnings formula from the dropdown.";
            }

        } else if ("SYNTHESIS".equalsIgnoreCase(step)) {
            if (request.getSubmittedResult() == null) {
                message = "Arithmetic Error! No computed value was submitted. Compute Total Earnings = Gross Pay + Overtime Pay and enter the result.";
            } else {
                double result        = request.getSubmittedResult();
                double expectedGross = hourlyRate * 8.0 * targetDaysPresent;
                double expectedOtPay = hourlyRate * actualOt * 1.25;
                double expected      = expectedGross + expectedOtPay;

                System.out.println("Backend Expected (Phase 3 Synthesis): " + expected + " | Frontend Sent: " + result);

                BigDecimal hourlyRateBD  = BigDecimal.valueOf(hourlyRate);
                BigDecimal eightBD       = BigDecimal.valueOf(8);
                BigDecimal daysPresentBD = BigDecimal.valueOf(targetDaysPresent);
                BigDecimal grossPayBD    = hourlyRateBD.multiply(eightBD).multiply(daysPresentBD).setScale(2, RoundingMode.HALF_UP);

                BigDecimal actualOtBD   = BigDecimal.valueOf(actualOt);
                BigDecimal multiplierBD = BigDecimal.valueOf(1.25);
                BigDecimal otPayBD      = hourlyRateBD.multiply(actualOtBD).multiply(multiplierBD).setScale(2, RoundingMode.HALF_UP);

                BigDecimal expectedTotalBD = grossPayBD.add(otPayBD).setScale(2, RoundingMode.HALF_UP);
                double expectedRounded     = expectedTotalBD.doubleValue();

                boolean isCorrect = Math.abs(expected - result) <= 0.02 || Math.abs(expectedRounded - result) <= 0.02;

                if (isCorrect) {
                    success = true;
                    message = "Phase 3 Complete! Total Overtime-adjusted Earnings verified successfully at ₱"
                            + String.format("%.2f", expectedRounded);
                    phaseJustCompleted = validationService.updateProgress(student, "M2_MULTIPLIERS", 1);
                } else {
                    message = "Arithmetic Error! Total Earnings = Gross Pay (₱"
                            + String.format("%.2f", grossPayBD.doubleValue()) + ") + Overtime Pay (₱"
                            + String.format("%.2f", otPayBD.doubleValue()) + ") again.";
                    auditExpected = expectedRounded;
                    auditReceived = result;
                }
            }
        }

        return validationService.runDrillEngineAndLog(
                student, request, success, isRedHerring, message, auditExpected, auditReceived, phaseJustCompleted);
    }
}
