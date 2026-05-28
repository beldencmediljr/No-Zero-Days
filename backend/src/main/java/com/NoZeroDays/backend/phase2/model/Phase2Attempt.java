package com.NoZeroDays.backend.phase2.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Phase2Attempt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Double submittedHourlyRate;
    private Integer submittedLateMinutes;
    private boolean isSuccessful;
    private String feedbackMessage;
    private LocalDateTime attemptTime = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Double getSubmittedHourlyRate() { return submittedHourlyRate; }
    public void setSubmittedHourlyRate(Double submittedHourlyRate) { this.submittedHourlyRate = submittedHourlyRate; }
    public Integer getSubmittedLateMinutes() { return submittedLateMinutes; }
    public void setSubmittedLateMinutes(Integer submittedLateMinutes) { this.submittedLateMinutes = submittedLateMinutes; }
    public boolean isSuccessful() { return isSuccessful; }
    public void setSuccessful(boolean successful) { isSuccessful = successful; }
    public String getFeedbackMessage() { return feedbackMessage; }
    public void setFeedbackMessage(String feedbackMessage) { this.feedbackMessage = feedbackMessage; }
    public LocalDateTime getAttemptTime() { return attemptTime; }
    public void setAttemptTime(LocalDateTime attemptTime) { this.attemptTime = attemptTime; }
}
