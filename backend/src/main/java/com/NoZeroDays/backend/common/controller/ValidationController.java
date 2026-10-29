package com.NoZeroDays.backend.common.controller;

import com.NoZeroDays.backend.common.dto.LoginRequest;
import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.repository.StudentProfileRepository;
import com.NoZeroDays.backend.common.service.ValidationService;
import com.NoZeroDays.backend.common.model.AttemptLog;
import com.NoZeroDays.backend.common.repository.AttemptLogRepository;
import com.NoZeroDays.backend.common.model.GameSession;
import com.NoZeroDays.backend.common.repository.GameSessionRepository;
import com.NoZeroDays.backend.common.auth.AuthInterceptor;
import com.NoZeroDays.backend.phase1.service.Phase1ValidationService;
import com.NoZeroDays.backend.phase2.service.Phase2ValidationService;
import com.NoZeroDays.backend.phase3.service.Phase3ValidationService;
import com.NoZeroDays.backend.phase4.service.Phase4ValidationService;
import com.NoZeroDays.backend.phase5.service.Phase5ValidationService;
import com.NoZeroDays.backend.phase6.service.Phase6ValidationService;
import com.NoZeroDays.backend.phase7.service.Phase7ValidationService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.List;
import java.util.Arrays;
import java.util.Collections;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ValidationController {

    @Autowired
    private ValidationService validationService;

    @Autowired
    private StudentProfileRepository studentRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private AttemptLogRepository attemptLogRepository;

    @Autowired
    private com.NoZeroDays.backend.common.service.AuthService authService;

    // Phase-specific validation services
    @Autowired private Phase1ValidationService phase1ValidationService;
    @Autowired private Phase2ValidationService phase2ValidationService;
    @Autowired private Phase3ValidationService phase3ValidationService;
    @Autowired private Phase4ValidationService phase4ValidationService;
    @Autowired private Phase5ValidationService phase5ValidationService;
    @Autowired private Phase6ValidationService phase6ValidationService;
    @Autowired private Phase7ValidationService phase7ValidationService;

    // 1. Unified Validation Endpoint — routes to the correct phase service based on module + phase
    @PostMapping("/validation/submit")
    public ResponseEntity<ValidationResponse> validate(@RequestBody ValidationRequest request, HttpServletRequest httpRequest) {
        // The submission must belong to the authenticated student.
        String authedStudentNumber = (String) httpRequest.getAttribute(AuthInterceptor.ATTR_STUDENT_NUMBER);
        if (authedStudentNumber == null || authedStudentNumber.isBlank()) {
            return ResponseEntity.status(401).body(new ValidationResponse(false,
                    "Student authentication required.", false, false));
        }
        if (request.getStudentNumber() == null || !request.getStudentNumber().trim().equalsIgnoreCase(authedStudentNumber)) {
            return ResponseEntity.status(403).body(new ValidationResponse(false,
                    "You can only submit answers for your own account.", false, false));
        }

        String module = request.getModule() != null ? request.getModule() : "M1_MATH";
        int phase     = request.getPhase()  != null ? request.getPhase()  : 1;

        // Ensure phase timer is running and stamp Phase 1 start time on student submission.
        // CRITICAL: MUST execute BEFORE validation services so that if this submission
        // successfully completes the phase, updateProgress()'s clean reset (phaseEnteredAt = null)
        // is NOT immediately overwritten!
        ensurePhaseTimingOnSubmission(request);

        ValidationResponse response;

        if ("M1_MATH".equalsIgnoreCase(module)) {
            response = (phase == 2)
                    ? phase2ValidationService.validate(request)
                    : phase1ValidationService.validate(request);
        } else if ("M2_MULTIPLIERS".equalsIgnoreCase(module)) {
            response = (phase == 2)
                    ? phase4ValidationService.validate(request)
                    : phase3ValidationService.validate(request);
        } else if ("M3_BUREAUCRACY".equalsIgnoreCase(module)) {
            response = (phase == 2)
                    ? phase6ValidationService.validate(request)
                    : phase5ValidationService.validate(request);
        } else if ("M4_TRIBUNAL".equalsIgnoreCase(module)) {
            response = phase7ValidationService.validate(request);
        } else {
            // Fallback: unknown module — return a generic failure
            response = new ValidationResponse(false,
                    "Unknown module: " + module + ". Please check your request payload.",
                    false, false);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Stamping method triggered on student answer submission:
     * - If phaseEnteredAt is null (e.g. after returning to dashboard), starts the phase timer NOW.
     * - If first-ever Phase 1 attempt, stamps session.startTime.
     */
    private void ensurePhaseTimingOnSubmission(ValidationRequest request) {
        if (request.getStudentNumber() == null || request.getStudentNumber().trim().isEmpty()) return;
        String module  = request.getModule()  != null ? request.getModule()  : "M1_MATH";
        Integer phase  = request.getPhase()   != null ? request.getPhase()   : 1;

        int canonicalPhase = 1;
        if ("M1_MATH".equalsIgnoreCase(module)) {
            canonicalPhase = (phase != null) ? phase : 1;
        } else if ("M2_MULTIPLIERS".equalsIgnoreCase(module)) {
            canonicalPhase = (phase != null) ? 2 + phase : 3;
        } else if ("M3_BUREAUCRACY".equalsIgnoreCase(module)) {
            canonicalPhase = (phase != null) ? 4 + phase : 5;
        } else if ("M4_TRIBUNAL".equalsIgnoreCase(module)) {
            canonicalPhase = 7;
        }

        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(request.getStudentNumber().trim());
        if (studentOpt.isEmpty()) return;
        StudentProfile student = studentOpt.get();

        Optional<GameSession> sessionOpt =
                gameSessionRepository.findFirstByStudentProfileAndStatusOrderByIdDesc(student, "ACTIVE");
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        if (sessionOpt.isEmpty()) {
            GameSession newSession = new GameSession(student);
            newSession.setCurrentModule(module);
            newSession.setCurrentPhase(canonicalPhase);
            newSession.setActivePhase(canonicalPhase);
            newSession.setStatus("ACTIVE");
            newSession.setPhaseEnteredAt(now);
            newSession.setLastHeartbeatAt(now);
            if (request.getRoomCode() != null && !request.getRoomCode().isBlank()) {
                newSession.setRoomCode(request.getRoomCode().trim());
            }
            // startTime is only stamped for a student's genuinely first-ever
            // session. Re-audit sessions (student already has attempts) must NOT
            // get a new startTime — that would reset their progress view.
            boolean hasPriorAttempts = attemptLogRepository.countByStudentProfile(student) > 0;
            if (!hasPriorAttempts) {
                newSession.setStartTime(now);
            }
            Long clamped = clampTimer(request.getTimerSeconds());
            if (clamped != null) newSession.setLastRecordedSeconds(clamped);
            gameSessionRepository.save(newSession);
        } else {
            GameSession session = sessionOpt.get();
            boolean dirty = false;
            session.setLastHeartbeatAt(now);
            dirty = true;
            Long clamped = clampTimer(request.getTimerSeconds());
            if (clamped != null) {
                session.setLastRecordedSeconds(clamped);
                dirty = true;
            }
            // startTime only gets stamped once, and only for the first session
            // (a null startTime here means a re-audit or join-created session —
            // leave it null so historical progress stays visible).
            if (session.getStartTime() == null) {
                boolean hasPriorAttempts = attemptLogRepository.countByStudentProfile(student) > 0;
                if (!hasPriorAttempts) {
                    session.setStartTime(now);
                    dirty = true;
                }
            }
            // Update active room presence to the phase being submitted
            boolean isDifferentPhase = session.getActivePhase() == null || !session.getActivePhase().equals(canonicalPhase);
            session.setActivePhase(canonicalPhase);
            if (isDifferentPhase || session.getPhaseEnteredAt() == null) {
                session.setPhaseEnteredAt(now);
                session.setPhaseExitedAt(null);
                session.setAccumulatedPauseSeconds(0L);
                dirty = true;
            }
            // Milestone currentPhase should only advance forward, never rewind
            if (canonicalPhase > session.getCurrentPhase()) {
                session.setCurrentPhase(canonicalPhase);
                dirty = true;
            }
            if (dirty) {
                gameSessionRepository.save(session);
            }
        }
    }

    private static Long clampTimer(Long timerSeconds) {
        if (timerSeconds == null) return null;
        return Math.min(Math.max(timerSeconds, 0L), 7200L);
    }

    // 2. Student Profile Registration & Login
    @PostMapping(value = {"/students/register", "/students/register/"})
    public ResponseEntity<?> registerStudent(@RequestBody LoginRequest request) {
        String studentNumber = request.getEffectiveStudentNumber();
        String fullName = request.getEffectiveName();
        String section = request.getSection() != null ? request.getSection().trim() : "";

        if (studentNumber.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student number cannot be empty."));
        }
        if (fullName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Full name cannot be empty."));
        }

        Optional<StudentProfile> existing = studentRepository.findByStudentNumber(studentNumber);
        StudentProfile profile;
        if (existing.isPresent()) {
            profile = existing.get();
        } else {
            profile = studentRepository.save(new StudentProfile(studentNumber, fullName, section));
        }
        authService.issueSession(profile);
        profile = studentRepository.save(profile);

        // NOTE: Do NOT create a GameSession here.
        // Session creation with a null startTime happens lazily when the student
        // joins a room. The startTime is stamped only on their first Phase 1 submission.
        // Creating a session with startTime=now() at registration would start
        // all timers at the same moment before any student has opened the game.

        return ResponseEntity.ok(profile);
    }

    // 2B. Student Login (Flexible validation for existing accounts)
    @PostMapping(value = {"/students/login", "/students/login/"})
    public ResponseEntity<?> loginStudent(@RequestBody LoginRequest request) {
        String studentNumber = request.getEffectiveStudentNumber();
        String fullName = request.getEffectiveName();

        if (studentNumber.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student number or email cannot be empty."));
        }

        try {
            StudentProfile profile = authService.authenticateStudent(studentNumber, fullName, request.getPassword());
            if (profile.getPasswordHash() == null) {
                // Kill any lingering pre-upgrade session token so it cannot be replayed.
                if (profile.getSessionToken() != null) {
                    profile.setSessionToken(null);
                    studentRepository.save(profile);
                }
                Map<String, Object> resp = new HashMap<>();
                resp.put("requiresUpgrade", true);
                resp.put("id", profile.getId());
                resp.put("studentNumber", profile.getStudentNumber());
                resp.put("fullName", profile.getFullName());
                resp.put("section", profile.getSection());
                resp.put("role", "STUDENT");
                return ResponseEntity.ok(resp);
            }
            authService.issueSession(profile);
            profile = studentRepository.save(profile);
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException e) {
            int status = e.getMessage().contains("not found") ? 404 : 400;
            return ResponseEntity.status(status).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/progress/status")
    public ResponseEntity<?> getProgressStatus(@RequestParam String studentNumber, HttpServletRequest httpRequest) {
        String authedStudentNumber = (String) httpRequest.getAttribute(AuthInterceptor.ATTR_STUDENT_NUMBER);
        if (authedStudentNumber == null || authedStudentNumber.isBlank()
                || !studentNumber.trim().equalsIgnoreCase(authedStudentNumber)) {
            return ResponseEntity.status(403).body("You can only view your own progress.");
        }

        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(studentNumber.trim());
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

        GameSession activeSession = gameSessionRepository
                .findFirstByStudentProfileOrderByIdDesc(student)
                .orElse(null);
        java.time.LocalDateTime sessionStartTime = activeSession != null ? activeSession.getStartTime() : null;
        if (sessionStartTime != null) {
            long currentSessionAttempts = attemptLogRepository.countAttemptsSince(student, sessionStartTime);
            if (currentSessionAttempts == 0) {
                sessionStartTime = null; // fallback to include historical attempts if no active attempts in current session
            }
        }
        int currentPhase = activeSession != null ? activeSession.getCurrentPhase() : 1;
        boolean isSessionCompleted = activeSession != null && "COMPLETED".equalsIgnoreCase(activeSession.getStatus());

        List<AttemptLog> allStudentAttempts = attemptLogRepository.findByStudentProfileOrderByAttemptTimeAsc(student);
        Map<String, List<AttemptLog>> phaseAttemptsMap = new HashMap<>();
        for (AttemptLog log : allStudentAttempts) {
            String key = (log.getModule() != null ? log.getModule().toUpperCase() : "") + "_" + log.getPhase();
            phaseAttemptsMap.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(log);
        }

        for (int i = 0; i < 7; i++) {
            int phaseId = i + 1;
            String module = modules[i];
            int phaseIndex = phases[i];
            
            boolean completed = isPhaseCompleted(student, module, phaseIndex, sessionStartTime);

            // A genuinely completed session implies every phase was finished.
            // (Completion is step-verified before the session can become COMPLETED.)
            if (isSessionCompleted) {
                completed = true;
            }

            // All phases are unlocked: status derives from step-based completion
            // and real activity, never from sequential gating.
            boolean hasAttempts = !phaseAttemptsMap
                    .getOrDefault(module.toUpperCase() + "_" + phaseIndex, Collections.emptyList())
                    .isEmpty();
            String status;
            if (completed) {
                status = "COMPLETED";
            } else if (hasAttempts) {
                status = "ACTIVE";
            } else {
                status = "NOT_ATTEMPTED";
            }
            
            int completionPercentage = completed ? 100 : calculateCompletionPercentage(student, module, phaseIndex, sessionStartTime);

            // Calculate best attempt score and attempts
            int bestScore = 0;
            int attemptsCount = 0;
            int failedAttempts = 0;
            if (completed) {
                List<AttemptLog> attempts = (sessionStartTime != null)
                    ? attemptLogRepository.findAttemptsSince(student, module, phaseIndex, sessionStartTime)
                    : attemptLogRepository.findLatestAttempts(student, module, phaseIndex);
                int failures = 0;
                int drillResets = 0;
                for (AttemptLog log : attempts) {
                    if ("system=DRILL_RESET".equals(log.getUserInputData())) {
                        drillResets++;
                    } else if (!log.isSuccessful() && !"RE_AUDIT".equalsIgnoreCase(log.getAttemptType())) {
                        // failedAttempts tracks the first-attempt stream only, so it
                        // measures the same set as attemptsCount (1 run + drill resets)
                        failures++;
                    }
                }
                attemptsCount = attempts.isEmpty() ? 0 : (1 + drillResets);
                failedAttempts = failures;
                bestScore = Math.max(100 - (failures * 10), 50);
            }

            // Calculate Re-Audit metrics
            String phaseKey = module.toUpperCase() + "_" + phaseIndex;
            List<AttemptLog> phaseAttempts = phaseAttemptsMap.getOrDefault(phaseKey, Collections.emptyList());
            List<String> requiredSteps = getRequiredStepsForPhase(module, phaseIndex);

            List<AttemptLog> firstAttempts = new java.util.ArrayList<>();
            List<AttemptLog> reAuditAttempts = new java.util.ArrayList<>();
            java.util.Set<String> stepsCompletedSoFar = new java.util.HashSet<>();
            boolean firstCompletedFound = false;

            for (AttemptLog log : phaseAttempts) {
                if ("RE_AUDIT".equalsIgnoreCase(log.getAttemptType())) {
                    reAuditAttempts.add(log);
                } else if (log.getAttemptType() != null && !log.getAttemptType().isBlank()) {
                    firstAttempts.add(log);
                } else {
                    if (firstCompletedFound) {
                        reAuditAttempts.add(log);
                    } else {
                        firstAttempts.add(log);
                        if (log.isSuccessful() && !log.isDrillReset() && log.getStep() != null) {
                            stepsCompletedSoFar.add(log.getStep().toUpperCase());
                            if (!requiredSteps.isEmpty() && requiredSteps.stream().allMatch(stepsCompletedSoFar::contains)) {
                                firstCompletedFound = true;
                            }
                        }
                    }
                }
            }

            boolean hasReAudited = !reAuditAttempts.isEmpty();
            boolean isReAuditCompleted = hasReAudited && isPhaseCompleteBySteps(reAuditAttempts, module, phaseIndex);

            int reAuditFailedCount = 0;
            int reAuditDrillResets = 0;
            for (AttemptLog log : reAuditAttempts) {
                if ("system=DRILL_RESET".equals(log.getUserInputData())) {
                    reAuditDrillResets++;
                } else if (!log.isSuccessful()) {
                    reAuditFailedCount++;
                }
            }
            String finalStepName = !requiredSteps.isEmpty() ? requiredSteps.get(requiredSteps.size() - 1) : null;
            long completedReAudits = reAuditAttempts.stream()
                    .filter(l -> l.isSuccessful() && !l.isDrillReset() && finalStepName != null && finalStepName.equalsIgnoreCase(l.getStep()))
                    .count();
            boolean inProgress = false;
            if (!reAuditAttempts.isEmpty()) {
                AttemptLog lastLog = reAuditAttempts.get(reAuditAttempts.size() - 1);
                if (!lastLog.isDrillReset()) {
                    boolean lastIsFinalSuccess = lastLog.isSuccessful() && finalStepName != null && finalStepName.equalsIgnoreCase(lastLog.getStep());
                    if (!lastIsFinalSuccess) {
                        inProgress = true;
                    }
                }
            }
            int reAuditAttemptsCount = (int) completedReAudits + reAuditDrillResets + (inProgress ? 1 : 0);
            if (hasReAudited && reAuditAttemptsCount == 0) {
                reAuditAttemptsCount = 1;
            }
            int reAuditScore = isReAuditCompleted ? Math.max(100 - (reAuditFailedCount * 10), 50) : 0;

            list.add(new PhaseProgress(phaseId, titles[i], descriptions[i], status, bestScore, completionPercentage, module, phaseIndex, attemptsCount, failedAttempts, hasReAudited, isReAuditCompleted, reAuditAttemptsCount, reAuditScore));
        }

        return ResponseEntity.ok(list);
    }

    private List<String> getRequiredStepsForPhase(String module, int phase) {
        if ("M1_MATH".equalsIgnoreCase(module) && phase == 1) {
            return Arrays.asList("EXTRACT", "IDENTIFY_RULE", "EXECUTE");
        } else if ("M1_MATH".equalsIgnoreCase(module) && phase == 2) {
            return Arrays.asList("EXTRACT", "IDENTIFY_RULE", "EXECUTE", "COMPUTE_GROSS", "NET_PAY_FORMULA", "SYNTHESIS");
        } else if ("M2_MULTIPLIERS".equalsIgnoreCase(module)) {
            if (phase == 1) {
                return Arrays.asList("EXTRACT", "FILTER_LUNCH", "ESTABLISH_PREMIUM", "ESTABLISH_FORMULA", "EXECUTE", "COMPUTE_GROSS", "NET_PAY_FORMULA", "SYNTHESIS");
            } else {
                return Arrays.asList("EXTRACT", "ESTABLISH_PREMIUM", "ESTABLISH_FORMULA", "EXECUTE", "COMPUTE_GROSS", "NET_PAY_FORMULA", "SYNTHESIS");
            }
        } else if ("M3_BUREAUCRACY".equalsIgnoreCase(module)) {
            if (phase == 1) {
                return Arrays.asList("EXTRACT", "PAGIBIG_DEDUCTION", "BASIC_SALARY", "IDENTIFY_RULE", "SYNTHESIS");
            } else {
                return Arrays.asList("EXTRACT", "PHILHEALTH_EE", "TAX_BRACKET", "WITHHOLDING_TAX", "SYNTHESIS");
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
            if (log.isSuccessful() && !log.isDrillReset()) {
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

    private boolean isPhaseCompleteBySteps(List<AttemptLog> attempts, String module, int phase) {
        List<String> requiredSteps = getRequiredStepsForPhase(module, phase);
        if (requiredSteps.isEmpty()) return false;

        java.util.Set<String> successfulSteps = attempts.stream()
                .filter(AttemptLog::isSuccessful)
                .filter(a -> !a.isDrillReset())
                .map(a -> a.getStep() != null ? a.getStep().toUpperCase() : "")
                .collect(java.util.stream.Collectors.toSet());

        return requiredSteps.stream().allMatch(step -> successfulSteps.contains(step.toUpperCase()));
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
        private int attemptsCount;
        private int failedAttempts;
        private boolean hasReAudited;
        private boolean reAuditCompleted;
        private int reAuditAttemptsCount;
        private int reAuditScore;

        public PhaseProgress(int phaseId, String title, String description, String status, int bestScore, int completionPercentage, String module, int phaseIndex) {
            this(phaseId, title, description, status, bestScore, completionPercentage, module, phaseIndex, 0, 0, false, false, 0, 0);
        }

        public PhaseProgress(int phaseId, String title, String description, String status, int bestScore, int completionPercentage, String module, int phaseIndex, int attemptsCount, int failedAttempts) {
            this(phaseId, title, description, status, bestScore, completionPercentage, module, phaseIndex, attemptsCount, failedAttempts, false, false, 0, 0);
        }

        public PhaseProgress(int phaseId, String title, String description, String status, int bestScore, int completionPercentage, String module, int phaseIndex, int attemptsCount, int failedAttempts, boolean hasReAudited, boolean reAuditCompleted, int reAuditAttemptsCount, int reAuditScore) {
            this.phaseId = phaseId;
            this.title = title;
            this.description = description;
            this.status = status;
            this.bestScore = bestScore;
            this.completionPercentage = completionPercentage;
            this.module = module;
            this.phaseIndex = phaseIndex;
            this.attemptsCount = attemptsCount;
            this.failedAttempts = failedAttempts;
            this.hasReAudited = hasReAudited;
            this.reAuditCompleted = reAuditCompleted;
            this.reAuditAttemptsCount = reAuditAttemptsCount;
            this.reAuditScore = reAuditScore;
        }

        public int getPhaseId() { return phaseId; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public String getStatus() { return status; }
        public int getBestScore() { return bestScore; }
        public int getCompletionPercentage() { return completionPercentage; }
        public String getModule() { return module; }
        public int getPhaseIndex() { return phaseIndex; }
        public int getAttemptsCount() { return attemptsCount; }
        public int getFailedAttempts() { return failedAttempts; }
        public boolean isHasReAudited() { return hasReAudited; }
        public boolean getHasReAudited() { return hasReAudited; }
        public boolean isReAuditCompleted() { return reAuditCompleted; }
        public boolean getReAuditCompleted() { return reAuditCompleted; }
        public int getReAuditAttemptsCount() { return reAuditAttemptsCount; }
        public int getReAuditScore() { return reAuditScore; }
    }
}
