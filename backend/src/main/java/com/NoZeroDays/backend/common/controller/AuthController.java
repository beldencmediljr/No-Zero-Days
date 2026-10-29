package com.NoZeroDays.backend.common.controller;

import com.NoZeroDays.backend.common.auth.AuthInterceptor;
import com.NoZeroDays.backend.common.dto.LoginRequest;
import com.NoZeroDays.backend.common.model.GameSession;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.model.Teacher;
import com.NoZeroDays.backend.common.repository.GameSessionRepository;
import com.NoZeroDays.backend.common.repository.StudentProfileRepository;
import com.NoZeroDays.backend.common.repository.TeacherRepository;

import com.NoZeroDays.backend.common.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private StudentProfileRepository studentRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private AuthService authService;

    /**
     * Unified Login endpoint:
     * POST /api/auth/login
     * Accepts: studentNumber, name, fullName, role, email + password (teachers)
     * Returns the profile plus a session token.
     */
    @PostMapping(value = {"/login", "/login/"})
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.isTeacher()) {
            return authenticateTeacher(request);
        } else {
            return authenticateStudent(request);
        }
    }

    /**
     * Unified Register endpoint:
     * POST /api/auth/register
     */
    @PostMapping(value = {"/register", "/register/"})
    public ResponseEntity<?> register(@RequestBody LoginRequest request) {
        if (request.isTeacher()) {
            return registerTeacher(request);
        } else {
            return registerStudent(request);
        }
    }

    /**
     * POST /api/auth/logout — clears the caller's session token.
     */
    @PostMapping(value = {"/logout", "/logout/"})
    public ResponseEntity<?> logout(HttpServletRequest httpRequest) {
        String role = (String) httpRequest.getAttribute(AuthInterceptor.ATTR_ROLE);
        if ("TEACHER".equals(role)) {
            String email = (String) httpRequest.getAttribute(AuthInterceptor.ATTR_TEACHER_EMAIL);
            teacherRepository.findByEmailIgnoreCase(email).ifPresent(t -> {
                t.setSessionToken(null);
                t.setSessionTokenExpiresAt(null);
                teacherRepository.save(t);
            });
        } else if ("STUDENT".equals(role)) {
            String studentNumber = (String) httpRequest.getAttribute(AuthInterceptor.ATTR_STUDENT_NUMBER);
            studentRepository.findByStudentNumber(studentNumber).ifPresent(s -> {
                s.setSessionToken(null);
                s.setSessionTokenExpiresAt(null);
                studentRepository.save(s);
            });
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * GET /api/auth/me — session probe for the frontend's localStorage restore
     * flow. Returns the caller's identity when their Bearer token is valid.
     */
    @GetMapping(value = {"/me", "/me/"})
    public ResponseEntity<?> me(HttpServletRequest httpRequest) {
        String role = (String) httpRequest.getAttribute(AuthInterceptor.ATTR_ROLE);
        if ("TEACHER".equals(role)) {
            String email = (String) httpRequest.getAttribute(AuthInterceptor.ATTR_TEACHER_EMAIL);
            Optional<Teacher> teacher = teacherRepository.findByEmailIgnoreCase(email);
            if (teacher.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "Session not found."));
            }
            Map<String, Object> resp = new HashMap<>();
            resp.put("role", "TEACHER");
            resp.put("email", teacher.get().getEmail());
            resp.put("fullName", teacher.get().getFullName());
            return ResponseEntity.ok(resp);
        }
        if ("STUDENT".equals(role)) {
            String studentNumber = (String) httpRequest.getAttribute(AuthInterceptor.ATTR_STUDENT_NUMBER);
            Optional<StudentProfile> student = studentRepository.findByStudentNumber(studentNumber);
            if (student.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "Session not found."));
            }
            Map<String, Object> resp = new HashMap<>();
            resp.put("role", "STUDENT");
            resp.put("studentNumber", student.get().getStudentNumber());
            resp.put("fullName", student.get().getFullName());
            resp.put("section", student.get().getSection());
            return ResponseEntity.ok(resp);
        }
        return ResponseEntity.status(401).body(Map.of("error", "Not authenticated."));
    }

    /**
     * POST /api/auth/upgrade-student — migration path for pre-password student
     * accounts. Verifies identity (student number + full name, same as login)
     * and attaches email + password. Issues a session token on success.
     */
    @PostMapping(value = {"/upgrade-student", "/upgrade-student/"})
    public ResponseEntity<?> upgradeStudent(@RequestBody LoginRequest request) {
        try {
            StudentProfile profile = authService.upgradeStudentCredentials(
                    request.getEffectiveStudentNumber(),
                    request.getEffectiveName(),
                    request.getEffectiveEmail(),
                    request.getPassword());
            authService.issueSession(profile);
            profile = studentRepository.save(profile);
            return ResponseEntity.ok(studentResponse(profile));
        } catch (IllegalArgumentException e) {
            int status = e.getMessage().contains("not found") ? 404 : 400;
            return ResponseEntity.status(status).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/auth/forgot-password — teacher account recovery.
     * Always answers with the same neutral message; a reset link is emailed
     * only when the account exists.
     */
    @PostMapping(value = {"/forgot-password", "/forgot-password/"})
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required."));
        }
        try {
            boolean sent = authService.requestTeacherPasswordReset(email);
            if (!sent) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "If a teacher account exists for that email, a password reset link has been sent."));
            }
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "A password reset link has been sent to your email. It expires in "
                            + AuthService.RESET_TOKEN_MINUTES + " minutes."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[AuthController] Failed to send password reset email: " + e.getMessage());
            return ResponseEntity.status(502).body(Map.of("error",
                    "The password reset email could not be sent. Please contact your administrator."));
        }
    }

    /**
     * POST /api/auth/reset-password — completes the teacher password reset.
     */
    @PostMapping(value = {"/reset-password", "/reset-password/"})
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body != null ? body.get("token") : null;
        String password = body != null ? body.get("password") : null;
        try {
            authService.resetTeacherPassword(token, password);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Password has been reset. You can now sign in."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/auth/change-password — authenticated password change for
     * teachers and students. Requires the current password.
     */
    @PostMapping(value = {"/change-password", "/change-password/"})
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body, HttpServletRequest httpRequest) {
        String currentPassword = body != null ? body.get("currentPassword") : null;
        String newPassword = body != null ? body.get("newPassword") : null;
        String role = (String) httpRequest.getAttribute(AuthInterceptor.ATTR_ROLE);
        try {
            if ("TEACHER".equals(role)) {
                String email = (String) httpRequest.getAttribute(AuthInterceptor.ATTR_TEACHER_EMAIL);
                Optional<Teacher> opt = teacherRepository.findByEmailIgnoreCase(email);
                if (opt.isEmpty()) {
                    return ResponseEntity.status(401).body(Map.of("error", "Session not found."));
                }
                authService.changeTeacherPassword(opt.get(), currentPassword, newPassword);
            } else if ("STUDENT".equals(role)) {
                String studentNumber = (String) httpRequest.getAttribute(AuthInterceptor.ATTR_STUDENT_NUMBER);
                Optional<StudentProfile> opt = studentRepository.findByStudentNumber(studentNumber);
                if (opt.isEmpty()) {
                    return ResponseEntity.status(401).body(Map.of("error", "Session not found."));
                }
                authService.changeStudentPassword(opt.get(), currentPassword, newPassword);
            } else {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required."));
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private ResponseEntity<?> authenticateStudent(LoginRequest request) {
        String identifier = request.getEffectiveStudentNumber();
        String name = request.getEffectiveName();

        if (identifier.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student number or email cannot be empty."));
        }

        try {
            StudentProfile profile = authService.authenticateStudent(identifier, name, request.getPassword());
            if (profile.getPasswordHash() == null) {
                // Legacy pre-migration account: identity verified, but the student
                // must attach email + password before regaining access. Kill any
                // lingering pre-upgrade session token so it cannot be replayed.
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
            return ResponseEntity.ok(studentResponse(profile));
        } catch (IllegalArgumentException e) {
            int status = e.getMessage().contains("not found") ? 404 : 400;
            return ResponseEntity.status(status).body(Map.of("error", e.getMessage()));
        }
    }

    private ResponseEntity<?> registerStudent(LoginRequest request) {
        String studentNumber = request.getEffectiveStudentNumber();
        String name = request.getEffectiveName();
        String section = request.getSection() != null ? request.getSection().trim() : "";
        String email = request.getEffectiveEmail();
        String password = request.getPassword();

        if (studentNumber.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student number cannot be empty."));
        }
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Full name cannot be empty."));
        }
        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required."));
        }
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please enter a valid email address."));
        }
        if (password == null || password.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters."));
        }

        Optional<StudentProfile> emailOwner = studentRepository.findByEmailIgnoreCase(email);
        if (emailOwner.isPresent() && !emailOwner.get().getStudentNumber().equalsIgnoreCase(studentNumber)) {
            return ResponseEntity.status(409).body(Map.of("error",
                    "Email '" + email + "' is already used by another student account."));
        }

        Optional<StudentProfile> existing = studentRepository.findByStudentNumber(studentNumber);
        StudentProfile profile;
        if (existing.isPresent()) {
            profile = existing.get();
            if (profile.getPasswordHash() != null) {
                return ResponseEntity.status(409).body(Map.of("error",
                        "Student number '" + studentNumber + "' is already registered. Please sign in instead."));
            }
            if (!"Temporary Student".equalsIgnoreCase(profile.getFullName())
                    && !authService.isFlexibleNameMatch(profile.getFullName(), name)) {
                return ResponseEntity.status(409).body(Map.of("error",
                        "Student number '" + studentNumber + "' is already registered to a different name."));
            }
            if ("Temporary Student".equalsIgnoreCase(profile.getFullName())) {
                profile.setFullName(name);
                if (!section.isEmpty()) {
                    profile.setSection(section);
                }
            }
            // Existing legacy account: attach the submitted credentials.
            profile.setEmail(email);
            profile.setPasswordHash(com.NoZeroDays.backend.common.auth.PasswordHasher.hash(password));
        } else {
            profile = new StudentProfile(studentNumber, name, section);
            profile.setEmail(email);
            profile.setPasswordHash(com.NoZeroDays.backend.common.auth.PasswordHasher.hash(password));
        }
        authService.issueSession(profile);
        profile = studentRepository.save(profile);

        // Ensure student has an active game session
        List<GameSession> activeSessions = gameSessionRepository.findByStudentProfileAndStatus(profile, "ACTIVE");
        if (activeSessions.isEmpty()) {
            GameSession newSession = new GameSession(profile);
            newSession.setCurrentModule("M1_MATH");
            newSession.setCurrentPhase(1);
            newSession.setStatus("ACTIVE");
            gameSessionRepository.save(newSession);
        }

        return ResponseEntity.ok(studentResponse(profile));
    }

    private Map<String, Object> studentResponse(StudentProfile profile) {
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", profile.getId());
        resp.put("studentNumber", profile.getStudentNumber());
        resp.put("fullName", profile.getFullName());
        resp.put("section", profile.getSection());
        resp.put("email", profile.getEmail());
        resp.put("createdAt", profile.getCreatedAt());
        resp.put("token", profile.getSessionToken());
        resp.put("role", "STUDENT");
        return resp;
    }

    private ResponseEntity<?> authenticateTeacher(LoginRequest request) {
        String email = request.getEffectiveEmail();
        String fullName = request.getEffectiveName();

        try {
            Teacher teacher = authService.authenticateTeacher(email, request.getPassword(), fullName);
            return ResponseEntity.ok(teacherResponse(teacher));
        } catch (IllegalArgumentException e) {
            int status = e.getMessage().contains("not found") ? 404 : 400;
            return ResponseEntity.status(status).body(Map.of("error", e.getMessage()));
        }
    }

    private ResponseEntity<?> registerTeacher(LoginRequest request) {
        String email = request.getEffectiveEmail();
        String fullName = request.getEffectiveName();

        try {
            Teacher teacher = authService.registerTeacher(email, request.getPassword(), fullName);
            return ResponseEntity.ok(teacherResponse(teacher));
        } catch (IllegalArgumentException e) {
            int status = e.getMessage().contains("already registered") ? 409 : 400;
            return ResponseEntity.status(status).body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> teacherResponse(Teacher teacher) {
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", teacher.getId());
        resp.put("email", teacher.getEmail());
        resp.put("fullName", teacher.getFullName());
        resp.put("teacherName", teacher.getFullName());
        resp.put("teacherEmail", teacher.getEmail());
        resp.put("token", teacher.getSessionToken());
        resp.put("role", "TEACHER");
        return resp;
    }
}
