package com.NoZeroDays.backend.service;

import com.NoZeroDays.backend.dto.ValidationRequest;
import com.NoZeroDays.backend.dto.ValidationResponse;
import com.NoZeroDays.backend.model.AttemptLog;
import com.NoZeroDays.backend.model.StudentProfile;
import com.NoZeroDays.backend.repository.AttemptLogRepository;
import com.NoZeroDays.backend.repository.StudentProfileRepository;
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
    private com.NoZeroDays.backend.repository.GameSessionRepository gameSessionRepository;

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

                    // Red Herring check: they must not subtract early clock-in minutes or extract them
                    if (Math.abs(valB - (targetLateMinutes - earlyClockIn)) < epsilon || Math.abs(valB - earlyClockIn) < epsilon) {
                        isRedHerring = true;
                        message = "ERROR: Early clock-ins do NOT offset late minutes under Philippine Labor standards. Extract raw tardiness minutes.";
                    } else if (Math.abs(valA - targetHourlyRate) < epsilon && Math.abs(valB - targetLateMinutes) < epsilon) {
                        success = true;
                        message = "Extraction Verified! Proceed to Step 2.";
                    } else {
                        message = "Extraction Failed. Extract the raw Hourly Rate and true late minutes from the logs.";
                    }
                } else if ("IDENTIFY_RULE".equalsIgnoreCase(step)) {
                    String rule = request.getSubmittedRule();
                    if ("TARDINESS_FORMULA".equalsIgnoreCase(rule) || "HOURLY_RATE_DIV_60_X_LATE".equalsIgnoreCase(rule)) {
                        success = true;
                        message = "Rule Verified! Deductions = (Hourly Rate / 60) × Late Minutes. Proceed to Step 3.";
                    } else {
                        message = "Incorrect Rule! Find the standard formula for late minutes deduction on the whiteboard.";
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
                        message = "Tardiness deduction verified successfully at ₱" + String.format("%.2f", expectedRounded) + ". Proceed to Step 4.";
                    } else {
                        success = false;
                        message = "Arithmetic Error! Compute (Hourly Rate / 60) × Late Minutes carefully.";
                        auditExpected = expectedRounded;
                        auditReceived = result;
                    }
                } else if ("SYNTHESIS".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double targetDailyRate = request.getDailyRate() != null ? request.getDailyRate() : 0.0;
                    int targetDaysPresent = request.getDaysPresent() != null ? request.getDaysPresent() : 0;

                    // Ensure Gross Pay is calculated exactly as: Hourly Rate * 8 * Days Present
                    double expectedGross = targetHourlyRate * 8.0 * targetDaysPresent;
                    
                    // Ensure Net Pay is calculated exactly as: Gross Pay - ((Hourly Rate / 60) * Late Minutes)
                    double expectedTardiness = (targetHourlyRate / 60.0) * targetLateMinutes;
                    double expected = expectedGross - expectedTardiness;

                    // Add explicit logging in the Spring Boot backend
                    System.out.println("Backend Expected: " + expected + " | Frontend Sent: " + result);

                    // Standardize backend math (BigDecimal)
                    BigDecimal hourlyRateBD = BigDecimal.valueOf(targetHourlyRate);
                    BigDecimal eight = BigDecimal.valueOf(8);
                    BigDecimal daysPresentBD = BigDecimal.valueOf(targetDaysPresent);
                    BigDecimal sixty = BigDecimal.valueOf(60);
                    BigDecimal lateMinutesBD = BigDecimal.valueOf(targetLateMinutes);

                    BigDecimal grossPayBD = hourlyRateBD.multiply(eight).multiply(daysPresentBD).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal tardinessBD = hourlyRateBD.divide(sixty, 10, RoundingMode.HALF_UP).multiply(lateMinutesBD).setScale(2, RoundingMode.HALF_UP);
                    BigDecimal expectedNetPayBD = grossPayBD.subtract(tardinessBD).setScale(2, RoundingMode.HALF_UP);
                    double expectedRounded = expectedNetPayBD.doubleValue();

                    // Implement accounting tolerance: margin of error <= 0.02
                    boolean isCorrect = Math.abs(expected - result) <= 0.02 || Math.abs(expectedRounded - result) <= 0.02;

                    if (isCorrect) {
                        success = true;
                        message = "Phase 2 Complete! Net Take-Home Pay verified successfully at ₱" + String.format("%.2f", expectedRounded);
                        updateProgress(student, "M1_MATH", 2);
                    } else {
                        success = false;
                        message = "Arithmetic Error! Net Pay = Gross Pay (₱" + String.format("%.2f", grossPayBD.doubleValue()) + ") - Tardiness Deduction (₱" + String.format("%.2f", tardinessBD.doubleValue()) + ") again.";
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

                    // Red Herring check: user must deduct unpaid lunch hours. If they extracted raw otHours, flag.
                    if (Math.abs(valB - otHours) < epsilon) {
                        isRedHerring = true;
                        message = "ERROR: Unpaid lunch hours must be deducted from recorded Overtime. Standard working hours do not credit rest intervals.";
                    } else if (Math.abs(valA - hourlyRate) < epsilon && Math.abs(valB - actualOt) < epsilon) {
                        success = true;
                        message = "Extraction Verified! Proceed to Step 2.";
                    } else {
                        message = "Extraction Failed. Make sure to deduct unpaid lunch from total OT hours.";
                    }
                } else if ("IDENTIFY_RULE".equalsIgnoreCase(step)) {
                    String rule = request.getSubmittedRule();
                    if ("OT_FORMULA".equalsIgnoreCase(rule) || "HOURLY_RATE_X_OT_X_1.25".equalsIgnoreCase(rule)) {
                        success = true;
                        message = "Rule Verified! OT Pay = Hourly Rate × OT Hours × 1.25. Proceed to Step 3.";
                    } else {
                        message = "Incorrect Rule! Overtime premium rate is 125% of hourly rate. Check the poster rules.";
                    }
                } else if ("EXECUTE".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expected = hourlyRate * actualOt * 1.25;

                    System.out.println("Backend Expected (Phase 3 Step 3): " + expected + " | Frontend Sent: " + result);

                    BigDecimal hourlyRateBD = BigDecimal.valueOf(hourlyRate);
                    BigDecimal actualOtBD = BigDecimal.valueOf(actualOt);
                    BigDecimal multiplierBD = BigDecimal.valueOf(1.25);
                    BigDecimal expectedOtBD = hourlyRateBD.multiply(actualOtBD).multiply(multiplierBD).setScale(2, RoundingMode.HALF_UP);
                    double expectedRounded = expectedOtBD.doubleValue();

                    boolean isCorrect = Math.abs(expected - result) <= 0.02 || Math.abs(expectedRounded - result) <= 0.02;

                    if (isCorrect) {
                        success = true;
                        message = "Overtime verified successfully at ₱" + String.format("%.2f", expectedRounded) + ". Proceed to Step 4.";
                    } else {
                        success = false;
                        message = "Arithmetic Error! Calculate: Hourly Rate (₱" + hourlyRate + ") × Actual OT Hours (" + actualOt + ") × 1.25 again.";
                        auditExpected = expectedRounded;
                        auditReceived = result;
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
                    double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;
                    double valB = request.getSubmittedValueB() != null ? request.getSubmittedValueB() : 0.0;

                    if (Math.abs(valB - 1.3) < epsilon) {
                        isRedHerring = true;
                        message = "ERROR: You extracted the Special Non-Working Holiday multiplier (1.3x). June 12 is Independence Day, which is a Regular Holiday (2.0x).";
                    } else if (Math.abs(valA - dailyRate) < epsilon && Math.abs(valB - 2.0) < epsilon) {
                        success = true;
                        message = "Extraction Verified! Holiday rate multiplier of 200% (2.0) identified. Proceed to Step 2.";
                    } else {
                        message = "Extraction Failed. Extract the base Daily Rate and the standard Regular Holiday double pay multiplier (2.0).";
                    }
                } else if ("IDENTIFY_RULE".equalsIgnoreCase(step)) {
                    String rule = request.getSubmittedRule();
                    if ("HOLIDAY_FORMULA".equalsIgnoreCase(rule) || "DAILY_RATE_X_2.0".equalsIgnoreCase(rule)) {
                        success = true;
                        message = "Rule Verified! Regular Holiday Pay = Daily Rate × 2.0. Proceed to Step 3.";
                    } else {
                        message = "Incorrect Rule! Regular Holiday pay requires double pay multiplier (2.0).";
                    }
                } else if ("EXECUTE".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expected = dailyRate * 2.0;
                    if (Math.abs(result - expected) < epsilon) {
                        success = true;
                        message = "Holiday Pay verified successfully at ₱" + String.format("%.2f", expected);
                    } else {
                        message = "Arithmetic Error! Holiday Double Pay = Daily Rate (₱" + dailyRate + ") × 2.";
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
            if (phase == 1) { // Phase 1: SSS Deductions
                double sssEe = request.getSssEeShare() != null ? request.getSssEeShare() : 0.0;
                double sssEr = request.getSssErShare() != null ? request.getSssErShare() : 0.0;
                double personalLoan = request.getPersonalSalaryLoan() != null ? request.getPersonalSalaryLoan() : 0.0;
                double spouseLoan = request.getSpouseLoan() != null ? request.getSpouseLoan() : 0.0;

                if ("EXTRACT".equalsIgnoreCase(step)) {
                    double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;
                    double valB = request.getSubmittedValueB() != null ? request.getSubmittedValueB() : 0.0;

                    // Red Herring check: ignore ER share or spouse loan
                    if (Math.abs(valA - sssEr) < epsilon || Math.abs(valB - spouseLoan) < epsilon) {
                        isRedHerring = true;
                        message = "ERROR: SSS Employer (ER) Share and spouse loans cannot be deducted from this employee's basic pay. Extract EE Share and Personal Loan.";
                    } else if (Math.abs(valA - sssEe) < epsilon && Math.abs(valB - personalLoan) < epsilon) {
                        success = true;
                        message = "Extraction Verified! Proceed to Step 2.";
                    } else {
                        message = "Extraction Failed. Extract the employee SSS EE share and personal salary loan.";
                    }
                } else if ("IDENTIFY_RULE".equalsIgnoreCase(step)) {
                    String rule = request.getSubmittedRule();
                    if ("SSS_FORMULA".equalsIgnoreCase(rule) || "EE_SHARE_ADD_LOAN".equalsIgnoreCase(rule)) {
                        success = true;
                        message = "Rule Verified! SSS Deductions = SSS EE Share + Personal Salary Loan. Proceed to Step 3.";
                    } else {
                        message = "Incorrect Rule! Deduct SSS Employee Share and Personal Loan together. Ignore Spouse loans and Employer share.";
                    }
                } else if ("EXECUTE".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expected = sssEe + personalLoan;
                    if (Math.abs(result - expected) < epsilon) {
                        success = true;
                        message = "SSS Deductions verified successfully at ₱" + String.format("%.2f", expected);
                    } else {
                        message = "Arithmetic Error! Sum SSS EE (₱" + sssEe + ") and Personal Loan (₱" + personalLoan + ") carefully.";
                    }
                } else if ("SYNTHESIS".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expected = sssEe + personalLoan;
                    if (Math.abs(result - expected) < epsilon) {
                        success = true;
                        message = "Phase 5 Complete! Total Statutory Deductions So Far verified successfully at ₱" + String.format("%.2f", expected);
                        updateProgress(student, "M3_BUREAUCRACY", 1);
                    } else {
                        message = "Arithmetic Error! Total Statutory Deductions So Far should be equal to the SSS Deductions (₱" + String.format("%.2f", expected) + ").";
                    }
                }
            } else if (phase == 2) { // Phase 2: PhilHealth Deductions
                double basicSalary = request.getBasicSalary() != null ? request.getBasicSalary() : 0.0;
                double sssEe = request.getSssEeShare() != null ? request.getSssEeShare() : 0.0;
                double personalLoan = request.getPersonalSalaryLoan() != null ? request.getPersonalSalaryLoan() : 0.0;

                if ("EXTRACT".equalsIgnoreCase(step)) {
                    double valA = request.getSubmittedValueA() != null ? request.getSubmittedValueA() : 0.0;
                    double valB = request.getSubmittedValueB() != null ? request.getSubmittedValueB() : 0.0;

                    if (Math.abs(valA - basicSalary) < epsilon && Math.abs(valB - 0.025) < epsilon) {
                        success = true;
                        message = "Extraction Verified! Base salary and PhilHealth rate (2.5% / 0.025) extracted. Proceed to Step 2.";
                    } else {
                        message = "Extraction Failed. Extract Basic Salary and the current standard rate of 2.5% (0.025) for PhilHealth.";
                    }
                } else if ("IDENTIFY_RULE".equalsIgnoreCase(step)) {
                    String rule = request.getSubmittedRule();
                    if ("PHILHEALTH_FORMULA".equalsIgnoreCase(rule) || "BASIC_SALARY_X_0.025".equalsIgnoreCase(rule)) {
                        success = true;
                        message = "Rule Verified! PhilHealth Premium = Basic Salary × 2.5%. Proceed to Step 3.";
                    } else {
                        message = "Incorrect Rule! Multiplier rate should be 2.5% (0.025) of Basic Salary.";
                    }
                } else if ("EXECUTE".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expected = basicSalary * 0.025;
                    if (Math.abs(result - expected) < epsilon) {
                        success = true;
                        message = "PhilHealth Deduction verified successfully at ₱" + String.format("%.2f", expected);
                    } else {
                        message = "Arithmetic Error! Calculate Basic Salary (₱" + basicSalary + ") × 0.025.";
                    }
                } else if ("SYNTHESIS".equalsIgnoreCase(step)) {
                    double result = request.getSubmittedResult() != null ? request.getSubmittedResult() : 0.0;
                    double expectedSss = sssEe + personalLoan;
                    double expectedPh = basicSalary * 0.025;
                    double expected = expectedSss + expectedPh;
                    if (Math.abs(result - expected) < epsilon) {
                        success = true;
                        message = "Phase 6 Complete! Final Statutory Deductions verified successfully at ₱" + String.format("%.2f", expected);
                        updateProgress(student, "M3_BUREAUCRACY", 2);
                    } else {
                        message = "Arithmetic Error! Final Statutory Deductions = SSS Deductions (₱" + String.format("%.2f", expectedSss) + ") + PhilHealth Deduction (₱" + String.format("%.2f", expectedPh) + ") again.";
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
            double sssDeductions = sssEe + personalLoan;
            double phDeduction = basicSalary * 0.025;
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

        // 3. LOG ATTEMPT TO DATABASE
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

        attempt.setExpectedData(String.format("dailyRate=%.2f, daysPresent=%d, hourlyRate=%.2f, lateMinutes=%d, otHours=%.2f, unpaidLunchHours=%.2f, workedOnHoliday=%b, sssEeShare=%.2f, personalSalaryLoan=%.2f, basicSalary=%.2f",
                request.getDailyRate() != null ? request.getDailyRate() : 0.0,
                request.getDaysPresent() != null ? request.getDaysPresent() : 0,
                request.getHourlyRate() != null ? request.getHourlyRate() : 0.0,
                request.getLateMinutes() != null ? request.getLateMinutes() : 0,
                request.getOtHours() != null ? request.getOtHours() : 0.0,
                request.getUnpaidLunchHours() != null ? request.getUnpaidLunchHours() : 0.0,
                request.getWorkedOnHoliday() != null ? request.getWorkedOnHoliday() : false,
                request.getSssEeShare() != null ? request.getSssEeShare() : 0.0,
                request.getPersonalSalaryLoan() != null ? request.getPersonalSalaryLoan() : 0.0,
                request.getBasicSalary() != null ? request.getBasicSalary() : 0.0));

        attemptLogRepository.save(attempt);


        // 4. INFINITE DRILL ENGINE
        // Rule: 3 consecutive failed attempts in this phase, or a Red Herring trap triggers the drill
        boolean drillTriggered = false;
        if (isRedHerring) {
            drillTriggered = true;
            message += " [INFINITE DRILL TRIGGERED: Rerolling scenario variables...]";
        } else if (!success) {
            List<AttemptLog> recentAttempts = attemptLogRepository.findLatestAttempts(student, module, phase);
            int consecutiveFailures = 0;
            // Iterate and count consecutive false successes
            for (AttemptLog log : recentAttempts) {
                if (!log.isSuccessful()) {
                    consecutiveFailures++;
                } else {
                    break;
                }
            }
            if (consecutiveFailures >= 3) {
                drillTriggered = true;
                message += " [INFINITE DRILL TRIGGERED: 3 consecutive failure threshold reached. Rerolling scenario variables...]";
            }
        }

        ValidationResponse response = new ValidationResponse(success, message, isRedHerring, drillTriggered);
        response.setExpected(auditExpected);
        response.setReceived(auditReceived);
        return response;
    }

    private void updateProgress(StudentProfile student, String module, int phase) {
        List<com.NoZeroDays.backend.model.GameSession> activeSessions = gameSessionRepository.findByStudentProfileAndStatus(student, "ACTIVE");
        if (!activeSessions.isEmpty()) {
            com.NoZeroDays.backend.model.GameSession session = activeSessions.get(0);
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
