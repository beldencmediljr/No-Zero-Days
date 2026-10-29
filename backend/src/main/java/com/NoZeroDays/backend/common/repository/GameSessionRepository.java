package com.NoZeroDays.backend.common.repository;

import com.NoZeroDays.backend.common.model.GameSession;
import com.NoZeroDays.backend.common.model.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
    List<GameSession> findByStudentProfileAndStatus(StudentProfile studentProfile, String status);
    List<GameSession> findByStudentProfile(StudentProfile studentProfile);
    Optional<GameSession> findFirstByStudentProfileOrderByIdDesc(StudentProfile studentProfile);
    Optional<GameSession> findFirstByStudentProfileAndStatusOrderByIdDesc(StudentProfile studentProfile, String status);

    // Room-scoped latest session: prefers a session tagged with the room code,
    // falls back to legacy untagged sessions so pre-scoping data stays visible.
    // Returns a List to avoid NonUniqueResultException when multiple sessions match.
    @Query("SELECT s FROM GameSession s WHERE s.studentProfile = :student AND (s.roomCode IS NULL OR s.roomCode = :roomCode) ORDER BY s.id DESC")
    List<GameSession> findAllByStudentProfileAndRoomCodeOrderByIdDesc(
        @Param("student") StudentProfile studentProfile,
        @Param("roomCode") String roomCode
    );

    Optional<GameSession> findFirstByStudentProfileAndRoomCodeIgnoreCaseOrderByIdDesc(
        StudentProfile studentProfile,
        String roomCode
    );

    Optional<GameSession> findFirstByStudentProfileAndRoomCodeIsNullOrderByIdDesc(
        StudentProfile studentProfile
    );

    default Optional<GameSession> findFirstByStudentProfileAndRoomCodeOrderByIdDesc(
        StudentProfile studentProfile,
        String roomCode
    ) {
        // A session tagged with this room must win over any untagged session —
        // an untagged ACTIVE session (e.g. one minted at registration) has a
        // higher id and would otherwise shadow the room's own session.
        Optional<GameSession> tagged = findFirstByStudentProfileAndRoomCodeIgnoreCaseOrderByIdDesc(studentProfile, roomCode);
        if (tagged.isPresent()) {
            return tagged;
        }
        return findFirstByStudentProfileAndRoomCodeIsNullOrderByIdDesc(studentProfile);
    }

    @Modifying
    @Transactional
    void deleteByStudentProfile(StudentProfile studentProfile);

    // Wipes free-play (pre-room) sessions when a student enters a room so the
    // teacher only tracks in-room performance. Returns the number of rows removed.
    @Modifying
    @Transactional
    long deleteByStudentProfileAndRoomCodeIsNull(StudentProfile studentProfile);

    @Modifying
    @Transactional
    @Query("DELETE FROM GameSession s WHERE s.studentProfile = :student AND (s.roomCode IS NULL OR UPPER(s.roomCode) = UPPER(:roomCode))")
    int deleteByStudentProfileAndRoomCodeScope(
        @Param("student") StudentProfile student,
        @Param("roomCode") String roomCode
    );

    @Modifying
    @Transactional
    @Query("DELETE FROM GameSession s WHERE s.studentProfile = :student AND UPPER(s.roomCode) = UPPER(:roomCode)")
    int deleteByStudentProfileAndRoomCode(
        @Param("student") StudentProfile student,
        @Param("roomCode") String roomCode
    );
}
