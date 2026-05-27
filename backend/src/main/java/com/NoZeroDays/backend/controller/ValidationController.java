package com.NoZeroDays.backend.controller;

import com.NoZeroDays.backend.dto.ValidationRequest;
import com.NoZeroDays.backend.dto.ValidationResponse;
import com.NoZeroDays.backend.model.StudentProfile;
import com.NoZeroDays.backend.repository.StudentProfileRepository;
import com.NoZeroDays.backend.service.ValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.List;
import com.NoZeroDays.backend.model.AttemptLog;
import com.NoZeroDays.backend.repository.AttemptLogRepository;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class ValidationController {

    @Autowired
    private ValidationService validationService;

    @Autowired
    private StudentProfileRepository studentRepository;

    // 1. Unified Validation Endpoint for all Modules, Phases, and Steps
    @PostMapping("/validation/submit")
    public ResponseEntity<ValidationResponse> validate(@RequestBody ValidationRequest request) {
        ValidationResponse response = validationService.validate(request);
        return ResponseEntity.ok(response);
    }

    // 2. Student Profile Registration & Login
    @PostMapping("/students/register")
    public ResponseEntity<?> registerStudent(@RequestBody StudentProfile student) {
        if (student.getStudentNumber() == null || student.getStudentNumber().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Student number cannot be empty.");
        }
        if (student.getFullName() == null || student.getFullName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Full name cannot be empty.");
        }

        Optional<StudentProfile> existing = studentRepository.findByStudentNumber(student.getStudentNumber());
        if (existing.isPresent()) {
            // Already registered - acts as login
            return ResponseEntity.ok(existing.get());
        }

        // Save new student
        StudentProfile saved = studentRepository.save(student);
        return ResponseEntity.ok(saved);
    }

    @Autowired
    private AttemptLogRepository attemptLogRepository;

    @GetMapping("/progress/status")
    public ResponseEntity<?> getProgressStatus(@RequestParam String studentNumber) {
        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(studentNumber);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Student not found.");
        }
        StudentProfile student = studentOpt.get();

        String[] modules = {
            "M1_MATH", "M1_MATH", 
            "M2_MULTIPLIERS", "M2_MULTIPLIERS", 
            "M3_BUREAUCRACY", "M3_BUREAUCRACY", 
            "M4_TRIBUNAL"
        };
        int[] phases = {1, 2, 1, 2, 1, 2, 1};
        String[] titles = {
            "Phase 1: Basic Gross Pay",
            "Phase 2: Tardiness Deductions",
            "Phase 3: Overtime Premiums",
            "Phase 4: Regular Holiday Pay",
            "Phase 5: SSS Deductions",
            "Phase 6: PhilHealth Premiums",
            "Phase 7: Net Payroll Boardroom"
        };
        String[] descriptions = {
            "Audit morning Lobby contracted Daily Rate and count calendar Shifts Worked.",
            "Scan Security Biometric clock-in logs and calculate standard Tardiness Deductions.",
            "Verify Factory Floor Overtime hourly multipliers (1.25x) and deduct unpaid lunch rest times.",
            "Comply with standard Double Pay (2.0x) rules on active Regular Holidays.",
            "Extract employee SSS EE share vs. ER share and calculate personal loan balances.",
            "Apply basic PhilHealth premium brackets and calculate standard 2.5% deductions.",
            "The final boardroom meeting. Assemble the complete take-home pay ledger unscaffolded."
        };

        java.util.List<PhaseProgress> list = new java.util.ArrayList<>();
        boolean previousCompleted = true;

        for (int i = 0; i < 7; i++) {
            int phaseId = i + 1;
            String module = modules[i];
            int phaseIndex = phases[i];
            
            boolean completed = isPhaseCompleted(student, module, phaseIndex);
            
            String status = "LOCKED";
            if (completed) {
                status = "COMPLETED";
            } else if (previousCompleted) {
                status = "ACTIVE";
            }
            
            // Calculate best attempt score
            int bestScore = 0;
            if (completed) {
                List<AttemptLog> attempts = attemptLogRepository.findLatestAttempts(student, module, phaseIndex);
                int failures = 0;
                for (AttemptLog log : attempts) {
                    if (!log.isSuccessful()) {
                        failures++;
                    }
                }
                bestScore = Math.max(100 - (failures * 10), 50);
            }

            list.add(new PhaseProgress(phaseId, titles[i], descriptions[i], status, bestScore, module, phaseIndex));
            previousCompleted = completed;
        }

        return ResponseEntity.ok(list);
    }

    private boolean isPhaseCompleted(StudentProfile student, String module, int phase) {
        List<AttemptLog> attempts = attemptLogRepository.findLatestAttempts(student, module, phase);
        for (AttemptLog log : attempts) {
            if (log.isSuccessful()) {
                String step = log.getStep();
                boolean needsSynthesis = ("M1_MATH".equalsIgnoreCase(module) && phase == 2) ||
                                         ("M2_MULTIPLIERS".equalsIgnoreCase(module) && (phase == 1 || phase == 2));
                if (needsSynthesis) {
                    if ("SYNTHESIS".equalsIgnoreCase(step)) {
                        return true;
                    }
                } else {
                    if ("EXECUTE".equalsIgnoreCase(step)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public static class PhaseProgress {
        private int phaseId;
        private String title;
        private String description;
        private String status; // LOCKED, ACTIVE, COMPLETED
        private int bestScore;
        private String module;
        private int phaseIndex;

        public PhaseProgress(int phaseId, String title, String description, String status, int bestScore, String module, int phaseIndex) {
            this.phaseId = phaseId;
            this.title = title;
            this.description = description;
            this.status = status;
            this.bestScore = bestScore;
            this.module = module;
            this.phaseIndex = phaseIndex;
        }

        public int getPhaseId() { return phaseId; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public String getStatus() { return status; }
        public int getBestScore() { return bestScore; }
        public String getModule() { return module; }
        public int getPhaseIndex() { return phaseIndex; }
    }
}
