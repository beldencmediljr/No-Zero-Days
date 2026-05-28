package com.NoZeroDays.backend.phase1.repository;

import com.NoZeroDays.backend.phase1.model.Phase1Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Phase1AttemptRepository extends JpaRepository<Phase1Attempt, Long> {
}