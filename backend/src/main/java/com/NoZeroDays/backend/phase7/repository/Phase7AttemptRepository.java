package com.NoZeroDays.backend.phase7.repository;

import com.NoZeroDays.backend.phase7.model.Phase7Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface Phase7AttemptRepository extends JpaRepository<Phase7Attempt, Long> {
}
