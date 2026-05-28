package com.NoZeroDays.backend.phase1.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Phase1Attempt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Double submittedDailyRate;
    private Integer submittedDaysPresent;
    private boolean isSuccessful;
    private String feedbackMessage;
    private LocalDateTime attemptTime = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Double getSubmittedDailyRate() { return submittedDailyRate; }
    public void setSubmittedDailyRate(Double submittedDailyRate) { this.submittedDailyRate = submittedDailyRate; }
    public Integer getSubmittedDaysPresent() { return submittedDaysPresent; }
    public void setSubmittedDaysPresent(Integer submittedDaysPresent) { this.submittedDaysPresent = submittedDaysPresent; }
    public boolean isSuccessful() { return isSuccessful; }
    public void setSuccessful(boolean successful) { isSuccessful = successful; }
    public String getFeedbackMessage() { return feedbackMessage; }
    public void setFeedbackMessage(String feedbackMessage) { this.feedbackMessage = feedbackMessage; }
}