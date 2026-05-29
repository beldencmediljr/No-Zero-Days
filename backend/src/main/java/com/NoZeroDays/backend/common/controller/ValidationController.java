package com.NoZeroDays.backend.common.controller;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.repository.StudentProfileRepository;
import com.NoZeroDays.backend.common.service.ValidationService;
import com.NoZeroDays.backend.common.model.AttemptLog;
import com.NoZeroDays.backend.common.repository.AttemptLogRepository;
import com.NoZeroDays.backend.common.model.GameSession;
import com.NoZeroDays.backend.common.repository.GameSessionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.List;
import java.util.Arrays;
import java.util.Collections;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class ValidationController {

    @Autowired
    private ValidationService validationService;

    @Autowired
    private StudentProfileRepository studentRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private AttemptLogRepository attemptLogRepository;

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
        StudentProfile profile;
        if (existing.isPresent()) {
            profile = existing.get();
        } else {
            profile = studentRepository.save(student);
        }

        // Ensure student has an active game session
        List<GameSession> activeSessions = gameSessionRepository.findByStudentProfileAndStatus(profile, "ACTIVE");
        if (activeSessions.isEmpty()) {
            GameSession newSession = new GameSession(profile);
            newSession.setCurrentModule("M1_MATH");
            newSession.setCurrentPhase(1);
            newSession.setStatus("ACTIVE");
            gameSessionRepository.save(newSession);
        }

        return ResponseEntity.ok(profile);
    }

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

        List<GameSession> activeSessions = gameSessionRepository.findByStudentProfileAndStatus(student, "ACTIVE");
        GameSession activeSession = activeSessions.isEmpty() ? null : activeSessions.get(0);
        java.time.LocalDateTime sessionStartTime = activeSession != null ? activeSession.getStartTime() : null;
        if (sessionStartTime != null) {
            long currentSessionAttempts = attemptLogRepository.countAttemptsSince(student, sessionStartTime);
            if (currentSessionAttempts == 0) {
                sessionStartTime = null; // fallback to include historical attempts if no active attempts in current session
            }
        }
        int currentPhase = activeSession != null ? activeSession.getCurrentPhase() : 1;
        boolean isSessionCompleted = activeSession != null && "COMPLETED".equalsIgnoreCase(activeSession.getStatus());

        for (int i = 0; i < 7; i++) {
            int phaseId = i + 1;
            String module = modules[i];
            int phaseIndex = phases[i];
            
            boolean completed = isPhaseCompleted(student, module, phaseIndex, sessionStartTime);
            
            // Also completed if GameSession has progressed past it or is complete
            if (isSessionCompleted || phaseId < currentPhase) {
                completed = true;
            }

            String status = "LOCKED";
            if (completed) {
                status = "COMPLETED";
            } else if (previousCompleted) {
                status = "ACTIVE";
            }
            
            int completionPercentage = completed ? 100 : calculateCompletionPercentage(student, module, phaseIndex, sessionStartTime);

            // Calculate best attempt score
            int bestScore = 0;
            if (completed) {
                List<AttemptLog> attempts = (sessionStartTime != null)
                    ? attemptLogRepository.findAttemptsSince(student, module, phaseIndex, sessionStartTime)
                    : attemptLogRepository.findLatestAttempts(student, module, phaseIndex);
                int failures = 0;
                for (AttemptLog log : attempts) {
                    if (!log.isSuccessful()) {
                        failures++;
                    }
                }
                bestScore = Math.max(100 - (failures * 10), 50);
            }

            list.add(new PhaseProgress(phaseId, titles[i], descriptions[i], status, bestScore, completionPercentage, module, phaseIndex));
            previousCompleted = completed;
        }

        return ResponseEntity.ok(list);
    }

    private List<String> getRequiredStepsForPhase(String module, int phase) {
        if ("M1_MATH".equalsIgnoreCase(module) && phase == 1) {
            return Arrays.asList("EXTRACT", "IDENTIFY_RULE", "EXECUTE");
        } else if ("M1_MATH".equalsIgnoreCase(module) && phase == 2) {
            return Arrays.asList("EXTRACT", "IDENTIFY_RULE", "EXECUTE", "SYNTHESIS");
        } else if ("M2_MULTIPLIERS".equalsIgnoreCase(module)) {
            return Arrays.asList("EXTRACT", "IDENTIFY_RULE", "EXECUTE", "SYNTHESIS");
        } else if ("M3_BUREAUCRACY".equalsIgnoreCase(module)) {
            if (phase == 1) {
                return Arrays.asList("EXTRACT", "IDENTIFY_RULE", "EXECUTE");
            } else {
                return Arrays.asList("EXTRACT", "IDENTIFY_RULE", "EXECUTE", "SYNTHESIS");
            }
        } else if ("M4_TRIBUNAL".equalsIgnoreCase(module)) {
            return Arrays.asList("SUBMIT");
        }
        return Collections.emptyList();
    }

    private int calculateCompletionPercentage(StudentProfile student, String module, int phase, java.time.LocalDateTime sessionStartTime) {
        List<String> requiredSteps = getRequiredStepsForPhase(module, phase);
        if (requiredSteps.isEmpty()) {
            return 0;
        }
        List<AttemptLog> attempts = (sessionStartTime != null)
            ? attemptLogRepository.findAttemptsSince(student, module, phase, sessionStartTime)
            : attemptLogRepository.findLatestAttempts(student, module, phase);
            
        java.util.Set<String> successfulSteps = new java.util.HashSet<>();
        for (AttemptLog log : attempts) {
            if (log.isSuccessful()) {
                String step = log.getStep();
                if (step != null) {
                    successfulSteps.add(step.toUpperCase());
                }
            }
        }
        long completedRequiredSteps = requiredSteps.stream()
            .map(String::toUpperCase)
            .filter(successfulSteps::contains)
            .count();
        return (int) Math.round(((double) completedRequiredSteps / requiredSteps.size()) * 100);
    }

    private boolean isPhaseCompleted(StudentProfile student, String module, int phase, java.time.LocalDateTime sessionStartTime) {
        return calculateCompletionPercentage(student, module, phase, sessionStartTime) == 100;
    }

    public static class PhaseProgress {
        private int phaseId;
        private String title;
        private String description;
        private String status; // LOCKED, ACTIVE, COMPLETED
        private int bestScore;
        private int completionPercentage;
        private String module;
        private int phaseIndex;

        public PhaseProgress(int phaseId, String title, String description, String status, int bestScore, int completionPercentage, String module, int phaseIndex) {
            this.phaseId = phaseId;
            this.title = title;
            this.description = description;
            this.status = status;
            this.bestScore = bestScore;
            this.completionPercentage = completionPercentage;
            this.module = module;
            this.phaseIndex = phaseIndex;
        }

        public int getPhaseId() { return phaseId; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public String getStatus() { return status; }
        public int getBestScore() { return bestScore; }
        public int getCompletionPercentage() { return completionPercentage; }
        public String getModule() { return module; }
        public int getPhaseIndex() { return phaseIndex; }
    }
}
