package com.NoZeroDays.backend.phase2.repository;

import com.NoZeroDays.backend.phase2.model.Phase2Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Phase2AttemptRepository extends JpaRepository<Phase2Attempt, Long> {
}
