package com.NoZeroDays.backend.common.service;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.model.AttemptLog;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.repository.AttemptLogRepository;
import com.NoZeroDays.backend.common.repository.GameSessionRepository;
import com.NoZeroDays.backend.common.repository.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Common infrastructure service — shared utilities only.
 *
 * Responsibilities:
 *  1. Student profile resolution (get-or-create)
 *  2. AttemptLog persistence
 *  3. Infinite Drill Engine (3-strike counter + DRILL_RESET barrier)
 *  4. GameSession progress tracking
 *  5. Float tolerance helper
 *
 * Phase-specific business logic lives in each phase's own PhaseXValidationService.
 */
@Service
public class ValidationService {

    @Autowired
    private StudentProfileRepository studentRepository;

    @Autowired
    private AttemptLogRepository attemptLogRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    // -------------------------------------------------------------------------
    // Public utility: float tolerance comparison
    // -------------------------------------------------------------------------

    /**
     * Returns true if the absolute difference between expected and user values
     * is within the supplied epsilon (accounting tolerance).
     */
    public boolean isWithinTolerance(double expected, double user, double epsilon) {
        return Math.abs(expected - user) <= epsilon;
    }

    // -------------------------------------------------------------------------
    // Public utility: student resolution
    // -------------------------------------------------------------------------

    /**
     * Finds an existing StudentProfile by studentNumber, or creates a temporary
     * one if none exists. Never returns null.
     */
    public StudentProfile resolveStudent(String studentNumber) {
        String studentNum = (studentNumber == null || studentNumber.trim().isEmpty())
                ? "STU-UNKNOWN"
                : studentNumber;

        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(studentNum);
        if (studentOpt.isEmpty()) {
            StudentProfile newStudent = new StudentProfile(studentNum, "Temporary Student", "ABM-A");
            return studentRepository.save(newStudent);
        }
        return studentOpt.get();
    }

    // -------------------------------------------------------------------------
    // Public utility: Drill Engine + AttemptLog persistence
    // -------------------------------------------------------------------------

    /**
     * Persists the current attempt, runs the Infinite Drill Engine (3-strike rule),
     * saves a DRILL_RESET barrier if triggered, and returns the final ValidationResponse.
     *
     * Call this at the end of every PhaseXValidationService.validate() method.
     *
     * @param student        Resolved StudentProfile (from resolveStudent)
     * @param request        Original ValidationRequest (for logging raw input/scenario data)
     * @param success        Whether the student's answer was correct
     * @param isRedHerring   Whether a red-herring trap was activated
     * @param message        Feedback message to send to the frontend
     * @param auditExpected  Expected value for audit display (null if not applicable)
     * @param auditReceived  Received value for audit display (null if not applicable)
     */
    public ValidationResponse runDrillEngineAndLog(
            StudentProfile student,
            ValidationRequest request,
            boolean success,
            boolean isRedHerring,
            String message,
            Double auditExpected,
            Double auditReceived) {

        String module = request.getModule() != null ? request.getModule() : "M1_MATH";
        int phase    = request.getPhase()  != null ? request.getPhase()  : 1;
        String step  = request.getStep()   != null ? request.getStep()   : "EXTRACT";

        // Scaffolding steps are exempt from the drill engine
        boolean isDrillExemptStep =
                "COMPUTE_GROSS".equalsIgnoreCase(step)
             || "NET_PAY_FORMULA".equalsIgnoreCase(step)
             || "FILTER_LUNCH".equalsIgnoreCase(step)
             || "ESTABLISH_PREMIUM".equalsIgnoreCase(step)
             || "ESTABLISH_FORMULA".equalsIgnoreCase(step);

        // --- Count prior failures BEFORE saving the current attempt ---
        // Querying BEFORE save means: we count only the student's PREVIOUS failures, then
        // add exactly +1 for the current submission. This eliminates the timestamp-ordering bug
        // where two AttemptLog rows created within the same second share an identical timestamp
        // and MySQL returns them in arbitrary order — causing a correct DRILL_RESET barrier to
        // sort AFTER old failures and become invisible, making the count jump to 3 after 2 mistakes.
        int priorConsecutiveFailures = 0;
        if (!isDrillExemptStep && !isRedHerring && !success) {
            List<AttemptLog> priorAttempts =
                    attemptLogRepository.findLatestAttemptsByStep(student, module, phase, step);
            for (AttemptLog log : priorAttempts) {
                if (!log.isSuccessful()) {
                    priorConsecutiveFailures++;
                } else {
                    // Any success (including DRILL_RESET barrier) stops the consecutive count
                    break;
                }
            }
        }

        // Persist current attempt
        AttemptLog attempt = new AttemptLog();
        attempt.setStudentProfile(student);
        attempt.setModule(module);
        attempt.setPhase(phase);
        attempt.setStep(step);
        attempt.setSuccessful(success);
        attempt.setRedHerring(isRedHerring);
        attempt.setFeedbackMessage(message);

        attempt.setUserInputData(String.format(
                "submittedValueA=%.2f, submittedValueB=%.2f, submittedRule=%s, submittedResult=%.2f",
                request.getSubmittedValueA()  != null ? request.getSubmittedValueA()  : 0.0,
                request.getSubmittedValueB()  != null ? request.getSubmittedValueB()  : 0.0,
                request.getSubmittedRule(),
                request.getSubmittedResult()  != null ? request.getSubmittedResult()  : 0.0));

        attempt.setExpectedData(String.format(
                "dailyRate=%.2f, daysPresent=%d, hourlyRate=%.2f, lateMinutes=%d, " +
                "otHours=%.2f, unpaidLunchHours=%.2f, workedOnHoliday=%b, " +
                "sssEeShare=%.2f, personalSalaryLoan=%.2f, basicSalary=%.2f, " +
                "employeeName=%s, companyName=%s",
                request.getDailyRate()           != null ? request.getDailyRate()           : 0.0,
                request.getDaysPresent()          != null ? request.getDaysPresent()          : 0,
                request.getHourlyRate()           != null ? request.getHourlyRate()           : 0.0,
                request.getLateMinutes()          != null ? request.getLateMinutes()          : 0,
                request.getOtHours()              != null ? request.getOtHours()              : 0.0,
                request.getUnpaidLunchHours()     != null ? request.getUnpaidLunchHours()     : 0.0,
                request.getWorkedOnHoliday()      != null ? request.getWorkedOnHoliday()      : false,
                request.getSssEeShare()           != null ? request.getSssEeShare()           : 0.0,
                request.getPersonalSalaryLoan()   != null ? request.getPersonalSalaryLoan()   : 0.0,
                request.getBasicSalary()          != null ? request.getBasicSalary()          : 0.0,
                request.getEmployeeName()         != null ? request.getEmployeeName()         : "Juan Dela Cruz",
                request.getCompanyName()          != null ? request.getCompanyName()          : "Apex Industrial Works"));

        attemptLogRepository.save(attempt);

        // --- Apply drill engine ---
        boolean drillTriggered = false;
        String finalMessage = message;

        if (!isDrillExemptStep) {
            if (isRedHerring) {
                drillTriggered = true;
                finalMessage += " [INFINITE DRILL TRIGGERED: Rerolling scenario variables...]";
            } else if (!success) {
                int totalConsecutiveFailures = priorConsecutiveFailures + 1;
                System.out.println("[DRILL ENGINE] step=" + step
                        + " priorConsecutive=" + priorConsecutiveFailures
                        + " total=" + totalConsecutiveFailures);

                if (totalConsecutiveFailures >= 3) {
                    drillTriggered = true;
                    finalMessage += " [INFINITE DRILL TRIGGERED: 3 consecutive failure threshold reached. Rerolling scenario variables...]";
                } else {
                    int attemptsLeft = 3 - totalConsecutiveFailures;
                    finalMessage += " (" + attemptsLeft + " attempt"
                            + (attemptsLeft == 1 ? "" : "s") + " remaining before scenario resets.)";
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
            resetBarrier.setAttemptTime(java.time.LocalDateTime.now().plusSeconds(1));
            resetBarrier.setFeedbackMessage("[DRILL_RESET] Strike counter reset after Infinite Drill trigger.");
            resetBarrier.setUserInputData("system=DRILL_RESET");
            resetBarrier.setExpectedData("system=DRILL_RESET");
            attemptLogRepository.save(resetBarrier);
        }

        ValidationResponse response = new ValidationResponse(success, finalMessage, isRedHerring, drillTriggered);
        response.setExpected(auditExpected);
        response.setReceived(auditReceived);
        return response;
    }

    // -------------------------------------------------------------------------
    // Public utility: GameSession progress tracking
    // -------------------------------------------------------------------------

    /**
     * Advances the student's GameSession to the next phase upon a successful completion.
     * Maps module+phase combinations to a canonical 1-7 phase index.
     */
    public void updateProgress(StudentProfile student, String module, int phase) {
        List<com.NoZeroDays.backend.common.model.GameSession> activeSessions =
                gameSessionRepository.findByStudentProfileAndStatus(student, "ACTIVE");
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
