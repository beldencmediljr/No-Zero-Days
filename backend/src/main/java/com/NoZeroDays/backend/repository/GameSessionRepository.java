package com.NoZeroDays.backend.repository;

import com.NoZeroDays.backend.model.GameSession;
import com.NoZeroDays.backend.model.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
    List<GameSession> findByStudentProfileAndStatus(StudentProfile studentProfile, String status);
}
