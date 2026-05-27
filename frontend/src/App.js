import React, { useState, useEffect } from 'react';
import Phase1Room from './Phase1Room';
import Popups from './Popups'; 
import Login from './Login';
import Dashboard from './Dashboard';
import './App.css'; 

function App() {
  // --- 1. NAVIGATION & SESSION STATE ---
  const [currentView, setCurrentView] = useState('LOGIN'); 
  const [student, setStudent] = useState(null);

  // --- 2. GAMEPLAY SCENARIO STATE ---
  const [scenario, setScenario] = useState({
    dailyRate: 800,
    daysPresent: 14,
    riceSubsidy: 1200,
    uniformAllowance: 1500,
    hourlyRate: 100,
    lateMinutes: 45,
    earlyClockInMinutes: 15
  });

  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [activePhaseIndex, setActivePhaseIndex] = useState(1);

  // --- 3. MISSION INPUTS & STEPS ---
  const [activePopup, setActivePopup] = useState(null);
  
  // Step 1: Extraction Inputs
  const [extractedA, setExtractedA] = useState('');
  const [extractedB, setExtractedB] = useState('');
  const [step1Status, setStep1Status] = useState('ACTIVE'); // ACTIVE, SUCCESS, ERROR
  const [extractionAttempts, setExtractionAttempts] = useState(0); // 3-Strike counter

  // Step 2: Rule Identification Inputs
  const [selectedRule, setSelectedRule] = useState('');
  const [step2Status, setStep2Status] = useState('LOCKED'); // LOCKED, ACTIVE, SUCCESS, ERROR

  // Step 3: Arithmetic Calculation Inputs
  const [calculatedValue, setCalculatedValue] = useState('');
  const [step3Status, setStep3Status] = useState('LOCKED'); // LOCKED, ACTIVE, SUCCESS, ERROR

  // Step 4: Synthesis Net Pay Inputs
  const [netPayValue, setNetPayValue] = useState('');
  const [step4Status, setStep4Status] = useState('LOCKED'); // LOCKED, ACTIVE, SUCCESS, ERROR

  // Reroll toast notification
  const [rerollToast, setRerollToast] = useState(null); // null | 'MAX_STRIKES' | 'RED_HERRING'

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('Scenario loaded. Extract the basic variables to begin.');

  // Load student profile if present in localStorage
  useEffect(() => {
    const savedStudent = localStorage.getItem('student');
    if (savedStudent) {
      setStudent(JSON.parse(savedStudent));
      setCurrentView('DASHBOARD');
    }
  }, []);

  // Debug log to trace narrative intro display gates (resolves ESLint unused var)
  useEffect(() => {
    console.log(`[DEBUG INTRO GATE] Student has seen the narrative briefing intro: ${hasSeenIntro}`);
  }, [hasSeenIntro]);


  const generateCalendarDays = (totalDays) => {
    const weekdaysList = [8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26];
    const shuffledDays = [...weekdaysList].sort(() => Math.random() - 0.5);
    const presentDays = new Set(shuffledDays.slice(0, totalDays));
    
    const newGrid = {};
    weekdaysList.forEach(day => {
      newGrid[day] = presentDays.has(day) ? 'P' : 'A';
    });
    return newGrid;
  };

  // --- 4. SCENARIO RANDOMIZATION ENGINE ---
  const handleRerollScenario = (showIntro = true, targetPhase = null) => {
    const phaseToUse = targetPhase !== null ? targetPhase : activePhaseIndex;
    setActivePhaseIndex(phaseToUse);

    const employees = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Penduko', 'Anna Mangahas', 'Jose Rizal'];
    const companies = ['Apex Industrial Works', 'TechGear Solutions Inc.', 'Starlight Garments Corp.', 'Cebu Logistics Ltd.'];
    const rates = [500, 600, 750, 800, 900, 1000];
    const shifts = [7, 8, 9, 10, 11, 12, 13, 14, 15];

    const newEmployee = employees[Math.floor(Math.random() * employees.length)];
    const newCompany = companies[Math.floor(Math.random() * companies.length)];
    const newDaily = rates[Math.floor(Math.random() * rates.length)];
    const newDays = shifts[Math.floor(Math.random() * shifts.length)];

    const newGrid = generateCalendarDays(newDays);

    const newHourly = newDaily / 8.0;
    const lateMinutesList = [15, 20, 30, 45, 60, 75, 90];
    const newLate = lateMinutesList[Math.floor(Math.random() * lateMinutesList.length)];
    const earlyInList = [5, 10, 15, 20, 25];
    const newEarly = earlyInList[Math.floor(Math.random() * earlyInList.length)];

    const biometricLogs = [
      { day: 'MON (June 8)', timeIn: `08:${newLate < 10 ? '0' + newLate : newLate} AM`, timeOut: '05:00 PM', late: newLate, early: 0, status: 'LATE' },
      { day: 'TUE (June 9)', timeIn: `07:${60 - newEarly} AM`, timeOut: '05:00 PM', late: 0, early: newEarly, status: 'EARLY IN' },
      { day: 'WED (June 10)', timeIn: '08:00 AM', timeOut: '05:00 PM', late: 0, early: 0, status: 'ON-TIME' },
      { day: 'THU (June 11)', timeIn: '08:00 AM', timeOut: '05:00 PM', late: 0, early: 0, status: 'ON-TIME' },
      { day: 'FRI (June 12)', timeIn: 'HOLIDAY', timeOut: 'HOLIDAY', late: 0, early: 0, status: 'HOLIDAY' }
    ];

    // Overtime hours parameters for Phase 3
    const otHoursList = [3, 4, 5, 6, 7, 8];
    const newOtHours = otHoursList[Math.floor(Math.random() * otHoursList.length)];
    const newUnpaidLunch = 1.0;

    setScenario({
      employeeName: newEmployee,
      companyName: newCompany,
      dailyRate: newDaily,
      daysPresent: newDays,
      riceSubsidy: 1200,
      uniformAllowance: 1500,
      hourlyRate: newHourly,
      lateMinutes: newLate,
      earlyClockInMinutes: newEarly,
      calendarGrid: newGrid,
      biometricLogs: biometricLogs,
      otHours: newOtHours,
      unpaidLunchHours: newUnpaidLunch
    });

    // Reset simulator inputs
    setExtractedA('');
    setExtractedB('');
    setSelectedRule('');
    setCalculatedValue('');
    setNetPayValue('');

    // Reset step levels
    setStep1Status('ACTIVE');
    setStep2Status('LOCKED');
    setStep3Status('LOCKED');
    setStep4Status('LOCKED');

    // Reset 3-strike counter on every reroll
    setExtractionAttempts(0);

    // Trigger narrative popups immediately
    if (showIntro) {
      setHasSeenIntro(false);
      setActivePopup('INTRO');
    }
  };

  const handleStartPhase1 = () => {
    if (!scenario.employeeName) {
      handleRerollScenario(true, 1);
    } else {
      setActivePhaseIndex(1);
    }
    setCurrentView('PHASE1');
    setFeedback('Simulator Room 1 entered. Scan HR Contract desk and June Calendar wall to extract variables.');
  };

  const handleTransitionToNextPhase = () => {
    if (activePhaseIndex === 1) {
      handleRerollScenario(true, 2);
      setFeedback('Security & Biometrics Room entered. Scan the Biometrics Terminal and DOLE Poster to audit the tardiness deduction.');
    } else if (activePhaseIndex === 2) {
      handleRerollScenario(true, 3);
      setFeedback('Production Line Room entered. Scan the Production Time Card and DOLE Overtime Poster to audit overtime premiums.');
    } else {
      setCurrentView('DASHBOARD');
      setFeedback('All completed phases Mastered! Returned to Dashboard Command Center.');
    }
  };


  // --- 5. SECURE BACKEND API SUBMISSIONS ---
  
  // Trigger a toast notification and auto-dismiss it after 3 seconds
  const triggerRerollToast = (type) => {
    setRerollToast(type);
    setTimeout(() => setRerollToast(null), 3500);
  };

  // Submit Step 1: Extraction
  const handleValidateExtraction = async () => {
    if (!extractedA || !extractedB) {
      setFeedback('Missing variables! Please extract and enter both values.');
      return;
    }

    setLoading(true);
    setFeedback('Verifying extraction parameters with DOLE compliance...');

    try {
      console.log(`[DEBUG EXTRACTION] Entered A: ${extractedA} | Entered B: ${extractedB}`);
      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          module: activePhaseIndex === 3 ? 'M2_MULTIPLIERS' : 'M1_MATH',
          phase: activePhaseIndex === 3 ? 1 : activePhaseIndex,
          step: 'EXTRACT',
          dailyRate: scenario.dailyRate,
          daysPresent: scenario.daysPresent,
          riceSubsidy: scenario.riceSubsidy,
          uniformAllowance: scenario.uniformAllowance,
          hourlyRate: scenario.hourlyRate,
          lateMinutes: scenario.lateMinutes,
          earlyClockInMinutes: scenario.earlyClockInMinutes,
          otHours: scenario.otHours,
          unpaidLunchHours: scenario.unpaidLunchHours,
          submittedValueA: extractedA ? parseFloat(extractedA) : 0.0,
          submittedValueB: extractedB ? parseFloat(extractedB) : 0.0
        })
      });

      if (!response.ok) {
        throw new Error('API connection lost.');
      }

      const data = await response.json();

      if (data.success) {
        setExtractionAttempts(0); // Clear counter on success
        setStep1Status('SUCCESS');
        setStep2Status('ACTIVE');
        setFeedback(data.message);
      } else {
        setStep1Status('ERROR');
        setFeedback(data.message);

        // --- RED HERRING: Critical failure — immediate reroll, bypass 3-strike counter ---
        if (data.redHerring) {
          setExtractedA('');
          setExtractedB('');
          triggerRerollToast('RED_HERRING');
          handleRerollScenario(false); // skip intro re-pop for seamless reset
          return;
        }

        // --- 3-STRIKE SYSTEM ---
        const newAttempts = extractionAttempts + 1;
        setExtractionAttempts(newAttempts);

        if (newAttempts >= 3 || data.drillTriggered) {
          // Strike 3 (or backend-triggered drill): force reroll
          triggerRerollToast('MAX_STRIKES');
          handleRerollScenario(false);
        }
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Cannot connect to the compliance validation server.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 2: Rule Identification
  const handleValidateRule = async () => {
    if (!selectedRule) {
      setFeedback('Please select a mathematical equation operator.');
      return;
    }

    setLoading(true);
    setFeedback('Validating formula syntax with standard accounting laws...');

    try {
      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          module: activePhaseIndex === 3 ? 'M2_MULTIPLIERS' : 'M1_MATH',
          phase: activePhaseIndex === 3 ? 1 : activePhaseIndex,
          step: 'IDENTIFY_RULE',
          dailyRate: scenario.dailyRate,
          daysPresent: scenario.daysPresent,
          hourlyRate: scenario.hourlyRate,
          lateMinutes: scenario.lateMinutes,
          earlyClockInMinutes: scenario.earlyClockInMinutes,
          otHours: scenario.otHours,
          unpaidLunchHours: scenario.unpaidLunchHours,
          submittedRule: selectedRule
        })
      });

      const data = await response.json();

      if (data.success) {
        setStep2Status('SUCCESS');
        setStep3Status('ACTIVE');
        setFeedback(data.message);
      } else {
        setStep2Status('ERROR');
        setFeedback(data.message);

        if (data.drillTriggered) {
          handleRerollScenario();
        }
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Compliance server timed out.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 3: Arithmetic Execution
  const handleValidateExecution = async () => {
    if (!calculatedValue) {
      setFeedback('Please enter the final computed pay amount.');
      return;
    }

    setLoading(true);
    setFeedback('Auditing final arithmetic ledger pay calculations...');

    try {
      const requestPayload = {
        studentNumber: student?.studentNumber || 'STU-UNKNOWN',
        module: activePhaseIndex === 3 ? 'M2_MULTIPLIERS' : 'M1_MATH',
        phase: activePhaseIndex === 3 ? 1 : activePhaseIndex,
        step: 'EXECUTE',
        dailyRate: scenario.dailyRate,
        daysPresent: scenario.daysPresent,
        hourlyRate: scenario.hourlyRate,
        lateMinutes: scenario.lateMinutes,
        earlyClockInMinutes: scenario.earlyClockInMinutes,
        otHours: scenario.otHours,
        unpaidLunchHours: scenario.unpaidLunchHours,
        submittedResult: calculatedValue ? parseFloat(calculatedValue) : 0.0
      };

      console.log("[DEBUG EXECUTE PAYLOAD SENT]:", requestPayload);

      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json();
      console.log("[DEBUG EXECUTE BACKEND RESPONSE]:", data);

      if (data.success) {
        setStep3Status('SUCCESS');
        if (activePhaseIndex === 2 || activePhaseIndex === 3) {
          setStep4Status('ACTIVE');
        }
        setFeedback(data.message);
      } else {
        setStep3Status('ERROR');
        setFeedback(data.message);

        if (data.drillTriggered) {
          handleRerollScenario();
        }
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Final ledger verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 4: Synthesis
  const handleValidateSynthesis = async () => {
    if (!netPayValue) {
      setFeedback(activePhaseIndex === 3 ? 'Please enter the final calculated Total Earnings.' : 'Please enter the final calculated Net Take-Home Pay.');
      return;
    }

    setLoading(true);
    setFeedback(activePhaseIndex === 3 ? 'Auditing final synthesis ledger Total Earnings calculations...' : 'Auditing final synthesis ledger Net Pay calculations...');

    try {
      const grossPay = parseFloat((scenario.dailyRate * scenario.daysPresent).toFixed(2));
      const tardinessDeduction = calculatedValue ? parseFloat(parseFloat(calculatedValue).toFixed(2)) : parseFloat(((scenario.hourlyRate / 60) * scenario.lateMinutes).toFixed(2));

      const requestPayload = {
        studentNumber: student?.studentNumber || 'STU-UNKNOWN',
        module: activePhaseIndex === 3 ? 'M2_MULTIPLIERS' : 'M1_MATH',
        phase: activePhaseIndex === 3 ? 1 : activePhaseIndex,
        step: 'SYNTHESIS',
        dailyRate: scenario.dailyRate,
        daysPresent: scenario.daysPresent,
        hourlyRate: scenario.hourlyRate,
        lateMinutes: scenario.lateMinutes,
        earlyClockInMinutes: scenario.earlyClockInMinutes,
        otHours: scenario.otHours,
        unpaidLunchHours: scenario.unpaidLunchHours,
        grossPay: grossPay,
        tardinessDeduction: tardinessDeduction,
        submittedResult: netPayValue ? parseFloat(netPayValue) : 0.0
      };

      console.log("[DEBUG SYNTHESIS PAYLOAD SENT]:", requestPayload);

      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json();
      console.log("[DEBUG SYNTHESIS BACKEND RESPONSE]:", data);

      if (data.success) {
        setStep4Status('SUCCESS');
        setFeedback(data.message);
      } else {
        setStep4Status('ERROR');
        let feedbackMsg = data.message;
        if (data.expected !== undefined && data.expected !== null) {
          feedbackMsg += ` | Backend Validation Audit: Expected ₱${data.expected.toFixed(2)}, Received ₱${data.received !== null ? data.received.toFixed(10) : '0.00'}. Arithmetic mismatch detected.`;
        }
        setFeedback(feedbackMsg);

        if (data.drillTriggered) {
          handleRerollScenario();
        }
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Synthesis payroll audit failed.');
    } finally {
      setLoading(false);
    }
  };

  // --- 6. CONDITIONAL SCREEN ROUTERS ---
  if (currentView === 'LOGIN') {
    return <Login onLoginSuccess={(stu) => {
      setStudent(stu);
      setCurrentView('DASHBOARD');
    }} />;
  }

  if (currentView === 'DASHBOARD') {
    return <Dashboard onSelectPhase={(phaseId) => {
      setActivePhaseIndex(phaseId);
      handleRerollScenario(true, phaseId);
      setCurrentView('PHASE1');
      if (phaseId === 1) {
        setFeedback('Simulator Room 1 entered. Scan HR Contract desk and June Calendar wall to extract variables.');
      } else if (phaseId === 2) {
        setFeedback('Security & Biometrics Room entered. Scan the Biometrics Terminal and DOLE Poster to audit the tardiness deduction.');
      } else if (phaseId === 3) {
        setFeedback('Production Line Room entered. Scan the Production Time Card and DOLE Overtime Poster to audit overtime premiums.');
      } else {
        setFeedback(`Room for Phase ${phaseId} entered.`);
      }
    }} />;
  }

  return (
    <div className="app-background">
      <div className="app-container">
        
        {/* LEFT PANEL: The Room Grid */}
        <div className="left-panel">
          <div className="panel-header">
            <h2 className="room-title">
              {activePhaseIndex === 1 
                ? 'ROOM 1: THE CORE LOBBY [PHASE 1]' 
                : activePhaseIndex === 2 
                  ? 'ROOM 2: SECURITY & BIOMETRICS [PHASE 2]' 
                  : 'ROOM 3: THE FACTORY FLOOR [PHASE 3]'
              }
            </h2>
            <p className="room-subtitle">
              {activePhaseIndex === 1 
                ? `${scenario.employeeName} Payroll - Gross Basic Pay Calculations` 
                : activePhaseIndex === 2 
                  ? `${scenario.employeeName} Payroll - Tardiness & Log Audit` 
                  : `${scenario.employeeName} Payroll - Overtime Premiums Audit`
              }
            </p>
          </div>
          
          <div className="room-content">
            <Phase1Room setActivePopup={setActivePopup} activePhaseIndex={activePhaseIndex} />
          </div>

          <div className="panel-footer">
            <span className="intel-icon">💬</span> {activePhaseIndex === 1 
              ? 'Click office objects (Desk, Calendar, Whiteboard) to inspect details.' 
              : activePhaseIndex === 2 
                ? 'Click office objects (Biometrics, DOLE Poster, Exit Door) to inspect details.' 
                : 'Click office objects (Time Card, DOLE Overtime Poster, Exit Door) to inspect details.'
            }
          </div>
        </div>

        {/* RIGHT PANEL: The Mission Task Log */}
        <div className="right-panel">
          <div className="mission-header">
            <h3>⚡ COGNITIVE AUDIT LOG</h3>
            <span className="timer" style={{ color: step3Status === 'SUCCESS' ? '#10b981' : '#f59e0b' }}>
              {step3Status === 'SUCCESS' ? '🟢 UNLOCKED' : '🔴 IN PROGRESS'}
            </span>
          </div>

          <div className="tracker-steps" style={{ overflowY: 'auto' }}>
            
            {/* STEP 1: EXTRACTION */}
            <div className={`step-card ${step1Status === 'ACTIVE' ? 'active-step' : ''} ${step1Status === 'SUCCESS' ? 'success-step' : ''} ${step1Status === 'ERROR' ? 'error-step' : ''}`}>
              <div className="step-title">
                <h4>① STEP 1: VARIABLE EXTRACTION</h4>
                <span className="badge" style={{ backgroundColor: step1Status === 'SUCCESS' ? '#10b981' : '#f59e0b', color: '#000' }}>
                  {step1Status}
                </span>
              </div>
              
              <div className="inputs-container">
                <label>
                  {activePhaseIndex === 1 ? 'VARIABLE COMPONENT A (Daily Rate)' : 'VARIABLE COMPONENT A (Hourly Rate)'}
                </label>
                <input 
                  type="number" 
                  placeholder={activePhaseIndex === 1 ? "₱ Enter base Daily Rate" : "₱ Enter base Hourly Rate"} 
                  className="tech-input"
                  value={extractedA}
                  onChange={(e) => setExtractedA(e.target.value)}
                  disabled={step1Status === 'SUCCESS' || loading}
                />
                
                <label>
                  {activePhaseIndex === 1 
                    ? 'VARIABLE COMPONENT B (Days Present)' 
                    : activePhaseIndex === 2 
                      ? 'VARIABLE COMPONENT B (Late Minutes)' 
                      : 'VARIABLE COMPONENT B (Actual OT Hours)'}
                </label>
                <input 
                  type="number" 
                  placeholder={activePhaseIndex === 1 
                    ? "Enter shifts worked" 
                    : activePhaseIndex === 2 
                      ? "Enter late minutes" 
                      : "Enter actual OT hours"} 
                  className="tech-input"
                  value={extractedB}
                  onChange={(e) => setExtractedB(e.target.value)}
                  disabled={step1Status === 'SUCCESS' || loading}
                />

                {/* 3-Strike Warning Banner */}
                {step1Status === 'ERROR' && extractionAttempts > 0 && extractionAttempts < 3 && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    backgroundColor: extractionAttempts === 2 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.10)',
                    border: `1px solid ${extractionAttempts === 2 ? '#ef4444' : '#f59e0b'}`,
                    color: extractionAttempts === 2 ? '#f87171' : '#fbbf24',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>{extractionAttempts === 2 ? '🚨' : '⚠️'}</span>
                    <span>
                      {extractionAttempts === 2
                        ? `CRITICAL WARNING: Final attempt remaining. One more failure will force a full scenario reroll.`
                        : `Extraction Failed. You have ${3 - extractionAttempts} attempt${3 - extractionAttempts === 1 ? '' : 's'} remaining before the scenario resets.`
                      }
                    </span>
                  </div>
                )}
                
                {step1Status !== 'SUCCESS' && (
                  <button className="run-btn" onClick={handleValidateExtraction} disabled={loading}>
                    {loading ? 'AUDITING...' : 'RUN EXTRACTION UNIT >'}
                  </button>
                )}
              </div>
            </div>

            {/* STEP 2: RULE IDENTIFICATION */}
            <div className={`step-card ${step2Status === 'ACTIVE' ? 'active-step' : ''} ${step2Status === 'SUCCESS' ? 'success-step' : ''} ${step2Status === 'ERROR' ? 'error-step' : ''} ${step2Status === 'LOCKED' ? 'locked-step' : ''}`}>
              <div className="step-title">
                <h4>② STEP 2: IDENTIFY CORE EQUATION</h4>
                <span className="badge" style={{ backgroundColor: step2Status === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
                  {step2Status}
                </span>
              </div>
              
              {step2Status !== 'LOCKED' && (
                <div className="inputs-container">
                  <label>
                    {activePhaseIndex === 1 
                      ? 'Gross Basic Pay Equation Formula:' 
                      : activePhaseIndex === 2 
                        ? 'Tardiness Deduction Equation Formula:' 
                        : 'Overtime Premium Equation Formula:'}
                  </label>
                  <select 
                    value={selectedRule}
                    onChange={(e) => setSelectedRule(e.target.value)}
                    disabled={step2Status === 'SUCCESS' || loading}
                    className="tech-input"
                    style={{ backgroundColor: '#0b1120', color: '#fff' }}
                  >
                    <option value="">-- SELECT FORMULA --</option>
                    {activePhaseIndex === 1 ? (
                      <>
                        <option value="ADDITION">Daily Rate + Days Present</option>
                        <option value="MULTIPLICATION">Daily Rate × Days Present (Multiplication)</option>
                        <option value="DIVISION">Daily Rate ÷ Days Present</option>
                      </>
                    ) : activePhaseIndex === 2 ? (
                      <>
                        <option value="TARDINESS_FORMULA">(Hourly Rate / 60) × Late Minutes</option>
                        <option value="OFFSET_FORMULA">(Hourly Rate / 60) × (Late Minutes - Early Clock-in)</option>
                        <option value="DAILY_RATE_DIV_60">(Daily Rate / 60) × Late Minutes</option>
                      </>
                    ) : (
                      <>
                        <option value="OT_FORMULA">Hourly Rate × OT Hours × 1.25</option>
                        <option value="OT_ADDITION">Hourly Rate + OT Hours + 1.25</option>
                        <option value="OT_DAILY">Daily Rate × OT Hours × 1.25</option>
                      </>
                    )}
                  </select>
                  
                  {step2Status !== 'SUCCESS' && (
                    <button className="run-btn" onClick={handleValidateRule} disabled={loading}>
                      {loading ? 'COMPLYING...' : 'SUBMIT RULES THEORY >'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* STEP 3: ARITHMETIC EXECUTION */}
            <div className={`step-card ${step3Status === 'ACTIVE' ? 'active-step' : ''} ${step3Status === 'SUCCESS' ? 'success-step' : ''} ${step3Status === 'ERROR' ? 'error-step' : ''} ${step3Status === 'LOCKED' ? 'locked-step' : ''}`}>
              <div className="step-title">
                <h4>③ STEP 3: EXECUTE ARITHMETIC</h4>
                <span className="badge" style={{ backgroundColor: step3Status === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
                  {step3Status}
                </span>
              </div>
              
              {step3Status !== 'LOCKED' && (
                <div className="inputs-container">
                  <label>
                    {activePhaseIndex === 1 
                      ? 'FINAL GROSS BASIC EARNINGS (₱)' 
                      : activePhaseIndex === 2 
                        ? 'TOTAL TARDINESS DEDUCTIONS (₱)' 
                        : 'FINAL OVERTIME PREMIUM PAY (₱)'}
                  </label>
                  <input 
                    type="number" 
                    placeholder={activePhaseIndex === 1 
                      ? "₱ Enter calculated amount" 
                      : activePhaseIndex === 2 
                        ? "₱ Enter calculated deductions" 
                        : "₱ Enter calculated overtime pay"} 
                    className="tech-input"
                    value={calculatedValue}
                    onChange={(e) => setCalculatedValue(e.target.value)}
                    disabled={step3Status === 'SUCCESS' || loading}
                  />
                  
                  {step3Status !== 'SUCCESS' && (
                    <button className="run-btn" onClick={handleValidateExecution} disabled={loading}>
                      {loading ? 'AUDITING LEDGER...' : 'RUN FINAL LEDGER AUDIT >'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* STEP 4: SYNTHESIS COMPUTE NET PAY / TOTAL EARNINGS */}
            {(activePhaseIndex === 2 || activePhaseIndex === 3) && (
              <div className={`step-card ${step4Status === 'ACTIVE' ? 'active-step' : ''} ${step4Status === 'SUCCESS' ? 'success-step' : ''} ${step4Status === 'ERROR' ? 'error-step' : ''} ${step4Status === 'LOCKED' ? 'locked-step' : ''}`} style={{ border: '2px solid #3b82f6', boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)' }}>
                <div className="step-title">
                  <h4 style={{ color: '#60a5fa' }}>
                    {activePhaseIndex === 2 ? '④ STEP 4: COMPUTE NET PAY' : '④ STEP 4: COMPUTE TOTAL EARNINGS'}
                  </h4>
                  <span className="badge" style={{ backgroundColor: step4Status === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
                    {step4Status}
                  </span>
                </div>
                
                {step4Status !== 'LOCKED' && (
                  <div className="inputs-container">
                    <label>
                      {activePhaseIndex === 2 ? 'FINAL TOTAL TAKE-HOME NET PAY (₱)' : 'FINAL OVERTIME-ADJUSTED TOTAL EARNINGS (₱)'}
                    </label>
                    <input 
                      type="number" 
                      placeholder={activePhaseIndex === 2 ? "₱ Enter calculated Net Pay" : "₱ Enter calculated Total Earnings"} 
                      className="tech-input"
                      value={netPayValue}
                      onChange={(e) => setNetPayValue(e.target.value)}
                      disabled={step4Status === 'SUCCESS' || loading}
                      style={{ border: '1px solid #3b82f6', color: '#fff' }}
                    />
                    <button 
                      className="tech-link"
                      onClick={() => setActivePopup('HANDBOOK')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        padding: 0,
                        textAlign: 'left',
                        marginTop: '5px',
                        display: 'block'
                      }}
                    >
                      {activePhaseIndex === 2 
                        ? '💡 Need the Net Pay formula? Check the Company Payroll Manual' 
                        : '💡 Need the Total Earnings formula? Check the Company Payroll Manual'}
                    </button>
                    
                    {step4Status !== 'SUCCESS' && (
                      <button className="run-btn" onClick={handleValidateSynthesis} disabled={loading} style={{ backgroundColor: '#1d4ed8', borderColor: '#3b82f6' }}>
                        {loading ? 'SYNTHESIZING...' : activePhaseIndex === 2 ? 'RUN FINAL SYNTHESIS NET AUDIT >' : 'RUN FINAL SYNTHESIS OT AUDIT >'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pulsing Amber CTA for Phase Completion */}
            {((activePhaseIndex === 1 && step3Status === 'SUCCESS') || 
              (activePhaseIndex === 2 && step4Status === 'SUCCESS') ||
              (activePhaseIndex === 3 && step4Status === 'SUCCESS')) && (
              <div className="text-amber-400 animate-pulse" style={{
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '1rem',
                border: '2px dashed #fbbf24',
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(251, 191, 36, 0.08)',
                marginTop: '15px',
                letterSpacing: '1px'
              }}>
                {activePhaseIndex === 1 
                  ? "MISSION PHASE 1 COMPLETE. [PROCEED TO ROOM DOOR]" 
                  : activePhaseIndex === 2
                    ? "MISSION PHASE 2 COMPLETE. [PROCEED TO ROOM DOOR]"
                    : "MISSION PHASE 3 COMPLETE. [PROCEED TO ROOM DOOR]"
                }
              </div>
            )}

            {/* General Feedback display terminal */}
            <div className="feedback-terminal" style={{
              background: '#070a13',
              border: '1px solid #1e293b',
              padding: '10px 15px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              borderRadius: '4px',
              color: feedback.includes('ERROR') || feedback.includes('Failed') ? '#ef4444' : '#60a5fa',
              marginTop: '10px'
            }}>
              <span style={{ color: '#10b981' }}>SYS_LOG&gt;&gt;</span> {feedback}
            </div>

          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              className="run-btn" 
              onClick={() => handleRerollScenario(true)} 
              disabled={loading}
              style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #60a5fa', color: '#60a5fa', margin: 0, padding: '12px' }}
            >
              🔄 REROLL SCENARIO
            </button>
            <button 
              className="escalate-btn" 
              onClick={() => setCurrentView('DASHBOARD')}
              style={{ flex: 1, margin: 0, padding: '12px' }}
            >
              [ RETURN TO DASHBOARD ]
            </button>
          </div>

        </div>

      </div>

      {/* 3-Strike / Red Herring Toast Notification */}
      {rerollToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          padding: '14px 24px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          letterSpacing: '0.5px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeInDown 0.3s ease',
          backgroundColor: rerollToast === 'RED_HERRING' ? '#450a0a' : '#1c1400',
          border: `1px solid ${rerollToast === 'RED_HERRING' ? '#ef4444' : '#f59e0b'}`,
          color: rerollToast === 'RED_HERRING' ? '#f87171' : '#fbbf24',
          maxWidth: '520px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '1.3rem' }}>{rerollToast === 'RED_HERRING' ? '🚨' : '🔄'}</span>
          <span>
            {rerollToast === 'RED_HERRING'
              ? 'RED HERRING DETECTED — Critical audit failure. A new Audit Case has been generated.'
              : 'Maximum attempts reached. A new Audit Case has been generated.'
            }
          </span>
        </div>
      )}

      {/* Renders overlay floating popups, bound with dynamic active randomized scenario variables */}
      <Popups 
        activeHotspot={activePopup} 
        onClose={() => {
          if (activePopup === 'INTRO') {
            setHasSeenIntro(true);
          }
          setActivePopup(null);
        }} 
        scenario={scenario} 
        isPhaseComplete={activePhaseIndex === 1 ? step3Status === 'SUCCESS' : step4Status === 'SUCCESS'}
        onProceed={() => {
          setActivePopup(null);
          if (activePhaseIndex === 1) {
            handleTransitionToNextPhase();
          } else {
            setCurrentView('DASHBOARD');
          }
        }}
        onReroll={() => {
          handleRerollScenario(true);
        }}
        activePhaseIndex={activePhaseIndex}
      />


    </div>
  );
}

export default App;