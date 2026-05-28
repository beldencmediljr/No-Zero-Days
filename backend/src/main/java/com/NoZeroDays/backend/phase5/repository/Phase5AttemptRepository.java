package com.NoZeroDays.backend.phase5.repository;

import com.NoZeroDays.backend.phase5.model.Phase5Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Phase5AttemptRepository extends JpaRepository<Phase5Attempt, Long> {
}
