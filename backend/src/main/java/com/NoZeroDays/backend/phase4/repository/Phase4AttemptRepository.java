package com.NoZeroDays.backend.phase4.repository;

import com.NoZeroDays.backend.phase4.model.Phase4Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Phase4AttemptRepository extends JpaRepository<Phase4Attempt, Long> {
}
