package com.NoZeroDays.backend.repository;

import com.NoZeroDays.backend.model.AttemptLog;
import com.NoZeroDays.backend.model.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttemptLogRepository extends JpaRepository<AttemptLog, Long> {
    
    // Finds the latest attempts for a student in a specific module, phase, and step
    @Query("SELECT a FROM AttemptLog a WHERE a.studentProfile = :student AND a.module = :module AND a.phase = :phase ORDER BY a.attemptTime DESC")
    List<AttemptLog> findLatestAttempts(
        @Param("student") StudentProfile student,
        @Param("module") String module,
        @Param("phase") int phase
    );
}
