package com.NoZeroDays.backend.common.repository;

import com.NoZeroDays.backend.common.model.AttemptLog;
import com.NoZeroDays.backend.common.model.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttemptLogRepository extends JpaRepository<AttemptLog, Long> {
    
    // Finds the latest attempts for a student in a specific module and phase (all steps)
    @Query("SELECT a FROM AttemptLog a WHERE a.studentProfile = :student AND a.module = :module AND a.phase = :phase ORDER BY a.attemptTime DESC")
    List<AttemptLog> findLatestAttempts(
        @Param("student") StudentProfile student,
        @Param("module") String module,
        @Param("phase") int phase
    );

    // Finds the latest attempts for a student in a specific module, phase, AND step.
    // Used by the Infinite Drill engine to count consecutive failures scoped to the current
    // step only, preventing cross-step failure accumulation (the off-by-one bug where
    // 1 EXTRACT fail + 2 EXECUTE fails = 3 would incorrectly trigger the drill after
    // only 2 EXECUTE mistakes instead of the required 3).
    @Query("SELECT a FROM AttemptLog a WHERE a.studentProfile = :student AND a.module = :module AND a.phase = :phase AND a.step = :step ORDER BY a.attemptTime DESC")
    List<AttemptLog> findLatestAttemptsByStep(
        @Param("student") StudentProfile student,
        @Param("module") String module,
        @Param("phase") int phase,
        @Param("step") String step
    );

    // Finds attempts for a student in a specific module and phase since session start
    @Query("SELECT a FROM AttemptLog a WHERE a.studentProfile = :student AND a.module = :module AND a.phase = :phase AND a.attemptTime >= :startTime ORDER BY a.attemptTime DESC")
    List<AttemptLog> findAttemptsSince(
        @Param("student") StudentProfile student,
        @Param("module") String module,
        @Param("phase") int phase,
        @Param("startTime") java.time.LocalDateTime startTime
    );

    // Counts attempts for a student since session start
    @Query("SELECT COUNT(a) FROM AttemptLog a WHERE a.studentProfile = :student AND a.attemptTime >= :startTime")
    long countAttemptsSince(
        @Param("student") StudentProfile student,
        @Param("startTime") java.time.LocalDateTime startTime
    );
}

