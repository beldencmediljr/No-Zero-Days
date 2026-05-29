import React, { useState, useEffect } from 'react';
import Phase1Room from '../phases/Phase1/Phase1Room';
import Phase2Room from '../phases/Phase2/Phase2Room';
import Phase3Room from '../phases/Phase3/Phase3Room';
import Phase4Room from '../phases/Phase4/Phase4Room';
import Phase5Room from '../phases/Phase5/Phase5Room';
import Phase6Room from '../phases/Phase6/Phase6Room';
import Phase7Room from '../phases/Phase7/Phase7Room';
import Popups from '../components/Shared/Popups'; 
import Login from './Auth';
import Dashboard from './Dashboard';
import MissionLog from '../components/Shared/MissionLog';
import Calculator from '../components/Shared/Calculator';
import { 
  generatePhase2Scenario, 
  generatePhase3Scenario, 
  generatePhase4Scenario, 
  generatePhase5Scenario, 
  generatePhase6Scenario, 
  generatePhase7Scenario 
} from '../utils/scenarioGen';
import './App.css'; 

function App() {
  // --- 1. NAVIGATION & SESSION STATE ---
  const [currentView, setCurrentView] = useState('LOGIN'); 
  const [student, setStudent] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);

  // --- 2. GAMEPLAY SCENARIO STATE ---
  // NOTE: All fields used by any phase/popup must have safe defaults here to prevent
  // crashes when popups open before the first setScenario() call resolves.
  const [scenario, setScenario] = useState({
    employeeName: 'Loading...',
    companyName: 'Loading...',
    dailyRate: 800,
    daysPresent: 14,
    riceSubsidy: 1200,
    uniformAllowance: 1500,
    hourlyRate: 100,
    lateMinutes: 45,
    redHerringLateMinutes: 60,
    earlyClockInMinutes: 0,
    calendarGrid: {},
    biometricLogs: [],
    otHours: 0,
    unpaidLunchHours: 1.0,
    workedOnHoliday: false,
    sssEeShare: 0,
    sssErShare: 0,
    personalSalaryLoan: 0,
    spouseLoan: 0,
    basicSalary: 0
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

  // Phase 2 exclusive: Step 4 (Gross Pay), Step 5 (Net Pay Formula)
  const [grossPayValue, setGrossPayValue] = useState('');
  const [grossPayStatus, setGrossPayStatus] = useState('LOCKED'); // LOCKED, ACTIVE, SUCCESS, ERROR
  const [netPayFormula, setNetPayFormula] = useState('');
  const [netFormulaStatus, setNetFormulaStatus] = useState('LOCKED'); // LOCKED, ACTIVE, SUCCESS, ERROR

  // Phase 3 and 4 exclusive scaffolding states
  const [trueOtHoursValue, setTrueOtHoursValue] = useState('');
  const [trueOtHoursStatus, setTrueOtHoursStatus] = useState('LOCKED');
  const [otMultiplierValue, setOtMultiplierValue] = useState('');
  const [otMultiplierStatus, setOtMultiplierStatus] = useState('LOCKED');
  const [otFormulaValue, setOtFormulaValue] = useState('');
  const [otFormulaStatus, setOtFormulaStatus] = useState('LOCKED');

  const [holidayTypeValue, setHolidayTypeValue] = useState('');
  const [holidayMultiplierValue, setHolidayMultiplierValue] = useState('');
  const [holidayFormulaValue, setHolidayFormulaValue] = useState('');
  const [holidayFormulaStatus, setHolidayFormulaStatus] = useState('LOCKED');

  // Phase 7 (Tribunal) Inputs & Status
  const [tribunalGross, setTribunalGross] = useState('');
  const [tribunalDeductions, setTribunalDeductions] = useState('');
  const [tribunalNet, setTribunalNet] = useState('');
  const [tribunalStatus, setTribunalStatus] = useState<'ACTIVE' | 'SUCCESS' | 'ERROR'>('ACTIVE'); // ACTIVE, SUCCESS, ERROR

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
      newScenario = generatePhase6Scenario(); // default fallback
      fetch(`http://localhost:8080/api/phase6/init?studentNumber=${student?.studentNumber || 'STU-UNKNOWN'}`)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          setScenario(data);
        })
        .catch(err => {
          console.error("Failed to fetch inherited Phase 6 scenario:", err);
        });
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
    setGrossPayValue('');
    setNetPayFormula('');

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
    setGrossPayStatus('LOCKED');
    setNetFormulaStatus('LOCKED');

    // Reset Phase 3 & 4 scaffolding states
    setTrueOtHoursValue('');
    setTrueOtHoursStatus('LOCKED');
    setOtMultiplierValue('');
    setOtMultiplierStatus('LOCKED');
    setOtFormulaValue('');
    setOtFormulaStatus('LOCKED');

    setHolidayTypeValue('');
    setHolidayMultiplierValue('');
    setHolidayFormulaValue('');
    setHolidayFormulaStatus('LOCKED');

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
    if (activePhaseIndex === 4) {
      if (!holidayTypeValue) {
        setFeedback('Please select a Holiday Type.');
        return;
      }
    } else {
      if (!extractedA || !extractedB) {
        setFeedback('Missing variables! Please extract and enter both values.');
        return;
      }
    }

    setLoading(true);
    setFeedback('Verifying extraction parameters with DOLE compliance...');

    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const bodyPayload: any = {
        studentNumber: student?.studentNumber || 'STU-UNKNOWN',
        module: mod,
        phase: ph,
        step: 'EXTRACT',
        employeeName: scenario.employeeName,
        companyName: scenario.companyName,
        dailyRate: scenario.dailyRate,
        daysPresent: scenario.daysPresent,
        riceSubsidy: scenario.riceSubsidy,
        uniformAllowance: scenario.uniformAllowance,
        hourlyRate: scenario.hourlyRate,
        lateMinutes: scenario.lateMinutes,
        redHerringLateMinutes: scenario.redHerringLateMinutes ?? 0,
        earlyClockInMinutes: scenario.earlyClockInMinutes ?? 0,
        otHours: scenario.otHours,
        unpaidLunchHours: scenario.unpaidLunchHours,
        basicSalary: scenario.basicSalary,
        sssEeShare: scenario.sssEeShare,
        sssErShare: scenario.sssErShare,
        personalSalaryLoan: scenario.personalSalaryLoan,
        spouseLoan: scenario.spouseLoan,
        workedOnHoliday: scenario.workedOnHoliday,
      };

      if (activePhaseIndex === 4) {
        bodyPayload.submittedRule = holidayTypeValue;
      } else {
        bodyPayload.submittedValueA = extractedA ? parseFloat(extractedA) : 0.0;
        bodyPayload.submittedValueB = extractedB ? parseFloat(extractedB) : 0.0;
      }

      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        throw new Error('API connection lost.');
      }

      const data = await response.json();

      if (data.success) {
        setExtractionAttempts(0); // Clear counter on success
        setStep1Status('SUCCESS');
        if (activePhaseIndex === 3) {
          setTrueOtHoursStatus('ACTIVE');
        } else {
          setStep2Status('ACTIVE');
        }
        setFeedback(data.message);
      } else {
        setStep1Status('ERROR');
        setFeedback(data.message);

        // --- RED HERRING: Critical failure — immediate reroll, bypass 3-strike counter ---
        if (data.redHerring) {
          setExtractedA('');
          setExtractedB('');
          setHolidayTypeValue('');
          triggerRerollToast('RED_HERRING');
          handleRerollScenario(false); // skip intro re-pop for seamless reset
          return;
        }

        // --- 3-STRIKE SYSTEM ---
        // Primary signal: backend returns drillTriggered=true after exactly 3 step-scoped failures.
        // The local counter serves as a safety net (reroll if backend is unreachable / state drifts),
        // but must NOT fire before the backend confirms 3 strikes to prevent off-by-one errors.
        const newAttempts = extractionAttempts + 1;
        setExtractionAttempts(newAttempts);

        if (data.drillTriggered) {
          // Backend confirmed: 3 strikes reached. Execute reroll.
          triggerRerollToast('MAX_STRIKES');
          handleRerollScenario(false);
        } else if (newAttempts >= 3) {
          // Safety-net: backend didn't signal a drill but local counter hit 3 (e.g., stale DB state).
          // Reroll to guarantee the student is never stuck without a fresh scenario.
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

  // Phase 3 Step 2: FILTER UNPAID LUNCH
  const handleValidateTrueOtHours = async () => {
    if (!trueOtHoursValue) {
      setFeedback('Please enter the calculated True OT Hours.');
      return;
    }
    setLoading(true);
    setFeedback('Filtering unpaid lunch hours...');
    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          module: mod,
          phase: ph,
          step: 'FILTER_LUNCH',
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
          submittedResult: Number(trueOtHoursValue) || 0.0
        })
      });
      const data = await response.json();
      if (data.success) {
        setTrueOtHoursStatus('SUCCESS');
        setOtMultiplierStatus('ACTIVE');
        setFeedback(data.message);
      } else {
        setTrueOtHoursStatus('ERROR');
        setFeedback(data.message);
        if (data.redHerring) {
          setTrueOtHoursValue('');
          triggerRerollToast('RED_HERRING');
          handleRerollScenario(false);
        } else if (data.drillTriggered) {
          handleRerollScenario();
        }
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Unpaid lunch filter validation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 3 Step 3: ESTABLISH DOLE PREMIUM
  const handleValidateOtMultiplier = async () => {
    if (!otMultiplierValue) {
      setFeedback('Please select a DOLE premium multiplier.');
      return;
    }
    setLoading(true);
    setFeedback('Validating DOLE overtime premium multiplier...');
    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          module: mod,
          phase: ph,
          step: 'ESTABLISH_PREMIUM',
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
          submittedValueA: Number(otMultiplierValue) || 0.0
        })
      });
      const data = await response.json();
      if (data.success) {
        setOtMultiplierStatus('SUCCESS');
        setOtFormulaStatus('ACTIVE');
        setFeedback(data.message);
      } else {
        setOtMultiplierStatus('ERROR');
        setFeedback(data.message);
        if (data.drillTriggered) handleRerollScenario();
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Overtime premium validation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 3 Step 4: ESTABLISH OT FORMULA
  const handleValidateOtFormula = async () => {
    if (!otFormulaValue) {
      setFeedback('Please select an Overtime formula.');
      return;
    }
    setLoading(true);
    setFeedback('Validating Overtime formula...');
    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          module: mod,
          phase: ph,
          step: 'ESTABLISH_FORMULA',
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
          submittedRule: otFormulaValue
        })
      });
      const data = await response.json();
      if (data.success) {
        setOtFormulaStatus('SUCCESS');
        setStep3Status('ACTIVE');
        setFeedback(data.message);
      } else {
        setOtFormulaStatus('ERROR');
        setFeedback(data.message);
        if (data.drillTriggered) handleRerollScenario();
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Formula validation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 4 Step 2: ESTABLISH DOLE PREMIUM (Holiday Multiplier)
  const handleValidateHolidayMultiplier = async () => {
    if (!holidayMultiplierValue) {
      setFeedback('Please select a Holiday multiplier.');
      return;
    }
    setLoading(true);
    setFeedback('Validating DOLE holiday premium multiplier...');
    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          module: mod,
          phase: ph,
          step: 'ESTABLISH_PREMIUM',
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
          submittedValueA: Number(holidayMultiplierValue) || 0.0
        })
      });
      const data = await response.json();
      if (data.success) {
        setStep2Status('SUCCESS');
        setHolidayFormulaStatus('ACTIVE');
        setFeedback(data.message);
      } else {
        setStep2Status('ERROR');
        setFeedback(data.message);
        if (data.drillTriggered) handleRerollScenario();
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Holiday multiplier validation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 4 Step 3: ESTABLISH HOLIDAY FORMULA
  const handleValidateHolidayFormula = async () => {
    if (!holidayFormulaValue) {
      setFeedback('Please select a Holiday Pay formula.');
      return;
    }
    setLoading(true);
    setFeedback('Validating Holiday formula logic...');
    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          module: mod,
          phase: ph,
          step: 'ESTABLISH_FORMULA',
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
          submittedRule: holidayFormulaValue
        })
      });
      const data = await response.json();
      if (data.success) {
        setHolidayFormulaStatus('SUCCESS');
        setStep3Status('ACTIVE');
        setFeedback(data.message);
      } else {
        setHolidayFormulaStatus('ERROR');
        setFeedback(data.message);
        if (data.drillTriggered) handleRerollScenario();
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Formula validation failed.');
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
        // Phase 2, 3, and 4 chain to Gross Pay step; all others chain to synthesis
        if (activePhaseIndex === 2 || activePhaseIndex === 3 || activePhaseIndex === 4) {
          setGrossPayStatus('ACTIVE');
        } else if (activePhaseIndex >= 5 && activePhaseIndex <= 6) {
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

  // Submit Phase 2 Step 4: Verify Gross Basic Pay
  const handleValidateGrossPay = async () => {
    if (!grossPayValue) {
      setFeedback('Please enter the computed Gross Basic Pay.');
      return;
    }
    setLoading(true);
    setFeedback('Verifying Gross Basic Pay computation...');
    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          module: mod,
          phase: ph,
          step: 'COMPUTE_GROSS',
          dailyRate: scenario.dailyRate,
          hourlyRate: scenario.hourlyRate,
          daysPresent: scenario.daysPresent,
          lateMinutes: scenario.lateMinutes,
          grossPay: Number(grossPayValue) || 0.0,
          submittedResult: Number(grossPayValue) || 0.0
        })
      });
      const data = await response.json();
      console.log('[DEBUG COMPUTE_GROSS RESPONSE]:', data);
      if (data.success) {
        setGrossPayStatus('SUCCESS');
        setNetFormulaStatus('ACTIVE');
        setFeedback(data.message);
      } else {
        setGrossPayStatus('ERROR');
        let feedbackMsg = data.message;
        if (data.expected !== undefined && data.expected !== null) {
          feedbackMsg += ` | Expected: ₱${data.expected.toFixed(2)}, Received: ₱${data.received !== null ? parseFloat(data.received).toFixed(2) : '0.00'}`;
        }
        setFeedback(feedbackMsg);
        if (data.drillTriggered) handleRerollScenario();
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Gross Pay verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Phase 2 Step 5: Verify Net Pay Formula
  const handleValidateNetPayFormula = async () => {
    if (!netPayFormula) {
      setFeedback('Please select a Net Pay formula from the dropdown.');
      return;
    }
    setLoading(true);
    setFeedback('Validating Net Pay formula logic...');
    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          module: mod,
          phase: ph,
          step: 'NET_PAY_FORMULA',
          submittedRule: netPayFormula
        })
      });
      const data = await response.json();
      console.log('[DEBUG NET_PAY_FORMULA RESPONSE]:', data);
      if (data.success) {
        setNetFormulaStatus('SUCCESS');
        setStep4Status('ACTIVE'); // Unlock final net pay (Step 6)
        setFeedback(data.message);
      } else {
        setNetFormulaStatus('ERROR');
        setFeedback(data.message);
        if (data.drillTriggered) handleRerollScenario();
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Formula validation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 4 (phases 3-6) / Step 6 (phase 2): Final Synthesis
  const handleValidateSynthesis = async () => {
    if (!netPayValue) {
      setFeedback((activePhaseIndex === 3 || activePhaseIndex === 4) ? 'Please enter the final calculated Total Earnings.' : 'Please enter the final calculated Net Take-Home Pay.');
      return;
    }

    setLoading(true);
    setFeedback(activePhaseIndex === 2 ? 'Running final Net Pay synthesis audit...' : activePhaseIndex === 4 ? 'Auditing Holiday Total Earnings...' : 'Auditing Overtime Total Earnings...');

    try {
      const { module: mod, phase: ph } = getModuleAndPhase();

      // Pass the student's verified gross pay if present, otherwise calculate default
      const grossPay = grossPayValue
        ? parseFloat(grossPayValue)
        : (activePhaseIndex === 2
            ? parseFloat((scenario.hourlyRate * 8 * scenario.daysPresent).toFixed(2))
            : parseFloat((scenario.dailyRate * scenario.daysPresent).toFixed(2)));
      const tardinessDeduction = calculatedValue
        ? parseFloat(parseFloat(calculatedValue).toFixed(2))
        : parseFloat(((scenario.hourlyRate / 60) * scenario.lateMinutes).toFixed(2));

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

      console.log('[DEBUG SYNTHESIS PAYLOAD SENT]:', requestPayload);

      const response = await fetch('http://localhost:8080/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json();
      console.log('[DEBUG SYNTHESIS BACKEND RESPONSE]:', data);

      if (data.success) {
        setStep4Status('SUCCESS');
        setFeedback(data.message);
      } else {
        setStep4Status('ERROR');
        let feedbackMsg = data.message;
        if (data.expected !== undefined && data.expected !== null) {
          feedbackMsg += ` | Backend Audit: Expected ₱${data.expected.toFixed(2)}, Received ₱${data.received !== null ? data.received.toFixed(2) : '0.00'}.`;
        }
        setFeedback(feedbackMsg);
        if (data.drillTriggered) handleRerollScenario();
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
            {activePhaseIndex === 1 && <Phase1Room setActivePopup={setActivePopup} />}
            {activePhaseIndex === 2 && <Phase2Room setActivePopup={setActivePopup} />}
            {activePhaseIndex === 3 && <Phase3Room setActivePopup={setActivePopup} />}
            {activePhaseIndex === 4 && <Phase4Room setActivePopup={setActivePopup} />}
            {activePhaseIndex === 5 && <Phase5Room setActivePopup={setActivePopup} />}
            {activePhaseIndex === 6 && <Phase6Room setActivePopup={setActivePopup} scenario={scenario} />}
            {activePhaseIndex === 7 && <Phase7Room setActivePopup={setActivePopup} />}
          </div>

          <div className="panel-footer">
            <span className="intel-icon">💬</span> {
              activePhaseIndex === 1 
                ? 'Click office objects (Desk, Calendar, Whiteboard) to inspect details.' 
                : activePhaseIndex === 2 
                  ? 'Click objects (Biometrics Terminal, HR Filing Cabinet, DOLE Poster, Exit Door) to inspect details.' 
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
          grossPayValue={grossPayValue}
          setGrossPayValue={setGrossPayValue}
          grossPayStatus={grossPayStatus}
          handleValidateGrossPay={handleValidateGrossPay}
          netPayFormula={netPayFormula}
          setNetPayFormula={setNetPayFormula}
          netFormulaStatus={netFormulaStatus}
          handleValidateNetPayFormula={handleValidateNetPayFormula}
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
          trueOtHoursValue={trueOtHoursValue}
          setTrueOtHoursValue={setTrueOtHoursValue}
          trueOtHoursStatus={trueOtHoursStatus}
          handleValidateTrueOtHours={handleValidateTrueOtHours}
          otMultiplierValue={otMultiplierValue}
          setOtMultiplierValue={setOtMultiplierValue}
          otMultiplierStatus={otMultiplierStatus}
          handleValidateOtMultiplier={handleValidateOtMultiplier}
          otFormulaValue={otFormulaValue}
          setOtFormulaValue={setOtFormulaValue}
          otFormulaStatus={otFormulaStatus}
          handleValidateOtFormula={handleValidateOtFormula}
          holidayTypeValue={holidayTypeValue}
          setHolidayTypeValue={setHolidayTypeValue}
          holidayMultiplierValue={holidayMultiplierValue}
          setHolidayMultiplierValue={setHolidayMultiplierValue}
          holidayFormulaValue={holidayFormulaValue}
          setHolidayFormulaValue={setHolidayFormulaValue}
          holidayFormulaStatus={holidayFormulaStatus}
          handleValidateHolidayMultiplier={handleValidateHolidayMultiplier}
          handleValidateHolidayFormula={handleValidateHolidayFormula}
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

      {/* Floating Calculator Component */}
      {currentView !== 'LOGIN' && (
        <Calculator 
          isVisible={showCalculator} 
          onToggle={() => setShowCalculator(prev => !prev)} 
        />
      )}

    </div>
  );
}

export default App;