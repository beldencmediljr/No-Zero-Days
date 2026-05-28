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

    @Test
    @SuppressWarnings("unchecked")
    void testProgressCalculation() {
        System.out.println("=== STARTING PROGRESS CALCULATION VERIFICATION TEST ===");
        
        // Find existing test student from database
        String testStudentNum = "17-1139-815";
        StudentProfile student = studentProfileRepository.findByStudentNumber(testStudentNum)
            .orElseThrow(() -> new AssertionError("Student " + testStudentNum + " must exist in DB for integration testing"));
        
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
            
            // Phase 3 & 4 must show 100% completed because they have SYNTHESIS (last step) successful in DB
            if (p.getPhaseId() == 3 || p.getPhaseId() == 4) {
                assertEquals("COMPLETED", p.getStatus(), p.getTitle() + " should be COMPLETED");
                assertEquals(100, p.getCompletionPercentage(), p.getTitle() + " completion % should be 100%");
            }
            
            // Phase 5 must show ACTIVE/LOCKED and NOT COMPLETED because SYNTHESIS was not completed
            if (p.getPhaseId() == 5) {
                assertNotEquals("COMPLETED", p.getStatus(), "Phase 5 should NOT be COMPLETED because it lacks the SYNTHESIS step");
                assertEquals(75, p.getCompletionPercentage(), "Phase 5 completion % should be 75% (has EXTRACT, IDENTIFY_RULE, EXECUTE)");
            }
        }
        
        System.out.println("=== PROGRESS CALCULATION VERIFICATION TEST SUCCESSFUL ===");
    }
}
