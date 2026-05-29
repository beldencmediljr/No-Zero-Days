package com.NoZeroDays.backend;

import com.NoZeroDays.backend.common.controller.ValidationController;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.repository.StudentProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private ValidationController validationController;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private com.NoZeroDays.backend.common.repository.AttemptLogRepository attemptLogRepository;

    @Autowired
    private com.NoZeroDays.backend.common.repository.GameSessionRepository gameSessionRepository;

    @Autowired
    private com.NoZeroDays.backend.phase7.service.Phase7ValidationService phase7ValidationService;

    @Test
    @SuppressWarnings("unchecked")
    void testProgressCalculation() {
        System.out.println("=== STARTING PROGRESS CALCULATION VERIFICATION TEST ===");
        
        String testStudentNum = "17-1139-815";

        // Clean up existing data for testStudentNum to ensure test is deterministic
        studentProfileRepository.findByStudentNumber(testStudentNum).ifPresent(s -> {
            java.util.List<com.NoZeroDays.backend.common.model.AttemptLog> logs = attemptLogRepository.findAll().stream()
                .filter(l -> l.getStudentProfile().getId().equals(s.getId()))
                .toList();
            attemptLogRepository.deleteAll(logs);
            
            java.util.List<com.NoZeroDays.backend.common.model.GameSession> sessions = gameSessionRepository.findAll().stream()
                .filter(gs -> gs.getStudentProfile().getId().equals(s.getId()))
                .toList();
            gameSessionRepository.deleteAll(sessions);
            
            studentProfileRepository.delete(s);
        });

        // Seed new student profile
        StudentProfile student = new StudentProfile();
        student.setStudentNumber(testStudentNum);
        student.setFullName("Test Student");
        student.setSection("ABM-12");
        student = studentProfileRepository.save(student);

        // Seed game session with currentPhase = 5 (makes Phase 1, 2, 3, 4 completed)
        com.NoZeroDays.backend.common.model.GameSession session = new com.NoZeroDays.backend.common.model.GameSession(student);
        session.setCurrentModule("M3_BUREAUCRACY");
        session.setCurrentPhase(5);
        session.setStatus("ACTIVE");
        session.setStartTime(java.time.LocalDateTime.now().minusMinutes(30));
        gameSessionRepository.save(session);

        // Seed 3 successful attempts for Phase 5 (which has 5 steps: EXTRACT, PAGIBIG_DEDUCTION, BASIC_SALARY, IDENTIFY_RULE, SYNTHESIS)
        // Seeding 3 steps: EXTRACT, PAGIBIG_DEDUCTION, and IDENTIFY_RULE. This makes completion % = 3/5 = 60%.
        String[] phase5Steps = {"EXTRACT", "PAGIBIG_DEDUCTION", "IDENTIFY_RULE"};
        for (String stepName : phase5Steps) {
            com.NoZeroDays.backend.common.model.AttemptLog log = new com.NoZeroDays.backend.common.model.AttemptLog();
            log.setStudentProfile(student);
            log.setModule("M3_BUREAUCRACY");
            log.setPhase(1);
            log.setStep(stepName);
            log.setSuccessful(true);
            log.setAttemptTime(java.time.LocalDateTime.now().minusMinutes(10));
            attemptLogRepository.save(log);
        }
        
        // Call validationController.getProgressStatus
        ResponseEntity<?> response = validationController.getProgressStatus(testStudentNum);
        assertEquals(200, response.getStatusCode().value());
        
        List<ValidationController.PhaseProgress> progressList = (List<ValidationController.PhaseProgress>) response.getBody();
        assertNotNull(progressList);
        assertEquals(7, progressList.size());
        
        // Verify each phase state
        for (ValidationController.PhaseProgress p : progressList) {
            System.out.printf("Phase %d (%s): Status = %s | Completion %% = %d | Best Score = %d%n",
                p.getPhaseId(),
                p.getTitle(),
                p.getStatus(),
                p.getCompletionPercentage(),
                p.getBestScore()
            );
            
            // Phase 3 & 4 must show 100% completed because they have progressed past current phase (currentPhase = 5)
            if (p.getPhaseId() == 3 || p.getPhaseId() == 4) {
                assertEquals("COMPLETED", p.getStatus(), p.getTitle() + " should be COMPLETED");
                assertEquals(100, p.getCompletionPercentage(), p.getTitle() + " completion % should be 100%");
            }
            
            // Phase 5 must show ACTIVE/LOCKED and NOT COMPLETED because SYNTHESIS was not completed
            if (p.getPhaseId() == 5) {
                assertNotEquals("COMPLETED", p.getStatus(), "Phase 5 should NOT be COMPLETED because it lacks the SYNTHESIS step");
                assertEquals(60, p.getCompletionPercentage(), "Phase 5 completion % should be 60% (has EXTRACT, PAGIBIG_DEDUCTION, IDENTIFY_RULE out of 5 steps)");
            }
        }
        
        System.out.println("=== PROGRESS CALCULATION VERIFICATION TEST SUCCESSFUL ===");
    }

    @Test
    void testPhase7Validation() {
        System.out.println("=== STARTING PHASE 7 VALIDATION TEST ===");

        String testStudentNum = "17-1139-815";
        
        // Seed student if not exists
        if (studentProfileRepository.findByStudentNumber(testStudentNum).isEmpty()) {
            StudentProfile newStudent = new StudentProfile();
            newStudent.setStudentNumber(testStudentNum);
            newStudent.setFullName("Test Student");
            newStudent.setSection("ABM-12");
            studentProfileRepository.save(newStudent);
        }

        // Test Case 1: Taxable income below threshold (No Withholding Tax)
        com.NoZeroDays.backend.common.dto.ValidationRequest request1 = new com.NoZeroDays.backend.common.dto.ValidationRequest();
        request1.setStudentNumber(testStudentNum);
        request1.setDailyRate(1000.0);
        request1.setDaysPresent(15);
        request1.setHourlyRate(125.0);
        request1.setLateMinutes(30);
        request1.setOtHours(5.0);
        request1.setUnpaidLunchHours(1.0);
        request1.setWorkedOnHoliday(true);
        request1.setSssEeShare(500.0);
        request1.setPersonalSalaryLoan(300.0);
        request1.setBasicSalary(15000.0);
        request1.setSubmittedValueA(17625.0); // Expected Gross: 15000 + 625 + 2000 = 17625.0
        request1.setSubmittedValueB(1437.5);  // Expected Deductions: 62.5 + 1000 + 375 + 0.0 = 1437.5
        request1.setSubmittedResult(16187.5); // Expected Net: 17625 - 1437.5 = 16187.5

        com.NoZeroDays.backend.common.dto.ValidationResponse response1 = phase7ValidationService.validate(request1);
        assertTrue(response1.isSuccess(), "Validation 1 should succeed: " + response1.getMessage());

        // Test Case 2: Taxable income above threshold (With Withholding Tax)
        com.NoZeroDays.backend.common.dto.ValidationRequest request2 = new com.NoZeroDays.backend.common.dto.ValidationRequest();
        request2.setStudentNumber(testStudentNum);
        request2.setDailyRate(1200.0);
        request2.setDaysPresent(25);
        request2.setHourlyRate(150.0);
        request2.setLateMinutes(0);
        request2.setOtHours(0.0);
        request2.setUnpaidLunchHours(0.0);
        request2.setWorkedOnHoliday(false);
        request2.setSssEeShare(1500.0);
        request2.setPersonalSalaryLoan(0.0);
        request2.setBasicSalary(30000.0);
        request2.setSubmittedValueA(30000.0);  // Expected Gross: 30000.0
        request2.setSubmittedValueB(3457.55); // Expected Deductions: 0 + 1700 + 750 + 1007.55 = 3457.55
        request2.setSubmittedResult(26542.45); // Expected Net: 30000 - 3457.55 = 26542.45

        com.NoZeroDays.backend.common.dto.ValidationResponse response2 = phase7ValidationService.validate(request2);
        assertTrue(response2.isSuccess(), "Validation 2 should succeed: " + response2.getMessage());

        System.out.println("=== PHASE 7 VALIDATION TEST SUCCESSFUL ===");
    }
}
