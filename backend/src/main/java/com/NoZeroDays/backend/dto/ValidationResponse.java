package com.NoZeroDays.backend.dto;

public class ValidationResponse {
    private boolean success;
    private String message;
    private boolean isRedHerring;
    private boolean drillTriggered;
    private Double expected;
    private Double received;

    public ValidationResponse() {}

    public ValidationResponse(boolean success, String message, boolean isRedHerring, boolean drillTriggered) {
        this.success = success;
        this.message = message;
        this.isRedHerring = isRedHerring;
        this.drillTriggered = drillTriggered;
    }

    public ValidationResponse(boolean success, String message, boolean isRedHerring, boolean drillTriggered, Double expected, Double received) {
        this.success = success;
        this.message = message;
        this.isRedHerring = isRedHerring;
        this.drillTriggered = drillTriggered;
        this.expected = expected;
        this.received = received;
    }

    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isRedHerring() { return isRedHerring; }
    public void setRedHerring(boolean redHerring) { this.isRedHerring = redHerring; }

    public boolean isDrillTriggered() { return drillTriggered; }
    public void setDrillTriggered(boolean drillTriggered) { this.drillTriggered = drillTriggered; }

    public Double getExpected() { return expected; }
    public void setExpected(Double expected) { this.expected = expected; }

    public Double getReceived() { return received; }
    public void setReceived(Double received) { this.received = received; }
}