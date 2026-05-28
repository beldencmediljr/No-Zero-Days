package com.NoZeroDays.backend.phase7.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Phase7Attempt {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Double submittedGross;
    private Double submittedDeductions;
    private Double submittedNet;
    private boolean isSuccessful;
    private String feedbackMessage;
    private LocalDateTime attemptTime = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Double getSubmittedGross() { return submittedGross; }
    public void setSubmittedGross(Double submittedGross) { this.submittedGross = submittedGross; }
    public Double getSubmittedDeductions() { return submittedDeductions; }
    public void setSubmittedDeductions(Double submittedDeductions) { this.submittedDeductions = submittedDeductions; }
    public Double getSubmittedNet() { return submittedNet; }
    public void setSubmittedNet(Double submittedNet) { this.submittedNet = submittedNet; }
    public boolean isSuccessful() { return isSuccessful; }
    public void setSuccessful(boolean successful) { isSuccessful = successful; }
    public String getFeedbackMessage() { return feedbackMessage; }
    public void setFeedbackMessage(String feedbackMessage) { this.feedbackMessage = feedbackMessage; }
    public LocalDateTime getAttemptTime() { return attemptTime; }
    public void setAttemptTime(LocalDateTime attemptTime) { this.attemptTime = attemptTime; }
}
