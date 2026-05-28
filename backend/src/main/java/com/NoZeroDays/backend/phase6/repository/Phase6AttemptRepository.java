package com.NoZeroDays.backend.phase6.repository;

import com.NoZeroDays.backend.phase6.model.Phase6Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Phase6AttemptRepository extends JpaRepository<Phase6Attempt, Long> {
}
