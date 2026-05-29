package com.NoZeroDays.backend.common.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.model.AttemptLog;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.repository.AttemptLogRepository;
import com.NoZeroDays.backend.common.repository.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
public class ValidationService {

    @Autowired
    private StudentProfileRepository studentRepository;

    @Autowired
    private AttemptLogRepository attemptLogRepository;

    @Autowired
    private com.NoZeroDays.backend.common.repository.GameSessionRepository gameSessionRepository;

    public ValidationResponse validate(ValidationRequest request) {
        // 1. Get or Create Student Profile to ensure logging works smoothly
        String studentNum = request.getStudentNumber();
        if (studentNum == null || studentNum.trim().isEmpty()) {
            studentNum = "STU-UNKNOWN";
        }
        
        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(studentNum);
        StudentProfile student;
        if (studentOpt.isEmpty()) {
            student = new StudentProfile(studentNum, "Temporary Student", "ABM-A");
            student = studentRepository.save(student);
        } else {
            student = studentOpt.get();
        }

        // Initialize response parameters
        boolean success = false;
        boolean isRedHerring = false;
        String message = "";
        Double auditExpected = null;
        Double auditReceived = null;

        String module = request.getModule() != null ? request.getModule() : "M1_MATH";
        int phase = request.getPhase() != null ? request.getPhase() : 1;
        String step = request.getStep() != null ? request.getStep() : "EXTRACT";

        // Double comparison threshold to handle float/double issues
        double epsilon = 0.01;

        // 2. Perform validation logic based on Module, Phase, and Step
        if ("M1_MATH".equalsIgnoreCase(module)) {
            if (phase == 1) { // Phase 1: Gross Pay
                double targetDailyRate = request.getDailyRate() != null ? request.getDailyRate() : 0.0;
                int targetDaysPresent = request.getDaysPresent() != null ? request.getDaysPresent() : 0;
                double rice = request.getRiceSubsidy() != null ? request.getRiceSubsidy() : 0.0;
                double uniform = request.getUniformAllowance() != null ? request.getUniformAllowance() : 0.0;

                if ("EXTRACT".equalsIgnoreCase(step)) {
                    double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;
                    double valB = request.getSubmittedValueB() != null ? request.getSubmittedValueB() : 0.0;

                    // Red Herring check: check if student extracted allowances
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
                    if ("MULTIPLICATION".equalsIgnoreCase(rule) || "DAILY_RATE_X_DAYS".equalsIgnoreCase(rule) || "*".equals(rule)) {
                        success = true;
                        message = "Rule Identified! The core equation is Daily Rate × Days Present. Proceed to Step 3.";
                    } else {
                        message = "Incorrect Rule! How do you compute Gross Pay from a Daily Rate and Days Present?";
                    }
                } else if ("EXECUTE".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expected = targetDailyRate * targetDaysPresent;
                    if (Math.abs(result - expected) < epsilon) {
                        success = true;
                        message = "Phase 1 Complete! Gross Basic Pay verified successfully at ₱" + expected;
                        updateProgress(student, "M1_MATH", 1);
                    } else {
                        message = "Arithmetic Error! Calculate Daily Rate (₱" + targetDailyRate + ") × Days Present (" + targetDaysPresent + ") again.";
                    }
                }
            } else if (phase == 2) { // Phase 2: Tardiness Deductions
                double targetHourlyRate = request.getHourlyRate() != null ? request.getHourlyRate() : 0.0;
                int targetLateMinutes = request.getLateMinutes() != null ? request.getLateMinutes() : 0;
                int earlyClockIn = request.getEarlyClockInMinutes() != null ? request.getEarlyClockInMinutes() : 0;

                if ("EXTRACT".equalsIgnoreCase(step)) {
                    double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;
                    double valB = request.getSubmittedValueB() != null ? request.getSubmittedValueB() : 0.0;
                    int redHerringMinutes = request.getRedHerringLateMinutes() != null ? request.getRedHerringLateMinutes() : -1;

                    System.out.println("[Phase2 EXTRACT] userHourlyRate=" + valA + " userLateMinutes=" + valB
                            + " | expectedHourlyRate=" + targetHourlyRate + " expectedLateMinutes=" + targetLateMinutes
                            + " | redHerringMinutes=" + redHerringMinutes);

                    // 1. Check for exact success FIRST (float tolerance for hourly rate, exact int for minutes)
                    if (Math.abs(valA - targetHourlyRate) <= 0.02 && Math.abs(valB - targetLateMinutes) < epsilon) {
                        success = true;
                        message = "Extraction Verified! Proceed to Step 2.";
                    }
                    // 2. Check for the specific Red Herring trap value SECOND
                    else if (redHerringMinutes > 0 && Math.abs(valB - redHerringMinutes) < epsilon) {
                        isRedHerring = true;
                        message = "RED HERRING DETECTED: You included a grace period deduction that does not apply under Philippine Labor standards. Extract the raw total late minutes directly from the biometric log.";
                    }
                    // 3. Default standard strike failure
                    else {
                        message = "Extraction Failed. Extract the raw Hourly Rate from the HR Filing Cabinet and the total late minutes from the Biometrics Swipe Log.";
                    }
                } else if ("IDENTIFY_RULE".equalsIgnoreCase(step)) {
                    String rule = request.getSubmittedRule();
                    if ("TARDINESS_FORMULA".equalsIgnoreCase(rule) || "HOURLY_RATE_DIV_60_X_LATE".equalsIgnoreCase(rule)) {
                        success = true;
                        message = "Rule Verified! Deductions = (Hourly Rate / 60) × Late Minutes. Proceed to Step 3.";
                    } else {
                        message = "Incorrect Rule! Find the standard formula for late minutes deduction on the DOLE Compliance Poster.";
                    }
                } else if ("EXECUTE".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    
                    // Dynamic calculation
                    double expected = (targetHourlyRate / 60.0) * targetLateMinutes;

                    // Add explicit logging in the Spring Boot backend
                    System.out.println("Backend Expected: " + expected + " | Frontend Sent: " + result);

                    // Precise calculation with BigDecimal
                    BigDecimal hourlyRateBD = BigDecimal.valueOf(targetHourlyRate);
                    BigDecimal sixty = BigDecimal.valueOf(60);
                    BigDecimal lateMinutesBD = BigDecimal.valueOf(targetLateMinutes);
                    BigDecimal expectedTardinessBD = hourlyRateBD.divide(sixty, 10, RoundingMode.HALF_UP)
                                                                 .multiply(lateMinutesBD)
                                                                 .setScale(2, RoundingMode.HALF_UP);
                    double expectedRounded = expectedTardinessBD.doubleValue();
                    
                    // Implement accounting tolerance: margin of error <= 0.02
                    boolean isCorrect = Math.abs(expected - result) <= 0.02 || Math.abs(expectedRounded - result) <= 0.02;
                    
                    if (isCorrect) {
                        success = true;
                        message = "Tardiness deduction verified at ₱" + String.format("%.2f", expectedRounded) + ". Proceed to Step 4 — Compute Gross Basic Pay.";
                    } else {
                        success = false;
                        message = "Arithmetic Error! Compute (Hourly Rate / 60) × Late Minutes carefully.";
                        auditExpected = expectedRounded;
                        auditReceived = result;
                    }
                } else if ("COMPUTE_GROSS".equalsIgnoreCase(step)) {
                    // Phase 2 Step 4: Verify Gross Basic Pay = Hourly Rate × 8 × Days Present
                    // Failsafe: read from BOTH grossPay and submittedResult keys in case of frontend payload mismatch
                    Double fromGrossPay = request.getGrossPay();
                    Double fromSubmittedResult = request.getSubmittedResult();
                    double userGrossPay = fromGrossPay != null ? fromGrossPay
                                        : (fromSubmittedResult != null ? fromSubmittedResult : 0.0);

                    Integer rawDaysPresent = request.getDaysPresent();
                    int expectedDaysPresent = rawDaysPresent != null ? rawDaysPresent : 0;
                    double expectedHourlyRate = targetHourlyRate;

                    System.out.println("--- STEP 4 DEBUG ---");
                    System.out.println("Received User Gross: " + userGrossPay);
                    System.out.println("Backend Hourly Rate: " + expectedHourlyRate);
                    System.out.println("Backend Days Present: " + expectedDaysPresent);
                    System.out.println("fromGrossPay key: " + fromGrossPay);
                    System.out.println("fromSubmittedResult key: " + fromSubmittedResult);

                    if (expectedDaysPresent == 0 || expectedHourlyRate == 0.0) {
                        success = false;
                        message = "Validation Error: Scenario parameters were not received by the server. Please try resubmitting.";
                    } else {
                        double expectedGrossPay = expectedHourlyRate * 8.0 * expectedDaysPresent;

                        System.out.println("Calculated Expected Gross: " + expectedGrossPay);
                        System.out.println("Diff: " + Math.abs(userGrossPay - expectedGrossPay));

                        if (Math.abs(userGrossPay - expectedGrossPay) <= 0.02) {
                            success = true;
                            message = "Gross Basic Pay verified at ₱" + String.format("%.2f", expectedGrossPay) + ". Proceed to Step 5 — Establish Net Pay Formula.";
                        } else {
                            success = false;
                            message = "Gross Pay is incorrect. Review the HR Filing Cabinet for the correct values.";
                            auditExpected = expectedGrossPay;
                            auditReceived = userGrossPay;
                        }
                    }
                } else if ("NET_PAY_FORMULA".equalsIgnoreCase(step)) {
                    // Phase 2 Step 5: Verify Net Pay Formula Selection
                    // NOTE: GROSS_PLUS_TARDINESS is a learning error, NOT a red herring trap.
                    // Using isRedHerring=true would trigger a drill reroll which is too punitive for a dropdown.
                    String rule = request.getSubmittedRule();
                    if ("GROSS_MINUS_TARDINESS".equalsIgnoreCase(rule)) {
                        success = true;
                        message = "Net Pay formula verified! Proceed to Step 6 — Compute Final Net Pay.";
                    } else if ("GROSS_PLUS_TARDINESS".equalsIgnoreCase(rule)) {
                        success = false;
                        message = "Incorrect formula. Deductions must be SUBTRACTED from Gross Pay, not added. Review the Company Payroll Manual.";
                    } else if ("HOURLY_MINUS_TARDINESS".equalsIgnoreCase(rule)) {
                        success = false;
                        message = "Incorrect formula. Net Pay is computed from the full Gross Basic Pay, not just the Hourly Rate. Review the Company Payroll Manual.";
                    } else {
                        message = "Please select a Net Pay formula from the dropdown.";
                    }
                } else if ("SYNTHESIS".equalsIgnoreCase(step)) {
                    // Phase 2 Step 6: Verify Final Net Pay = Gross Pay - Tardiness
                    // Gross pay was already verified in Step 4 — we trust the scenario values for canonical computation.
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    int targetDaysPresent = request.getDaysPresent() != null ? request.getDaysPresent() : 0;

                    System.out.println("[Phase2 SYNTHESIS] HourlyRate=" + targetHourlyRate + " Days=" + targetDaysPresent + " LateMinutes=" + targetLateMinutes + " | Received=" + result);

                    // Canonical computation using BigDecimal
                    BigDecimal hourlyRateBD = BigDecimal.valueOf(targetHourlyRate);
                    BigDecimal eight = BigDecimal.valueOf(8);
                    BigDecimal daysPresentBD = BigDecimal.valueOf(targetDaysPresent);
                    BigDecimal sixty = BigDecimal.valueOf(60);
                    BigDecimal lateMinutesBD = BigDecimal.valueOf(targetLateMinutes);

                    BigDecimal grossPayBD = hourlyRateBD.multiply(eight).multiply(daysPresentBD).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal tardinessBD = hourlyRateBD.divide(sixty, 10, RoundingMode.HALF_UP).multiply(lateMinutesBD).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal expectedNetPayBD = grossPayBD.subtract(tardinessBD).setScale(2, RoundingMode.HALF_UP);
                    double expectedRounded = expectedNetPayBD.doubleValue();

                    boolean isCorrect = Math.abs(expectedRounded - result) <= 0.02;

                    if (isCorrect) {
                        success = true;
                        message = "Phase 2 Complete! Net Take-Home Pay verified at ₱" + String.format("%.2f", expectedRounded) + ". Excellent audit work!";
                        updateProgress(student, "M1_MATH", 2);
                    } else {
                        success = false;
                        message = "Net Pay is incorrect. Review the Company Payroll Manual for the Net Pay formula and verify your prior computations.";
                        auditExpected = expectedRounded;
                        auditReceived = result;
                    }
                }
            }

        } else if ("M2_MULTIPLIERS".equalsIgnoreCase(module)) {
            if (phase == 1) { // Phase 1: Overtime Premiums
                double hourlyRate = request.getHourlyRate() != null ? request.getHourlyRate() : 0.0;
                double otHours = request.getOtHours() != null ? request.getOtHours() : 0.0;
                double unpaidLunch = request.getUnpaidLunchHours() != null ? request.getUnpaidLunchHours() : 0.0;
                double actualOt = otHours - unpaidLunch;
                int targetDaysPresent = request.getDaysPresent() != null ? request.getDaysPresent() : 0;

                if ("EXTRACT".equalsIgnoreCase(step)) {
                    double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;
                    double valB = request.getSubmittedValueB() != null ? request.getSubmittedValueB() : 0.0;

                    // Step 1: EXTRACT LOGS -> Extract Hourly Rate and Total Recorded OT Hours
                    if (Math.abs(valA - hourlyRate) < epsilon && Math.abs(valB - otHours) < epsilon) {
                        success = true;
                        message = "Extraction Verified! Total recorded OT hours and Hourly Rate extracted successfully. Proceed to Step 2.";
                    } else {
                        message = "Extraction Failed. Make sure to extract the base Hourly Rate from the employee contract and the total recorded OT hours from the timesheet terminal.";
                    }
                } else if ("FILTER_LUNCH".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    
                    // Step 2: FILTER UNPAID LUNCH -> Numeric input for "True OT Hours"
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

                    // Step 3: ESTABLISH DOLE PREMIUM -> Dropdown to select the correct multiplier (1.25x)
                    if (Math.abs(valA - 1.25) < epsilon) {
                        success = true;
                        message = "DOLE Overtime premium multiplier verified! Proceed to Step 4.";
                    } else {
                        message = "Incorrect DOLE Premium multiplier. Review the DOLE Overtime Poster in the room for the correct overtime premium rate.";
                    }
                } else if ("ESTABLISH_FORMULA".equalsIgnoreCase(step)) {
                    String rule = request.getSubmittedRule();

                    // Step 4: ESTABLISH OT FORMULA -> Dropdown to select the formula
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
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expected = hourlyRate * actualOt * 1.25;

                    System.out.println("Backend Expected (Phase 3 Step 5): " + expected + " | Frontend Sent: " + result);

                    BigDecimal hourlyRateBD = BigDecimal.valueOf(hourlyRate);
                    BigDecimal actualOtBD = BigDecimal.valueOf(actualOt);
                    BigDecimal multiplierBD = BigDecimal.valueOf(1.25);
                    BigDecimal expectedOtBD = hourlyRateBD.multiply(actualOtBD).multiply(multiplierBD).setScale(2, RoundingMode.HALF_UP);
                    double expectedRounded = expectedOtBD.doubleValue();

                    boolean isCorrect = Math.abs(expected - result) <= 0.02 || Math.abs(expectedRounded - result) <= 0.02;

                    if (isCorrect) {
                        success = true;
                        message = "Overtime premium pay verified successfully at ₱" + String.format("%.2f", expectedRounded) + ". Proceed to Step 6 — Compute Gross Basic Pay.";
                    } else {
                        success = false;
                        message = "Arithmetic Error! Calculate: Hourly Rate (₱" + hourlyRate + ") × True OT Hours (" + actualOt + ") × 1.25 again.";
                        auditExpected = expectedRounded;
                        auditReceived = result;
                    }
                } else if ("COMPUTE_GROSS".equalsIgnoreCase(step)) {
                    double userGross = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expectedGross = hourlyRate * 8.0 * targetDaysPresent;
                    BigDecimal expectedGrossBD = BigDecimal.valueOf(hourlyRate)
                            .multiply(BigDecimal.valueOf(8.0))
                            .multiply(BigDecimal.valueOf(targetDaysPresent))
                            .setScale(2, RoundingMode.HALF_UP);
                    double expectedRounded = expectedGrossBD.doubleValue();

                    if (Math.abs(userGross - expectedGross) <= 0.02 || Math.abs(userGross - expectedRounded) <= 0.02) {
                        success = true;
                        message = "Gross Basic Pay verified at ₱" + String.format("%.2f", expectedRounded) + ". Proceed to Step 7 — Establish Synthesis Formula.";
                    } else {
                        success = false;
                        message = "Gross Pay is incorrect. Review the employee contract file for the correct hourly rate and multiply by 8 hours and days present.";
                        auditExpected = expectedRounded;
                        auditReceived = userGross;
                    }
                } else if ("NET_PAY_FORMULA".equalsIgnoreCase(step)) {
                    String rule = request.getSubmittedRule();
                    if ("GROSS_PLUS_OT".equalsIgnoreCase(rule)) {
                        success = true;
                        message = "Synthesis formula verified! Proceed to Step 8 — Synthesize Total Earnings.";
                    } else if ("GROSS_MINUS_OT".equalsIgnoreCase(rule)) {
                        success = false;
                        message = "Incorrect formula. Overtime pay must be ADDED to Gross Pay, not subtracted. Review the Company Payroll Manual.";
                    } else if ("HOURLY_PLUS_OT".equalsIgnoreCase(rule)) {
                        success = false;
                        message = "Incorrect formula. Total Earnings are computed from the full Gross Basic Pay, not just the Hourly Rate. Review the Company Payroll Manual.";
                    } else {
                        message = "Please select a Total Earnings formula from the dropdown.";
                    }
                } else if ("SYNTHESIS".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    
                    double expectedGross = hourlyRate * 8.0 * targetDaysPresent;
                    double expectedOtPay = hourlyRate * actualOt * 1.25;
                    double expected = expectedGross + expectedOtPay;

                    System.out.println("Backend Expected (Phase 3 Synthesis): " + expected + " | Frontend Sent: " + result);

                    BigDecimal hourlyRateBD = BigDecimal.valueOf(hourlyRate);
                    BigDecimal eightBD = BigDecimal.valueOf(8);
                    BigDecimal daysPresentBD = BigDecimal.valueOf(targetDaysPresent);
                    BigDecimal grossPayBD = hourlyRateBD.multiply(eightBD).multiply(daysPresentBD).setScale(2, RoundingMode.HALF_UP);

                    BigDecimal actualOtBD = BigDecimal.valueOf(actualOt);
                    BigDecimal multiplierBD = BigDecimal.valueOf(1.25);
                    BigDecimal otPayBD = hourlyRateBD.multiply(actualOtBD).multiply(multiplierBD).setScale(2, RoundingMode.HALF_UP);

                    BigDecimal expectedTotalEarningsBD = grossPayBD.add(otPayBD).setScale(2, RoundingMode.HALF_UP);
                    double expectedRounded = expectedTotalEarningsBD.doubleValue();

                    boolean isCorrect = Math.abs(expected - result) <= 0.02 || Math.abs(expectedRounded - result) <= 0.02;

                    if (isCorrect) {
                        success = true;
                        message = "Phase 3 Complete! Total Overtime-adjusted Earnings verified successfully at ₱" + String.format("%.2f", expectedRounded);
                        updateProgress(student, "M2_MULTIPLIERS", 1);
                    } else {
                        success = false;
                        message = "Arithmetic Error! Total Earnings = Gross Pay (₱" + String.format("%.2f", grossPayBD.doubleValue()) + ") + Overtime Pay (₱" + String.format("%.2f", otPayBD.doubleValue()) + ") again.";
                        auditExpected = expectedRounded;
                        auditReceived = result;
                    }
                }
            } else if (phase == 2) { // Phase 2: Regular Holiday Pay
                double dailyRate = request.getDailyRate() != null ? request.getDailyRate() : 0.0;

                if ("EXTRACT".equalsIgnoreCase(step)) {
                    String rule = request.getSubmittedRule();

                    // Step 1: EXTRACT HOLIDAY TYPE -> Dropdown mapping the calendar date
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

                    // Step 2: ESTABLISH DOLE PREMIUM -> Dropdown to select the multiplier (2.00x)
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

                    // Step 3: ESTABLISH HOLIDAY FORMULA -> Dropdown to select the formula
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
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expected = dailyRate * 2.0;
                    if (Math.abs(result - expected) < epsilon) {
                        success = true;
                        message = "Holiday Pay verified successfully at ₱" + String.format("%.2f", expected) + ". Proceed to Step 5 — Compute Gross Basic Pay.";
                    } else {
                        message = "Arithmetic Error! Holiday Double Pay = Daily Rate (₱" + dailyRate + ") × 2.";
                    }
                } else if ("COMPUTE_GROSS".equalsIgnoreCase(step)) {
                    double userGross = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    int targetDaysPresent = request.getDaysPresent() != null ? request.getDaysPresent() : 0;
                    double expectedGross = dailyRate * targetDaysPresent;
                    BigDecimal expectedGrossBD = BigDecimal.valueOf(dailyRate)
                            .multiply(BigDecimal.valueOf(targetDaysPresent))
                            .setScale(2, RoundingMode.HALF_UP);
                    double expectedRounded = expectedGrossBD.doubleValue();

                    if (Math.abs(userGross - expectedGross) <= 0.02 || Math.abs(userGross - expectedRounded) <= 0.02) {
                        success = true;
                        message = "Gross Basic Pay verified at ₱" + String.format("%.2f", expectedRounded) + ". Proceed to Step 6 — Establish Synthesis Formula.";
                    } else {
                        success = false;
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
                        success = false;
                        message = "Incorrect formula. Holiday Pay must be ADDED to Gross Pay, not subtracted. Review the Company Payroll Manual.";
                    } else if ("DAILY_PLUS_HOLIDAY".equalsIgnoreCase(rule)) {
                        success = false;
                        message = "Incorrect formula. Total Earnings are computed from the full Gross Basic Pay, not just the Daily Rate. Review the Company Payroll Manual.";
                    } else {
                        message = "Please select a Total Earnings formula from the dropdown.";
                    }
                } else if ("SYNTHESIS".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    
                    double targetDailyRate = request.getDailyRate() != null ? request.getDailyRate() : 0.0;
                    int targetDaysPresent = request.getDaysPresent() != null ? request.getDaysPresent() : 0;
                    
                    double expectedGross = targetDailyRate * targetDaysPresent;
                    double expectedHolidayPay = targetDailyRate * 2.0;
                    double expected = expectedGross + expectedHolidayPay;

                    System.out.println("Backend Expected (Phase 4 Synthesis): " + expected + " | Frontend Sent: " + result);

                    BigDecimal grossPayBD = BigDecimal.valueOf(targetDailyRate).multiply(BigDecimal.valueOf(targetDaysPresent)).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal holidayPayBD = BigDecimal.valueOf(targetDailyRate).multiply(BigDecimal.valueOf(2.0)).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal expectedTotalEarningsBD = grossPayBD.add(holidayPayBD).setScale(2, RoundingMode.HALF_UP);
                    double expectedRounded = expectedTotalEarningsBD.doubleValue();

                    boolean isCorrect = Math.abs(expected - result) <= 0.02 || Math.abs(expectedRounded - result) <= 0.02;

                    if (isCorrect) {
                        success = true;
                        message = "Phase 4 Complete! Total Holiday-adjusted Earnings verified successfully at ₱" + String.format("%.2f", expectedRounded);
                        updateProgress(student, "M2_MULTIPLIERS", 2);
                    } else {
                        success = false;
                        message = "Arithmetic Error! Total Earnings = Basic Gross Pay (₱" + String.format("%.2f", grossPayBD.doubleValue()) + ") + Holiday Pay (₱" + String.format("%.2f", holidayPayBD.doubleValue()) + ") again.";
                        auditExpected = expectedRounded;
                        auditReceived = result;
                    }
                }
            }
        } else if ("M3_BUREAUCRACY".equalsIgnoreCase(module)) {
            if (phase == 1) { // Phase 1: SSS & Pag-IBIG & Personal Loan Deductions (Phase 5)
                double sssEe = request.getSssEeShare() != null ? request.getSssEeShare() : 0.0;
                double sssEr = request.getSssErShare() != null ? request.getSssErShare() : 0.0;
                double personalLoan = request.getPersonalSalaryLoan() != null ? request.getPersonalSalaryLoan() : 0.0;
                double spouseLoan = request.getSpouseLoan() != null ? request.getSpouseLoan() : 0.0;

                if ("EXTRACT".equalsIgnoreCase(step)) {
                    double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;
                    double valB = request.getSubmittedValueB() != null ? request.getSubmittedValueB() : 0.0;

                    // Red Herring check: ignore ER share and spouse loan
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
                    if ("SSS_PERSONAL_PAGIBIG_FORMULA".equalsIgnoreCase(rule) || "EE_SHARE_ADD_PAGIBIG".equalsIgnoreCase(rule) || "ADDITION".equalsIgnoreCase(rule)) {
                        success = true;
                        message = "Rule Verified! The core equation is SSS EE Share + Personal Salary Loan + Pag-ibig Deduction. Proceed to Step 4.";
                    } else {
                        message = "Incorrect Rule! Choose the formula that adds SSS EE Share, Personal Salary Loan, and Pag-ibig Deduction together.";
                    }
                } else if ("EXECUTE".equalsIgnoreCase(step) || "SYNTHESIS".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expected = sssEe + personalLoan + 200.00;
                    if (Math.abs(result - expected) < epsilon) {
                        success = true;
                        message = "Phase 5 Complete! Total Deductions verified successfully at ₱" + String.format("%.2f", expected);
                        updateProgress(student, "M3_BUREAUCRACY", 1);
                    } else {
                        message = "Arithmetic Error! Calculate SSS EE Share (₱" + sssEe + ") + Personal Salary Loan (₱" + personalLoan + ") + Pag-ibig Deduction (₱200.00) again.";
                    }
                }
            } else if (phase == 2) { // Phase 2: PhilHealth Deductions (Phase 6)
                double basicSalary = request.getBasicSalary() != null ? request.getBasicSalary() : 0.0;
                double sssEe = request.getSssEeShare() != null ? request.getSssEeShare() : 0.0;
                double personalLoan = request.getPersonalSalaryLoan() != null ? request.getPersonalSalaryLoan() : 0.0;

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
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expected = basicSalary * 0.05;
                    if (Math.abs(result - expected) < epsilon) {
                        success = true;
                        message = "PhilHealth Deduction verified successfully at ₱" + String.format("%.2f", expected);
                    } else {
                        message = "Arithmetic Error! Calculate Basic Salary (₱" + basicSalary + ") × 0.05.";
                    }
                } else if ("SYNTHESIS".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expectedSss = sssEe + personalLoan + 200.00; // SSS EE Share + Personal Salary Loan + Pag-IBIG EE Share (₱200.00)
                    double expectedPh = basicSalary * 0.05;
                    double expected = expectedSss + expectedPh;
                    if (Math.abs(result - expected) < epsilon) {
                        success = true;
                        message = "Phase 6 Complete! Final Statutory Deductions verified successfully at ₱" + String.format("%.2f", expected);
                        updateProgress(student, "M3_BUREAUCRACY", 2);
                    } else {
                        message = "Arithmetic Error! Final Statutory Deductions = SSS/Pag-IBIG/Loan (₱" + String.format("%.2f", expectedSss) + ") + PhilHealth (₱" + String.format("%.2f", expectedPh) + ") again.";
                    }
                }
            }
        } else if ("M4_TRIBUNAL".equalsIgnoreCase(module)) {
            // Module 4: Tribunal (Final Boss room - all steps combined)
            double dailyRate = request.getDailyRate() != null ? request.getDailyRate() : 0.0;
            int daysPresent = request.getDaysPresent() != null ? request.getDaysPresent() : 0;
            double hourlyRate = request.getHourlyRate() != null ? request.getHourlyRate() : 0.0;
            int lateMinutes = request.getLateMinutes() != null ? request.getLateMinutes() : 0;
            double otHours = request.getOtHours() != null ? request.getOtHours() : 0.0;
            double unpaidLunch = request.getUnpaidLunchHours() != null ? request.getUnpaidLunchHours() : 0.0;
            boolean holiday = request.getWorkedOnHoliday() != null ? request.getWorkedOnHoliday() : false;
            double sssEe = request.getSssEeShare() != null ? request.getSssEeShare() : 0.0;
            double personalLoan = request.getPersonalSalaryLoan() != null ? request.getPersonalSalaryLoan() : 0.0;
            double basicSalary = request.getBasicSalary() != null ? request.getBasicSalary() : (dailyRate * daysPresent);

            // Compute target values
            double grossBasicPay = dailyRate * daysPresent;
            double otPay = hourlyRate * (otHours - unpaidLunch) * 1.25;
            double holidayPay = holiday ? (dailyRate * 2.0) : 0.0;
            double expectedGross = grossBasicPay + otPay + holidayPay;

            double tardinessDeduction = (hourlyRate / 60.0) * lateMinutes;
            double sssDeductions = sssEe + personalLoan + 200.00;
            double phDeduction = basicSalary * 0.05;
            double expectedDeductions = tardinessDeduction + sssDeductions + phDeduction;

            double expectedNet = expectedGross - expectedDeductions;

            // Submit step holds user answers
            double userGross = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;       // Submitted Total Gross
            double userDeductions = request.getSubmittedValueB() != null ? request.getSubmittedValueB() : 0.0;  // Submitted Total Deductions
            double userNet = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;         // Submitted Net Pay

            boolean grossMatch = Math.abs(userGross - expectedGross) < 1.0; // Allow slight rounding
            boolean deductionsMatch = Math.abs(userDeductions - expectedDeductions) < 1.0;
            boolean netMatch = Math.abs(userNet - expectedNet) < 1.0;

            if (grossMatch && deductionsMatch && netMatch) {
                success = true;
                message = "CONGRATULATIONS AUDITOR! Net Payroll audit is clean and 100% correct. You are a payroll champion!";
                updateProgress(student, "M4_TRIBUNAL", 1);
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
        }

        // 4. INFINITE DRILL ENGINE
        // Rule: 3 consecutive failed attempts at this exact step, or a Red Herring trap triggers the drill.
        // EXEMPTION: Scaffolding steps (COMPUTE_GROSS, NET_PAY_FORMULA, etc.) never trigger a drill.
        boolean drillTriggered = false;
        boolean isDrillExemptStep = "COMPUTE_GROSS".equalsIgnoreCase(step) || "NET_PAY_FORMULA".equalsIgnoreCase(step)
                || "FILTER_LUNCH".equalsIgnoreCase(step) || "ESTABLISH_PREMIUM".equalsIgnoreCase(step) || "ESTABLISH_FORMULA".equalsIgnoreCase(step);

        // --- Count prior failures BEFORE saving the current attempt ---
        // Querying BEFORE save means: we count only the student's PREVIOUS failures, then
        // add exactly +1 for the current submission. This eliminates the timestamp-ordering bug
        // where two AttemptLog rows created within the same second share an identical timestamp
        // and MySQL returns them in arbitrary order — causing a correct DRILL_RESET barrier to
        // sort AFTER old failures and become invisible, making the count jump to 3 after 2 mistakes.
        int priorConsecutiveFailures = 0;
        if (!isDrillExemptStep && !isRedHerring && !success) {
            List<AttemptLog> priorAttempts = attemptLogRepository.findLatestAttemptsByStep(student, module, phase, step);
            for (AttemptLog log : priorAttempts) {
                if (!log.isSuccessful()) {
                    priorConsecutiveFailures++;
                } else {
                    // Any success (including DRILL_RESET barrier) stops the consecutive count
                    break;
                }
            }
        }

        // 3. LOG ATTEMPT TO DATABASE (after counting prior failures)
        AttemptLog attempt = new AttemptLog();
        attempt.setStudentProfile(student);
        attempt.setModule(module);
        attempt.setPhase(phase);
        attempt.setStep(step);
        attempt.setSuccessful(success);
        attempt.setRedHerring(isRedHerring);
        attempt.setFeedbackMessage(message);

        // Raw string formatting to record user input & target scenarios without jackson dependency
        attempt.setUserInputData(String.format("submittedValueA=%.2f, submittedValueB=%.2f, submittedRule=%s, submittedResult=%.2f",
                request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0,
                request.getSubmittedValueB() != null ? request.getSubmittedValueB() : 0.0,
                request.getSubmittedRule(),
                request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0));

        attempt.setExpectedData(String.format("dailyRate=%.2f, daysPresent=%d, hourlyRate=%.2f, lateMinutes=%d, otHours=%.2f, unpaidLunchHours=%.2f, workedOnHoliday=%b, sssEeShare=%.2f, personalSalaryLoan=%.2f, basicSalary=%.2f, employeeName=%s, companyName=%s",
                request.getDailyRate() != null ? request.getDailyRate() : 0.0,
                request.getDaysPresent() != null ? request.getDaysPresent() : 0,
                request.getHourlyRate() != null ? request.getHourlyRate() : 0.0,
                request.getLateMinutes() != null ? request.getLateMinutes() : 0,
                request.getOtHours() != null ? request.getOtHours() : 0.0,
                request.getUnpaidLunchHours() != null ? request.getUnpaidLunchHours() : 0.0,
                request.getWorkedOnHoliday() != null ? request.getWorkedOnHoliday() : false,
                request.getSssEeShare() != null ? request.getSssEeShare() : 0.0,
                request.getPersonalSalaryLoan() != null ? request.getPersonalSalaryLoan() : 0.0,
                request.getBasicSalary() != null ? request.getBasicSalary() : 0.0,
                request.getEmployeeName() != null ? request.getEmployeeName() : "Juan Dela Cruz",
                request.getCompanyName() != null ? request.getCompanyName() : "Apex Industrial Works"));

        attemptLogRepository.save(attempt);

        // Apply the drill rule: current attempt counts as +1 on top of prior failures
        if (!isDrillExemptStep) {
            if (isRedHerring) {
                drillTriggered = true;
                message += " [INFINITE DRILL TRIGGERED: Rerolling scenario variables...]";
            } else if (!success) {
                // Total failures = prior consecutive failures + the current failure just logged
                int totalConsecutiveFailures = priorConsecutiveFailures + 1;

                System.out.println("[DRILL ENGINE] step=" + step + " priorConsecutive=" + priorConsecutiveFailures + " total=" + totalConsecutiveFailures);

                if (totalConsecutiveFailures >= 3) {
                    drillTriggered = true;
                    message += " [INFINITE DRILL TRIGGERED: 3 consecutive failure threshold reached. Rerolling scenario variables...]";
                } else {
                    // Inform the student exactly how many attempts remain before a reroll
                    int attemptsLeft = 3 - totalConsecutiveFailures;
                    message += " (" + attemptsLeft + " attempt" + (attemptsLeft == 1 ? "" : "s") + " remaining before scenario resets.)";
                }
            }
        }

        // DRILL_RESET BARRIER: When a drill triggers, save a synthetic success record stamped
        // 1 second in the FUTURE. This guarantees it sorts BEFORE (DESC order) any old failure
        // records in subsequent queries, regardless of system clock precision — no timestamp
        // collision is possible with the explicit +1 second offset.
        if (drillTriggered) {
            AttemptLog resetBarrier = new AttemptLog();
            resetBarrier.setStudentProfile(student);
            resetBarrier.setModule(module);
            resetBarrier.setPhase(phase);
            resetBarrier.setStep(step);
            resetBarrier.setSuccessful(true);
            resetBarrier.setRedHerring(false);
            resetBarrier.setAttemptTime(java.time.LocalDateTime.now().plusSeconds(1)); // Ensures this sorts first in DESC
            resetBarrier.setFeedbackMessage("[DRILL_RESET] Strike counter reset after Infinite Drill trigger.");
            resetBarrier.setUserInputData("system=DRILL_RESET");
            resetBarrier.setExpectedData("system=DRILL_RESET");
            attemptLogRepository.save(resetBarrier);
        }

        ValidationResponse response = new ValidationResponse(success, message, isRedHerring, drillTriggered);
        response.setExpected(auditExpected);
        response.setReceived(auditReceived);
        return response;
    }

    private void updateProgress(StudentProfile student, String module, int phase) {
        List<com.NoZeroDays.backend.common.model.GameSession> activeSessions = gameSessionRepository.findByStudentProfileAndStatus(student, "ACTIVE");
        if (!activeSessions.isEmpty()) {
            com.NoZeroDays.backend.common.model.GameSession session = activeSessions.get(0);
            int currentCompletedPhase = 1;
            if ("M1_MATH".equalsIgnoreCase(module)) {
                currentCompletedPhase = phase;
            } else if ("M2_MULTIPLIERS".equalsIgnoreCase(module)) {
                currentCompletedPhase = 2 + phase;
            } else if ("M3_BUREAUCRACY".equalsIgnoreCase(module)) {
                currentCompletedPhase = 4 + phase;
            } else if ("M4_TRIBUNAL".equalsIgnoreCase(module)) {
                currentCompletedPhase = 7;
            }
            
            if (session.getCurrentPhase() <= currentCompletedPhase) {
                session.setCurrentPhase(currentCompletedPhase + 1);
                if (currentCompletedPhase >= 7) {
                    session.setStatus("COMPLETED");
                }
                gameSessionRepository.save(session);
            }
        }
    }
}
