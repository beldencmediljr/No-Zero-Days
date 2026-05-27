package com.NoZeroDays.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_sessions")
public class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_profile_id", nullable = false)
    private StudentProfile studentProfile;

    private LocalDateTime startTime = LocalDateTime.now();
    private LocalDateTime endTime;

    private String currentModule = "M1_MATH";
    private int currentPhase = 1;

    private String status = "ACTIVE"; // ACTIVE, COMPLETED

    // Default Constructor
    public GameSession() {}

    public GameSession(StudentProfile studentProfile) {
        this.studentProfile = studentProfile;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public StudentProfile getStudentProfile() { return studentProfile; }
    public void setStudentProfile(StudentProfile studentProfile) { this.studentProfile = studentProfile; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getCurrentModule() { return currentModule; }
    public void setCurrentModule(String currentModule) { this.currentModule = currentModule; }

    public int getCurrentPhase() { return currentPhase; }
    public void setCurrentPhase(int currentPhase) { this.currentPhase = currentPhase; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
