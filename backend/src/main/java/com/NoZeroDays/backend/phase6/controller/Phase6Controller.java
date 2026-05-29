package com.NoZeroDays.backend.phase6.controller;

import com.NoZeroDays.backend.common.dto.ValidationRequest;
import com.NoZeroDays.backend.common.dto.ValidationResponse;
import com.NoZeroDays.backend.common.model.StudentProfile;
import com.NoZeroDays.backend.common.model.AttemptLog;
import com.NoZeroDays.backend.common.repository.StudentProfileRepository;
import com.NoZeroDays.backend.common.repository.AttemptLogRepository;
import com.NoZeroDays.backend.phase6.service.Phase6Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/phase6")
@CrossOrigin(origins = "http://localhost:3000")
public class Phase6Controller {

    @Autowired
    private Phase6Service phase6Service;

    @Autowired
    private StudentProfileRepository studentRepository;

    @Autowired
    private AttemptLogRepository attemptLogRepository;

    @GetMapping("/init")
    public ResponseEntity<?> initPhase6(@RequestParam String studentNumber) {
        Optional<StudentProfile> studentOpt = studentRepository.findByStudentNumber(studentNumber);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Student profile not found.");
        }
        StudentProfile student = studentOpt.get();
        
        List<AttemptLog> attempts = attemptLogRepository.findLatestAttempts(student, "M3_BUREAUCRACY", 1);
        AttemptLog successAttempt = attempts.stream()
            .filter(AttemptLog::isSuccessful)
            .findFirst()
            .orElse(null);

        if (successAttempt == null) {
            return ResponseEntity.badRequest().body("No successful Phase 5 audit found for this student.");
        }

        return ResponseEntity.ok(parseAttemptLogToScenario(successAttempt));
    }

    @PostMapping("/validate")
    public ResponseEntity<ValidationResponse> validate(@RequestBody ValidationRequest request) {
        if (request.getModule() == null) {
            request.setModule("M3_BUREAUCRACY");
        }
        if (request.getPhase() == null) {
            request.setPhase(2);
        }
        
        ValidationResponse response = phase6Service.validate(request);
        return ResponseEntity.ok(response);
    }

    private java.util.Map<String, Object> parseAttemptLogToScenario(AttemptLog attempt) {
        java.util.Map<String, Object> scenario = new java.util.HashMap<>();
        
        // Safe fallbacks
        scenario.put("employeeName", "Juan Dela Cruz");
        scenario.put("companyName", "Apex Industrial Works");
        scenario.put("dailyRate", 800.0);
        scenario.put("daysPresent", 14);
        scenario.put("hourlyRate", 100.0);
        scenario.put("lateMinutes", 0);
        scenario.put("otHours", 0.0);
        scenario.put("unpaidLunchHours", 1.0);
        scenario.put("workedOnHoliday", false);
        scenario.put("sssEeShare", 0.0);
        scenario.put("sssErShare", 0.0);
        scenario.put("personalSalaryLoan", 0.0);
        scenario.put("spouseLoan", 0.0);
        scenario.put("basicSalary", 22500.0);
        scenario.put("riceSubsidy", 1200.0);
        scenario.put("uniformAllowance", 1500.0);
        scenario.put("calendarGrid", new java.util.HashMap<>());
        scenario.put("biometricLogs", new java.util.ArrayList<>());

        if (attempt.getExpectedData() != null) {
            String expected = attempt.getExpectedData();
            for (String pair : expected.split(",")) {
                String[] kv = pair.trim().split("=");
                if (kv.length == 2) {
                    String key = kv[0].trim();
                    String val = kv[1].trim();
                    try {
                        if ("employeeName".equalsIgnoreCase(key)) {
                            scenario.put("employeeName", val);
                        } else if ("companyName".equalsIgnoreCase(key)) {
                            scenario.put("companyName", val);
                        } else if ("dailyRate".equalsIgnoreCase(key)) {
                            scenario.put("dailyRate", Double.parseDouble(val));
                        } else if ("daysPresent".equalsIgnoreCase(key)) {
                            scenario.put("daysPresent", Integer.parseInt(val));
                        } else if ("hourlyRate".equalsIgnoreCase(key)) {
                            scenario.put("hourlyRate", Double.parseDouble(val));
                        } else if ("lateMinutes".equalsIgnoreCase(key)) {
                            scenario.put("lateMinutes", Integer.parseInt(val));
                        } else if ("otHours".equalsIgnoreCase(key)) {
                            scenario.put("otHours", Double.parseDouble(val));
                        } else if ("unpaidLunchHours".equalsIgnoreCase(key)) {
                            scenario.put("unpaidLunchHours", Double.parseDouble(val));
                        } else if ("workedOnHoliday".equalsIgnoreCase(key)) {
                            scenario.put("workedOnHoliday", Boolean.parseBoolean(val));
                        } else if ("sssEeShare".equalsIgnoreCase(key)) {
                            scenario.put("sssEeShare", Double.parseDouble(val));
                            scenario.put("sssErShare", Double.parseDouble(val) * 2);
                        } else if ("personalSalaryLoan".equalsIgnoreCase(key)) {
                            scenario.put("personalSalaryLoan", Double.parseDouble(val));
                        } else if ("basicSalary".equalsIgnoreCase(key)) {
                            scenario.put("basicSalary", Double.parseDouble(val));
                        }
                    } catch (Exception e) {
                        // Keep fallback if parsing fails for a single parameter
                    }
                }
            }
        }
        return scenario;
    }
}
