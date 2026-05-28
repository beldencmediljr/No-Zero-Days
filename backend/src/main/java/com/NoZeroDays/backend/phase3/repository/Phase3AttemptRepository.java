package com.NoZeroDays.backend.phase3.repository;

import com.NoZeroDays.backend.phase3.model.Phase3Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Phase3AttemptRepository extends JpaRepository<Phase3Attempt, Long> {
}
