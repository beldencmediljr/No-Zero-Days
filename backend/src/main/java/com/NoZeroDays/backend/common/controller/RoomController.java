package com.NoZeroDays.backend.common.controller;

import com.NoZeroDays.backend.common.model.AttemptLog;
import com.NoZeroDays.backend.common.model.GameSession;
import com.NoZeroDays.backend.common.model.Room;
import com.NoZeroDays.backend.common.model.RoomParticipant;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.repository.AttemptLogRepository;
import com.NoZeroDays.backend.common.repository.GameSessionRepository;
import com.NoZeroDays.backend.common.repository.RoomParticipantRepository;
import com.NoZeroDays.backend.common.repository.RoomRepository;
import com.NoZeroDays.backend.common.repository.StudentProfileRepository;

import com.NoZeroDays.backend.common.model.Teacher;
import com.NoZeroDays.backend.common.repository.TeacherRepository;

import com.NoZeroDays.backend.common.auth.AuthInterceptor;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private RoomParticipantRepository roomParticipantRepository;

    @Autowired
    private StudentProfileRepository studentRepository;

    @Autowired
    private GameSessionRepository gameSessionRepository;

    @Autowired
    private AttemptLogRepository attemptLogRepository;

    @Autowired
    private com.NoZeroDays.backend.common.repository.ScenarioSnapshotRepository scenarioSnapshotRepository;

    @Autowired
    private com.NoZeroDays.backend.common.service.EmailReportService emailReportService;

    @Autowired
    private com.NoZeroDays.backend.common.service.AuthService authService;

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private static final String[] MODULES = {
        "M1_MATH", "M1_MATH",
        "M2_MULTIPLIERS", "M2_MULTIPLIERS",
        "M3_BUREAUCRACY", "M3_BUREAUCRACY",
        "M4_TRIBUNAL"
    };
    private static final int[] PHASES = {1, 2, 1, 2, 1, 2, 1};
    private static final String[] PHASE_TITLES = {
        "Phase 1: Basic Gross Pay",
        "Phase 2: Tardiness Deductions",
        "Phase 3: Overtime Premiums",
        "Phase 4: Regular Holiday Pay",
        "Phase 5: SSS Deductions",
        "Phase 6: PhilHealth Premiums",
        "Phase 7: Net Payroll Boardroom"
    };

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // 0A. TEACHER REGISTRATION (Master Account Creation)
    // -------------------------------------------------------------------------
    @PostMapping(value = {"/teachers/register", "/teachers/register/"})
    public ResponseEntity<?> registerTeacher(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", body.getOrDefault("teacherEmail", "")).trim();
        String fullName = body.getOrDefault("fullName", body.getOrDefault("teacherName", "")).trim();
        String password = body.getOrDefault("password", "");

        try {
            Teacher teacher = authService.registerTeacher(email, password, fullName);
            Map<String, Object> resp = new HashMap<>();
            resp.put("id", teacher.getId());
            resp.put("email", teacher.getEmail());
            resp.put("fullName", teacher.getFullName());
            resp.put("teacherName", teacher.getFullName());
            resp.put("teacherEmail", teacher.getEmail());
            resp.put("token", teacher.getSessionToken());
            resp.put("role", "TEACHER");
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // 0B. TEACHER LOGIN (Master Account Verification)
    // -------------------------------------------------------------------------
    @PostMapping(value = {"/teachers/login", "/teachers/login/"})
    public ResponseEntity<?> loginTeacher(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", body.getOrDefault("teacherEmail", "")).trim();
        String fullName = body.getOrDefault("fullName", body.getOrDefault("teacherName", "")).trim();
        String password = body.getOrDefault("password", "");

        try {
            Teacher teacher = authService.authenticateTeacher(email, password, fullName);
            Map<String, Object> resp = new HashMap<>();
            resp.put("id", teacher.getId());
            resp.put("email", teacher.getEmail());
            resp.put("fullName", teacher.getFullName());
            resp.put("teacherName", teacher.getFullName());
            resp.put("teacherEmail", teacher.getEmail());
            resp.put("token", teacher.getSessionToken());
            resp.put("role", "TEACHER");
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // 1. CREATE ROOM
    // -------------------------------------------------------------------------
    @PostMapping("/rooms/create")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String authedEmail = (String) request.getAttribute(AuthInterceptor.ATTR_TEACHER_EMAIL);
        if (authedEmail == null || authedEmail.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Teacher authentication required."));
        }

        String teacherName = body.getOrDefault("teacherName", "Instructor");
        String section = body.getOrDefault("section", "");
        // The room always belongs to the authenticated teacher — a body-supplied
        // teacherEmail must never claim another teacher's identity.
        String teacherEmail = authedEmail;
        String customCode = body.get("roomCode");

        String roomCode;
        if (customCode != null && !customCode.trim().isEmpty()) {
            roomCode = customCode.trim().toUpperCase();
        } else {
            roomCode = generateUniqueRoomCode();
        }

        if (roomCode.length() > 32) {
            return ResponseEntity.badRequest().body(Map.of("error", "Room code must be 32 characters or fewer."));
        }
        if (teacherName != null && teacherName.length() > 255) {
            return ResponseEntity.badRequest().body(Map.of("error", "Teacher name is too long (max 255 characters)."));
        }

        // Resolve the authenticated teacher's master account
        Teacher teacher = teacherRepository.findByEmailIgnoreCase(teacherEmail.trim())
                .orElseGet(() -> teacherRepository.save(new Teacher(teacherEmail.trim(), teacherName)));

        // Check if room code already exists
        Optional<Room> existing = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        Room room;
        if (existing.isPresent()) {
            room = existing.get();
            // A room code may only be reclaimed by the teacher who owns it.
            boolean sameEmail = room.getTeacherEmail() != null
                    && teacherEmail.trim().equalsIgnoreCase(room.getTeacherEmail().trim());
            if (!sameEmail) {
                return ResponseEntity.status(409).body(Map.of("error",
                        "Room code '" + roomCode + "' is already in use by another teacher."));
            }
            room.setTeacherName(teacherName);
            room.setSection(section);
            room.setTeacherEmail(teacherEmail.trim());
            room.setTeacher(teacher);
            room.setStatus("WAITING");
            room.setCreatedAt(LocalDateTime.now());
            room.setStartedAt(null);
        } else {
            room = new Room(roomCode, teacherName, section, teacherEmail.trim());
            room.setTeacher(teacher);
        }
        room = roomRepository.save(room);

        Map<String, Object> resp = new HashMap<>();
        resp.put("roomCode", room.getRoomCode());
        resp.put("teacherName", room.getTeacherName());
        resp.put("teacherEmail", room.getTeacherEmail());
        resp.put("section", room.getSection());
        resp.put("status", room.getStatus());
        resp.put("createdAt", room.getCreatedAt());
        resp.put("teacherId", teacher.getId());

        return ResponseEntity.ok(resp);
    }

    // -------------------------------------------------------------------------
    // 1B. GET TEACHER ROOMS (List all rooms/sections for persistent teacher)
    // -------------------------------------------------------------------------
    @GetMapping("/teachers/rooms")
    public ResponseEntity<?> getTeacherRooms(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String teacherEmail,
            @RequestParam(required = false) String teacherName,
            @RequestParam(required = false) Long teacherId,
            HttpServletRequest request) {
        // Identity always comes from the authenticated session, never from query params.
        String authedEmail = (String) request.getAttribute(AuthInterceptor.ATTR_TEACHER_EMAIL);
        if (authedEmail == null || authedEmail.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Teacher authentication required."));
        }

        List<Room> rooms = Collections.emptyList();
        Optional<Teacher> t = teacherRepository.findByEmailIgnoreCase(authedEmail.trim());
        if (t.isPresent()) {
            rooms = roomRepository.findByTeacherOrderByCreatedAtDesc(t.get());
        }
        if (rooms.isEmpty()) {
            rooms = roomRepository.findByTeacherEmailIgnoreCaseOrderByCreatedAtDesc(authedEmail.trim());
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Room r : rooms) {
            Map<String, Object> map = new HashMap<>();
            map.put("roomCode", r.getRoomCode());
            map.put("section", r.getSection() != null ? r.getSection() : "Default Section");
            map.put("teacherName", r.getTeacherName());
            map.put("teacherEmail", r.getTeacherEmail());
            map.put("status", r.getStatus());
            map.put("createdAt", r.getCreatedAt());
            map.put("startedAt", r.getStartedAt());
            map.put("participantCount", roomParticipantRepository.countByRoom(r));
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    // -------------------------------------------------------------------------
    // 1C. FIND ROOM BY TEACHER (Session recovery & section lookup)
    // -------------------------------------------------------------------------
    @GetMapping("/rooms/find-by-teacher")
    public ResponseEntity<?> findByTeacher(
            @RequestParam(required = false) String teacherEmail,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String teacherName,
            @RequestParam(required = false) String section,
            HttpServletRequest request) {
        String authedEmail = (String) request.getAttribute(AuthInterceptor.ATTR_TEACHER_EMAIL);
        if (authedEmail == null || authedEmail.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Teacher authentication required."));
        }

        List<Room> rooms = roomRepository.findByTeacherEmailIgnoreCaseOrderByCreatedAtDesc(authedEmail.trim());

        if (rooms.isEmpty()) {
            return ResponseEntity.ok(Map.of("found", false));
        }

        Room matched = rooms.get(0);
        if (section != null && !section.isBlank()) {
            for (Room r : rooms) {
                if (section.trim().equalsIgnoreCase(r.getSection())) {
                    matched = r;
                    break;
                }
            }
        }

        List<Map<String, Object>> roomList = new ArrayList<>();
        for (Room r : rooms) {
            Map<String, Object> map = new HashMap<>();
            map.put("roomCode", r.getRoomCode());
            map.put("section", r.getSection());
            map.put("teacherName", r.getTeacherName());
            map.put("teacherEmail", r.getTeacherEmail());
            map.put("status", r.getStatus());
            map.put("createdAt", r.getCreatedAt());
            map.put("participantCount", roomParticipantRepository.countByRoom(r));
            roomList.add(map);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("found", true);
        resp.put("roomCode", matched.getRoomCode());
        resp.put("section", matched.getSection());
        resp.put("teacherName", matched.getTeacherName());
        resp.put("teacherEmail", matched.getTeacherEmail());
        resp.put("status", matched.getStatus());
        resp.put("rooms", roomList);

        return ResponseEntity.ok(resp);
    }

    // -------------------------------------------------------------------------
    // 2. GET ROOM STATUS (Polled by StudentWaiting)
    // -------------------------------------------------------------------------
    @GetMapping("/rooms/{roomCode}/status")
    public ResponseEntity<?> getRoomStatus(@PathVariable String roomCode) {
        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }

        Room room = roomOpt.get();
        long count = roomParticipantRepository.countByRoom(room);

        Map<String, Object> resp = new HashMap<>();
        resp.put("roomCode", room.getRoomCode());
        resp.put("status", room.getStatus());
        resp.put("participantCount", count);
        resp.put("teacherName", room.getTeacherName());
        resp.put("teacherEmail", room.getTeacherEmail());
        resp.put("section", room.getSection());
        resp.put("startedAt", room.getStartedAt());

        return ResponseEntity.ok(resp);
    }

    // -------------------------------------------------------------------------
    // 3. GET ROOM PARTICIPANTS (Polled by TeacherLobby)
    // -------------------------------------------------------------------------
    @GetMapping("/rooms/{roomCode}/participants")
    public ResponseEntity<?> getRoomParticipants(@PathVariable String roomCode, HttpServletRequest request) {
        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }

        Room room = roomOpt.get();
        ResponseEntity<?> ownershipError = requireRoomOwner(room, request);
        if (ownershipError != null) return ownershipError;

        List<RoomParticipant> participants = roomParticipantRepository.findByRoomOrderByJoinedAtAsc(room);

        List<Map<String, Object>> participantList = participants.stream().map(p -> {
            Map<String, Object> item = new HashMap<>();
            StudentProfile s = p.getStudentProfile();
            item.put("studentNumber", s.getStudentNumber());
            item.put("fullName", s.getFullName());
            item.put("section", s.getSection() != null ? s.getSection() : room.getSection());
            item.put("joinedAt", p.getJoinedAt());
            item.put("status", p.getStatus() != null ? p.getStatus() : "ACCEPTED");
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> resp = new HashMap<>();
        resp.put("roomCode", room.getRoomCode());
        resp.put("participantCount", participantList.size());
        resp.put("participants", participantList);

        return ResponseEntity.ok(resp);
    }

    // -------------------------------------------------------------------------
    // 4. START ROOM SESSION (Triggered by TeacherLobby)
    // -------------------------------------------------------------------------
    @PostMapping("/rooms/{roomCode}/start")
    public ResponseEntity<?> startRoom(@PathVariable String roomCode, HttpServletRequest request) {
        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }

        Room room = roomOpt.get();
        ResponseEntity<?> ownershipError = requireRoomOwner(room, request);
        if (ownershipError != null) return ownershipError;

        if ("COMPLETED".equalsIgnoreCase(room.getStatus())) {
            return ResponseEntity.status(409).body(Map.of("error", "This room session has already been completed."));
        }
        if ("ACTIVE".equalsIgnoreCase(room.getStatus())) {
            Map<String, Object> already = new HashMap<>();
            already.put("success", true);
            already.put("alreadyActive", true);
            already.put("roomCode", room.getRoomCode());
            already.put("status", "ACTIVE");
            already.put("startedAt", room.getStartedAt());
            return ResponseEntity.ok(already);
        }

        room.setStatus("ACTIVE");
        room.setStartedAt(LocalDateTime.now());
        roomRepository.save(room);

        // Ensure all registered participants have an active GameSession initialized.
        // startTime is intentionally left null here — it will be stamped on the
        // student's very first Phase 1 attempt, not at room activation.
        List<RoomParticipant> participants = roomParticipantRepository.findByRoomOrderByJoinedAtAsc(room);
        for (RoomParticipant p : participants) {
            StudentProfile profile = p.getStudentProfile();
            Optional<GameSession> latest = gameSessionRepository
                    .findFirstByStudentProfileAndRoomCodeOrderByIdDesc(profile, room.getRoomCode());
            if (latest.isEmpty() || !"ACTIVE".equalsIgnoreCase(latest.get().getStatus())) {
                GameSession newSession = new GameSession(profile);
                newSession.setCurrentModule("M1_MATH");
                newSession.setCurrentPhase(1);
                newSession.setStatus("ACTIVE");
                newSession.setRoomCode(room.getRoomCode());
                // startTime stays null — set only when student begins Phase 1
                gameSessionRepository.save(newSession);
            }
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("roomCode", room.getRoomCode());
        resp.put("status", "ACTIVE");
        resp.put("startedAt", room.getStartedAt());

        return ResponseEntity.ok(resp);
    }

    // -------------------------------------------------------------------------
    // 4B. CLOSE ROOM (Archive — non-destructive)
    // -------------------------------------------------------------------------
    @PostMapping("/rooms/{roomCode}/close")
    public ResponseEntity<?> closeRoom(@PathVariable String roomCode, HttpServletRequest request) {
        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }

        Room room = roomOpt.get();
        ResponseEntity<?> ownershipError = requireRoomOwner(room, request);
        if (ownershipError != null) return ownershipError;

        if ("COMPLETED".equalsIgnoreCase(room.getStatus())) {
            Map<String, Object> already = new HashMap<>();
            already.put("success", true);
            already.put("alreadyClosed", true);
            already.put("roomCode", room.getRoomCode());
            already.put("status", "COMPLETED");
            return ResponseEntity.ok(already);
        }

        // Archive only: student data, sessions, and attempt history are kept.
        room.setStatus("COMPLETED");
        roomRepository.save(room);

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("roomCode", room.getRoomCode());
        resp.put("status", "COMPLETED");
        return ResponseEntity.ok(resp);
    }

    // -------------------------------------------------------------------------
    // 4C. DELETE ROOM (Owner-only; removes only this room's records)
    // -------------------------------------------------------------------------
    @DeleteMapping("/rooms/{roomCode}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteRoom(@PathVariable String roomCode, HttpServletRequest request) {
        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }

        Room room = roomOpt.get();
        ResponseEntity<?> ownershipError = requireRoomOwner(room, request);
        if (ownershipError != null) return ownershipError;

        // Cascade is scoped strictly to this room: participants, and the
        // sessions/attempts tagged with this room's code. Untagged free-play
        // records and other rooms' data are never touched.
        List<RoomParticipant> participants = roomParticipantRepository.findByRoomOrderByJoinedAtAsc(room);
        for (RoomParticipant p : participants) {
            StudentProfile student = p.getStudentProfile();
            if (student == null) continue;
            gameSessionRepository.deleteByStudentProfileAndRoomCode(student, room.getRoomCode());
            attemptLogRepository.deleteByStudentProfileAndRoomCode(student, room.getRoomCode());
        }
        roomParticipantRepository.deleteByRoom(room);
        roomRepository.delete(room);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Room " + roomCode + " and its classroom records have been deleted."));
    }

    // -------------------------------------------------------------------------
    // 5. STUDENT JOINS ROOM
    // -------------------------------------------------------------------------
    @PostMapping("/rooms/join")
    @Transactional
    public ResponseEntity<?> joinRoom(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String roomCode = body.get("roomCode");
        String studentNumber = body.get("studentNumber");
        String fullName = body.get("fullName");
        String section = body.get("section");

        String authedStudentNumber = (String) request.getAttribute(AuthInterceptor.ATTR_STUDENT_NUMBER);
        if (authedStudentNumber == null || authedStudentNumber.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Student authentication required."));
        }
        if (studentNumber == null || !studentNumber.trim().equalsIgnoreCase(authedStudentNumber)) {
            return ResponseEntity.status(403).body(Map.of("error", "You can only join a room with your own student account."));
        }

        if (roomCode == null || roomCode.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Room code is required."));
        }
        if (roomCode.trim().length() > 32) {
            return ResponseEntity.badRequest().body(Map.of("error", "Room code must be 32 characters or fewer."));
        }

        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode.trim());
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room code '" + roomCode.toUpperCase() + "' does not exist. Check with your teacher."));
        }
        Room room = roomOpt.get();

        StudentProfile profile = studentRepository.findByStudentNumber(authedStudentNumber).orElse(null);
        if (profile == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Student account not found. Please sign up first."));
        }

        boolean alreadyParticipant = roomParticipantRepository
                .findByRoomAndStudentProfile(room, profile).isPresent();

        // A completed room no longer accepts new participants; existing
        // participants may still re-join to resume their records.
        if ("COMPLETED".equalsIgnoreCase(room.getStatus()) && !alreadyParticipant) {
            return ResponseEntity.status(409).body(Map.of("error", "This room session has already been completed."));
        }

        // Add to room participants if not already present
        Optional<RoomParticipant> participantOpt = roomParticipantRepository.findByRoomAndStudentProfile(room, profile);
        if (participantOpt.isEmpty()) {
            RoomParticipant participant = new RoomParticipant(room, profile, "ACCEPTED");
            try {
                roomParticipantRepository.save(participant);
            } catch (DataIntegrityViolationException e) {
                // Concurrent join (double click / second tab) — already a participant, treat as success.
            }
        } else {
            RoomParticipant participant = participantOpt.get();
            participant.setStatus("ACCEPTED");
            roomParticipantRepository.save(participant);
        }

        // Wipe pre-room and room progress ONLY on the first join of this room.
        // Existing participants re-join to RESUME their records — wiping here
        // would erase their in-room progress on every reconnect.
        boolean progressReset = false;
        if (!alreadyParticipant) {
            progressReset = resetPreRoomProgress(profile, room.getRoomCode());
        }

        // Initialize active game session if none exists for this room.
        // startTime is left null — it gets stamped on the student's first Phase 1 submission.
        Optional<GameSession> latest = gameSessionRepository
                .findFirstByStudentProfileAndRoomCodeOrderByIdDesc(profile, room.getRoomCode());
        if (latest.isEmpty() || !"ACTIVE".equalsIgnoreCase(latest.get().getStatus())) {
            GameSession newSession = new GameSession(profile);
            newSession.setCurrentModule("M1_MATH");
            newSession.setCurrentPhase(1);
            newSession.setStatus("ACTIVE");
            newSession.setRoomCode(room.getRoomCode());
            // Do NOT copy room.getStartedAt() — that would start every student's
            // timer at the same instant (room activation), not their individual start.
            gameSessionRepository.save(newSession);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("roomCode", room.getRoomCode());
        resp.put("student", profile);
        resp.put("roomStatus", room.getStatus());
        resp.put("progressReset", progressReset);

        return ResponseEntity.ok(resp);
    }

    /**
     * Wipes pre-room (free-play) progress and any prior progress for this room
     * when a student first enters it, ensuring First Attempt progress starts
     * fresh with accurate timer tracking. Scenario snapshots (scenario-consistency
     * locks) are cleared only when free-play rows were actually removed, so
     * another room's mid-phase locks survive.
     */
    private boolean resetPreRoomProgress(StudentProfile student, String roomCode) {
        long deletedNullSessions = gameSessionRepository.deleteByStudentProfileAndRoomCodeIsNull(student);
        long deletedNullAttempts = attemptLogRepository.deleteByStudentProfileAndRoomCodeIsNull(student);

        long deletedRoomSessions = 0;
        long deletedRoomAttempts = 0;
        if (roomCode != null && !roomCode.isBlank()) {
            deletedRoomSessions = gameSessionRepository.deleteByStudentProfileAndRoomCode(student, roomCode.trim());
            deletedRoomAttempts = attemptLogRepository.deleteByStudentProfileAndRoomCode(student, roomCode.trim());
        }

        if (deletedNullSessions > 0 || deletedNullAttempts > 0) {
            scenarioSnapshotRepository.deleteByStudentProfile(student);
        }
        return deletedNullSessions > 0 || deletedNullAttempts > 0
                || deletedRoomSessions > 0 || deletedRoomAttempts > 0;
    }

    // -------------------------------------------------------------------------
    // 6. TEACHER ADDS STUDENT TO ROOM (WITH VALIDATION & INVITATION)
    // -------------------------------------------------------------------------
    @PostMapping("/rooms/{roomCode}/students")
    public ResponseEntity<?> addStudentToRoom(@PathVariable String roomCode, @RequestBody Map<String, String> body, HttpServletRequest request) {
        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }
        Room room = roomOpt.get();
        ResponseEntity<?> ownershipError = requireRoomOwner(room, request);
        if (ownershipError != null) return ownershipError;

        String studentNumber = body.get("studentNumber");
        String fullName = body.get("fullName");

        if (studentNumber == null || studentNumber.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student number is required."));
        }
        if (fullName == null || fullName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student full name is required."));
        }

        String trimmedNumber = studentNumber.trim();
        String trimmedName = fullName.trim();

        // 1. Validation: student number must exist in database
        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(trimmedNumber);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                "error", "Student number '" + trimmedNumber + "' does not exist. Student must register an account first."
            ));
        }

        StudentProfile profile = studentOpt.get();

        // 2. Validation: student name must flexibly match registered record
        if (profile.getFullName() == null || !authService.isFlexibleNameMatch(profile.getFullName(), trimmedName)) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Student name '" + trimmedName + "' does not match registered record for ID '" + trimmedNumber + "'. (Expected: " + profile.getFullName() + ")"
            ));
        }

        // 3. Check if participant already exists in this room
        Optional<RoomParticipant> participantOpt = roomParticipantRepository.findByRoomAndStudentProfile(room, profile);
        if (participantOpt.isPresent()) {
            RoomParticipant existing = participantOpt.get();
            if ("ACCEPTED".equalsIgnoreCase(existing.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Student " + profile.getFullName() + " (" + trimmedNumber + ") is already in this room."
                ));
            } else if ("INVITED".equalsIgnoreCase(existing.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Student " + profile.getFullName() + " (" + trimmedNumber + ") has already been invited to this room."
                ));
            } else {
                existing.setStatus("INVITED");
                existing.setJoinedAt(LocalDateTime.now());
                roomParticipantRepository.save(existing);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Invitation re-sent to " + profile.getFullName() + ".",
                    "student", profile
                ));
            }
        }

        RoomParticipant participant = new RoomParticipant(room, profile, "INVITED");
        roomParticipantRepository.save(participant);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Student " + profile.getFullName() + " added and invited to room.",
            "student", profile
        ));
    }

    // -------------------------------------------------------------------------
    // 6A. CHECK STUDENT INVITATIONS (Polled by Student UI)
    // -------------------------------------------------------------------------
    @GetMapping("/students/{studentNumber}/invitations")
    public ResponseEntity<?> getStudentInvitations(@PathVariable String studentNumber, HttpServletRequest request) {
        // Students may only query their own invitations.
        String authedStudentNumber = (String) request.getAttribute(AuthInterceptor.ATTR_STUDENT_NUMBER);
        if (authedStudentNumber != null && !authedStudentNumber.isBlank()
                && !studentNumber.trim().equalsIgnoreCase(authedStudentNumber)) {
            return ResponseEntity.status(403).body(Map.of("error", "You can only view your own invitations."));
        }

        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(studentNumber.trim());
        if (studentOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasInvitation", false));
        }

        StudentProfile student = studentOpt.get();
        Optional<RoomParticipant> inviteOpt =
                roomParticipantRepository.findFirstByStudentProfileAndStatusOrderByJoinedAtDesc(student, "INVITED");

        if (inviteOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasInvitation", false));
        }

        RoomParticipant p = inviteOpt.get();
        Room room = p.getRoom();

        Map<String, Object> resp = new HashMap<>();
        resp.put("hasInvitation", true);
        resp.put("roomCode", room.getRoomCode());
        resp.put("teacherName", room.getTeacherName());
        resp.put("teacherEmail", room.getTeacherEmail());
        resp.put("section", room.getSection());
        resp.put("roomStatus", room.getStatus());

        return ResponseEntity.ok(resp);
    }

    // -------------------------------------------------------------------------
    // 6B. STUDENT ACCEPTS ROOM INVITATION
    // -------------------------------------------------------------------------
    @PostMapping("/rooms/{roomCode}/invitations/accept")
    @Transactional
    public ResponseEntity<?> acceptRoomInvitation(@PathVariable String roomCode, @RequestBody Map<String, String> body, HttpServletRequest request) {
        String studentNumber = body.get("studentNumber");
        String authedStudentNumber = (String) request.getAttribute(AuthInterceptor.ATTR_STUDENT_NUMBER);
        if (authedStudentNumber == null || authedStudentNumber.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Student authentication required."));
        }
        if (studentNumber == null || !studentNumber.trim().equalsIgnoreCase(authedStudentNumber)) {
            return ResponseEntity.status(403).body(Map.of("error", "You can only accept invitations for your own account."));
        }

        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode.trim());
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }
        Room room = roomOpt.get();

        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(authedStudentNumber);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Student not found: " + studentNumber));
        }
        StudentProfile student = studentOpt.get();

        Optional<RoomParticipant> partOpt = roomParticipantRepository.findByRoomAndStudentProfile(room, student);
        if (partOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "No invitation found for room " + roomCode));
        }
        if ("COMPLETED".equalsIgnoreCase(room.getStatus()) && !"ACCEPTED".equalsIgnoreCase(partOpt.get().getStatus())) {
            return ResponseEntity.status(409).body(Map.of("error", "This room session has already been completed."));
        }

        RoomParticipant participant = partOpt.get();
        boolean wasAccepted = "ACCEPTED".equalsIgnoreCase(participant.getStatus());
        participant.setStatus("ACCEPTED");
        participant.setJoinedAt(LocalDateTime.now());
        roomParticipantRepository.save(participant);

        // Wipe pre-room and room progress ONLY on first acceptance. Re-accepting
        // an already-ACCEPTED participant must not erase their in-room records.
        boolean progressReset = wasAccepted ? false : resetPreRoomProgress(student, room.getRoomCode());

        // Ensure active game session exists for the accepting student.
        // startTime is intentionally left null — set only on Phase 1 first attempt.
        Optional<GameSession> latest = gameSessionRepository
                .findFirstByStudentProfileAndRoomCodeOrderByIdDesc(student, room.getRoomCode());
        if (latest.isEmpty() || !"ACTIVE".equalsIgnoreCase(latest.get().getStatus())) {
            GameSession newSession = new GameSession(student);
            newSession.setCurrentModule("M1_MATH");
            newSession.setCurrentPhase(1);
            newSession.setStatus("ACTIVE");
            newSession.setRoomCode(room.getRoomCode());
            // Do NOT copy room.getStartedAt() here — each student's clock must
            // start independently when they open Phase 1, not when they accept.
            gameSessionRepository.save(newSession);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "Invitation accepted.");
        resp.put("roomCode", room.getRoomCode());
        resp.put("roomStatus", room.getStatus());
        resp.put("student", student);
        resp.put("progressReset", progressReset);

        return ResponseEntity.ok(resp);
    }

    // -------------------------------------------------------------------------
    // 6C. STUDENT DECLINES ROOM INVITATION
    // -------------------------------------------------------------------------
    @PostMapping("/rooms/{roomCode}/invitations/decline")
    @Transactional
    public ResponseEntity<?> declineRoomInvitation(@PathVariable String roomCode, @RequestBody Map<String, String> body, HttpServletRequest request) {
        String studentNumber = body.get("studentNumber");
        String authedStudentNumber = (String) request.getAttribute(AuthInterceptor.ATTR_STUDENT_NUMBER);
        if (authedStudentNumber == null || authedStudentNumber.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Student authentication required."));
        }
        if (studentNumber == null || !studentNumber.trim().equalsIgnoreCase(authedStudentNumber)) {
            return ResponseEntity.status(403).body(Map.of("error", "You can only decline invitations for your own account."));
        }

        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode.trim());
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }
        Room room = roomOpt.get();

        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(authedStudentNumber);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Student not found: " + studentNumber));
        }
        StudentProfile student = studentOpt.get();

        roomParticipantRepository.deleteByRoomAndStudentProfile(room, student);
        gameSessionRepository.deleteByStudentProfileAndRoomCodeScope(student, room.getRoomCode());
        attemptLogRepository.deleteByStudentProfileAndRoomCodeScope(student, room.getRoomCode());
        scenarioSnapshotRepository.deleteByStudentProfile(student);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Room invitation declined."
        ));
    }

    // -------------------------------------------------------------------------
    // 7. TEACHER DELETES / REMOVES STUDENT FROM ROOM
    // -------------------------------------------------------------------------
    @DeleteMapping("/rooms/{roomCode}/students/{studentNumber}")
    @Transactional
    public ResponseEntity<?> removeStudentFromRoom(@PathVariable String roomCode, @PathVariable String studentNumber, HttpServletRequest request) {
        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }
        Room room = roomOpt.get();
        ResponseEntity<?> ownershipError = requireRoomOwner(room, request);
        if (ownershipError != null) return ownershipError;

        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(studentNumber);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Student not found: " + studentNumber));
        }
        StudentProfile student = studentOpt.get();

        roomParticipantRepository.deleteByRoomAndStudentProfile(room, student);
        gameSessionRepository.deleteByStudentProfileAndRoomCodeScope(student, room.getRoomCode());
        attemptLogRepository.deleteByStudentProfileAndRoomCodeScope(student, room.getRoomCode());
        scenarioSnapshotRepository.deleteByStudentProfile(student);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Student " + student.getFullName() + " (" + studentNumber + ") removed from room " + roomCode
        ));
    }

    // -------------------------------------------------------------------------
    // 8. DELETE STUDENT PROFILE (Global)
    // -------------------------------------------------------------------------
    @DeleteMapping("/students/{studentNumber:^(?!login$|register$).+$}")
    @Transactional
    public ResponseEntity<?> deleteStudentEntirely(@PathVariable String studentNumber) {
        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(studentNumber);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Student not found: " + studentNumber));
        }
        StudentProfile student = studentOpt.get();

        roomParticipantRepository.deleteByStudentProfile(student);
        attemptLogRepository.deleteByStudentProfile(student);
        gameSessionRepository.deleteByStudentProfile(student);
        studentRepository.delete(student);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Student " + studentNumber + " permanently deleted."
        ));
    }

    // -------------------------------------------------------------------------
    // 8B. STUDENT PHASE PRESENCE SIGNALS — enter / exit
    //
    // Called by the frontend whenever a student enters or leaves a phase room.
    // These two endpoints drive the accurate per-phase timer by recording the
    // exact moments the student is actively inside a phase, so idle time spent
    // on the Dashboard between phases is never counted.
    // -------------------------------------------------------------------------

    /**
     * POST /api/rooms/{roomCode}/phase-enter or /api/students/phase-enter
     *
     * Fired by the frontend when the student navigates into a phase room.
     * - If the student previously exited this phase without completing it,
     *   the gap (exitedAt -> now) is banked into accumulatedPauseSeconds so
     *   that pause time can be subtracted when computing net active time.
     * - Sets phaseEnteredAt = now() to mark the start of the new active window.
     * - Refreshes lastHeartbeatAt.
     */
    @PostMapping(value = {"/rooms/{roomCode}/phase-enter", "/students/phase-enter"})
    public ResponseEntity<?> notifyPhaseEnter(
            @PathVariable(name = "roomCode", required = false) String roomCode,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        String studentNumber = body.get("studentNumber") != null ? body.get("studentNumber").toString() : null;
        if (studentNumber == null || studentNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "studentNumber required"));
        }
        if (studentNotSelf(studentNumber, request)) {
            return ResponseEntity.status(403).body(Map.of("error", "You can only update your own session."));
        }

        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(studentNumber.trim());
        if (studentOpt.isEmpty()) return ResponseEntity.ok(Map.of("ok", true));

        StudentProfile student = studentOpt.get();

        // N5: only actual participants of a room may enter its phases.
        // Free-play calls hit /students/phase-enter (no roomCode) and skip this.
        if (roomCode != null && !roomCode.isBlank()) {
            Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode.trim());
            if (roomOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Room not found."));
            }
            if (roomParticipantRepository.findByRoomAndStudentProfile(roomOpt.get(), student).isEmpty()) {
                return ResponseEntity.status(403).body(Map.of("error",
                        "You must be a participant of this room to enter its phases."));
            }
        }

        Optional<GameSession> sessionOpt =
                gameSessionRepository.findFirstByStudentProfileAndStatusOrderByIdDesc(student, "ACTIVE");
        if (sessionOpt.isEmpty()) return ResponseEntity.ok(Map.of("ok", true));

        GameSession session = sessionOpt.get();
        LocalDateTime now = LocalDateTime.now();
        session.setLastHeartbeatAt(now);

        Integer reportedPhase = null;
        if (body != null && body.get("phase") != null) {
            try {
                reportedPhase = Integer.parseInt(body.get("phase").toString());
            } catch (Exception ignored) {}
        }
        if (reportedPhase == null || reportedPhase < 1 || reportedPhase > 7) {
            int currentP = session.getCurrentPhase();
            reportedPhase = (currentP >= 1 && currentP <= 7) ? currentP : 1;
        }

        // Track the specific phase room the student entered
        boolean isDifferentPhase = session.getActivePhase() == null || !session.getActivePhase().equals(reportedPhase);
        session.setActivePhase(reportedPhase);

        if (isDifferentPhase) {
            // New presence window for this specific phase room
            session.setPhaseEnteredAt(now);
            session.setPhaseExitedAt(null);
            session.setAccumulatedPauseSeconds(0L);
        } else if (session.getPhaseExitedAt() != null) {
            // Resuming the same phase room after a pause
            long pauseGap = ChronoUnit.SECONDS.between(session.getPhaseExitedAt(), now);
            session.setAccumulatedPauseSeconds(
                    session.getAccumulatedPauseSeconds() + Math.max(pauseGap, 0));
            session.setPhaseExitedAt(null); // clear exit marker — student is back
            if (session.getPhaseEnteredAt() == null) {
                session.setPhaseEnteredAt(now);
            }
        } else if (session.getPhaseEnteredAt() == null) {
            session.setPhaseEnteredAt(now);
        }

        Long reportedSeconds = parseClampedTimerSeconds(body);
        if (reportedSeconds != null) session.setLastRecordedSeconds(reportedSeconds);
        gameSessionRepository.save(session);

        Map<String, Object> resp = new HashMap<>();
        resp.put("ok", true);
        if (session.getPhaseEnteredAt() != null) {
            resp.put("enteredAt", session.getPhaseEnteredAt().toString());
        }
        return ResponseEntity.ok(resp);
    }

    /**
     * POST /api/rooms/{roomCode}/phase-exit or /api/students/phase-exit
     *
     * Fired by the frontend when the student leaves a phase room without
     * completing it (e.g., clicks "Return to Dashboard", logs out, switches tab, or navigates away).
     * - Pauses the timer by setting phaseExitedAt = now().
     * - Preserves phaseEnteredAt and progress so the student can resume.
     */
    @PostMapping(value = {"/rooms/{roomCode}/phase-exit", "/students/phase-exit", "/students/logout-session"})
    public ResponseEntity<?> notifyPhaseExit(
            @PathVariable(name = "roomCode", required = false) String roomCode,
            @RequestBody(required = false) Map<String, Object> body,
            HttpServletRequest request) {

        String studentNumber = (body != null && body.get("studentNumber") != null) ? body.get("studentNumber").toString() : null;
        if (studentNumber == null || studentNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "studentNumber required"));
        }
        if (studentNotSelf(studentNumber, request)) {
            return ResponseEntity.status(403).body(Map.of("error", "You can only update your own session."));
        }

        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(studentNumber.trim());
        if (studentOpt.isEmpty()) return ResponseEntity.ok(Map.of("ok", true));

        StudentProfile student = studentOpt.get();
        Optional<GameSession> sessionOpt =
                gameSessionRepository.findFirstByStudentProfileAndStatusOrderByIdDesc(student, "ACTIVE");
        if (sessionOpt.isEmpty()) return ResponseEntity.ok(Map.of("ok", true));

        GameSession session = sessionOpt.get();
        LocalDateTime now = LocalDateTime.now();

        // Nothing to pause when the student is not inside any phase room.
        if (session.getActivePhase() == null) {
            session.setLastHeartbeatAt(now);
            gameSessionRepository.save(session);
            return ResponseEntity.ok(Map.of("ok", true, "ignored", true));
        }

        Integer reportedPhase = null;
        if (body != null && body.get("phase") != null) {
            try {
                reportedPhase = Integer.parseInt(body.get("phase").toString());
            } catch (Exception ignored) {}
        }

        // Only ignore if reported phase doesn't match the student's active room
        if (reportedPhase != null && !reportedPhase.equals(session.getActivePhase())) {
            return ResponseEntity.ok(Map.of("ok", true, "ignored", true));
        }

        // Freeze/pause the active timer at this moment while preserving active room presence
        // so the teacher dashboard shows THIS specific phase as paused (not leaked into milestone phase)
        session.setPhaseExitedAt(now);
        session.setLastHeartbeatAt(now);
        if (reportedPhase != null && reportedPhase >= 1 && reportedPhase <= 7) {
            session.setActivePhase(reportedPhase);
        }
        Long reportedSeconds = parseClampedTimerSeconds(body);
        if (reportedSeconds != null) session.setLastRecordedSeconds(reportedSeconds);
        gameSessionRepository.save(session);

        return ResponseEntity.ok(Map.of("ok", true, "exitedAt", now.toString()));
    }

    /**
     * POST /api/students/heartbeat or /api/rooms/{roomCode}/heartbeat
     *
     * Periodic ping sent by active student client while inside a phase room.
     * Prevents runaway timer if student disconnects, kills browser, or locks screen
     * without a clean exit beacon firing.
     */
    @PostMapping(value = {"/rooms/{roomCode}/heartbeat", "/students/heartbeat"})
    public ResponseEntity<?> studentHeartbeat(
            @PathVariable(name = "roomCode", required = false) String roomCode,
            @RequestBody(required = false) Map<String, Object> body,
            HttpServletRequest request) {

        String studentNumber = (body != null && body.get("studentNumber") != null) ? body.get("studentNumber").toString() : null;
        if (studentNumber == null || studentNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "studentNumber required"));
        }
        if (studentNotSelf(studentNumber, request)) {
            return ResponseEntity.status(403).body(Map.of("error", "You can only update your own session."));
        }

        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(studentNumber.trim());
        if (studentOpt.isEmpty()) return ResponseEntity.ok(Map.of("ok", true));

        StudentProfile student = studentOpt.get();
        Optional<GameSession> sessionOpt =
                gameSessionRepository.findFirstByStudentProfileAndStatusOrderByIdDesc(student, "ACTIVE");
        if (sessionOpt.isEmpty()) return ResponseEntity.ok(Map.of("ok", true));

        GameSession session = sessionOpt.get();
        LocalDateTime now = LocalDateTime.now();
        session.setLastHeartbeatAt(now);

        // Presence updates only count while the session is ACTIVE.
        if ("ACTIVE".equalsIgnoreCase(session.getStatus()) && body != null && body.get("phase") != null) {
            try {
                int p = Integer.parseInt(body.get("phase").toString());
                if (p >= 1 && p <= 7) {
                    session.setActivePhase(p);
                }
            } catch (Exception ignored) {}
        }

        Long reportedSeconds = parseClampedTimerSeconds(body);
        if (reportedSeconds != null) session.setLastRecordedSeconds(reportedSeconds);
        gameSessionRepository.save(session);

        return ResponseEntity.ok(Map.of("ok", true, "heartbeatAt", now.toString()));
    }

    /** Parses client timerSeconds, clamping to [0, 7200] (2 hours) and tolerating fractional JSON numbers. */
    private static Long parseClampedTimerSeconds(Map<String, Object> body) {
        if (body == null || body.get("timerSeconds") == null) return null;
        try {
            double d = Double.parseDouble(body.get("timerSeconds").toString());
            if (!Double.isFinite(d)) return null;
            long s = (long) d;
            return Math.min(Math.max(s, 0L), 7200L);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** True when a student token is present but does not match the given student number. */
    private boolean studentNotSelf(String studentNumber, HttpServletRequest request) {
        String authed = (String) request.getAttribute(AuthInterceptor.ATTR_STUDENT_NUMBER);
        return authed != null && !authed.isBlank() && !studentNumber.trim().equalsIgnoreCase(authed);
    }

    /** Returns a 403 response when the authenticated teacher does not own the room, or null when OK. */
    private ResponseEntity<?> requireRoomOwner(Room room, HttpServletRequest request) {
        String authedEmail = (String) request.getAttribute(AuthInterceptor.ATTR_TEACHER_EMAIL);
        if (authedEmail == null || authedEmail.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Teacher authentication required."));
        }
        if (room.getTeacherEmail() == null || !authedEmail.trim().equalsIgnoreCase(room.getTeacherEmail().trim())) {
            return ResponseEntity.status(403).body(Map.of("error", "You do not own this room."));
        }
        return null;
    }

    // -------------------------------------------------------------------------
    // 9. TEACHER DASHBOARD ANALYTICS WITH PER-PHASE TIME & ATTEMPTS & SUMMARY
    // -------------------------------------------------------------------------
    @GetMapping("/rooms/{roomCode}/dashboard")
    public ResponseEntity<?> getRoomDashboard(
            @PathVariable String roomCode,
            @RequestParam(name = "attemptMode", required = false, defaultValue = "ALL") String attemptMode,
            HttpServletRequest request) {
        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }
        Room room = roomOpt.get();
        ResponseEntity<?> ownershipError = requireRoomOwner(room, request);
        if (ownershipError != null) return ownershipError;

        try {
            List<RoomParticipant> participants = roomParticipantRepository.findByRoomOrderByJoinedAtAsc(room);
            LocalDateTime roomStartedAt = room.getStartedAt() != null ? room.getStartedAt() : room.getCreatedAt();

            List<Map<String, Object>> studentResults = new ArrayList<>();
            java.util.List<String> dataErrorStudents = new java.util.ArrayList<>();

            // Aggregators for Class Summary & Charts: Combined
            int[] classPhaseCompletedCounts = new int[7];
            int[] classPhaseActiveCounts = new int[7];
            long[] classPhaseTotalAttempts = new long[7];
            long[] classPhaseTotalSeconds = new long[7];
            int[] classPhaseTimeContributors = new int[7];

            // Aggregators for First Attempt stream
            int[] classFirstCompletedCounts = new int[7];
            int[] classFirstActiveCounts = new int[7];
            long[] classFirstTotalAttempts = new long[7];
            long[] classFirstTotalSeconds = new long[7];
            int[] classFirstTimeContributors = new int[7];

            // Aggregators for Re-Audit stream
            int[] classReAuditCompletedCounts = new int[7];
            int[] classReAuditActiveCounts = new int[7];
            long[] classReAuditTotalAttempts = new long[7];
            long[] classReAuditTotalSeconds = new long[7];
            int[] classReAuditTimeContributors = new int[7];

            int totalRoomAttempts = 0;
            int completedStudentsCount = 0;
            int firstAttemptCompletedStudentsCount = 0;
            int reAuditActiveStudentsCount = 0;

        for (RoomParticipant p : participants) {
            if (p == null || p.getStudentProfile() == null) {
                continue;
            }
            try {
                StudentProfile student = p.getStudentProfile();

                // Fetch the latest session regardless of status so COMPLETED students
            // are reported with their real phase progression instead of falling back to phase 1
            GameSession session = gameSessionRepository
                    .findFirstByStudentProfileAndRoomCodeOrderByIdDesc(student, room.getRoomCode())
                    .orElse(null);
            int currentPhaseIndex = session != null ? session.getCurrentPhase() : 1;
            Integer activePhase = session != null ? session.getActivePhase() : null;
            boolean isSessionCompleted = session != null && "COMPLETED".equalsIgnoreCase(session.getStatus());

            // Fetch all attempts for this student in this room, sorted chronologically
            List<AttemptLog> allAttempts = attemptLogRepository
                    .findByStudentProfileAndRoomCodeScopeOrderByAttemptTimeAsc(student, room.getRoomCode());

            // Group attempts by (module + "_" + phase)
            Map<String, List<AttemptLog>> phaseAttemptsMap = new HashMap<>();
            for (AttemptLog log : allAttempts) {
                String key = (log.getModule() != null ? log.getModule().toUpperCase() : "") + "_" + log.getPhase();
                phaseAttemptsMap.computeIfAbsent(key, k -> new ArrayList<>()).add(log);
            }

            List<Map<String, Object>> studentPhases = new ArrayList<>();
            LocalDateTime firstEverAttempt = allAttempts.isEmpty() ? null : allAttempts.get(0).getAttemptTime();
            LocalDateTime sessionStart = (session != null && session.getStartTime() != null)
                    ? session.getStartTime()
                    : firstEverAttempt;
            LocalDateTime previousPhaseCompletedTime = sessionStart;

            int studentCompletedPhases = 0;
            long studentTotalSeconds = 0;
            int studentTotalAttempts = 0;

            int studentFirstCompletedPhases = 0;
            long studentFirstTotalSeconds = 0;
            int studentFirstTotalAttempts = 0;

            int studentReAuditCompletedPhases = 0;
            long studentReAuditTotalSeconds = 0;
            int studentReAuditTotalAttempts = 0;
            boolean studentHasReAuditedAny = false;

            for (int i = 0; i < 7; i++) {
                int phaseId = i + 1;
                String module = MODULES[i];
                int phaseIndex = PHASES[i];
                String phaseKey = module.toUpperCase() + "_" + phaseIndex;
                List<AttemptLog> attempts = phaseAttemptsMap.getOrDefault(phaseKey, Collections.emptyList());
                List<String> requiredSteps = getRequiredStepsForPhase(module, phaseIndex);

                // Partition attempts: First Attempt vs Re-Audit
                List<AttemptLog> firstAttempts = new ArrayList<>();
                List<AttemptLog> reAuditAttempts = new ArrayList<>();
                Set<String> stepsCompletedSoFar = new HashSet<>();
                boolean firstCompletedFound = false;

                for (AttemptLog log : attempts) {
                    if ("RE_AUDIT".equalsIgnoreCase(log.getAttemptType())) {
                        reAuditAttempts.add(log);
                    } else if (log.getAttemptType() != null && !log.getAttemptType().isBlank()) {
                        firstAttempts.add(log);
                    } else {
                        // Legacy fallback when attemptType was null
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

                // --- 1. Compute First Attempt Metrics ---
                int firstFailedCount = 0;
                int firstDrillResets = 0;
                LocalDateTime firstLastSuccess = null;
                LocalDateTime firstStart = firstAttempts.isEmpty() ? null : firstAttempts.get(0).getAttemptTime();
                LocalDateTime firstEnd = firstAttempts.isEmpty() ? null : firstAttempts.get(firstAttempts.size() - 1).getAttemptTime();

                for (AttemptLog log : firstAttempts) {
                    if ("system=DRILL_RESET".equals(log.getUserInputData())) {
                        firstDrillResets++;
                    } else if (!log.isSuccessful()) {
                        firstFailedCount++;
                    } else {
                        firstLastSuccess = log.getAttemptTime();
                    }
                }

                // Attempts = phase run attempts (1 initial attempt + drill resets).
                // DRILL_RESET barriers mark failed runs that restarted the scenario.
                int firstAttemptsCount = firstAttempts.isEmpty() ? 0 : (1 + firstDrillResets);
                studentFirstTotalAttempts += firstAttemptsCount;

                // Judge completion solely by actual steps completed (not sequential phase index comparison)
                boolean isFirstCompleted = isSessionCompleted || firstCompletedFound
                        || (firstLastSuccess != null && isPhaseCompleteBySteps(firstAttempts, module, phaseIndex));

                // Active phase is the specific room the student is currently inside (session.getActivePhase()).
                // If activePhase is null, the student has not entered any phase room (e.g. on Dashboard).
                boolean isCurrentActivePhase = (activePhase != null && activePhase == phaseId);
                boolean isStudentActivelyInPhase = isCurrentActivePhase && session != null
                        && session.getPhaseEnteredAt() != null && session.getPhaseExitedAt() == null;
                boolean isStudentPausedInPhase = isCurrentActivePhase && session != null
                        && session.getPhaseEnteredAt() != null && session.getPhaseExitedAt() != null;

                long firstPhaseSeconds = 0;
                if (isFirstCompleted) {
                    studentFirstCompletedPhases++;
                    classFirstCompletedCounts[i]++;
                    classFirstTotalAttempts[i] += firstAttemptsCount;

                    // Check if completion attempt log recorded real-time timerSeconds
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
                        firstPhaseSeconds = recordedSeconds;
                    } else if (firstStart != null) {
                        LocalDateTime startRef = (phaseId == 1 && session != null && session.getStartTime() != null)
                                ? session.getStartTime()
                                : firstStart;
                        LocalDateTime endRef = firstLastSuccess != null ? firstLastSuccess : (firstEnd != null ? firstEnd : firstStart);
                        long diff = (startRef != null && endRef != null) ? ChronoUnit.SECONDS.between(startRef, endRef) : 0L;
                        long paused = (session != null && isCurrentActivePhase) ? session.getAccumulatedPauseSeconds() : 0L;
                        firstPhaseSeconds = Math.max(diff - paused, 0L);
                    } else {
                        firstPhaseSeconds = 0L;
                    }
                } else if (isStudentActivelyInPhase) {
                    classFirstActiveCounts[i]++;
                    classFirstTotalAttempts[i] += firstAttemptsCount;

                    long diff;
                    if (session.getLastRecordedSeconds() != null && session.getLastRecordedSeconds() > 0) {
                        long secSinceReport = 0;
                        if (session.getLastHeartbeatAt() != null) {
                            secSinceReport = ChronoUnit.SECONDS.between(session.getLastHeartbeatAt(), LocalDateTime.now());
                            secSinceReport = Math.max(0, Math.min(secSinceReport, 15L));
                        }
                        diff = session.getLastRecordedSeconds() + secSinceReport;
                    } else {
                        LocalDateTime activeStart = session.getPhaseEnteredAt();
                        LocalDateTime activeEnd;
                        LocalDateTime now = LocalDateTime.now();
                        // Inactivity / disconnect safeguard: if no heartbeat received for > 30s, freeze at last heartbeat
                        if (session.getLastHeartbeatAt() != null) {
                            long heartbeatAge = ChronoUnit.SECONDS.between(session.getLastHeartbeatAt(), now);
                            activeEnd = (heartbeatAge > 30) ? session.getLastHeartbeatAt() : now;
                        } else {
                            long ageSinceEnter = (activeStart != null) ? ChronoUnit.SECONDS.between(activeStart, now) : 0L;
                            activeEnd = (ageSinceEnter > 45 && activeStart != null) ? activeStart.plusSeconds(30) : now;
                        }
                        long wallDiff = (activeStart != null && activeEnd != null) ? ChronoUnit.SECONDS.between(activeStart, activeEnd) : 0L;
                        long paused = session.getAccumulatedPauseSeconds();
                        // Hard cap runaway timer if student abandoned without logging out (max 2 hours)
                        diff = Math.min(Math.max(wallDiff - paused, 0L), 7200L);
                    }
                    firstPhaseSeconds = diff;
                } else if (isStudentPausedInPhase) {
                    classFirstActiveCounts[i]++;
                    classFirstTotalAttempts[i] += firstAttemptsCount;

                    long diff;
                    if (session.getLastRecordedSeconds() != null && session.getLastRecordedSeconds() > 0) {
                        diff = session.getLastRecordedSeconds();
                    } else {
                        LocalDateTime activeStart = session.getPhaseEnteredAt();
                        LocalDateTime activeEnd = session.getPhaseExitedAt();
                        long wallDiff = (activeStart != null && activeEnd != null) ? ChronoUnit.SECONDS.between(activeStart, activeEnd) : 0L;
                        long paused = session.getAccumulatedPauseSeconds();
                        diff = Math.min(Math.max(wallDiff - paused, 0L), 7200L);
                    }
                    firstPhaseSeconds = diff;
                } else if (!firstAttempts.isEmpty()) {
                    // Non-consecutive phase previously attempted by student!
                    classFirstTotalAttempts[i] += firstAttemptsCount;
                    if (firstStart != null && firstEnd != null) {
                        long diff = ChronoUnit.SECONDS.between(firstStart, firstEnd);
                        firstPhaseSeconds = Math.max(diff, 0L);
                    } else {
                        firstPhaseSeconds = 0L;
                    }
                }

                // First Winning Run Speed vs Total Effort across attempts (Option 2)
                long firstWinningSeconds = firstPhaseSeconds;
                long firstTotalEffortSeconds = 0;

                if (firstAttemptsCount <= 1) {
                    firstTotalEffortSeconds = firstPhaseSeconds;
                } else {
                    // Slicing firstAttempts by DRILL_RESET barriers to capture each attempt run
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
                    // Runs prior to the last run were failed runs terminated by a reset barrier
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
                    firstTotalEffortSeconds = failedRunsSum + firstPhaseSeconds;
                }
                firstTotalEffortSeconds = Math.max(firstTotalEffortSeconds, firstPhaseSeconds);

                studentFirstTotalSeconds += firstTotalEffortSeconds;
                if (isFirstCompleted) {
                    classFirstTotalSeconds[i] += firstTotalEffortSeconds;
                    classFirstTimeContributors[i]++;
                }

                int firstScore = isFirstCompleted ? Math.max(100 - (firstFailedCount * 10), 50) : 0;
                // All phases are unlocked so any attempted phase is visible and accurately tracked
                String firstStatus;
                if (isFirstCompleted) {
                    firstStatus = "COMPLETED";
                } else if (isStudentActivelyInPhase || isStudentPausedInPhase || !firstAttempts.isEmpty()) {
                    firstStatus = "ACTIVE";
                } else {
                    firstStatus = "NOT_ATTEMPTED";
                }

                // --- 2. Compute Re-Audit Metrics ---
                int reAuditFailedCount = 0;
                int reAuditDrillResets = 0;
                LocalDateTime reAuditLastSuccess = null;
                LocalDateTime reAuditStart = reAuditAttempts.isEmpty() ? null : reAuditAttempts.get(0).getAttemptTime();
                LocalDateTime reAuditEnd = reAuditAttempts.isEmpty() ? null : reAuditAttempts.get(reAuditAttempts.size() - 1).getAttemptTime();

                for (AttemptLog log : reAuditAttempts) {
                    if ("system=DRILL_RESET".equals(log.getUserInputData())) {
                        reAuditDrillResets++;
                    } else if (!log.isSuccessful()) {
                        reAuditFailedCount++;
                    } else {
                        reAuditLastSuccess = log.getAttemptTime();
                    }
                }

                String finalStepName = !requiredSteps.isEmpty() ? requiredSteps.get(requiredSteps.size() - 1) : null;
                int reAuditAttemptsCount = 0;
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
                    reAuditAttemptsCount = (int) completedReAudits + reAuditDrillResets + (inProgress ? 1 : 0);
                    if (reAuditAttemptsCount == 0) {
                        reAuditAttemptsCount = 1;
                    }
                }
                boolean hasReAudited = !reAuditAttempts.isEmpty();
                boolean isReAuditCompleted = hasReAudited && isPhaseCompleteBySteps(reAuditAttempts, module, phaseIndex);

                long reAuditPhaseSeconds = 0;
                if (hasReAudited) {
                    studentHasReAuditedAny = true;
                    studentReAuditTotalAttempts += reAuditAttemptsCount;
                    classReAuditTotalAttempts[i] += reAuditAttemptsCount;

                    // Calculate best (least) recorded re-audit completion time among all replay attempts
                    Long bestReAuditSeconds = null;
                    Long latestRecordedSeconds = null;

                    for (AttemptLog log : reAuditAttempts) {
                        if (log.isSuccessful() && !log.isDrillReset()) {
                            Long s = extractRecordedSeconds(log);
                            if (s != null && s > 0) {
                                latestRecordedSeconds = s;
                                boolean isCompletionStep = (finalStepName != null && finalStepName.equalsIgnoreCase(log.getStep()));
                                if (isCompletionStep) {
                                    if (bestReAuditSeconds == null || s < bestReAuditSeconds) {
                                        bestReAuditSeconds = s;
                                    }
                                }
                            }
                        }
                    }

                    Long chosenSeconds = (bestReAuditSeconds != null) ? bestReAuditSeconds : latestRecordedSeconds;

                    if (chosenSeconds != null && chosenSeconds > 0) {
                        reAuditPhaseSeconds = chosenSeconds;
                    } else if (reAuditStart != null) {
                        // Bound the wall-clock fallback to the most recent run (after
                        // the last DRILL_RESET barrier) so it never spans days.
                        LocalDateTime runStart = reAuditStart;
                        for (int k = reAuditAttempts.size() - 1; k >= 0; k--) {
                            if (reAuditAttempts.get(k).isDrillReset()) {
                                runStart = reAuditAttempts.get(k).getAttemptTime();
                                break;
                            }
                        }
                        LocalDateTime endRef = reAuditLastSuccess != null ? reAuditLastSuccess : (reAuditEnd != null ? reAuditEnd : reAuditStart);
                        long diff = (endRef != null && !endRef.isBefore(runStart)) ? ChronoUnit.SECONDS.between(runStart, endRef) : 0L;
                        reAuditPhaseSeconds = Math.max(diff, 0L);
                    }
                    studentReAuditTotalSeconds += reAuditPhaseSeconds;

                    if (isReAuditCompleted) {
                        studentReAuditCompletedPhases++;
                        classReAuditCompletedCounts[i]++;
                        classReAuditTotalSeconds[i] += reAuditPhaseSeconds;
                        classReAuditTimeContributors[i]++;
                    } else {
                        classReAuditActiveCounts[i]++;
                    }
                }

                int reAuditScore = isReAuditCompleted ? Math.max(100 - (reAuditFailedCount * 10), 50) : 0;
                String reAuditStatus = isReAuditCompleted ? "COMPLETED" : (hasReAudited ? "ACTIVE" : "NOT_ATTEMPTED");

                // --- 3. Combined / Legacy Metrics ---
                int totalAttemptsForPhase = firstAttemptsCount + reAuditAttemptsCount;
                int totalFailedForPhase = firstFailedCount + reAuditFailedCount;
                long totalSecondsForPhase = firstTotalEffortSeconds + reAuditPhaseSeconds;
                boolean isCombinedCompleted = isFirstCompleted || isReAuditCompleted;
                String combinedStatus = (isFirstCompleted || isReAuditCompleted)
                        ? "COMPLETED"
                        : ("ACTIVE".equals(firstStatus) || "ACTIVE".equals(reAuditStatus) ? "ACTIVE" : "NOT_ATTEMPTED");
                int combinedBestScore = Math.max(firstScore, reAuditScore);

                studentTotalAttempts += totalAttemptsForPhase;
                classPhaseTotalAttempts[i] += totalAttemptsForPhase;

                if (isCombinedCompleted) {
                    studentCompletedPhases++;
                    classPhaseCompletedCounts[i]++;
                    studentTotalSeconds += totalSecondsForPhase;
                    classPhaseTotalSeconds[i] += totalSecondsForPhase;
                    classPhaseTimeContributors[i]++;
                } else if ("ACTIVE".equals(combinedStatus)) {
                    classPhaseActiveCounts[i]++;
                    studentTotalSeconds += totalSecondsForPhase;
                }

                // Build granular phase object
                Map<String, Object> phaseObj = new HashMap<>();
                phaseObj.put("phaseId", phaseId);
                phaseObj.put("title", PHASE_TITLES[i]);
                phaseObj.put("module", module);
                phaseObj.put("phaseIndex", phaseIndex);

                // Combined / Default
                phaseObj.put("status", combinedStatus);
                phaseObj.put("attempts", totalAttemptsForPhase);
                phaseObj.put("failedAttempts", totalFailedForPhase);
                phaseObj.put("bestScore", combinedBestScore);
                phaseObj.put("winningTimeSeconds", isFirstCompleted ? firstWinningSeconds : 0L);
                phaseObj.put("winningTimeFormatted", isFirstCompleted ? formatDuration(firstWinningSeconds, "COMPLETED") : "--");
                phaseObj.put("totalEffortSeconds", totalSecondsForPhase);
                phaseObj.put("totalEffortFormatted", formatDuration(totalSecondsForPhase, combinedStatus));
                phaseObj.put("timeSpentSeconds", totalSecondsForPhase);
                phaseObj.put("timeSpentFormatted", formatDuration(totalSecondsForPhase, combinedStatus));

                // First Attempt Specifics (Option 2: Winning speed + Total effort)
                Map<String, Object> firstObj = new HashMap<>();
                firstObj.put("status", firstStatus);
                firstObj.put("attempts", firstAttemptsCount);
                firstObj.put("failedAttempts", firstFailedCount);
                firstObj.put("bestScore", firstScore);
                firstObj.put("winningTimeSeconds", firstWinningSeconds);
                firstObj.put("winningTimeFormatted", isFirstCompleted ? formatDuration(firstWinningSeconds, "COMPLETED") : "--");
                firstObj.put("totalEffortSeconds", firstTotalEffortSeconds);
                firstObj.put("totalEffortFormatted", formatDuration(firstTotalEffortSeconds, firstStatus));
                firstObj.put("timeSpentSeconds", firstTotalEffortSeconds);
                firstObj.put("timeSpentFormatted", formatDuration(firstTotalEffortSeconds, firstStatus));
                phaseObj.put("firstAttempt", firstObj);

                // Re-Audit Specifics (Fastest recorded run stays standard)
                Map<String, Object> reAuditObj = new HashMap<>();
                reAuditObj.put("status", reAuditStatus);
                reAuditObj.put("hasReAudited", hasReAudited);
                reAuditObj.put("attempts", reAuditAttemptsCount);
                reAuditObj.put("failedAttempts", reAuditFailedCount);
                reAuditObj.put("bestScore", reAuditScore);
                reAuditObj.put("winningTimeSeconds", reAuditPhaseSeconds);
                reAuditObj.put("winningTimeFormatted", isReAuditCompleted ? formatDuration(reAuditPhaseSeconds, "COMPLETED") : "--");
                reAuditObj.put("totalEffortSeconds", reAuditPhaseSeconds);
                reAuditObj.put("totalEffortFormatted", formatDuration(reAuditPhaseSeconds, reAuditStatus));
                reAuditObj.put("timeSpentSeconds", reAuditPhaseSeconds);
                reAuditObj.put("timeSpentFormatted", formatDuration(reAuditPhaseSeconds, reAuditStatus));
                phaseObj.put("reAudit", reAuditObj);

                studentPhases.add(phaseObj);
            }

            boolean hasMasteredAll = studentCompletedPhases >= 7 || studentReAuditCompletedPhases >= 7 || isSessionCompleted;
            if (hasMasteredAll) {
                completedStudentsCount++;
            }
            if (studentFirstCompletedPhases >= 7) {
                firstAttemptCompletedStudentsCount++;
            }
            if (studentHasReAuditedAny) {
                reAuditActiveStudentsCount++;
            }
            totalRoomAttempts += studentTotalAttempts;

            int displayPhaseIndex;
            if (activePhase != null && activePhase >= 1 && activePhase <= 7) {
                displayPhaseIndex = activePhase;
            } else if (currentPhaseIndex >= 1 && currentPhaseIndex <= 7) {
                displayPhaseIndex = currentPhaseIndex;
            } else if (currentPhaseIndex > 7 || hasMasteredAll) {
                displayPhaseIndex = 7;
            } else {
                displayPhaseIndex = 1;
            }

            String currentPhaseTitle = (hasMasteredAll || currentPhaseIndex > 7)
                    ? "Final Audit Complete"
                    : PHASE_TITLES[Math.max(0, Math.min(6, displayPhaseIndex - 1))];

            Map<String, Object> stuMap = new HashMap<>();
            stuMap.put("studentNumber", student.getStudentNumber());
            stuMap.put("fullName", student.getFullName());
            stuMap.put("section", student.getSection() != null ? student.getSection() : room.getSection());
            stuMap.put("completedPhases", Math.max(studentCompletedPhases, studentReAuditCompletedPhases));
            stuMap.put("currentPhase", displayPhaseIndex);
            stuMap.put("currentPhaseTitle", currentPhaseTitle);
            stuMap.put("attempts", studentTotalAttempts);
            stuMap.put("status", hasMasteredAll ? "COMPLETED" : "ACTIVE");
            stuMap.put("totalTimeSpentSeconds", studentTotalSeconds);
            stuMap.put("totalTimeFormatted", formatDuration(studentTotalSeconds, hasMasteredAll ? "COMPLETED" : "ACTIVE"));
            stuMap.put("phases", studentPhases);
            stuMap.put("hasReAudited", studentHasReAuditedAny);

            // Student First Attempt Rollup
            Map<String, Object> stuFirst = new HashMap<>();
            stuFirst.put("completedPhases", studentFirstCompletedPhases);
            stuFirst.put("attempts", studentFirstTotalAttempts);
            stuFirst.put("totalTimeSpentSeconds", studentFirstTotalSeconds);
            stuFirst.put("totalTimeFormatted", formatDuration(studentFirstTotalSeconds, studentFirstCompletedPhases >= 7 ? "COMPLETED" : "ACTIVE"));
            stuFirst.put("status", studentFirstCompletedPhases >= 7 ? "COMPLETED" : "ACTIVE");
            stuMap.put("firstAttempt", stuFirst);

            // Student Re-Audit Rollup
            Map<String, Object> stuReAudit = new HashMap<>();
            stuReAudit.put("completedPhases", studentReAuditCompletedPhases);
            stuReAudit.put("attempts", studentReAuditTotalAttempts);
            stuReAudit.put("totalTimeSpentSeconds", studentReAuditTotalSeconds);
            stuReAudit.put("totalTimeFormatted", formatDuration(studentReAuditTotalSeconds, studentReAuditCompletedPhases >= 7 ? "COMPLETED" : (studentHasReAuditedAny ? "ACTIVE" : "NOT_ATTEMPTED")));
            stuReAudit.put("hasReAudited", studentHasReAuditedAny);
            stuReAudit.put("status", studentReAuditCompletedPhases >= 7 ? "COMPLETED" : (studentHasReAuditedAny ? "ACTIVE" : "NOT_ATTEMPTED"));
            stuMap.put("reAudit", stuReAudit);

            studentResults.add(stuMap);
            } catch (Exception ex) {
                System.err.println("[RoomController] Error processing participant in room " + roomCode + ": " + ex.getMessage());
                ex.printStackTrace();
                try {
                    StudentProfile student = p.getStudentProfile();
                    if (student != null) {
                        boolean alreadyAdded = studentResults.stream()
                                .anyMatch(m -> student.getStudentNumber().equals(m.get("studentNumber")));
                        if (!alreadyAdded) {
                            Map<String, Object> fallbackMap = new HashMap<>();
                            fallbackMap.put("studentNumber", student.getStudentNumber());
                            fallbackMap.put("fullName", student.getFullName() != null ? student.getFullName() : "Unknown");
                            fallbackMap.put("section", student.getSection() != null ? student.getSection() : room.getSection());
                            fallbackMap.put("completedPhases", 0);
                            fallbackMap.put("currentPhase", 1);
                            fallbackMap.put("currentPhaseTitle", PHASE_TITLES[0]);
                            fallbackMap.put("attempts", 0);
                            fallbackMap.put("status", "ACTIVE");
                            fallbackMap.put("totalTimeSpentSeconds", 0L);
                            fallbackMap.put("totalTimeFormatted", "--");
                            fallbackMap.put("phases", Collections.emptyList());
                            fallbackMap.put("hasReAudited", false);
                            // Placeholder row — flagged so the teacher knows this
                            // student's real metrics could not be computed.
                            fallbackMap.put("dataError", true);
                            fallbackMap.put("errorNote", "Metrics unavailable for this student.");
                            dataErrorStudents.add(student.getStudentNumber());
                            Map<String, Object> fallbackSub = new HashMap<>();
                            fallbackSub.put("completedPhases", 0);
                            fallbackSub.put("attempts", 0);
                            fallbackSub.put("totalTimeSpentSeconds", 0L);
                            fallbackSub.put("totalTimeFormatted", "--");
                            fallbackSub.put("status", "ACTIVE");
                            fallbackMap.put("firstAttempt", fallbackSub);
                            fallbackMap.put("reAudit", fallbackSub);
                            studentResults.add(fallbackMap);
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        int totalStudents = studentResults.size();

        // Build Combined Class Summary
        List<Map<String, Object>> summaryPhases = new ArrayList<>();
        // Build First Attempt Class Summary
        List<Map<String, Object>> firstAttemptSummaryPhases = new ArrayList<>();
        // Build Re-Audit Class Summary
        List<Map<String, Object>> reAuditSummaryPhases = new ArrayList<>();

        for (int i = 0; i < 7; i++) {
            // Combined
            Map<String, Object> sp = new HashMap<>();
            sp.put("phaseId", i + 1);
            sp.put("title", PHASE_TITLES[i]);
            sp.put("completedCount", classPhaseCompletedCounts[i]);
            sp.put("activeCount", classPhaseActiveCounts[i]);
            sp.put("totalAttempts", classPhaseTotalAttempts[i]);
            double avgAttempts = totalStudents > 0
                    ? Math.round((double) classPhaseTotalAttempts[i] / totalStudents * 10.0) / 10.0
                    : 0.0;
            sp.put("avgAttempts", avgAttempts);
            long avgSeconds = classPhaseTimeContributors[i] > 0
                    ? classPhaseTotalSeconds[i] / classPhaseTimeContributors[i]
                    : 0;
            sp.put("avgTimeSeconds", avgSeconds);
            sp.put("avgTimeFormatted", formatDuration(avgSeconds, "COMPLETED"));
            summaryPhases.add(sp);

            // First Attempt
            Map<String, Object> fsp = new HashMap<>();
            fsp.put("phaseId", i + 1);
            fsp.put("title", PHASE_TITLES[i]);
            fsp.put("completedCount", classFirstCompletedCounts[i]);
            fsp.put("activeCount", classFirstActiveCounts[i]);
            fsp.put("totalAttempts", classFirstTotalAttempts[i]);
            double fAvgAttempts = totalStudents > 0
                    ? Math.round((double) classFirstTotalAttempts[i] / totalStudents * 10.0) / 10.0
                    : 0.0;
            fsp.put("avgAttempts", fAvgAttempts);
            long fAvgSeconds = classFirstTimeContributors[i] > 0
                    ? classFirstTotalSeconds[i] / classFirstTimeContributors[i]
                    : 0;
            fsp.put("avgTimeSeconds", fAvgSeconds);
            fsp.put("avgTimeFormatted", formatDuration(fAvgSeconds, "COMPLETED"));
            firstAttemptSummaryPhases.add(fsp);

            // Re-Audit
            Map<String, Object> rsp = new HashMap<>();
            rsp.put("phaseId", i + 1);
            rsp.put("title", PHASE_TITLES[i]);
            rsp.put("completedCount", classReAuditCompletedCounts[i]);
            rsp.put("activeCount", classReAuditActiveCounts[i]);
            rsp.put("totalAttempts", classReAuditTotalAttempts[i]);
            int reAuditParticipantsInPhase = Math.max(classReAuditCompletedCounts[i] + classReAuditActiveCounts[i], 1);
            double rAvgAttempts = classReAuditTotalAttempts[i] > 0
                    ? Math.round((double) classReAuditTotalAttempts[i] / reAuditParticipantsInPhase * 10.0) / 10.0
                    : 0.0;
            rsp.put("avgAttempts", rAvgAttempts);
            long rAvgSeconds = classReAuditTimeContributors[i] > 0
                    ? classReAuditTotalSeconds[i] / classReAuditTimeContributors[i]
                    : 0;
            rsp.put("avgTimeSeconds", rAvgSeconds);
            rsp.put("avgTimeFormatted", formatDuration(rAvgSeconds, "COMPLETED"));
            reAuditSummaryPhases.add(rsp);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalStudents", totalStudents);
        summary.put("completedStudents", completedStudentsCount);
        summary.put("activeStudents", Math.max(0, totalStudents - completedStudentsCount));
        summary.put("totalAttempts", totalRoomAttempts);
        summary.put("phaseStats", summaryPhases);
        summary.put("firstAttemptPhaseStats", firstAttemptSummaryPhases);
        summary.put("reAuditPhaseStats", reAuditSummaryPhases);
        summary.put("firstAttemptCompletedStudents", firstAttemptCompletedStudentsCount);
        summary.put("reAuditStudentsCount", reAuditActiveStudentsCount);

        Map<String, Object> response = new HashMap<>();
        response.put("roomCode", room.getRoomCode());
        response.put("teacherName", room.getTeacherName());
        response.put("teacherEmail", room.getTeacherEmail());
        response.put("section", room.getSection());
        response.put("status", room.getStatus());
        response.put("startedAt", room.getStartedAt());
        response.put("summary", summary);
        response.put("students", studentResults);
        response.put("attemptMode", attemptMode);
        if (!dataErrorStudents.isEmpty()) {
            Map<String, Object> warnings = new HashMap<>();
            warnings.put("count", dataErrorStudents.size());
            warnings.put("studentNumbers", dataErrorStudents);
            warnings.put("note", "Metrics for these students could not be computed and are shown as placeholders.");
            response.put("dataWarnings", warnings);
        }
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        System.err.println("[RoomController] Unexpected error in getRoomDashboard for room " + roomCode + ": " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to load the room dashboard. Please try again."));
    }
}

    // -------------------------------------------------------------------------
    // HELPER METHODS
    // -------------------------------------------------------------------------

    private StudentProfile resolveOrCreateStudent(String studentNumber, String fullName, String section, String defaultSection) {
        Optional<StudentProfile> existing = studentRepository.findByStudentNumber(studentNumber);
        if (existing.isPresent()) {
            StudentProfile s = existing.get();
            if (fullName != null && !fullName.trim().isEmpty()) {
                boolean isTemporary = "Temporary Student".equalsIgnoreCase(s.getFullName());
                if (isTemporary) {
                    s.setFullName(fullName.trim());
                } else if (!authService.isFlexibleNameMatch(s.getFullName(), fullName)) {
                    throw new IllegalArgumentException("Student number '" + studentNumber
                            + "' is already registered to a different name. Please check your credentials.");
                }
            }
            // Never overwrite an existing profile's identity during join.
            return studentRepository.save(s);
        }

        String actualSection = (section != null && !section.trim().isEmpty()) ? section.trim() : defaultSection;
        StudentProfile newProfile = new StudentProfile(
                studentNumber,
                (fullName != null && !fullName.trim().isEmpty()) ? fullName.trim() : "Student " + studentNumber,
                actualSection
        );
        return studentRepository.save(newProfile);
    }

    private boolean isPhaseCompleteBySteps(List<AttemptLog> attempts, String module, int phase) {
        List<String> requiredSteps = getRequiredStepsForPhase(module, phase);
        if (requiredSteps.isEmpty()) return false;

        Set<String> successfulSteps = attempts.stream()
                .filter(AttemptLog::isSuccessful)
                .filter(a -> !a.isDrillReset())
                .map(a -> a.getStep() != null ? a.getStep().toUpperCase() : "")
                .collect(Collectors.toSet());

        return requiredSteps.stream().allMatch(step -> successfulSteps.contains(step.toUpperCase()));
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

    private String formatDuration(long totalSeconds, String status) {
        if ("LOCKED".equals(status) || "NOT_ATTEMPTED".equals(status) || totalSeconds < 0) {
            return "--";
        }
        if (totalSeconds == 0) {
            return "0s";
        }
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

    private String generateUniqueRoomCode() {
        for (int attempts = 0; attempts < 50; attempts++) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!roomRepository.existsByRoomCodeIgnoreCase(code)) {
                return code;
            }
        }
        return "NZD" + (100 + RANDOM.nextInt(900));
    }

    // -------------------------------------------------------------------------
    // 10. MANUAL EMAIL CLASSROOM REPORT DISPATCH
    // -------------------------------------------------------------------------
    @PostMapping("/rooms/{roomCode}/send-report")
    public ResponseEntity<?> sendRoomReportEmail(
            @PathVariable String roomCode,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {
        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }
        Room room = roomOpt.get();
        ResponseEntity<?> ownershipError = requireRoomOwner(room, request);
        if (ownershipError != null) return ownershipError;

        // The report always goes to the room's registered owner email — a request
        // body must never be able to retarget it.
        if (room.getTeacherEmail() == null || room.getTeacherEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No teacher email address configured for room " + roomCode));
        }

        try {
            emailReportService.sendClassroomReportSync(room, null);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Classroom audit report sent to " + room.getTeacherEmail()
            ));
        } catch (org.springframework.mail.MailAuthenticationException mae) {
            return ResponseEntity.status(401).body(Map.of(
                "error", "SMTP Authentication Failed: Gmail rejected login credentials. Please set your Gmail address and 16-character Google App Password in application.properties (spring.mail.username and spring.mail.password)."
            ));
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(400).body(Map.of(
                "error", ise.getMessage()
            ));
        } catch (Exception ex) {
            System.err.println("[RoomController] Failed to send report: " + ex.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to send email report."
            ));
        }
    }

    // -------------------------------------------------------------------------
    // 11. HTML REPORT PREVIEW IN BROWSER
    // -------------------------------------------------------------------------
    @GetMapping(value = "/rooms/{roomCode}/report/preview", produces = "text/html;charset=UTF-8")
    public ResponseEntity<String> previewRoomReport(@PathVariable String roomCode, HttpServletRequest request) {
        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body("<h1>Room not found</h1>");
        }
        Room room = roomOpt.get();
        ResponseEntity<?> ownershipError = requireRoomOwner(room, request);
        if (ownershipError != null) {
            return ResponseEntity.status(ownershipError.getStatusCode())
                    .body("<h1>" + ownershipError.getStatusCode().value() + "</h1>");
        }
        String html = emailReportService.generateClassroomReportHtml(room);
        return ResponseEntity.ok(html);
    }

    // -------------------------------------------------------------------------
    // 12. EXCEL CLASSROOM REPORT DOWNLOAD (.XLSX)
    // -------------------------------------------------------------------------
    @GetMapping("/rooms/{roomCode}/report/excel")
    public ResponseEntity<?> downloadRoomReportExcel(@PathVariable String roomCode, HttpServletRequest request) {
        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }
        Room room = roomOpt.get();
        ResponseEntity<?> ownershipError = requireRoomOwner(room, request);
        if (ownershipError != null) {
            return ownershipError;
        }
        try {
            byte[] excelBytes = emailReportService.generateClassroomReportExcel(room);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename("Classroom_Audit_Report_" + room.getRoomCode() + ".xlsx")
                    .build());
            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        } catch (Exception ex) {
            System.err.println("[RoomController] Error generating Excel report for room " + roomCode + ": " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .header("Content-Type", "application/json")
                    .body(Map.of("error", "Failed to generate Excel report: " + ex.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // 13. RE-AUDIT ROOM LEADERBOARD / SPEED RANKINGS
    // -------------------------------------------------------------------------
    @GetMapping("/rooms/{roomCode}/reaudit-rankings")
    public ResponseEntity<?> getRoomReAuditRankings(@PathVariable String roomCode, HttpServletRequest request) {
        Optional<Room> roomOpt = roomRepository.findByRoomCodeIgnoreCase(roomCode);
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found: " + roomCode));
        }
        Room room = roomOpt.get();

        // Rankings expose student names and numbers. Restrict to the room's
        // teacher or its participants — never anonymous callers.
        String role = (String) request.getAttribute(AuthInterceptor.ATTR_ROLE);
        if ("TEACHER".equals(role)) {
            ResponseEntity<?> ownership = requireRoomOwner(room, request);
            if (ownership != null) return ownership;
        } else if ("STUDENT".equals(role)) {
            String studentNumber = (String) request.getAttribute(AuthInterceptor.ATTR_STUDENT_NUMBER);
            Optional<StudentProfile> student = studentRepository.findByStudentNumber(studentNumber);
            boolean isParticipant = student.isPresent()
                    && roomParticipantRepository.findByRoomAndStudentProfile(room, student.get()).isPresent();
            if (!isParticipant) {
                return ResponseEntity.status(403).body(Map.of("error",
                        "Only participants of this room can view its rankings."));
            }
        } else {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required."));
        }

        try {
            List<RoomParticipant> participants = roomParticipantRepository.findByRoomOrderByJoinedAtAsc(room);
            List<Map<String, Object>> studentRankings = new ArrayList<>();

            for (RoomParticipant p : participants) {
                if (p == null || p.getStudentProfile() == null) continue;
                StudentProfile student = p.getStudentProfile();

                List<AttemptLog> allAttempts = attemptLogRepository
                        .findByStudentProfileAndRoomCodeScopeOrderByAttemptTimeAsc(student, room.getRoomCode());

                Map<String, List<AttemptLog>> phaseAttemptsMap = new HashMap<>();
                for (AttemptLog log : allAttempts) {
                    String key = (log.getModule() != null ? log.getModule().toUpperCase() : "") + "_" + log.getPhase();
                    phaseAttemptsMap.computeIfAbsent(key, k -> new ArrayList<>()).add(log);
                }

                int completedReAuditPhasesCount = 0;
                long totalFastestReAuditSeconds = 0;
                boolean hasReAuditedAny = false;
                List<Map<String, Object>> phaseBreakdown = new ArrayList<>();

                for (int i = 0; i < 7; i++) {
                    int phaseId = i + 1;
                    String module = MODULES[i];
                    int phaseIndex = PHASES[i];
                    String phaseKey = module.toUpperCase() + "_" + phaseIndex;
                    List<AttemptLog> attempts = phaseAttemptsMap.getOrDefault(phaseKey, Collections.emptyList());
                    List<String> requiredSteps = getRequiredStepsForPhase(module, phaseIndex);

                    List<AttemptLog> reAuditAttempts = new ArrayList<>();
                    Set<String> stepsCompletedSoFar = new HashSet<>();
                    boolean firstCompletedFound = false;

                    for (AttemptLog log : attempts) {
                        if ("RE_AUDIT".equalsIgnoreCase(log.getAttemptType())) {
                            reAuditAttempts.add(log);
                        } else if (log.getAttemptType() != null && !log.getAttemptType().isBlank()) {
                            // First attempt log
                        } else {
                            if (firstCompletedFound) {
                                reAuditAttempts.add(log);
                            } else {
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
                    if (hasReAudited) hasReAuditedAny = true;

                    boolean isReAuditCompleted = hasReAudited && isPhaseCompleteBySteps(reAuditAttempts, module, phaseIndex);
                    long fastestSeconds = 0;

                    if (hasReAudited) {
                        Long bestReAuditSeconds = null;
                        Long latestRecordedSeconds = null;
                        String finalStepName = !requiredSteps.isEmpty() ? requiredSteps.get(requiredSteps.size() - 1) : null;

                        LocalDateTime reAuditStart = reAuditAttempts.get(0).getAttemptTime();
                        LocalDateTime reAuditLastSuccess = null;
                        LocalDateTime reAuditEnd = reAuditAttempts.get(reAuditAttempts.size() - 1).getAttemptTime();

                        for (AttemptLog log : reAuditAttempts) {
                            if (log.isSuccessful()) {
                                reAuditLastSuccess = log.getAttemptTime();
                            }
                            if (log.isSuccessful() && !log.isDrillReset()) {
                                Long s = extractRecordedSeconds(log);
                                if (s != null && s > 0) {
                                    latestRecordedSeconds = s;
                                    boolean isCompletionStep = (finalStepName != null && finalStepName.equalsIgnoreCase(log.getStep()));
                                    if (isCompletionStep) {
                                        if (bestReAuditSeconds == null || s < bestReAuditSeconds) {
                                            bestReAuditSeconds = s;
                                        }
                                    }
                                }
                            }
                        }

                        Long chosenSeconds = (bestReAuditSeconds != null) ? bestReAuditSeconds : latestRecordedSeconds;
                        if (chosenSeconds != null && chosenSeconds > 0) {
                            fastestSeconds = chosenSeconds;
                        } else if (reAuditStart != null) {
                            // Legacy logs without recorded seconds: bound the wall-clock
                            // fallback to the most recent run (after the last DRILL_RESET
                            // barrier) so rankings never span multiple runs/days.
                            LocalDateTime runStart = reAuditStart;
                            for (int k = reAuditAttempts.size() - 1; k >= 0; k--) {
                                if (reAuditAttempts.get(k).isDrillReset()) {
                                    runStart = reAuditAttempts.get(k).getAttemptTime();
                                    break;
                                }
                            }
                            LocalDateTime endRef = reAuditLastSuccess != null ? reAuditLastSuccess : (reAuditEnd != null ? reAuditEnd : reAuditStart);
                            if (endRef != null && !endRef.isBefore(runStart)) {
                                fastestSeconds = Math.max(ChronoUnit.SECONDS.between(runStart, endRef), 0L);
                            }
                        }
                    }

                    if (isReAuditCompleted) {
                        completedReAuditPhasesCount++;
                        totalFastestReAuditSeconds += fastestSeconds;
                    }

                    Map<String, Object> pMap = new HashMap<>();
                    pMap.put("phaseId", phaseId);
                    pMap.put("title", PHASE_TITLES[i]);
                    pMap.put("hasReAudited", hasReAudited);
                    pMap.put("isCompleted", isReAuditCompleted);
                    pMap.put("fastestSeconds", fastestSeconds);
                    pMap.put("fastestFormatted", (isReAuditCompleted && fastestSeconds > 0) ? formatDuration(fastestSeconds, "COMPLETED") : "--");
                    phaseBreakdown.add(pMap);
                }

                Map<String, Object> stuMap = new HashMap<>();
                stuMap.put("studentNumber", student.getStudentNumber());
                stuMap.put("fullName", student.getFullName() != null ? student.getFullName() : "Unknown");
                stuMap.put("section", student.getSection() != null ? student.getSection() : room.getSection());
                stuMap.put("completedPhasesCount", completedReAuditPhasesCount);
                stuMap.put("totalPhases", 7);
                stuMap.put("isMasteredAll", completedReAuditPhasesCount >= 7);
                stuMap.put("hasReAudited", hasReAuditedAny);
                stuMap.put("totalFastestSeconds", totalFastestReAuditSeconds);
                stuMap.put("totalFastestFormatted", formatDuration(totalFastestReAuditSeconds, completedReAuditPhasesCount > 0 ? "COMPLETED" : "NOT_ATTEMPTED"));
                stuMap.put("phaseBreakdown", phaseBreakdown);

                studentRankings.add(stuMap);
            }

            // Only participants who completed the re-audit of all 7 phases are on the leaderboard
            List<Map<String, Object>> completed7Rankings = new ArrayList<>();
            for (Map<String, Object> item : studentRankings) {
                int comp = (int) item.get("completedPhasesCount");
                if (comp >= 7) {
                    completed7Rankings.add(item);
                }
            }

            // Sort completed students strictly by totalFastestSeconds ascending (lowest total time = fastest = Rank 1)
            completed7Rankings.sort((a, b) -> {
                long secA = (long) a.get("totalFastestSeconds");
                long secB = (long) b.get("totalFastestSeconds");
                return Long.compare(secA, secB);
            });

            // Assign rank numbers and top10 flag
            int currentRank = 1;
            for (Map<String, Object> item : completed7Rankings) {
                item.put("rank", currentRank);
                item.put("isTop10", currentRank <= 10);
                currentRank++;
            }

            Map<String, Object> resp = new HashMap<>();
            resp.put("roomCode", room.getRoomCode());
            resp.put("section", room.getSection());
            resp.put("teacherName", room.getTeacherName());
            resp.put("totalParticipants", participants.size());
            resp.put("totalCompleted7Count", completed7Rankings.size());
            resp.put("rankings", completed7Rankings);

            return ResponseEntity.ok(resp);
        } catch (Exception ex) {
            System.err.println("[RoomController] Error fetching reaudit rankings for room " + roomCode + ": " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to calculate rankings: " + ex.getMessage()));
        }
    }
}
