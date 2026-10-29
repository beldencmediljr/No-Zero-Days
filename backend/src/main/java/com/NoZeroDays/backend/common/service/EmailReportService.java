package com.NoZeroDays.backend.common.service;

import com.NoZeroDays.backend.common.model.AttemptLog;
import com.NoZeroDays.backend.common.model.GameSession;
import com.NoZeroDays.backend.common.model.Room;
import com.NoZeroDays.backend.common.model.RoomParticipant;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.repository.AttemptLogRepository;
import com.NoZeroDays.backend.common.repository.GameSessionRepository;
import com.NoZeroDays.backend.common.repository.RoomParticipantRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class EmailReportService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private RoomParticipantRepository roomParticipantRepository;

    @Autowired
    private AttemptLogRepository attemptLogRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Value("${spring.mail.username:}")
    private String mailSenderUsername;

    @Value("${spring.mail.password:}")
    private String mailSenderPassword;

    @Value("${google.oauth2.client-id:}")
    private String googleClientId;

    @Value("${google.oauth2.client-secret:}")
    private String googleClientSecret;

    @Value("${google.oauth2.refresh-token:}")
    private String googleRefreshToken;

    @Value("${google.oauth2.sender-email:}")
    private String googleSenderEmail;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private static final String[] MODULES = {
        "M1_MATH", "M1_MATH", "M2_MULTIPLIERS", "M2_MULTIPLIERS",
        "M3_BUREAUCRACY", "M3_BUREAUCRACY", "M4_TRIBUNAL"
    };
    private static final int[] PHASES = {1, 2, 1, 2, 1, 2, 1};
    private static final String[] PHASE_NAMES = {
        "Phase 1: Basic Gross Pay",
        "Phase 2: Tardiness Deductions",
        "Phase 3: Overtime Premiums",
        "Phase 4: Regular Holiday Pay",
        "Phase 5: SSS Deductions",
        "Phase 6: PhilHealth Premiums",
        "Phase 7: Net Payroll Boardroom"
    };

    /**
     * Data structure holding analyzed metrics for a single student.
     */
    public static class StudentMetrics {
        public StudentProfile profile;
        public boolean isCompletedAll;
        public int completedPhasesCount;
        public int currentPhase;
        public String currentPhaseTitle;
        public long totalTimeSeconds;
        public long avgTimeSeconds;
        public int totalAttempts;
        public List<PhaseMetric> phaseMetrics = new ArrayList<>();

        // First Attempt Rollup
        public int firstCompletedCount;
        public int firstTotalAttempts;
        public long firstTotalSeconds;
        public long firstAvgSeconds;

        // Re-Audit Rollup
        public int reAuditCompletedCount;
        public int reAuditTotalAttempts;
        public long reAuditTotalSeconds;
        public long reAuditAvgSeconds;
        public boolean hasReAudited;
    }

    public static class PhaseMetric {
        public int phaseId;
        public String title;
        public int tries;
        public long seconds;
        public boolean isCompleted;

        // First Attempt Breakdown
        public int firstTries;
        public long firstSeconds;
        public long firstWinningSeconds;
        public boolean isFirstCompleted;

        // Re-Audit Breakdown
        public int reAuditTries;
        public long reAuditSeconds;
        public boolean isReAuditCompleted;
        public boolean hasReAudited;
    }

    /**
     * Synchronously generates and dispatches the comprehensive classroom email report.
     * Throws an exception on failure so caller can report exact error to user.
     */
    public void sendClassroomReportSync(Room room, StudentProfile triggeringStudent) throws Exception {
        if (room == null) {
            throw new IllegalArgumentException("Room cannot be null.");
        }
        String teacherEmail = room.getTeacherEmail();
        if (teacherEmail == null || teacherEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("No teacher email configured for room " + room.getRoomCode());
        }

        // Validate credentials: check Google OAuth 2.0 or SMTP credentials
        boolean hasOAuth = googleRefreshToken != null && !googleRefreshToken.trim().isEmpty() &&
                           googleClientId != null && !googleClientId.trim().isEmpty() &&
                           googleClientSecret != null && !googleClientSecret.trim().isEmpty();
        boolean hasSmtp = mailSenderUsername != null && !mailSenderUsername.trim().isEmpty() &&
                          mailSenderPassword != null && !mailSenderPassword.trim().isEmpty();

        if (!hasOAuth && !hasSmtp) {
            throw new IllegalStateException(
                "Email credentials are not configured in backend/src/main/resources/application.properties. " +
                "Please configure Google OAuth2 (google.oauth2.refresh-token) or SMTP credentials."
            );
        }

        List<RoomParticipant> participants = roomParticipantRepository.findByRoomOrderByJoinedAtAsc(room);
        List<StudentMetrics> allMetrics = new ArrayList<>();
        List<String> skippedStudents = new ArrayList<>();

        for (RoomParticipant p : participants) {
            if (p == null || p.getStudentProfile() == null) continue;
            try {
                StudentMetrics sm = computeStudentMetrics(room, p.getStudentProfile());
                allMetrics.add(sm);
            } catch (Exception e) {
                System.err.println("[EmailReportService] Failed to compute metrics for "
                        + p.getStudentProfile().getStudentNumber() + ": " + e.getMessage());
                skippedStudents.add(p.getStudentProfile().getFullName()
                        + " (" + p.getStudentProfile().getStudentNumber() + ")");
            }
        }

        // Sort: completed students first (with triggering student at the very top), then active students
        allMetrics.sort((a, b) -> {
            if (triggeringStudent != null) {
                if (a.profile.getStudentNumber().equals(triggeringStudent.getStudentNumber())) return -1;
                if (b.profile.getStudentNumber().equals(triggeringStudent.getStudentNumber())) return 1;
            }
            if (a.isCompletedAll && !b.isCompletedAll) return -1;
            if (!a.isCompletedAll && b.isCompletedAll) return 1;
            return Integer.compare(b.completedPhasesCount, a.completedPhasesCount);
        });

        String html = buildClassroomHtml(room, allMetrics, triggeringStudent, skippedStudents);

        Session mailSession = mailSender != null
                ? mailSender.createMimeMessage().getSession()
                : Session.getInstance(new Properties());
        MimeMessage message = new MimeMessage(mailSession);
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        String senderAddress = (hasOAuth && googleSenderEmail != null && !googleSenderEmail.trim().isEmpty())
                ? googleSenderEmail.trim()
                : (mailSenderUsername != null && !mailSenderUsername.trim().isEmpty() ? mailSenderUsername.trim() : "no-reply@nozerodays.edu");

        helper.setFrom(senderAddress, "No Zero Days Payroll Simulator");
        helper.setTo(teacherEmail.trim());

        String subject = String.format("📊 Classroom Audit Report: Room %s (%d Students) — %s",
                room.getRoomCode(),
                participants.size(),
                DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm").format(LocalDateTime.now())
        );
        helper.setSubject(subject);
        helper.setText(html, true);

        // Attach official Excel report workbook (.xlsx)
        try {
            byte[] excelBytes = generateClassroomReportExcel(room, allMetrics, skippedStudents);
            helper.addAttachment(
                "Classroom_Audit_Report_" + room.getRoomCode() + ".xlsx",
                new ByteArrayResource(excelBytes),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
        } catch (Exception ex) {
            System.err.println("[EmailService] Warning: Could not generate/attach Excel workbook: " + ex.getMessage());
        }

        message.saveChanges();

        if (hasOAuth) {
            String accessToken = fetchGoogleAccessToken();
            sendViaGmailApi(message, accessToken);
            System.out.println("[EmailService] Successfully sent classroom report with Excel attachment via Gmail OAuth2 to " + teacherEmail);
        } else {
            if (mailSender == null) {
                throw new IllegalStateException("JavaMailSender bean is not available in Spring context.");
            }
            mailSender.send(message);
            System.out.println("[EmailService] Successfully sent classroom report with Excel attachment via SMTP to " + teacherEmail);
        }
    }

    /**
     * Asynchronously generates and dispatches the comprehensive classroom email report.
     */
    @Async
    public void sendClassroomReport(Room room, StudentProfile triggeringStudent) {
        try {
            sendClassroomReportSync(room, triggeringStudent);
        } catch (Exception ex) {
            System.err.println("[EmailService] Error in background email report dispatch: " + ex.getMessage());
        }
    }

    /**
     * Sends the teacher password reset email. Uses the same dispatch path as
     * classroom reports (Gmail OAuth2 when configured, SMTP otherwise).
     */
    public void sendPasswordResetEmail(String toEmail, String resetToken) throws Exception {
        String baseUrl = (frontendUrl != null && !frontendUrl.trim().isEmpty())
                ? frontendUrl.trim().replaceAll("/+$", "") : "http://localhost:3000";
        String resetLink = baseUrl + "/?reset=" + URLEncoder.encode(resetToken, StandardCharsets.UTF_8);

        boolean hasOAuth = googleRefreshToken != null && !googleRefreshToken.trim().isEmpty() &&
                           googleClientId != null && !googleClientId.trim().isEmpty() &&
                           googleClientSecret != null && !googleClientSecret.trim().isEmpty();
        boolean hasSmtp = mailSenderUsername != null && !mailSenderUsername.trim().isEmpty() &&
                          mailSenderPassword != null && !mailSenderPassword.trim().isEmpty();

        if (!hasOAuth && !hasSmtp) {
            throw new IllegalStateException(
                "Email credentials are not configured in backend/src/main/resources/application.properties. " +
                "Please configure Google OAuth2 (google.oauth2.refresh-token) or SMTP credentials."
            );
        }

        Session mailSession = mailSender != null
                ? mailSender.createMimeMessage().getSession()
                : Session.getInstance(new Properties());
        MimeMessage message = new MimeMessage(mailSession);
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        String senderAddress = (hasOAuth && googleSenderEmail != null && !googleSenderEmail.trim().isEmpty())
                ? googleSenderEmail.trim()
                : (mailSenderUsername != null && !mailSenderUsername.trim().isEmpty() ? mailSenderUsername.trim() : "no-reply@nozerodays.edu");

        helper.setFrom(senderAddress, "No Zero Days Payroll Simulator");
        helper.setTo(toEmail.trim());
        helper.setSubject("No Zero Days — Password Reset");
        helper.setText(
            "<div style='font-family:Arial,Helvetica,sans-serif;color:#1f2937;'>"
            + "<h2 style='color:#1d4ed8;'>Password Reset</h2>"
            + "<p>A password reset was requested for your No Zero Days teacher account.</p>"
            + "<p>Click the link below to choose a new password. The link expires in 15 minutes.</p>"
            + "<p><a href='" + resetLink + "' style='display:inline-block;background:#1d4ed8;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;'>Reset my password</a></p>"
            + "<p style='color:#6b7280;font-size:12px;'>If you did not request this, you can ignore this email — your password has not been changed.</p>"
            + "</div>", true);
        message.saveChanges();

        if (hasOAuth) {
            String accessToken = fetchGoogleAccessToken();
            sendViaGmailApi(message, accessToken);
        } else {
            if (mailSender == null) {
                throw new IllegalStateException("JavaMailSender bean is not available in Spring context.");
            }
            mailSender.send(message);
        }
    }

    /**
     * Generates HTML report content directly for browser preview or testing.
     */
    public String generateClassroomReportHtml(Room room) {
        if (room == null) return "<p>Room not found.</p>";
        List<RoomParticipant> participants = roomParticipantRepository.findByRoomOrderByJoinedAtAsc(room);
        List<StudentMetrics> allMetrics = new ArrayList<>();
        List<String> skippedStudents = new ArrayList<>();
        for (RoomParticipant p : participants) {
            if (p == null || p.getStudentProfile() == null) continue;
            try {
                allMetrics.add(computeStudentMetrics(room, p.getStudentProfile()));
            } catch (Exception e) {
                System.err.println("[EmailReportService] Failed to compute metrics for html: " + e.getMessage());
                skippedStudents.add(p.getStudentProfile().getFullName()
                        + " (" + p.getStudentProfile().getStudentNumber() + ")");
            }
        }
        return buildClassroomHtml(room, allMetrics, null, skippedStudents);
    }

    private StudentMetrics computeStudentMetrics(Room room, StudentProfile student) {
        if (student == null) {
            return new StudentMetrics();
        }
        StudentMetrics sm = new StudentMetrics();
        sm.profile = student;

        GameSession session = gameSessionRepository
                .findFirstByStudentProfileAndRoomCodeOrderByIdDesc(student, room.getRoomCode())
                .orElse(null);
        int currentPhaseIndex = session != null ? session.getCurrentPhase() : 1;
        boolean isSessionCompleted = session != null && "COMPLETED".equalsIgnoreCase(session.getStatus());

        List<AttemptLog> allAttempts = attemptLogRepository
                .findByStudentProfileAndRoomCodeScopeOrderByAttemptTimeAsc(student, room.getRoomCode());
        Map<String, List<AttemptLog>> phaseAttemptsMap = new HashMap<>();
        for (AttemptLog log : allAttempts) {
            String key = (log.getModule() != null ? log.getModule().toUpperCase() : "") + "_" + log.getPhase();
            phaseAttemptsMap.computeIfAbsent(key, k -> new ArrayList<>()).add(log);
        }

        LocalDateTime previousCompletedTime = (session != null && session.getStartTime() != null)
                ? session.getStartTime()
                : (room.getStartedAt() != null ? room.getStartedAt() : student.getCreatedAt());

        long totalSeconds = 0;
        int totalAttempts = 0;
        int completedCount = 0;

        int firstCompletedCount = 0;
        int firstTotalAttempts = 0;
        long firstTotalSeconds = 0;

        int reAuditCompletedCount = 0;
        int reAuditTotalAttempts = 0;
        long reAuditTotalSeconds = 0;
        boolean hasReAuditedAny = false;

        for (int i = 0; i < 7; i++) {
            int phaseId = i + 1;
            String module = MODULES[i];
            int phaseIndex = PHASES[i];
            String key = module + "_" + phaseIndex;
            List<AttemptLog> phaseAttempts = phaseAttemptsMap.getOrDefault(key, Collections.emptyList());
            List<String> requiredSteps = getRequiredStepsForPhase(module, phaseIndex);

            // Partition attempts into First Attempt vs Re-Audit
            List<AttemptLog> firstAttempts = new ArrayList<>();
            List<AttemptLog> reAuditAttempts = new ArrayList<>();
            Set<String> stepsCompletedSoFar = new HashSet<>();
            boolean firstCompletedFound = false;

            for (AttemptLog log : phaseAttempts) {
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

            // 1. First Attempt Metrics
            int firstFailedCount = 0;
            int firstDrillResets = 0;
            LocalDateTime firstAttemptTime = firstAttempts.isEmpty() ? null : firstAttempts.get(0).getAttemptTime();
            LocalDateTime firstLastSuccess = null;
            LocalDateTime firstLastAttempt = null;

            for (AttemptLog log : firstAttempts) {
                if ("system=DRILL_RESET".equals(log.getUserInputData())) {
                    firstDrillResets++;
                } else if (!log.isSuccessful()) {
                    firstFailedCount++;
                } else {
                    firstLastSuccess = log.getAttemptTime();
                }
                firstLastAttempt = log.getAttemptTime();
            }
            int firstTries = firstAttempts.isEmpty() ? 0 : (1 + firstDrillResets);
            firstTotalAttempts += firstTries;

            boolean isFirstDone = isSessionCompleted || firstCompletedFound || isPhaseCompleteBySteps(firstAttempts, module, phaseIndex);
            long firstSec = 0;

            if (isFirstDone) {
                firstCompletedCount++;

                Long recordedSeconds = null;
                for (int k = firstAttempts.size() - 1; k >= 0; k--) {
                    AttemptLog log = firstAttempts.get(k);
                    if (log.isSuccessful()) {
                        Long s = extractRecordedSeconds(log);
                        if (s != null && s > 0) {
                            recordedSeconds = s;
                            break;
                        }
                    }
                }

                if (recordedSeconds != null && recordedSeconds > 0) {
                    firstSec = recordedSeconds;
                } else if (firstAttemptTime != null) {
                    LocalDateTime startRef = (phaseId == 1 && session != null && session.getStartTime() != null)
                            ? session.getStartTime()
                            : firstAttemptTime;
                    LocalDateTime endRef = firstLastSuccess != null ? firstLastSuccess : (firstLastAttempt != null ? firstLastAttempt : firstAttemptTime);
                    long diff = ChronoUnit.SECONDS.between(startRef, endRef);
                    long paused = (session != null && phaseId == currentPhaseIndex) ? session.getAccumulatedPauseSeconds() : 0L;
                    firstSec = Math.max(diff - paused, 0L);
                } else {
                    firstSec = 0L;
                }
            } else if (phaseId == currentPhaseIndex && session != null && session.getPhaseEnteredAt() != null && session.getPhaseExitedAt() == null) {
                LocalDateTime activeStart = session.getPhaseEnteredAt();
                LocalDateTime activeEnd;
                LocalDateTime now = LocalDateTime.now();
                if (session.getLastHeartbeatAt() != null) {
                    long heartbeatAge = ChronoUnit.SECONDS.between(session.getLastHeartbeatAt(), now);
                    activeEnd = (heartbeatAge > 30) ? session.getLastHeartbeatAt() : now;
                } else {
                    long ageSinceEnter = ChronoUnit.SECONDS.between(activeStart, now);
                    activeEnd = (ageSinceEnter > 45) ? activeStart.plusSeconds(30) : now;
                }
                long diff = ChronoUnit.SECONDS.between(activeStart, activeEnd);
                long paused = session.getAccumulatedPauseSeconds();
                firstSec = Math.min(Math.max(diff - paused, 0L), 7200L);
            } else if (!firstAttempts.isEmpty() && firstAttemptTime != null) {
                LocalDateTime endRef = firstLastAttempt != null ? firstLastAttempt : firstAttemptTime;
                long diff = ChronoUnit.SECONDS.between(firstAttemptTime, endRef);
                firstSec = Math.max(diff, 0L);
            }

            // Option 2: First Winning Run Speed vs Total Effort across attempts
            long firstWinningSeconds = firstSec;
            long firstTotalEffortSeconds = 0;

            if (firstTries <= 1) {
                firstTotalEffortSeconds = firstSec;
            } else {
                List<List<AttemptLog>> runs = new ArrayList<>();
                List<AttemptLog> currentRun = new ArrayList<>();
                for (AttemptLog log : firstAttempts) {
                    if (log.isDrillReset()) {
                        runs.add(currentRun);
                        currentRun = new ArrayList<>();
                    } else {
                        currentRun.add(log);
                    }
                }
                runs.add(currentRun);

                long failedRunsSum = 0;
                for (int r = 0; r < runs.size() - 1; r++) {
                    List<AttemptLog> rLogs = runs.get(r);
                    long runMax = 0;
                    for (AttemptLog log : rLogs) {
                        Long s = extractRecordedSeconds(log);
                        if (s != null && s > runMax) {
                            runMax = s;
                        }
                    }
                    if (runMax <= 0 && !rLogs.isEmpty()) {
                        LocalDateTime rStart = rLogs.get(0).getAttemptTime();
                        LocalDateTime rEnd = rLogs.get(rLogs.size() - 1).getAttemptTime();
                        if (rStart != null && rEnd != null) {
                            runMax = Math.max(ChronoUnit.SECONDS.between(rStart, rEnd), 0L);
                        }
                    }
                    failedRunsSum += Math.min(Math.max(runMax, 0L), 3600L);
                }
                firstTotalEffortSeconds = failedRunsSum + firstSec;
            }
            firstTotalEffortSeconds = Math.max(firstTotalEffortSeconds, firstSec);

            firstTotalSeconds += firstTotalEffortSeconds;

            // 2. Re-Audit Metrics
            int reAuditFailedCount = 0;
            int reAuditDrillResets = 0;
            LocalDateTime reAuditStart = reAuditAttempts.isEmpty() ? null : reAuditAttempts.get(0).getAttemptTime();
            LocalDateTime reAuditLastSuccess = null;
            LocalDateTime reAuditLastAttempt = null;

            for (AttemptLog log : reAuditAttempts) {
                if ("system=DRILL_RESET".equals(log.getUserInputData())) {
                    reAuditDrillResets++;
                } else if (!log.isSuccessful()) {
                    reAuditFailedCount++;
                } else {
                    reAuditLastSuccess = log.getAttemptTime();
                }
                reAuditLastAttempt = log.getAttemptTime();
            }

            String finalStepName = !requiredSteps.isEmpty() ? requiredSteps.get(requiredSteps.size() - 1) : null;
            int reAuditTries = 0;
            if (!reAuditAttempts.isEmpty()) {
                long completedReAudits = reAuditAttempts.stream()
                        .filter(l -> l.isSuccessful() && !l.isDrillReset() && finalStepName != null && finalStepName.equalsIgnoreCase(l.getStep()))
                        .count();
                boolean inProgress = false;
                AttemptLog lastLog = reAuditAttempts.get(reAuditAttempts.size() - 1);
                if (!lastLog.isDrillReset()) {
                    boolean lastIsFinalSuccess = lastLog.isSuccessful() && finalStepName != null && finalStepName.equalsIgnoreCase(lastLog.getStep());
                    if (!lastIsFinalSuccess) {
                        inProgress = true;
                    }
                }
                reAuditTries = (int) completedReAudits + reAuditDrillResets + (inProgress ? 1 : 0);
                if (reAuditTries == 0) {
                    reAuditTries = 1;
                }
            }

            boolean hasReAudited = !reAuditAttempts.isEmpty();
            boolean isReAuditDone = hasReAudited && isPhaseCompleteBySteps(reAuditAttempts, module, phaseIndex);
            long reAuditSec = 0;

            if (hasReAudited) {
                hasReAuditedAny = true;
                reAuditTotalAttempts += reAuditTries;

                // Best (least) recorded completion time across replays, matching
                // the teacher dashboard's calculation.
                Long bestReAuditSeconds = null;
                Long latestRecordedSeconds = null;
                for (AttemptLog log : reAuditAttempts) {
                    if (log.isSuccessful() && !log.isDrillReset()) {
                        Long s = null;
                        if (log.getElapsedSeconds() != null && log.getElapsedSeconds() > 0) {
                            s = log.getElapsedSeconds();
                        } else if (log.getUserInputData() != null && log.getUserInputData().contains("timerSeconds=")) {
                            try {
                                java.util.regex.Matcher m = java.util.regex.Pattern.compile("timerSeconds=(\\d+)").matcher(log.getUserInputData());
                                if (m.find()) {
                                    long val = Long.parseLong(m.group(1));
                                    if (val > 0) s = val;
                                }
                            } catch (Exception ignored) {}
                        }
                        if (s != null && s > 0) {
                            latestRecordedSeconds = s;
                            if (finalStepName != null && finalStepName.equalsIgnoreCase(log.getStep())) {
                                if (bestReAuditSeconds == null || s < bestReAuditSeconds) {
                                    bestReAuditSeconds = s;
                                }
                            }
                        }
                    }
                }

                Long chosenSeconds = (bestReAuditSeconds != null) ? bestReAuditSeconds : latestRecordedSeconds;
                if (chosenSeconds != null && chosenSeconds > 0) {
                    reAuditSec = chosenSeconds;
                } else if (reAuditStart != null) {
                    LocalDateTime endRef = reAuditLastSuccess != null ? reAuditLastSuccess : (reAuditLastAttempt != null ? reAuditLastAttempt : reAuditStart);
                    reAuditSec = Math.max(ChronoUnit.SECONDS.between(reAuditStart, endRef), 0L);
                }
                reAuditTotalSeconds += reAuditSec;
                if (isReAuditDone) {
                    reAuditCompletedCount++;
                }
            }

            // Combined
            int combinedTries = firstTries + reAuditTries;
            long combinedSec = firstSec + reAuditSec;
            boolean isCombinedDone = isFirstDone;

            if (isCombinedDone) {
                completedCount++;
            }
            totalSeconds += combinedSec;
            totalAttempts += combinedTries;

            PhaseMetric pm = new PhaseMetric();
            pm.phaseId = phaseId;
            pm.title = PHASE_NAMES[i];
            pm.tries = combinedTries;
            pm.seconds = combinedSec;
            pm.isCompleted = isCombinedDone;

            pm.firstTries = firstTries;
            pm.firstSeconds = firstTotalEffortSeconds;
            pm.firstWinningSeconds = firstWinningSeconds;
            pm.isFirstCompleted = isFirstDone;

            pm.reAuditTries = reAuditTries;
            pm.reAuditSeconds = reAuditSec;
            pm.isReAuditCompleted = isReAuditDone;
            pm.hasReAudited = hasReAudited;

            sm.phaseMetrics.add(pm);
        }

        sm.completedPhasesCount = completedCount;
        sm.isCompletedAll = (completedCount >= 7) || isSessionCompleted;
        sm.totalTimeSeconds = totalSeconds;
        sm.avgTimeSeconds = (completedCount > 0) ? (totalSeconds / completedCount) : totalSeconds;
        sm.totalAttempts = totalAttempts;

        int safePhaseIndex = (currentPhaseIndex >= 1 && currentPhaseIndex <= 7) ? currentPhaseIndex : (currentPhaseIndex > 7 ? 7 : 1);
        String currentPhaseTitle = (completedCount >= 7 || isSessionCompleted || currentPhaseIndex > 7)
                ? "Completed All Phases"
                : PHASE_NAMES[Math.max(0, Math.min(6, safePhaseIndex - 1))];
        sm.currentPhase = safePhaseIndex;
        sm.currentPhaseTitle = currentPhaseTitle;

        sm.firstCompletedCount = firstCompletedCount;
        sm.firstTotalAttempts = firstTotalAttempts;
        sm.firstTotalSeconds = firstTotalSeconds;
        sm.firstAvgSeconds = (firstCompletedCount > 0) ? (firstTotalSeconds / firstCompletedCount) : firstTotalSeconds;

        sm.reAuditCompletedCount = reAuditCompletedCount;
        sm.reAuditTotalAttempts = reAuditTotalAttempts;
        sm.reAuditTotalSeconds = reAuditTotalSeconds;
        sm.reAuditAvgSeconds = (reAuditCompletedCount > 0) ? (reAuditTotalSeconds / reAuditCompletedCount) : reAuditTotalSeconds;
        sm.hasReAudited = hasReAuditedAny;

        return sm;
    }

    private boolean isPhaseCompleteBySteps(List<AttemptLog> attempts, String module, int phase) {
        List<String> requiredSteps = getRequiredStepsForPhase(module, phase);
        if (requiredSteps.isEmpty()) return false;
        Set<String> successfulSteps = new HashSet<>();
        for (AttemptLog a : attempts) {
            if (a.isSuccessful() && !a.isDrillReset() && a.getStep() != null) {
                successfulSteps.add(a.getStep().toUpperCase());
            }
        }
        return requiredSteps.stream().allMatch(successfulSteps::contains);
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
            return Collections.singletonList("SUBMIT");
        }
        return Collections.emptyList();
    }

    private String buildClassroomHtml(Room room, List<StudentMetrics> list, StudentProfile triggeringStudent, List<String> skippedStudents) {
        StringBuilder sb = new StringBuilder();
        int totalEnrolled = list.size();
        long completedCount = list.stream().filter(m -> m.isCompletedAll).count();

        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body style='margin:0;padding:20px;background:#090d16;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;'>");
        sb.append("<div style='max-width:750px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:30px;box-shadow:0 10px 30px rgba(0,0,0,0.5);'>");

        // Header
        sb.append("<div style='border-bottom:2px solid #3b82f6;padding-bottom:15px;margin-bottom:20px;'>");
        sb.append("<h1 style='margin:0;color:#38bdf8;font-size:22px;letter-spacing:1px;'>NO ZERO DAYS // CLASSROOM PERFORMANCE AUDIT</h1>");
        sb.append("<p style='margin:6px 0 0 0;color:#94a3b8;font-size:13px;'>Interactive Philippine Payroll Simulator — Student Completion & Progress Report</p>");
        sb.append("</div>");

        // Room Meta Box
        long firstCompletedAllCount = list.stream().filter(m -> m.firstCompletedCount >= 7).count();
        long reAuditCount = list.stream().filter(m -> m.hasReAudited).count();

        sb.append("<div style='display:flex;gap:12px;background:#1e293b;padding:15px;border-radius:8px;margin-bottom:20px;'>");
        sb.append("<div style='flex:1;'><div style='font-size:11px;color:#94a3b8;'>ROOM CODE</div><div style='font-size:17px;font-weight:bold;color:#facc15;letter-spacing:1px;'>").append(esc(room.getRoomCode())).append("</div></div>");
        sb.append("<div style='flex:1;'><div style='font-size:11px;color:#94a3b8;'>TEACHER</div><div style='font-size:14px;font-weight:bold;color:#fff;'>").append(esc(room.getTeacherName())).append("</div></div>");
        sb.append("<div style='flex:1;'><div style='font-size:11px;color:#94a3b8;'>FIRST ATTEMPT PASSED</div><div style='font-size:16px;font-weight:bold;color:#4ade80;'>").append(firstCompletedAllCount).append("/").append(totalEnrolled).append("</div></div>");
        sb.append("<div style='flex:1;'><div style='font-size:11px;color:#94a3b8;'>RE-AUDIT PRACTICE</div><div style='font-size:16px;font-weight:bold;color:#38bdf8;'>").append(reAuditCount).append("/").append(totalEnrolled).append("</div></div>");
        sb.append("</div>");

        // Data Warning Banner: students whose metrics could not be computed
        if (skippedStudents != null && !skippedStudents.isEmpty()) {
            sb.append("<div style='background:rgba(250, 204, 21, 0.10);border:1px solid #facc15;border-radius:8px;padding:12px 18px;margin-bottom:25px;'>");
            sb.append("<div style='font-size:14px;font-weight:bold;color:#facc15;'>⚠️ DATA WARNING — ").append(skippedStudents.size()).append(" STUDENT(S) OMITTED</div>");
            sb.append("<div style='font-size:12px;color:#cbd5e1;margin-top:4px;'>Metrics could not be computed for the following students, so they are excluded from this report: ");
            sb.append("<strong>");
            for (int i = 0; i < skippedStudents.size(); i++) {
                if (i > 0) sb.append(", ");
                sb.append(esc(skippedStudents.get(i)));
            }
            sb.append("</strong></div>");
            sb.append("</div>");
        }

        // Excel Attachment Notice
        sb.append("<div style='background:rgba(16, 185, 129, 0.12);border:1px solid #10b981;border-radius:8px;padding:12px 18px;margin-bottom:25px;'>");
        sb.append("<div style='font-size:14px;font-weight:bold;color:#34d399;'>📊 OFFICIAL EXCEL SPREADSHEET ATTACHED (.XLSX)</div>");
        sb.append("<div style='font-size:12px;color:#cbd5e1;margin-top:4px;'>A detailed multi-sheet audit workbook (<strong>Classroom_Audit_Report_").append(esc(room.getRoomCode())).append(".xlsx</strong>) is attached to this email featuring dedicated sheets for <strong>First Attempt Audit</strong> (Grading Baseline), <strong>Re-Audit Mastery</strong> (Remediation/Practice), and <strong>Classroom Summary</strong>.</div>");
        sb.append("</div>");

        // SECTION 1: FINISHED STUDENTS (Detailed Breakdown)
        List<StudentMetrics> completedList = new ArrayList<>();
        List<StudentMetrics> inProgressList = new ArrayList<>();
        for (StudentMetrics sm : list) {
            if (sm.isCompletedAll) completedList.add(sm);
            else inProgressList.add(sm);
        }

        if (!completedList.isEmpty()) {
            sb.append("<h2 style='color:#4ade80;font-size:16px;border-left:4px solid #4ade80;padding-left:10px;margin-bottom:15px;'>");
            sb.append("🎓 COMPLETED STUDENTS (DETAILED PHASE AUDIT)");
            sb.append("</h2>");

            for (StudentMetrics sm : completedList) {
                boolean isTrigger = triggeringStudent != null && triggeringStudent.getStudentNumber().equals(sm.profile.getStudentNumber());
                sb.append("<div style='background:#111827;border:1px solid ").append(isTrigger ? "#38bdf8" : "#334155").append(";border-radius:8px;padding:20px;margin-bottom:20px;'>");
                
                // Student Name Banner
                sb.append("<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;'>");
                sb.append("<div><span style='font-size:18px;font-weight:bold;color:#fff;'>").append(esc(sm.profile.getFullName())).append("</span>");
                sb.append("<span style='margin-left:10px;color:#94a3b8;font-size:13px;'>(").append(esc(sm.profile.getStudentNumber())).append(")</span></div>");
                sb.append("<span style='background:#15803d;color:#dcfce7;font-size:11px;font-weight:bold;padding:4px 10px;border-radius:4px;'>COMPLETED ALL PHASES (7/7)</span>");
                sb.append("</div>");

                // Metric Badges
                sb.append("<div style='display:flex;gap:10px;margin-bottom:15px;'>");
                sb.append("<div style='flex:1;background:#1e293b;padding:10px;border-radius:5px;'><div style='font-size:11px;color:#94a3b8;'>TOTAL TIME SPENT</div><div style='font-size:15px;font-weight:bold;color:#38bdf8;'>").append(formatSeconds(sm.totalTimeSeconds)).append("</div></div>");
                sb.append("<div style='flex:1;background:#1e293b;padding:10px;border-radius:5px;'><div style='font-size:11px;color:#94a3b8;'>AVG TIME / PHASE</div><div style='font-size:15px;font-weight:bold;color:#4ade80;'>").append(formatSeconds(sm.avgTimeSeconds)).append("</div></div>");
                sb.append("<div style='flex:1;background:#1e293b;padding:10px;border-radius:5px;'><div style='font-size:11px;color:#94a3b8;'>TOTAL TRIES</div><div style='font-size:15px;font-weight:bold;color:#fbbf24;'>").append(sm.totalAttempts).append(" attempts</div></div>");
                sb.append("</div>");

                // Detailed Phase Table
                sb.append("<table style='width:100%;border-collapse:collapse;font-size:13px;'>");
                sb.append("<thead><tr style='background:#1e293b;color:#94a3b8;'><th style='padding:8px;border:1px solid #334155;text-align:left;'>Phase</th><th style='padding:8px;border:1px solid #334155;text-align:center;'>Tries / Attempts</th><th style='padding:8px;border:1px solid #334155;text-align:center;'>Time Spent</th><th style='padding:8px;border:1px solid #334155;text-align:center;'>Status</th></tr></thead>");
                sb.append("<tbody>");
                for (PhaseMetric pm : sm.phaseMetrics) {
                    sb.append("<tr>");
                    sb.append("<td style='padding:8px;border:1px solid #334155;color:#e2e8f0;'>").append(pm.title).append("</td>");
                    sb.append("<td style='padding:8px;border:1px solid #334155;text-align:center;color:#fbbf24;font-weight:bold;'>").append(pm.tries).append("</td>");
                    sb.append("<td style='padding:8px;border:1px solid #334155;text-align:center;color:#38bdf8;'>").append(formatSeconds(pm.seconds)).append("</td>");
                    sb.append("<td style='padding:8px;border:1px solid #334155;text-align:center;color:#4ade80;'>✓ Completed</td>");
                    sb.append("</tr>");
                }
                sb.append("</tbody></table>");
                sb.append("</div>");
            }
        }

        // SECTION 2: CLASSROOM ROSTER (ALL STUDENTS STATUS)
        sb.append("<h2 style='color:#38bdf8;font-size:16px;border-left:4px solid #38bdf8;padding-left:10px;margin-top:25px;margin-bottom:15px;'>");
        sb.append("👥 ENROLLED STUDENTS PROGRESS (").append(totalEnrolled).append(" Students)");
        sb.append("</h2>");

        sb.append("<table style='width:100%;border-collapse:collapse;font-size:13px;background:#111827;border-radius:6px;overflow:hidden;'>");
        sb.append("<thead><tr style='background:#1e293b;color:#94a3b8;'>");
        sb.append("<th style='padding:10px;border:1px solid #334155;text-align:left;'>#</th>");
        sb.append("<th style='padding:10px;border:1px solid #334155;text-align:left;'>Student Name</th>");
        sb.append("<th style='padding:10px;border:1px solid #334155;text-align:left;'>ID Number</th>");
        sb.append("<th style='padding:10px;border:1px solid #334155;text-align:center;'>First Attempt</th>");
        sb.append("<th style='padding:10px;border:1px solid #334155;text-align:center;'>First Time</th>");
        sb.append("<th style='padding:10px;border:1px solid #334155;text-align:center;'>Re-Audit Status</th>");
        sb.append("<th style='padding:10px;border:1px solid #334155;text-align:center;'>Re-Audit Time</th>");
        sb.append("</tr></thead>");
        sb.append("<tbody>");

        int index = 1;
        for (StudentMetrics sm : list) {
            String firstBadge = sm.firstCompletedCount >= 7
                    ? "<span style='color:#4ade80;font-weight:bold;'>✓ Passed (7/7)</span>"
                    : "<span style='color:#fbbf24;font-weight:bold;'>" + sm.firstCompletedCount + "/7</span>";

            String reAuditBadge = sm.reAuditCompletedCount >= 7
                    ? "<span style='color:#34d399;font-weight:bold;'>↻ Mastered (7/7)</span>"
                    : (sm.hasReAudited
                        ? "<span style='color:#38bdf8;font-weight:bold;'>↻ Practicing (" + sm.reAuditCompletedCount + "/7)</span>"
                        : "<span style='color:#64748b;'>--</span>");

            sb.append("<tr>");
            sb.append("<td style='padding:8px 10px;border:1px solid #334155;color:#64748b;'>").append(index++).append("</td>");
            sb.append("<td style='padding:8px 10px;border:1px solid #334155;font-weight:bold;color:#fff;'>").append(esc(sm.profile.getFullName())).append("</td>");
            sb.append("<td style='padding:8px 10px;border:1px solid #334155;color:#94a3b8;'>").append(esc(sm.profile.getStudentNumber())).append("</td>");
            sb.append("<td style='padding:8px 10px;border:1px solid #334155;text-align:center;'>").append(firstBadge).append("</td>");
            sb.append("<td style='padding:8px 10px;border:1px solid #334155;text-align:center;color:#38bdf8;'>").append(formatSeconds(sm.firstTotalSeconds)).append("</td>");
            sb.append("<td style='padding:8px 10px;border:1px solid #334155;text-align:center;'>").append(reAuditBadge).append("</td>");
            sb.append("<td style='padding:8px 10px;border:1px solid #334155;text-align:center;color:#a855f7;'>").append(sm.reAuditTotalSeconds > 0 ? formatSeconds(sm.reAuditTotalSeconds) : "--").append("</td>");
            sb.append("</tr>");
        }
        sb.append("</tbody></table>");

        // Footer
        sb.append("<div style='margin-top:25px;padding-top:15px;border-top:1px solid #1e293b;text-align:center;color:#64748b;font-size:12px;'>");
        sb.append("Generated by No Zero Days Payroll Simulator // Grade 12 ABM Capstone Platform");
        sb.append("</div>");

        sb.append("</div></body></html>");
        return sb.toString();
    }

    private static String esc(String s) {
        if (s == null) return "";
        return org.springframework.web.util.HtmlUtils.htmlEscape(s);
    }

    private Long extractRecordedSeconds(AttemptLog log) {
        if (log == null) return null;
        if (log.getElapsedSeconds() != null && log.getElapsedSeconds() > 0) {
            return log.getElapsedSeconds();
        }
        if (log.getUserInputData() != null && log.getUserInputData().contains("timerSeconds=")) {
            try {
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("timerSeconds=(\\d+)").matcher(log.getUserInputData());
                if (m.find()) {
                    long s = Long.parseLong(m.group(1));
                    if (s > 0) return s;
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String formatSeconds(long totalSeconds) {
        if (totalSeconds <= 0) return "--";
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;

        if (hours > 0) {
            return String.format("%dh %02dm", hours, minutes);
        } else if (minutes > 0) {
            return String.format("%dm %02ds", minutes, seconds);
        } else {
            return String.format("%ds", seconds);
        }
    }

    /**
     * Generates a multi-sheet Microsoft Excel spreadsheet report (.xlsx) for the specified classroom room.
     */
    public byte[] generateClassroomReportExcel(Room room) throws Exception {
        if (room == null) throw new IllegalArgumentException("Room cannot be null");
        List<RoomParticipant> participants = roomParticipantRepository.findByRoomOrderByJoinedAtAsc(room);
        List<StudentMetrics> allMetrics = new ArrayList<>();
        List<String> skippedStudents = new ArrayList<>();
        for (RoomParticipant p : participants) {
            if (p == null || p.getStudentProfile() == null) continue;
            try {
                allMetrics.add(computeStudentMetrics(room, p.getStudentProfile()));
            } catch (Exception e) {
                System.err.println("[EmailReportService] Failed to compute metrics for student in room " + room.getRoomCode() + ": " + e.getMessage());
                skippedStudents.add(p.getStudentProfile().getFullName()
                        + " (" + p.getStudentProfile().getStudentNumber() + ")");
            }
        }
        return generateClassroomReportExcel(room, allMetrics, skippedStudents);
    }

    /**
     * Generates a multi-sheet Microsoft Excel spreadsheet report (.xlsx) with styled summary, First Attempt grading sheet, Re-Audit mastery sheet, and combined roster.
     */
    public byte[] generateClassroomReportExcel(Room room, List<StudentMetrics> list, List<String> skippedStudents) throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            DataFormat textFormat = workbook.createDataFormat();

            // Colors & Fonts
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 11);

            // Style: Primary Royal Blue (First Attempt & Global)
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Style: Emerald Green (Re-Audit Mastery)
            CellStyle headerReAuditStyle = workbook.createCellStyle();
            headerReAuditStyle.setFont(headerFont);
            headerReAuditStyle.setFillForegroundColor(IndexedColors.SEA_GREEN.getIndex());
            headerReAuditStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerReAuditStyle.setAlignment(HorizontalAlignment.CENTER);
            headerReAuditStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerReAuditStyle.setBorderTop(BorderStyle.THIN);
            headerReAuditStyle.setBorderBottom(BorderStyle.THIN);
            headerReAuditStyle.setBorderLeft(BorderStyle.THIN);
            headerReAuditStyle.setBorderRight(BorderStyle.THIN);

            // Style: Slate (Combined Sheet)
            CellStyle headerCombinedStyle = workbook.createCellStyle();
            headerCombinedStyle.setFont(headerFont);
            headerCombinedStyle.setFillForegroundColor(IndexedColors.GREY_50_PERCENT.getIndex());
            headerCombinedStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCombinedStyle.setAlignment(HorizontalAlignment.CENTER);
            headerCombinedStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerCombinedStyle.setBorderTop(BorderStyle.THIN);
            headerCombinedStyle.setBorderBottom(BorderStyle.THIN);
            headerCombinedStyle.setBorderLeft(BorderStyle.THIN);
            headerCombinedStyle.setBorderRight(BorderStyle.THIN);

            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 15);
            titleFont.setColor(IndexedColors.DARK_BLUE.getIndex());
            titleStyle.setFont(titleFont);

            CellStyle boldLabelStyle = workbook.createCellStyle();
            Font boldLabelFont = workbook.createFont();
            boldLabelFont.setBold(true);
            boldLabelStyle.setFont(boldLabelFont);

            // Verbatim Text Cell Style (avoids Excel interpreting "3m 02s" as "302m")
            CellStyle cellStyle = workbook.createCellStyle();
            cellStyle.setDataFormat(textFormat.getFormat("@"));
            cellStyle.setBorderTop(BorderStyle.THIN);
            cellStyle.setBorderBottom(BorderStyle.THIN);
            cellStyle.setBorderLeft(BorderStyle.THIN);
            cellStyle.setBorderRight(BorderStyle.THIN);
            cellStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            CellStyle cellCenterStyle = workbook.createCellStyle();
            cellCenterStyle.cloneStyleFrom(cellStyle);
            cellCenterStyle.setAlignment(HorizontalAlignment.CENTER);
            cellCenterStyle.setDataFormat(textFormat.getFormat("@"));

            CellStyle completedBadgeStyle = workbook.createCellStyle();
            completedBadgeStyle.cloneStyleFrom(cellCenterStyle);
            Font completedFont = workbook.createFont();
            completedFont.setBold(true);
            completedFont.setColor(IndexedColors.DARK_GREEN.getIndex());
            completedBadgeStyle.setFont(completedFont);

            CellStyle inProgressBadgeStyle = workbook.createCellStyle();
            inProgressBadgeStyle.cloneStyleFrom(cellCenterStyle);
            Font inProgressFont = workbook.createFont();
            inProgressFont.setBold(true);
            inProgressFont.setColor(IndexedColors.DARK_YELLOW.getIndex());
            inProgressBadgeStyle.setFont(inProgressFont);

            // ==========================================
            // SHEET 1: Classroom Summary
            // ==========================================
            Sheet summarySheet = workbook.createSheet("Classroom Summary");
            summarySheet.setDisplayGridlines(true);

            int rowIdx = 0;
            Row titleRow = summarySheet.createRow(rowIdx++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("NO ZERO DAYS // CLASSROOM PERFORMANCE AUDIT");
            titleCell.setCellStyle(titleStyle);

            Row subRow = summarySheet.createRow(rowIdx++);
            subRow.createCell(0).setCellValue("Philippine Payroll Simulation Capstone Platform — First Attempt vs Re-Audit Analysis");

            rowIdx++; // blank row

            int totalEnrolled = list.size();
            long firstCompletedAllCount = list.stream().filter(m -> m.firstCompletedCount >= 7).count();
            long reAuditParticipantsCount = list.stream().filter(m -> m.hasReAudited).count();

            createMetaRow(summarySheet, rowIdx++, "Room Code", room.getRoomCode(), boldLabelStyle);
            createMetaRow(summarySheet, rowIdx++, "Supervisor / Teacher", room.getTeacherName(), boldLabelStyle);
            createMetaRow(summarySheet, rowIdx++, "Section", room.getSection() != null ? room.getSection() : "General", boldLabelStyle);
            createMetaRow(summarySheet, rowIdx++, "Teacher Recipient Email", room.getTeacherEmail() != null ? room.getTeacherEmail() : "Not set", boldLabelStyle);
            createMetaRow(summarySheet, rowIdx++, "Enrolled Students", String.valueOf(totalEnrolled), boldLabelStyle);
            createMetaRow(summarySheet, rowIdx++, "First Attempt Passed (7/7)", firstCompletedAllCount + " / " + totalEnrolled, boldLabelStyle);
            createMetaRow(summarySheet, rowIdx++, "Engaged in Re-Audit Practice", reAuditParticipantsCount + " / " + totalEnrolled, boldLabelStyle);
            createMetaRow(summarySheet, rowIdx++, "Report Generated At", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), boldLabelStyle);

            rowIdx++; // blank row

            Row tableTitle = summarySheet.createRow(rowIdx++);
            Cell ttCell = tableTitle.createCell(0);
            ttCell.setCellValue("PHASE-BY-PHASE MASTERY OVERVIEW (FIRST ATTEMPT VS RE-AUDIT)");
            ttCell.setCellStyle(boldLabelStyle);

            String[] summaryHeaders = {
                "Phase #", "Module & Phase Title",
                "First Attempt Passed", "First Attempt Rate", "First Attempt Avg Time", "First Attempt Tries",
                "Re-Audit Passed", "Re-Audit Avg Time", "Re-Audit Tries"
            };
            Row summaryHeaderRow = summarySheet.createRow(rowIdx++);
            summaryHeaderRow.setHeightInPoints(24);
            for (int col = 0; col < summaryHeaders.length; col++) {
                Cell c = summaryHeaderRow.createCell(col);
                c.setCellValue(summaryHeaders[col]);
                c.setCellStyle(headerStyle);
            }

            for (int i = 0; i < 7; i++) {
                int phaseId = i + 1;
                int firstPassed = 0;
                long firstSecSum = 0;
                int firstTimeCount = 0;
                int firstTriesSum = 0;

                int reAuditPassed = 0;
                long reAuditSecSum = 0;
                int reAuditTimeCount = 0;
                int reAuditTriesSum = 0;

                for (StudentMetrics sm : list) {
                    if (sm.phaseMetrics.size() > i) {
                        PhaseMetric pm = sm.phaseMetrics.get(i);
                        if (pm.isFirstCompleted) firstPassed++;
                        if (pm.firstSeconds > 0) {
                            firstSecSum += pm.firstSeconds;
                            firstTimeCount++;
                        }
                        firstTriesSum += pm.firstTries;

                        if (pm.isReAuditCompleted) reAuditPassed++;
                        if (pm.reAuditSeconds > 0) {
                            reAuditSecSum += pm.reAuditSeconds;
                            reAuditTimeCount++;
                        }
                        reAuditTriesSum += pm.reAuditTries;
                    }
                }

                long fAvgSec = firstTimeCount > 0 ? (firstSecSum / firstTimeCount) : 0;
                double fRate = totalEnrolled > 0 ? ((double) firstPassed / totalEnrolled) * 100.0 : 0.0;
                long rAvgSec = reAuditTimeCount > 0 ? (reAuditSecSum / reAuditTimeCount) : 0;

                Row r = summarySheet.createRow(rowIdx++);
                Cell c0 = r.createCell(0); c0.setCellValue("Phase " + phaseId); c0.setCellStyle(cellCenterStyle);
                Cell c1 = r.createCell(1); c1.setCellValue(PHASE_NAMES[i]); c1.setCellStyle(cellStyle);
                Cell c2 = r.createCell(2); c2.setCellValue(firstPassed + " / " + totalEnrolled); c2.setCellStyle(cellCenterStyle);
                Cell c3 = r.createCell(3); c3.setCellValue(String.format("%.1f%%", fRate)); c3.setCellStyle(cellCenterStyle);
                Cell c4 = r.createCell(4); c4.setCellValue(formatSeconds(fAvgSec)); c4.setCellStyle(cellCenterStyle);
                Cell c5 = r.createCell(5); c5.setCellValue(firstTriesSum); c5.setCellStyle(cellCenterStyle);
                Cell c6 = r.createCell(6); c6.setCellValue(reAuditPassed > 0 ? (reAuditPassed + " passed") : "--"); c6.setCellStyle(cellCenterStyle);
                Cell c7 = r.createCell(7); c7.setCellValue(rAvgSec > 0 ? formatSeconds(rAvgSec) : "--"); c7.setCellStyle(cellCenterStyle);
                Cell c8 = r.createCell(8); c8.setCellValue(reAuditTriesSum); c8.setCellStyle(cellCenterStyle);
            }

            for (int col = 0; col < summaryHeaders.length; col++) {
                try {
                    summarySheet.autoSizeColumn(col);
                } catch (Throwable ignored) {}
                summarySheet.setColumnWidth(col, Math.max(summarySheet.getColumnWidth(col) + 1200, 4200));
            }

            // ==========================================
            // SHEET 2: First Attempt Audit (Grading Baseline)
            // ==========================================
            Sheet firstSheet = workbook.createSheet("First Attempt Audit");
            firstSheet.setDisplayGridlines(true);

            String[] firstHeaders = {
                "#", "Student Name", "Student ID", "First Attempt Status", "Passed Phases",
                "Total Attempts", "Total Time Spent", "Avg Time / Phase",
                "P1 Tries", "P1 Time", "P2 Tries", "P2 Time", "P3 Tries", "P3 Time",
                "P4 Tries", "P4 Time", "P5 Tries", "P5 Time", "P6 Tries", "P6 Time",
                "P7 Tries", "P7 Time"
            };

            Row firstHeaderRow = firstSheet.createRow(0);
            firstHeaderRow.setHeightInPoints(24);
            for (int col = 0; col < firstHeaders.length; col++) {
                Cell c = firstHeaderRow.createCell(col);
                c.setCellValue(firstHeaders[col]);
                c.setCellStyle(headerStyle);
            }

            int sIdx = 1;
            for (StudentMetrics sm : list) {
                if (sm == null || sm.profile == null) continue;
                Row r = firstSheet.createRow(sIdx);
                Cell c0 = r.createCell(0); c0.setCellValue(sIdx); c0.setCellStyle(cellCenterStyle);
                String fullName = sm.profile.getFullName() != null ? sm.profile.getFullName() : "Unknown";
                String studentNum = sm.profile.getStudentNumber() != null ? sm.profile.getStudentNumber() : "--";
                Cell c1 = r.createCell(1); c1.setCellValue(fullName); c1.setCellStyle(cellStyle);
                Cell c2 = r.createCell(2); c2.setCellValue(studentNum); c2.setCellStyle(cellCenterStyle);
                Cell c3 = r.createCell(3);
                c3.setCellValue(sm.firstCompletedCount >= 7 ? "PASSED (7/7)" : "In Progress (" + sm.firstCompletedCount + "/7)");
                c3.setCellStyle(sm.firstCompletedCount >= 7 ? completedBadgeStyle : inProgressBadgeStyle);

                Cell c4 = r.createCell(4); c4.setCellValue(sm.firstCompletedCount + " / 7"); c4.setCellStyle(cellCenterStyle);
                Cell c5 = r.createCell(5); c5.setCellValue(sm.firstTotalAttempts); c5.setCellStyle(cellCenterStyle);
                Cell c6 = r.createCell(6); c6.setCellValue(formatSeconds(sm.firstTotalSeconds)); c6.setCellStyle(cellCenterStyle);
                Cell c7 = r.createCell(7); c7.setCellValue(formatSeconds(sm.firstAvgSeconds)); c7.setCellStyle(cellCenterStyle);

                for (int p = 0; p < 7; p++) {
                    int tryCol = 8 + (p * 2);
                    int timeCol = 9 + (p * 2);
                    if (p < sm.phaseMetrics.size()) {
                        PhaseMetric pm = sm.phaseMetrics.get(p);
                        Cell cTries = r.createCell(tryCol);
                        cTries.setCellValue(pm.firstTries);
                        cTries.setCellStyle(cellCenterStyle);

                        Cell cTime = r.createCell(timeCol);
                        if (pm.isFirstCompleted || pm.firstSeconds > 0) {
                            if (pm.firstTries > 1 && pm.firstWinningSeconds > 0 && pm.firstSeconds > pm.firstWinningSeconds) {
                                cTime.setCellValue(formatSeconds(pm.firstWinningSeconds) + " (tot: " + formatSeconds(pm.firstSeconds) + ")");
                            } else {
                                cTime.setCellValue(formatSeconds(pm.firstSeconds));
                            }
                        } else {
                            cTime.setCellValue("--");
                        }
                        cTime.setCellStyle(cellCenterStyle);
                    } else {
                        Cell cTries = r.createCell(tryCol); cTries.setCellValue(0); cTries.setCellStyle(cellCenterStyle);
                        Cell cTime = r.createCell(timeCol); cTime.setCellValue("--"); cTime.setCellStyle(cellCenterStyle);
                    }
                }
                sIdx++;
            }

            for (int col = 0; col < firstHeaders.length; col++) {
                try {
                    firstSheet.autoSizeColumn(col);
                } catch (Throwable ignored) {}
                firstSheet.setColumnWidth(col, Math.max(firstSheet.getColumnWidth(col) + 1000, 3600));
            }

            // ==========================================
            // SHEET 3: Re-Audit Mastery (Practice & Fluency)
            // ==========================================
            Sheet reAuditSheet = workbook.createSheet("Re-Audit Mastery");
            reAuditSheet.setDisplayGridlines(true);

            String[] reAuditHeaders = {
                "#", "Student Name", "Student ID", "Re-Audit Status", "Re-Audited Phases",
                "Re-Audit Attempts", "Re-Audit Time", "Avg Time / Phase",
                "P1 Tries", "P1 Time", "P2 Tries", "P2 Time", "P3 Tries", "P3 Time",
                "P4 Tries", "P4 Time", "P5 Tries", "P5 Time", "P6 Tries", "P6 Time",
                "P7 Tries", "P7 Time"
            };

            Row reAuditHeaderRow = reAuditSheet.createRow(0);
            reAuditHeaderRow.setHeightInPoints(24);
            for (int col = 0; col < reAuditHeaders.length; col++) {
                Cell c = reAuditHeaderRow.createCell(col);
                c.setCellValue(reAuditHeaders[col]);
                c.setCellStyle(headerReAuditStyle);
            }

            int rIdx = 1;
            for (StudentMetrics sm : list) {
                if (sm == null || sm.profile == null) continue;
                Row r = reAuditSheet.createRow(rIdx);
                Cell c0 = r.createCell(0); c0.setCellValue(rIdx); c0.setCellStyle(cellCenterStyle);
                String fullName = sm.profile.getFullName() != null ? sm.profile.getFullName() : "Unknown";
                String studentNum = sm.profile.getStudentNumber() != null ? sm.profile.getStudentNumber() : "--";
                Cell c1 = r.createCell(1); c1.setCellValue(fullName); c1.setCellStyle(cellStyle);
                Cell c2 = r.createCell(2); c2.setCellValue(studentNum); c2.setCellStyle(cellCenterStyle);
                Cell c3 = r.createCell(3);
                if (sm.reAuditCompletedCount >= 7) {
                    c3.setCellValue("RE-AUDITED ALL (7/7)");
                    c3.setCellStyle(completedBadgeStyle);
                } else if (sm.hasReAudited) {
                    c3.setCellValue("Re-Auditing (" + sm.reAuditCompletedCount + "/7)");
                    c3.setCellStyle(inProgressBadgeStyle);
                } else {
                    c3.setCellValue("No Re-Audit");
                    c3.setCellStyle(cellCenterStyle);
                }

                Cell c4 = r.createCell(4); c4.setCellValue(sm.reAuditCompletedCount + " / 7"); c4.setCellStyle(cellCenterStyle);
                Cell c5 = r.createCell(5); c5.setCellValue(sm.reAuditTotalAttempts); c5.setCellStyle(cellCenterStyle);
                Cell c6 = r.createCell(6); c6.setCellValue(sm.reAuditTotalSeconds > 0 ? formatSeconds(sm.reAuditTotalSeconds) : "--"); c6.setCellStyle(cellCenterStyle);
                Cell c7 = r.createCell(7); c7.setCellValue(sm.reAuditAvgSeconds > 0 ? formatSeconds(sm.reAuditAvgSeconds) : "--"); c7.setCellStyle(cellCenterStyle);

                for (int p = 0; p < 7; p++) {
                    int tryCol = 8 + (p * 2);
                    int timeCol = 9 + (p * 2);
                    if (p < sm.phaseMetrics.size()) {
                        PhaseMetric pm = sm.phaseMetrics.get(p);
                        Cell cTries = r.createCell(tryCol);
                        cTries.setCellValue(pm.hasReAudited ? pm.reAuditTries : 0);
                        cTries.setCellStyle(cellCenterStyle);

                        Cell cTime = r.createCell(timeCol);
                        cTime.setCellValue(pm.hasReAudited && pm.reAuditSeconds > 0 ? formatSeconds(pm.reAuditSeconds) : "--");
                        cTime.setCellStyle(cellCenterStyle);
                    } else {
                        Cell cTries = r.createCell(tryCol); cTries.setCellValue(0); cTries.setCellStyle(cellCenterStyle);
                        Cell cTime = r.createCell(timeCol); cTime.setCellValue("--"); cTime.setCellStyle(cellCenterStyle);
                    }
                }
                rIdx++;
            }

            for (int col = 0; col < reAuditHeaders.length; col++) {
                try {
                    reAuditSheet.autoSizeColumn(col);
                } catch (Throwable ignored) {}
                reAuditSheet.setColumnWidth(col, Math.max(reAuditSheet.getColumnWidth(col) + 1000, 3600));
            }

            // ==========================================
            // SHEET 4: Combined Full Audit (Legacy & Composite)
            // ==========================================
            Sheet rosterSheet = workbook.createSheet("Combined Student Roster");
            rosterSheet.setDisplayGridlines(true);

            String[] rosterHeaders = {
                "#", "Student Name", "Student ID", "Status", "Completed Phases",
                "Total Attempts", "Total Time Spent", "Avg Time / Phase",
                "P1 Tries", "P1 Time", "P2 Tries", "P2 Time", "P3 Tries", "P3 Time",
                "P4 Tries", "P4 Time", "P5 Tries", "P5 Time", "P6 Tries", "P6 Time",
                "P7 Tries", "P7 Time"
            };

            Row rosterHeaderRow = rosterSheet.createRow(0);
            rosterHeaderRow.setHeightInPoints(24);
            for (int col = 0; col < rosterHeaders.length; col++) {
                Cell c = rosterHeaderRow.createCell(col);
                c.setCellValue(rosterHeaders[col]);
                c.setCellStyle(headerCombinedStyle);
            }

            int cIdx = 1;
            for (StudentMetrics sm : list) {
                if (sm == null || sm.profile == null) continue;
                Row r = rosterSheet.createRow(cIdx);
                Cell c0 = r.createCell(0); c0.setCellValue(cIdx); c0.setCellStyle(cellCenterStyle);
                String fullName = sm.profile.getFullName() != null ? sm.profile.getFullName() : "Unknown";
                String studentNum = sm.profile.getStudentNumber() != null ? sm.profile.getStudentNumber() : "--";
                Cell c1 = r.createCell(1); c1.setCellValue(fullName); c1.setCellStyle(cellStyle);
                Cell c2 = r.createCell(2); c2.setCellValue(studentNum); c2.setCellStyle(cellCenterStyle);
                Cell c3 = r.createCell(3);
                c3.setCellValue(sm.isCompletedAll ? "COMPLETED (7/7)" : "Phase " + sm.currentPhase + " (" + sm.completedPhasesCount + "/7)");
                c3.setCellStyle(sm.isCompletedAll ? completedBadgeStyle : inProgressBadgeStyle);

                Cell c4 = r.createCell(4); c4.setCellValue(sm.completedPhasesCount + " / 7"); c4.setCellStyle(cellCenterStyle);
                Cell c5 = r.createCell(5); c5.setCellValue(sm.totalAttempts); c5.setCellStyle(cellCenterStyle);
                Cell c6 = r.createCell(6); c6.setCellValue(formatSeconds(sm.totalTimeSeconds)); c6.setCellStyle(cellCenterStyle);
                Cell c7 = r.createCell(7); c7.setCellValue(formatSeconds(sm.avgTimeSeconds)); c7.setCellStyle(cellCenterStyle);

                for (int p = 0; p < 7; p++) {
                    int tryCol = 8 + (p * 2);
                    int timeCol = 9 + (p * 2);
                    if (p < sm.phaseMetrics.size()) {
                        PhaseMetric pm = sm.phaseMetrics.get(p);
                        Cell cTries = r.createCell(tryCol);
                        cTries.setCellValue(pm.tries);
                        cTries.setCellStyle(cellCenterStyle);

                        Cell cTime = r.createCell(timeCol);
                        cTime.setCellValue(pm.isCompleted || pm.seconds > 0 ? formatSeconds(pm.seconds) : "--");
                        cTime.setCellStyle(cellCenterStyle);
                    } else {
                        Cell cTries = r.createCell(tryCol); cTries.setCellValue(0); cTries.setCellStyle(cellCenterStyle);
                        Cell cTime = r.createCell(timeCol); cTime.setCellValue("--"); cTime.setCellStyle(cellCenterStyle);
                    }
                }
                cIdx++;
            }

            for (int col = 0; col < rosterHeaders.length; col++) {
                try {
                    rosterSheet.autoSizeColumn(col);
                } catch (Throwable ignored) {}
                rosterSheet.setColumnWidth(col, Math.max(rosterSheet.getColumnWidth(col) + 1000, 3600));
            }

            // DATA WARNINGS sheet: lists students whose metrics could not be computed
            if (skippedStudents != null && !skippedStudents.isEmpty()) {
                Sheet warnSheet = workbook.createSheet("DATA WARNINGS");
                Row wHeader = warnSheet.createRow(0);
                Cell wc0 = wHeader.createCell(0);
                wc0.setCellValue("Students omitted (metrics unavailable)");
                wc0.setCellStyle(headerStyle);
                int wr = 1;
                for (String skipped : skippedStudents) {
                    Row wRow = warnSheet.createRow(wr++);
                    Cell wcell = wRow.createCell(0);
                    wcell.setCellValue(skipped);
                    wcell.setCellStyle(cellStyle);
                }
                try {
                    warnSheet.autoSizeColumn(0);
                } catch (Throwable ignored) {}
                warnSheet.setColumnWidth(0, Math.max(warnSheet.getColumnWidth(0) + 1000, 5000));
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    private void createMetaRow(Sheet sheet, int rowIdx, String label, String value, CellStyle boldStyle) {
        Row r = sheet.createRow(rowIdx);
        Cell c0 = r.createCell(0);
        c0.setCellValue(label + ":");
        c0.setCellStyle(boldStyle);
        Cell c1 = r.createCell(1);
        c1.setCellValue(value != null ? value : "N/A");
    }

    /**
     * Refreshes the Google OAuth2 access token using the stored refresh token.
     */
    private String fetchGoogleAccessToken() throws Exception {
        String form = "client_id=" + URLEncoder.encode(googleClientId.trim(), StandardCharsets.UTF_8)
                + "&client_secret=" + URLEncoder.encode(googleClientSecret.trim(), StandardCharsets.UTF_8)
                + "&refresh_token=" + URLEncoder.encode(googleRefreshToken.trim(), StandardCharsets.UTF_8)
                + "&grant_type=refresh_token";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://oauth2.googleapis.com/token"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new IllegalStateException("Failed to refresh Google OAuth2 access token (HTTP "
                    + response.statusCode() + "): " + response.body());
        }

        String body = response.body();
        int tokenIdx = body.indexOf("\"access_token\":");
        if (tokenIdx == -1) {
            throw new IllegalStateException("No access_token field in Google OAuth response: " + body);
        }
        int startQuote = body.indexOf("\"", tokenIdx + 15);
        int endQuote = body.indexOf("\"", startQuote + 1);
        return body.substring(startQuote + 1, endQuote);
    }

    /**
     * Dispatches the RFC822 MimeMessage directly via the official Google Gmail REST API.
     */
    private void sendViaGmailApi(MimeMessage message, String accessToken) throws Exception {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        message.writeTo(buffer);
        String rawBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(buffer.toByteArray());

        String jsonPayload = "{\"raw\":\"" + rawBase64 + "\"}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://gmail.googleapis.com/gmail/v1/users/me/messages/send"))
                .header("Authorization", "Bearer " + accessToken)
                .header("Content-Type", "application/json; charset=UTF-8")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .build();

        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new IllegalStateException("Gmail API send failed (HTTP " + response.statusCode() + "): " + response.body());
        }
    }
}
