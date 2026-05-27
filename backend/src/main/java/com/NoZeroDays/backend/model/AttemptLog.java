package com.NoZeroDays.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attempt_logs")
public class AttemptLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_profile_id", nullable = false)
    private StudentProfile studentProfile;

    private String module;  // e.g., "M1_MATH", "M2_MULTIPLIERS", etc.
    private int phase;      // e.g., 1, 2
    private String step;    // e.g., "EXTRACT", "IDENTIFY_RULE", "EXECUTE"

    @Column(columnDefinition = "TEXT")
    private String userInputData; // JSON representation of user submissions

    @Column(columnDefinition = "TEXT")
    private String expectedData;  // JSON representation of generated scenario parameters

    private boolean isSuccessful;
    private boolean isRedHerring;
    private String feedbackMessage;

    private LocalDateTime attemptTime = LocalDateTime.now();

    // Default Constructor
    public AttemptLog() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public StudentProfile getStudentProfile() { return studentProfile; }
    public void setStudentProfile(StudentProfile studentProfile) { this.studentProfile = studentProfile; }

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public int getPhase() { return phase; }
    public void setPhase(int phase) { this.phase = phase; }

    public String getStep() { return step; }
    public void setStep(String step) { this.step = step; }

    public String getUserInputData() { return userInputData; }
    public void setUserInputData(String userInputData) { this.userInputData = userInputData; }

    public String getExpectedData() { return expectedData; }
    public void setExpectedData(String expectedData) { this.expectedData = expectedData; }

    public boolean isSuccessful() { return isSuccessful; }
    public void setSuccessful(boolean successful) { isSuccessful = successful; }

    public boolean isRedHerring() { return isRedHerring; }
    public void setRedHerring(boolean redHerring) { isRedHerring = redHerring; }

    public String getFeedbackMessage() { return feedbackMessage; }
    public void setFeedbackMessage(String feedbackMessage) { this.feedbackMessage = feedbackMessage; }

    public LocalDateTime getAttemptTime() { return attemptTime; }
    public void setAttemptTime(LocalDateTime attemptTime) { this.attemptTime = attemptTime; }
}
