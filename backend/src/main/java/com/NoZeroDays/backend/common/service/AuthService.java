package com.NoZeroDays.backend.common.service;

import com.NoZeroDays.backend.common.auth.PasswordHasher;
import com.NoZeroDays.backend.common.model.GameSession;
import com.NoZeroDays.backend.common.model.Room;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.model.Teacher;
import com.NoZeroDays.backend.common.repository.GameSessionRepository;
import com.NoZeroDays.backend.common.repository.RoomRepository;
import com.NoZeroDays.backend.common.repository.StudentProfileRepository;
import com.NoZeroDays.backend.common.repository.TeacherRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    /** Session token lifetime (hours) and sliding-renewal threshold (hours). */
    public static final long SESSION_LIFETIME_HOURS = 24;
    public static final long SESSION_RENEW_THRESHOLD_HOURS = 12;

    /** Lockout policy: lock the account after this many failed password attempts. */
    public static final int MAX_FAILED_ATTEMPTS = 5;
    public static final long LOCK_MINUTES = 15;

    /** Password reset token lifetime (minutes). */
    public static final long RESET_TOKEN_MINUTES = 15;

    @Autowired
    private StudentProfileRepository studentRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private EmailReportService emailReportService;

    /** Cryptographically random 256-bit session token (hex). */
    public String issueSessionToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    /** Issues a new session token (with expiry) onto the profile. */
    public void issueSession(StudentProfile profile) {
        profile.setSessionToken(issueSessionToken());
        profile.setSessionTokenExpiresAt(LocalDateTime.now().plusHours(SESSION_LIFETIME_HOURS));
        profile.setFailedLoginAttempts(0);
        profile.setLockedUntil(null);
    }

    /** Issues a new session token (with expiry) onto the teacher account. */
    public void issueSession(Teacher teacher) {
        teacher.setSessionToken(issueSessionToken());
        teacher.setSessionTokenExpiresAt(LocalDateTime.now().plusHours(SESSION_LIFETIME_HOURS));
        teacher.setFailedLoginAttempts(0);
        teacher.setLockedUntil(null);
    }

    /**
     * Flexible Student Login verification:
     * - Identifier must exist as a student number OR email.
     * - Full name is OPTIONAL; when supplied it must plausibly match the
     *   registered record (case-insensitive, whitespace-insensitive, token-based).
     * - Accounts upgraded with a password must supply it; legacy accounts
     *   (passwordHash == null) ignore the password and are flagged for the
     *   controller to return requiresUpgrade.
     */
    public StudentProfile authenticateStudent(String rawIdentifier, String rawName, String password) {
        if (rawIdentifier == null || rawIdentifier.trim().isEmpty()) {
            throw new IllegalArgumentException("Student number or email cannot be empty.");
        }

        String identifier = rawIdentifier.trim();
        boolean isEmail = identifier.contains("@");
        Optional<StudentProfile> existing = isEmail
                ? studentRepository.findByEmailIgnoreCase(identifier)
                : studentRepository.findByStudentNumber(identifier);
        if (existing.isEmpty()) {
            throw new IllegalArgumentException(isEmail
                    ? "Student account not found with email '" + identifier + "'. Please sign up first."
                    : "Student account not found with ID '" + identifier + "'. Please sign up first.");
        }

        StudentProfile profile = existing.get();

        if (isLockedOut(profile)) {
            throw new IllegalArgumentException(lockoutMessage(profile));
        }

        if (rawName != null && !rawName.trim().isEmpty()
                && !isFlexibleNameMatch(profile.getFullName(), rawName)) {
            throw new IllegalArgumentException("Entered name '" + rawName.trim()
                + "' does not match registered record for '" + identifier
                + "'. Please check your credentials or sign up first.");
        }

        if (profile.getPasswordHash() != null) {
            if (password == null || password.isEmpty()) {
                throw new IllegalArgumentException("Password is required. This account was upgraded with a password.");
            }
            if (!PasswordHasher.verify(password, profile.getPasswordHash())) {
                // Throttle: record the failure and lock after repeated misses.
                registerFailedLogin(profile);
                throw new IllegalArgumentException("Incorrect password for '" + identifier + "'.");
            }
            profile.setFailedLoginAttempts(0);
            profile.setLockedUntil(null);
        }

        // NOTE: Do NOT create a GameSession here.
        // Session creation and startTime stamping happen later, when the student
        // joins a room and then explicitly begins Phase 1 (first attempt submission).
        // Creating a session at login would start every student's timer simultaneously
        // regardless of when they actually open Phase 1.

        return profile;
    }

    /**
     * Migration path for pre-password student accounts: verifies identity the
     * same way login does (student number OR email + flexible name match), then
     * attaches the student's email and password. Accounts that already have a
     * password cannot be re-claimed here — they must sign in normally.
     */
    public StudentProfile upgradeStudentCredentials(String rawIdentifier, String rawName,
                                                    String rawEmail, String password) {
        if (rawIdentifier == null || rawIdentifier.trim().isEmpty()) {
            throw new IllegalArgumentException("Student number or email cannot be empty.");
        }

        String email = (rawEmail != null) ? rawEmail.trim() : "";
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Please enter a valid email address.");
        }
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters.");
        }

        String identifier = rawIdentifier.trim();
        boolean isEmail = identifier.contains("@");
        Optional<StudentProfile> existing = isEmail
                ? studentRepository.findByEmailIgnoreCase(identifier)
                : studentRepository.findByStudentNumber(identifier);
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Student account not found. Please sign up first.");
        }
        StudentProfile profile = existing.get();

        if (rawName != null && !rawName.trim().isEmpty()
                && !isFlexibleNameMatch(profile.getFullName(), rawName)) {
            throw new IllegalArgumentException("Entered name '" + rawName.trim()
                + "' does not match registered record for '" + identifier
                + "'. Please check your credentials.");
        }
        if (profile.getPasswordHash() != null) {
            throw new IllegalArgumentException("Account '" + identifier + "' already has a password. Please sign in instead.");
        }

        Optional<StudentProfile> emailOwner = studentRepository.findByEmailIgnoreCase(email);
        if (emailOwner.isPresent() && !emailOwner.get().getStudentNumber().equalsIgnoreCase(profile.getStudentNumber())) {
            throw new IllegalArgumentException("Email '" + email + "' is already used by another student account.");
        }

        profile.setEmail(email);
        profile.setPasswordHash(PasswordHasher.hash(password));
        return studentRepository.save(profile);
    }

    /**
     * Teacher login with password verification.
     *
     * Migration path: teachers created before passwords existed have a null
     * passwordHash — their FIRST successful login claims the account by storing
     * the supplied password. Afterwards the stored hash is verified.
     */
    public Teacher authenticateTeacher(String rawEmail, String password, String rawName) {
        String email = (rawEmail != null) ? rawEmail.trim() : "";
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (!email.toLowerCase().endsWith("@gmail.com")) {
            throw new IllegalArgumentException("Email must be a valid @gmail.com address.");
        }

        boolean passwordProvided = password != null && !password.trim().isEmpty();
        String trimmedPassword = passwordProvided ? password.trim() : null;

        Optional<Teacher> opt = teacherRepository.findByEmailIgnoreCase(email);
        Teacher teacher;
        if (opt.isPresent()) {
            teacher = opt.get();
            if (isLockedOut(teacher)) {
                throw new IllegalArgumentException(lockoutMessage(teacher));
            }
            if (teacher.getPasswordHash() == null) {
                // Legacy pre-password account: signing in without a password
                // stays allowed. Supplying one claims and secures the account.
                if (passwordProvided) {
                    teacher.setPasswordHash(PasswordHasher.hash(trimmedPassword));
                }
            } else {
                if (!passwordProvided) {
                    throw new IllegalArgumentException("This account has a password. Please enter it to sign in.");
                }
                if (!PasswordHasher.verify(trimmedPassword, teacher.getPasswordHash())) {
                    registerFailedLogin(teacher);
                    throw new IllegalArgumentException("Incorrect password for '" + email + "'.");
                }
            }
        } else {
            if (!passwordProvided) {
                throw new IllegalArgumentException("Teacher account not found for '" + email + "'. Please switch to Sign Up.");
            }
            // Legacy rooms: rooms created before teacher accounts existed only
            // carry a teacherEmail. Claiming them now requires a password, which
            // is set on the newly created teacher account.
            List<Room> existingRooms = roomRepository.findByTeacherEmailIgnoreCaseOrderByCreatedAtDesc(email);
            if (existingRooms.isEmpty()) {
                throw new IllegalArgumentException("Teacher account not found for '" + email + "'. Please switch to Sign Up.");
            }
            String existingName = (rawName != null && !rawName.trim().isEmpty())
                    ? rawName.trim()
                    : existingRooms.get(0).getTeacherName();
            teacher = teacherRepository.save(new Teacher(email, existingName));
            teacher.setPasswordHash(PasswordHasher.hash(trimmedPassword));
            for (Room r : existingRooms) {
                if (r.getTeacher() == null) {
                    r.setTeacher(teacher);
                    roomRepository.save(r);
                }
            }
        }

        if (rawName != null && !rawName.trim().isEmpty()) {
            teacher.setFullName(rawName.trim());
        }
        issueSession(teacher);
        return teacherRepository.save(teacher);
    }

    /**
     * Teacher registration. Requires a password of at least 8 characters.
     * Re-registering an email that already has a password is rejected.
     */
    public Teacher registerTeacher(String rawEmail, String password, String rawName) {
        String email = (rawEmail != null) ? rawEmail.trim() : "";
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (!email.toLowerCase().endsWith("@gmail.com")) {
            throw new IllegalArgumentException("Email must be a valid @gmail.com address.");
        }
        if (rawName == null || rawName.trim().isEmpty()) {
            throw new IllegalArgumentException("Full name is required.");
        }
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters.");
        }

        Optional<Teacher> opt = teacherRepository.findByEmailIgnoreCase(email);
        if (opt.isPresent() && opt.get().getPasswordHash() != null) {
            throw new IllegalArgumentException("Teacher account '" + email + "' is already registered. Please sign in instead.");
        }

        Teacher teacher = opt.orElseGet(() -> new Teacher(email, rawName.trim()));
        teacher.setFullName(rawName.trim());
        teacher.setPasswordHash(PasswordHasher.hash(password));
        issueSession(teacher);
        return teacherRepository.save(teacher);
    }

    /**
     * Initiates the teacher forgot-password flow. Always returns a neutral
     * response so account existence is not revealed; returns true only when a
     * reset email was actually sent for an existing account.
     */
    public boolean requestTeacherPasswordReset(String rawEmail) throws Exception {
        String email = (rawEmail != null) ? rawEmail.trim() : "";
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Email is required.");
        }
        Optional<Teacher> opt = teacherRepository.findByEmailIgnoreCase(email);
        if (opt.isEmpty()) {
            return false;
        }
        Teacher teacher = opt.get();
        teacher.setResetToken(issueSessionToken());
        teacher.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_MINUTES));
        teacherRepository.save(teacher);
        emailReportService.sendPasswordResetEmail(email, teacher.getResetToken());
        return true;
    }

    /**
     * Completes the teacher password reset. Invalidates all existing sessions
     * so a leaked reset link cannot be combined with a stolen token.
     */
    public void resetTeacherPassword(String token, String newPassword) {
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Reset link is invalid or has expired.");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters.");
        }
        Optional<Teacher> opt = teacherRepository.findByResetToken(token.trim());
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("Reset link is invalid or has expired.");
        }
        Teacher teacher = opt.get();
        if (teacher.getResetTokenExpiresAt() == null
                || LocalDateTime.now().isAfter(teacher.getResetTokenExpiresAt())) {
            teacher.setResetToken(null);
            teacher.setResetTokenExpiresAt(null);
            teacherRepository.save(teacher);
            throw new IllegalArgumentException("Reset link is invalid or has expired.");
        }
        teacher.setPasswordHash(PasswordHasher.hash(newPassword));
        teacher.setResetToken(null);
        teacher.setResetTokenExpiresAt(null);
        teacher.setSessionToken(null);
        teacher.setSessionTokenExpiresAt(null);
        teacher.setFailedLoginAttempts(0);
        teacher.setLockedUntil(null);
        teacherRepository.save(teacher);
    }

    /** Changes the teacher's password after verifying the current one. */
    public void changeTeacherPassword(Teacher teacher, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters.");
        }
        if (teacher.getPasswordHash() != null) {
            if (currentPassword == null || !PasswordHasher.verify(currentPassword, teacher.getPasswordHash())) {
                throw new IllegalArgumentException("Current password is incorrect.");
            }
        }
        teacher.setPasswordHash(PasswordHasher.hash(newPassword));
        teacherRepository.save(teacher);
    }

    /** Changes the student's password after verifying the current one. */
    public void changeStudentPassword(StudentProfile student, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters.");
        }
        if (student.getPasswordHash() != null) {
            if (currentPassword == null || !PasswordHasher.verify(currentPassword, student.getPasswordHash())) {
                throw new IllegalArgumentException("Current password is incorrect.");
            }
        }
        student.setPasswordHash(PasswordHasher.hash(newPassword));
        studentRepository.save(student);
    }

    private boolean isLockedOut(StudentProfile profile) {
        return profile.getLockedUntil() != null && LocalDateTime.now().isBefore(profile.getLockedUntil());
    }

    private boolean isLockedOut(Teacher teacher) {
        return teacher.getLockedUntil() != null && LocalDateTime.now().isBefore(teacher.getLockedUntil());
    }

    private String lockoutMessage(StudentProfile profile) {
        long minutes = java.time.Duration.between(LocalDateTime.now(), profile.getLockedUntil()).toMinutes();
        return "Too many failed sign-in attempts. Please try again in "
                + Math.max(minutes, 1) + " minute(s).";
    }

    private String lockoutMessage(Teacher teacher) {
        long minutes = java.time.Duration.between(LocalDateTime.now(), teacher.getLockedUntil()).toMinutes();
        return "Too many failed sign-in attempts. Please try again in "
                + Math.max(minutes, 1) + " minute(s).";
    }

    private void registerFailedLogin(StudentProfile profile) {
        int attempts = profile.getFailedLoginAttempts() + 1;
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            profile.setFailedLoginAttempts(0);
            profile.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
        } else {
            profile.setFailedLoginAttempts(attempts);
        }
        studentRepository.save(profile);
    }

    private void registerFailedLogin(Teacher teacher) {
        int attempts = teacher.getFailedLoginAttempts() + 1;
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            teacher.setFailedLoginAttempts(0);
            teacher.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
        } else {
            teacher.setFailedLoginAttempts(attempts);
        }
        teacherRepository.save(teacher);
    }

    /**
     * Flexible name comparison:
     * - Case-insensitive
     * - Strips leading/trailing whitespace and collapses multiple spaces
     * - Exact match, or every significant token (>= 4 chars) of the entered name
     *   must appear as a token (or a >= 4 char substring of a token) of the
     *   registered name. Short fragments (e.g. "mar" or "s") alone do not pass.
     */
    public boolean isFlexibleNameMatch(String registeredName, String inputName) {
        if (inputName == null || inputName.trim().isEmpty()) {
            return false;
        }
        if (registeredName == null || registeredName.trim().isEmpty()) {
            return false;
        }

        String normReg = registeredName.trim().replaceAll("\\s+", " ").toLowerCase();
        String normInput = inputName.trim().replaceAll("\\s+", " ").toLowerCase();

        // 1. Exact or case-insensitive match
        if (normReg.equals(normInput)) {
            return true;
        }

        // 2. The entered name fully contains the registered name (e.g. registered
        //    "Maria Santos" entered as "Maria Santos Cruz"). The reverse direction
        //    is NOT accepted — it would let short fragments authenticate.
        if (normInput.contains(normReg)) {
            return true;
        }

        // 2. Token overlap: every significant token of the entered name must
        //    match a registered token. Substring matching only applies to
        //    fragments of 4+ characters so tiny guesses can't authenticate.
        String[] regParts = normReg.split("[\\s,-]+");
        String[] inputParts = normInput.split("[\\s,-]+");
        boolean anySignificantToken = false;
        for (String ip : inputParts) {
            if (ip.length() < 4) continue;
            anySignificantToken = true;
            boolean found = false;
            for (String rp : regParts) {
                if (rp.equals(ip)) {
                    found = true;
                    break;
                }
                if (rp.length() >= 4 && (rp.contains(ip) || ip.contains(rp))) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }

        return anySignificantToken;
    }
}
