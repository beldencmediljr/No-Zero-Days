package com.NoZeroDays.backend.phase5.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Phase5Attempt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Double submittedSssEe;
    private Double submittedPersonalLoan;
    private boolean isSuccessful;
    private String feedbackMessage;
    private LocalDateTime attemptTime = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Double getSubmittedSssEe() { return submittedSssEe; }
    public void setSubmittedSssEe(Double submittedSssEe) { this.submittedSssEe = submittedSssEe; }
    public Double getSubmittedPersonalLoan() { return submittedPersonalLoan; }
    public void setSubmittedPersonalLoan(Double submittedPersonalLoan) { this.submittedPersonalLoan = submittedPersonalLoan; }
    public boolean isSuccessful() { return isSuccessful; }
    public void setSuccessful(boolean successful) { isSuccessful = successful; }
    public String getFeedbackMessage() { return feedbackMessage; }
    public void setFeedbackMessage(String feedbackMessage) { this.feedbackMessage = feedbackMessage; }
    public LocalDateTime getAttemptTime() { return attemptTime; }
    public void setAttemptTime(LocalDateTime attemptTime) { this.attemptTime = attemptTime; }
}
