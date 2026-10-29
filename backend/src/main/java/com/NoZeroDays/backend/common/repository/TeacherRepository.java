package com.NoZeroDays.backend.common.repository;

import com.NoZeroDays.backend.common.model.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByEmailIgnoreCase(String email);
    Optional<Teacher> findByFullNameIgnoreCase(String fullName);
    Optional<Teacher> findBySessionToken(String sessionToken);
    Optional<Teacher> findByResetToken(String resetToken);
}
