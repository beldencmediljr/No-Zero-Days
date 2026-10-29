package com.NoZeroDays.backend.common.auth;

import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.model.Teacher;
import com.NoZeroDays.backend.common.repository.StudentProfileRepository;
import com.NoZeroDays.backend.common.repository.TeacherRepository;
import com.NoZeroDays.backend.common.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Bearer-token interceptor for /api/**.
 *
 * Route policy:
 *  - PUBLIC:   /api/auth/**, /api/health, legacy /api/students/login|register,
 *              /api/teachers/login|register
 *  - TEACHER:  room create/list, start, dashboard, participants, enroll/remove
 *              students, global student delete, report endpoints
 *  - ANY-ROLE: room status polling (student waiting screen + teacher lobby)
 *  - STUDENT:  everything else (phase presence, validation, invitations, join)
 *
 * Resolved identity is stored as request attributes:
 *  - auth.role          ("TEACHER" | "STUDENT")
 *  - auth.teacherEmail  (teacher email, teacher routes only)
 *  - auth.studentNumber (student number, student routes only)
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String ATTR_ROLE = "auth.role";
    public static final String ATTR_TEACHER_EMAIL = "auth.teacherEmail";
    public static final String ATTR_STUDENT_NUMBER = "auth.studentNumber";

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // CORS preflight must pass through untouched
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String uri = request.getRequestURI();
        String method = request.getMethod();
        String path = uri.startsWith("/api") ? uri.substring(4) : uri;

        if (isPublicPath(path)) {
            return true;
        }

        String token = extractBearerToken(request);
        if (token == null || token.isBlank()) {
            return reject(response, "Authentication required.");
        }

        Optional<Teacher> teacherOpt = teacherRepository.findBySessionToken(token);
        if (teacherOpt.isPresent()) {
            Teacher teacher = teacherOpt.get();
            LocalDateTime now = LocalDateTime.now();
            if (teacher.getSessionTokenExpiresAt() != null
                    && now.isAfter(teacher.getSessionTokenExpiresAt())) {
                // Expired: clear the token so it cannot be replayed.
                teacher.setSessionToken(null);
                teacher.setSessionTokenExpiresAt(null);
                teacherRepository.save(teacher);
                return reject(response, "Session expired. Please sign in again.");
            }
            if (teacher.getSessionTokenExpiresAt() != null
                    && teacher.getSessionTokenExpiresAt().isBefore(now.plusHours(AuthService.SESSION_RENEW_THRESHOLD_HOURS))) {
                // Sliding renewal: active users keep their session; stale tokens expire.
                teacher.setSessionTokenExpiresAt(now.plusHours(AuthService.SESSION_LIFETIME_HOURS));
                teacherRepository.save(teacher);
            }
            request.setAttribute(ATTR_ROLE, "TEACHER");
            request.setAttribute(ATTR_TEACHER_EMAIL, teacher.getEmail());
            if (isStudentOnlyPath(path, method)) {
                return reject(response, "Teacher accounts cannot use student endpoints.");
            }
            return true;
        }

        Optional<StudentProfile> studentOpt = studentProfileRepository.findBySessionToken(token);
        if (studentOpt.isPresent()) {
            StudentProfile student = studentOpt.get();
            // Legacy pre-password accounts must upgrade before ANY access is
            // granted — even a valid pre-upgrade token cannot bypass this.
            if (student.getPasswordHash() == null) {
                return reject(response, "This account must be upgraded with an email and password. Please sign in again to update your credentials.");
            }
            LocalDateTime now = LocalDateTime.now();
            if (student.getSessionTokenExpiresAt() != null
                    && now.isAfter(student.getSessionTokenExpiresAt())) {
                student.setSessionToken(null);
                student.setSessionTokenExpiresAt(null);
                studentProfileRepository.save(student);
                return reject(response, "Session expired. Please sign in again.");
            }
            if (student.getSessionTokenExpiresAt() != null
                    && student.getSessionTokenExpiresAt().isBefore(now.plusHours(AuthService.SESSION_RENEW_THRESHOLD_HOURS))) {
                student.setSessionTokenExpiresAt(now.plusHours(AuthService.SESSION_LIFETIME_HOURS));
                studentProfileRepository.save(student);
            }
            request.setAttribute(ATTR_ROLE, "STUDENT");
            request.setAttribute(ATTR_STUDENT_NUMBER, student.getStudentNumber());
            if (isTeacherOnlyPath(path, method)) {
                return reject(response, "Teacher access required.");
            }
            return true;
        }

        return reject(response, "Invalid or expired session.");
    }

    private static boolean isPublicPath(String path) {
        if (path.equals("/health")) return true;
        // Logout requires a token (it clears the caller's session)
        if (path.equals("/auth/logout") || path.equals("/auth/logout/")) return false;
        // Session probe requires a token (used by the frontend to validate
        // restored sessions before rendering)
        if (path.equals("/auth/me") || path.equals("/auth/me/")) return false;
        // Password change requires an authenticated session
        if (path.equals("/auth/change-password") || path.equals("/auth/change-password/")) return false;
        if (path.startsWith("/auth/")) return true;
        // Legacy auth endpoints
        if (path.equals("/students/login") || path.equals("/students/login/")) return true;
        if (path.equals("/students/register") || path.equals("/students/register/")) return true;
        if (path.equals("/teachers/login") || path.equals("/teachers/login/")) return true;
        if (path.equals("/teachers/register") || path.equals("/teachers/register/")) return true;
        // Rankings expose student names/numbers — authentication required;
        // room ownership/participation is enforced inside the endpoint.
        return false;
    }

    private static boolean isTeacherOnlyPath(String path, String method) {
        if (path.equals("/rooms/create")) return true;
        if (path.equals("/teachers/rooms")) return true;
        if (path.equals("/rooms/find-by-teacher")) return true;
        if (path.matches("/rooms/[^/]+/start")) return true;
        if (path.matches("/rooms/[^/]+/close")) return true;
        if (path.matches("/rooms/[^/]+/dashboard")) return true;
        if (path.matches("/rooms/[^/]+/participants")) return true;
        if ("POST".equalsIgnoreCase(method) && path.matches("/rooms/[^/]+/students")) return true;
        if ("DELETE".equalsIgnoreCase(method) && path.matches("/rooms/[^/]+")) return true;
        if ("DELETE".equalsIgnoreCase(method) && path.matches("/rooms/[^/]+/students/[^/]+")) return true;
        if ("DELETE".equalsIgnoreCase(method) && path.matches("/students/[^/]+")) return true;
        if (path.matches("/rooms/[^/]+/send-report")) return true;
        if (path.matches("/rooms/[^/]+/report/preview")) return true;
        if (path.matches("/rooms/[^/]+/report/excel")) return true;
        return false;
    }

    private static boolean isStudentOnlyPath(String path, String method) {
        // Student-invitation endpoints accept teacher tokens as well (teachers
        // may poll pending invitations), so only presence/validation/join paths
        // are student-exclusive.
        if (path.equals("/rooms/join")) return true;
        if (path.matches("/rooms/[^/]+/invitations/accept")) return true;
        if (path.matches("/rooms/[^/]+/invitations/decline")) return true;
        if (path.matches("/rooms/[^/]+/phase-enter")) return true;
        if (path.matches("/rooms/[^/]+/phase-exit")) return true;
        if (path.matches("/rooms/[^/]+/heartbeat")) return true;
        if (path.matches("/students/phase-enter")) return true;
        if (path.matches("/students/phase-exit")) return true;
        if (path.matches("/students/heartbeat")) return true;
        if (path.equals("/students/logout-session")) return true;
        if (path.startsWith("/validation/")) return true;
        if (path.startsWith("/progress/")) return true;
        return false;
    }

    private static String extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null) return null;
        String trimmed = header.trim();
        if (trimmed.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return trimmed.substring(7).trim();
        }
        return null;
    }

    private static boolean reject(HttpServletResponse response, String message) throws Exception {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + escapeJson(message) + "\"}");
        return false;
    }

    private static String escapeJson(String s) {
        StringBuilder sb = new StringBuilder(s.length() + 8);
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
            }
        }
        return sb.toString();
    }
}
