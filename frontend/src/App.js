import React, { useState, useEffect } from 'react';
import Phase1Room from './Phase1Room';
import Popups from './Popups'; 
import Login from './Login';
import Dashboard from './Dashboard';
import MissionLog from './MissionLog';
import { 
  generatePhase2Scenario, 
  generatePhase3Scenario, 
  generatePhase4Scenario, 
  generatePhase5Scenario, 
  generatePhase6Scenario, 
  generatePhase7Scenario 
} from './utils/scenarioGen';
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

  // Phase 7 (Tribunal) Inputs & Status
  const [tribunalGross, setTribunalGross] = useState('');
  const [tribunalDeductions, setTribunalDeductions] = useState('');
  const [tribunalNet, setTribunalNet] = useState('');
  const [tribunalStatus, setTribunalStatus] = useState('ACTIVE'); // ACTIVE, SUCCESS, ERROR

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

    let newScenario;
    if (phaseToUse === 1) {
      const employees = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Penduko', 'Anna Mangahas', 'Jose Rizal'];
      const companies = ['Apex Industrial Works', 'TechGear Solutions Inc.', 'Starlight Garments Corp.', 'Cebu Logistics Ltd.'];
      const rates = [500, 600, 750, 800, 900, 1000];
      const shifts = [7, 8, 9, 10, 11, 12, 13, 14, 15];
      const newEmployee = employees[Math.floor(Math.random() * employees.length)];
      const newCompany = companies[Math.floor(Math.random() * companies.length)];
      const newDaily = rates[Math.floor(Math.random() * rates.length)];
      const newDays = shifts[Math.floor(Math.random() * shifts.length)];
      const newGrid = generateCalendarDays(newDays);
      newScenario = {
        employeeName: newEmployee,
        companyName: newCompany,
        dailyRate: newDaily,
        daysPresent: newDays,
        riceSubsidy: 1200,
        uniformAllowance: 1500,
        hourlyRate: newDaily / 8.0,
        lateMinutes: 0,
        earlyClockInMinutes: 0,
        calendarGrid: newGrid,
        biometricLogs: []
      };
    } else if (phaseToUse === 2) {
      newScenario = generatePhase2Scenario();
    } else if (phaseToUse === 3) {
      newScenario = generatePhase3Scenario();
    } else if (phaseToUse === 4) {
      newScenario = generatePhase4Scenario();
    } else if (phaseToUse === 5) {
      newScenario = generatePhase5Scenario();
    } else if (phaseToUse === 6) {
      newScenario = generatePhase6Scenario();
    } else if (phaseToUse === 7) {
      newScenario = generatePhase7Scenario();
    }

    setScenario(newScenario);

    // Reset simulator inputs
    setExtractedA('');
    setExtractedB('');
    setSelectedRule('');
    setCalculatedValue('');
    setNetPayValue('');

    // Reset Tribunal inputs
    setTribunalGross('');
    setTribunalDeductions('');
    setTribunalNet('');
    setTribunalStatus('ACTIVE');

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



  const handleTransitionToNextPhase = () => {
    if (activePhaseIndex === 1) {
      handleRerollScenario(true, 2);
      setFeedback('Security & Biometrics Room entered. Scan the Biometrics Terminal and DOLE Poster to audit the tardiness deduction.');
    } else if (activePhaseIndex === 2) {
      handleRerollScenario(true, 3);
      setFeedback('Production Line Room entered. Scan the Production Time Card and DOLE Overtime Poster to audit overtime premiums.');
    } else if (activePhaseIndex === 3) {
      handleRerollScenario(true, 4);
      setFeedback('Factory Breakroom entered. Scan the Corkboard Corporate Memos and Timesheet Terminal to audit Regular Holiday Pay.');
    } else if (activePhaseIndex === 4) {
      handleRerollScenario(true, 5);
      setFeedback('PC Lab / Bureaucracy Room entered. Scan the SSS contribution table and employee loan statement on the monitor to audit SSS deductions.');
    } else if (activePhaseIndex === 5) {
      handleRerollScenario(true, 6);
      setFeedback('PC Lab / Bureaucracy Room entered. Scan the PhilHealth table and HR salary database to audit PhilHealth premium deductions.');
    } else if (activePhaseIndex === 6) {
      handleRerollScenario(true, 7);
      setFeedback('Executive Boardroom entered. Scan the Master Case File in the Audit Folder on the table to perform the final payroll run.');
    } else {
      setCurrentView('DASHBOARD');
      setFeedback('All completed phases Mastered! Returned to Dashboard Command Center.');
    }
  };


  // --- 5. SECURE BACKEND API SUBMISSIONS ---
  
  // Helper to compute module and phase dynamically
  const getModuleAndPhase = () => {
    let module = 'M1_MATH';
    let phase = activePhaseIndex;
    if (activePhaseIndex === 3 || activePhaseIndex === 4) {
      module = 'M2_MULTIPLIERS';
      phase = activePhaseIndex === 3 ? 1 : 2;
    } else if (activePhaseIndex === 5 || activePhaseIndex === 6) {
      module = 'M3_BUREAUCRACY';
      phase = activePhaseIndex === 5 ? 1 : 2;
    } else if (activePhaseIndex === 7) {
      module = 'M4_TRIBUNAL';
      phase = 1;
    }
    return { module, phase };
  };

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
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          module: mod,
          phase: ph,
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
          basicSalary: scenario.basicSalary,
          sssEeShare: scenario.sssEeShare,
          sssErShare: scenario.sssErShare,
          personalSalaryLoan: scenario.personalSalaryLoan,
          spouseLoan: scenario.spouseLoan,
          workedOnHoliday: scenario.workedOnHoliday,
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
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          module: mod,
          phase: ph,
          step: 'IDENTIFY_RULE',
          dailyRate: scenario.dailyRate,
          daysPresent: scenario.daysPresent,
          hourlyRate: scenario.hourlyRate,
          lateMinutes: scenario.lateMinutes,
          earlyClockInMinutes: scenario.earlyClockInMinutes,
          otHours: scenario.otHours,
          unpaidLunchHours: scenario.unpaidLunchHours,
          basicSalary: scenario.basicSalary,
          sssEeShare: scenario.sssEeShare,
          sssErShare: scenario.sssErShare,
          personalSalaryLoan: scenario.personalSalaryLoan,
          spouseLoan: scenario.spouseLoan,
          workedOnHoliday: scenario.workedOnHoliday,
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
      const { module: mod, phase: ph } = getModuleAndPhase();
      const requestPayload = {
        studentNumber: student?.studentNumber || 'STU-UNKNOWN',
        module: mod,
        phase: ph,
        step: 'EXECUTE',
        dailyRate: scenario.dailyRate,
        daysPresent: scenario.daysPresent,
        hourlyRate: scenario.hourlyRate,
        lateMinutes: scenario.lateMinutes,
        earlyClockInMinutes: scenario.earlyClockInMinutes,
        otHours: scenario.otHours,
        unpaidLunchHours: scenario.unpaidLunchHours,
        basicSalary: scenario.basicSalary,
        sssEeShare: scenario.sssEeShare,
        sssErShare: scenario.sssErShare,
        personalSalaryLoan: scenario.personalSalaryLoan,
        spouseLoan: scenario.spouseLoan,
        workedOnHoliday: scenario.workedOnHoliday,
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
        if (activePhaseIndex >= 2 && activePhaseIndex <= 6) {
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
      setFeedback((activePhaseIndex === 3 || activePhaseIndex === 4) ? 'Please enter the final calculated Total Earnings.' : 'Please enter the final calculated Net Take-Home Pay.');
      return;
    }

    setLoading(true);
    setFeedback(activePhaseIndex === 2 ? 'Auditing final synthesis ledger Net Pay calculations...' : activePhaseIndex === 4 ? 'Auditing final synthesis ledger Holiday Total Earnings calculations...' : 'Auditing final synthesis ledger Overtime Total Earnings calculations...');

    try {
      const grossPay = parseFloat((scenario.dailyRate * scenario.daysPresent).toFixed(2));
      const tardinessDeduction = calculatedValue ? parseFloat(parseFloat(calculatedValue).toFixed(2)) : parseFloat(((scenario.hourlyRate / 60) * scenario.lateMinutes).toFixed(2));

      const { module: mod, phase: ph } = getModuleAndPhase();
      const requestPayload = {
        studentNumber: student?.studentNumber || 'STU-UNKNOWN',
        module: mod,
        phase: ph,
        step: 'SYNTHESIS',
        dailyRate: scenario.dailyRate,
        daysPresent: scenario.daysPresent,
        hourlyRate: scenario.hourlyRate,
        lateMinutes: scenario.lateMinutes,
        earlyClockInMinutes: scenario.earlyClockInMinutes,
        otHours: scenario.otHours,
        unpaidLunchHours: scenario.unpaidLunchHours,
        basicSalary: scenario.basicSalary,
        sssEeShare: scenario.sssEeShare,
        sssErShare: scenario.sssErShare,
        personalSalaryLoan: scenario.personalSalaryLoan,
        spouseLoan: scenario.spouseLoan,
        workedOnHoliday: scenario.workedOnHoliday,
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

  // Submit Phase 7 (Tribunal Final Boss)
  const handleValidateTribunal = async () => {
    if (!tribunalGross || !tribunalDeductions || !tribunalNet) {
      setFeedback('Missing variables! Please enter all three audit values.');
      return;
    }

    setLoading(true);
    setFeedback('Submitting final Net Payroll audit to Board of Trustees...');

    try {
      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          module: 'M4_TRIBUNAL',
          phase: 1,
          step: 'SUBMIT',
          dailyRate: scenario.dailyRate,
          daysPresent: scenario.daysPresent,
          hourlyRate: scenario.hourlyRate,
          lateMinutes: scenario.lateMinutes,
          earlyClockInMinutes: 0,
          otHours: scenario.otHours,
          unpaidLunchHours: scenario.unpaidLunchHours,
          workedOnHoliday: scenario.workedOnHoliday,
          basicSalary: scenario.basicSalary,
          sssEeShare: scenario.sssEeShare,
          personalSalaryLoan: scenario.personalSalaryLoan,
          submittedValueA: tribunalGross ? parseFloat(tribunalGross) : 0.0,
          submittedValueB: tribunalDeductions ? parseFloat(tribunalDeductions) : 0.0,
          submittedResult: tribunalNet ? parseFloat(tribunalNet) : 0.0
        })
      });

      if (!response.ok) {
        throw new Error('API connection lost.');
      }

      const data = await response.json();

      if (data.success) {
        setTribunalStatus('SUCCESS');
        setFeedback(data.message);
      } else {
        setTribunalStatus('ERROR');
        setFeedback(data.message);
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Cannot connect to the compliance validation server.');
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
                  : activePhaseIndex === 3
                    ? 'ROOM 3: THE FACTORY FLOOR [PHASE 3]'
                    : activePhaseIndex === 4
                      ? 'ROOM 4: THE FACTORY BREAKROOM [PHASE 4]'
                      : activePhaseIndex === 5
                        ? 'ROOM 5: THE PC LAB / BUREAUCRACY [PHASE 5]'
                        : activePhaseIndex === 6
                          ? 'ROOM 6: THE PC LAB / BUREAUCRACY [PHASE 6]'
                          : 'ROOM 7: THE EXECUTIVE BOARDROOM [PHASE 7]'
              }
            </h2>
            <p className="room-subtitle">
              {activePhaseIndex === 1 
                ? `${scenario.employeeName} Payroll - Gross Basic Pay Calculations` 
                : activePhaseIndex === 2 
                  ? `${scenario.employeeName} Payroll - Tardiness & Log Audit` 
                  : activePhaseIndex === 3
                    ? `${scenario.employeeName} Payroll - Overtime Premiums Audit`
                    : activePhaseIndex === 4
                      ? `${scenario.employeeName} Payroll - Regular Holiday Pay Audit`
                      : activePhaseIndex === 5
                        ? `${scenario.employeeName} Payroll - SSS Deductions Audit`
                        : activePhaseIndex === 6
                          ? `${scenario.employeeName} Payroll - PhilHealth Premiums Audit`
                          : `${scenario.employeeName} Payroll - Final Net Payroll Audit`
              }
            </p>
          </div>
          
          <div className="room-content">
            <Phase1Room setActivePopup={setActivePopup} activePhaseIndex={activePhaseIndex} />
          </div>

          <div className="panel-footer">
            <span className="intel-icon">💬</span> {
              activePhaseIndex === 1 
                ? 'Click office objects (Desk, Calendar, Whiteboard) to inspect details.' 
                : activePhaseIndex === 2 
                  ? 'Click office objects (Biometrics, DOLE Poster, Exit Door) to inspect details.' 
                  : activePhaseIndex === 3
                    ? 'Click office objects (Time Card, DOLE Overtime Poster, Exit Door) to inspect details.'
                    : activePhaseIndex === 4
                      ? 'Click breakroom objects (Corkboard Memos, Timesheet Terminal, DOLE Holiday Poster, Exit Door) to inspect details.'
                      : activePhaseIndex === 5 || activePhaseIndex === 6
                        ? 'Click PC Lab objects (Notice Board, PC Monitor, Company Manual, Exit Door) to inspect details.'
                        : 'Click boardroom objects (Executive Audit Folder, Exit Door) to inspect details.'
            }
          </div>
        </div>

        {/* RIGHT PANEL: The Mission Task Log Component */}
        <MissionLog
          activePhaseIndex={activePhaseIndex}
          scenario={scenario}
          loading={loading}
          feedback={feedback}
          setActivePopup={setActivePopup}
          handleRerollScenario={handleRerollScenario}
          setCurrentView={setCurrentView}
          student={student}
          extractedA={extractedA}
          setExtractedA={setExtractedA}
          extractedB={extractedB}
          setExtractedB={setExtractedB}
          step1Status={step1Status}
          extractionAttempts={extractionAttempts}
          handleValidateExtraction={handleValidateExtraction}
          selectedRule={selectedRule}
          setSelectedRule={setSelectedRule}
          step2Status={step2Status}
          handleValidateRule={handleValidateRule}
          calculatedValue={calculatedValue}
          setCalculatedValue={setCalculatedValue}
          step3Status={step3Status}
          handleValidateExecution={handleValidateExecution}
          netPayValue={netPayValue}
          setNetPayValue={setNetPayValue}
          step4Status={step4Status}
          handleValidateSynthesis={handleValidateSynthesis}
          tribunalGross={tribunalGross}
          setTribunalGross={setTribunalGross}
          tribunalDeductions={tribunalDeductions}
          setTribunalDeductions={setTribunalDeductions}
          tribunalNet={tribunalNet}
          setTribunalNet={setTribunalNet}
          handleValidateTribunal={handleValidateTribunal}
          tribunalStatus={tribunalStatus}
        />

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
        isPhaseComplete={
          activePhaseIndex === 1 
            ? step3Status === 'SUCCESS' 
            : activePhaseIndex === 7
              ? tribunalStatus === 'SUCCESS'
              : step4Status === 'SUCCESS'
        }
        onProceed={() => {
          setActivePopup(null);
          if (activePhaseIndex >= 1 && activePhaseIndex <= 6) {
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