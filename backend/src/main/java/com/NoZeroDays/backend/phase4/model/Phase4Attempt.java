package com.NoZeroDays.backend.phase4.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Phase4Attempt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Double submittedDailyRate;
    private boolean isSuccessful;
    private String feedbackMessage;
    private LocalDateTime attemptTime = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Double getSubmittedDailyRate() { return submittedDailyRate; }
    public void setSubmittedDailyRate(Double submittedDailyRate) { this.submittedDailyRate = submittedDailyRate; }
    public boolean isSuccessful() { return isSuccessful; }
    public void setSuccessful(boolean successful) { isSuccessful = successful; }
    public String getFeedbackMessage() { return feedbackMessage; }
    public void setFeedbackMessage(String feedbackMessage) { this.feedbackMessage = feedbackMessage; }
    public LocalDateTime getAttemptTime() { return attemptTime; }
    public void setAttemptTime(LocalDateTime attemptTime) { this.attemptTime = attemptTime; }
}
