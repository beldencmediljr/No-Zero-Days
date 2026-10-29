import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../config';
import { authFetch, logout } from '../utils/api';
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
import TeacherLobby from './TeacherLobby';
import TeacherDashboard from './TeacherDashboard';
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
import { getStorageNamespace, phaseTimerKey, phaseProgressKey, currentViewKey } from '../utils/storage';
import './App.css'; 

function App() {
  // --- 1. NAVIGATION & SESSION STATE ---
  const [currentView, setCurrentView] = useState('LOGIN');
  // Prevents rendering anything before the localStorage session-restore effect has fired.
  // Without this, a stale teacher/student in localStorage could cause the app to briefly
  // show Login then snap to another view (or vice-versa) on every page load.
  const [sessionChecked, setSessionChecked] = useState(false);
  const [student, setStudent] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);

  // --- ROOM MANAGEMENT STATE ---
  const [roomCode, setRoomCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherSection, setTeacherSection] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');

  // --- INVITATION STATE ---
  const [roomInvitation, setRoomInvitation] = useState<{
    roomCode: string;
    teacherName: string;
    section: string;
    teacherEmail?: string;
    roomStatus?: string;
  } | null>(null);
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
  const [isDecliningInvite, setIsDecliningInvite] = useState(false);
  const [confirmingInvitation, setConfirmingInvitation] = useState(false);

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

  // Phase 5 exclusive Pag-IBIG deduction step
  const [pagIbigDeductionValue, setPagIbigDeductionValue] = useState('');
  const [pagIbigDeductionStatus, setPagIbigDeductionStatus] = useState('LOCKED');

  // Phase 6 exclusive PhilHealth & SSS EE shares step
  const [philhealthErValue, setPhilhealthErValue] = useState('');
  const [philhealthSssEeValue, setPhilhealthSssEeValue] = useState('');
  const [philhealthErStatus, setPhilhealthErStatus] = useState('LOCKED');

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
  const [rerollToast, setRerollToast] = useState(null); // null | 'MAX_STRIKES' | 'RED_HERRING' | 'PROGRESS_RESET'

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('Scenario loaded. Extract the variables to begin.');

  // Theme state: dark (default) | light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('no_zero_days_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('no_zero_days_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-mode');
      document.documentElement.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Loads a phase's autosaved state from sessionStorage. Returns true when state
  // was found and restored. Used both when picking a phase from the Dashboard
  // and when re-entering a mid-phase session after a page refresh.
  const loadPhaseStateFromStorage = (phase: number, studentNum: string | undefined, room: string): boolean => {
    try {
      const stored = sessionStorage.getItem(
        phaseProgressKey(phase, getStorageNamespace(studentNum, room))
      );
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      if (!parsed || parsed.phaseId !== phase || !parsed.scenario) return false;

      // Completed phases must never be reloaded as an ongoing in-progress session
      const isStoredComplete = phase === 1
        ? parsed.step3Status === 'SUCCESS'
        : phase === 7
          ? parsed.tribunalStatus === 'SUCCESS'
          : parsed.step4Status === 'SUCCESS';
      if (isStoredComplete) {
        try {
          sessionStorage.removeItem(phaseProgressKey(phase, getStorageNamespace(studentNum, room)));
        } catch (_) {}
        return false;
      }

      const restoredScenario = parsed.scenario;
      if (restoredScenario && (!restoredScenario.calendarGrid || Object.keys(restoredScenario.calendarGrid).length === 0) && restoredScenario.daysPresent) {
        restoredScenario.calendarGrid = generateCalendarDays(restoredScenario.daysPresent);
      }
      setScenario(restoredScenario);
      setExtractedA(parsed.extractedA || '');
      setExtractedB(parsed.extractedB || '');
      const s1 = parsed.step1Status || 'ACTIVE';
      setStep1Status(s1);
      setExtractionAttempts(parsed.extractionAttempts || 0);
      setSelectedRule(parsed.selectedRule || '');
      setStep2Status(parsed.step2Status || 'LOCKED');
      setCalculatedValue(parsed.calculatedValue || '');

      let s3 = parsed.step3Status || 'LOCKED';
      let grossStatus = parsed.grossPayStatus || 'LOCKED';
      let netFormStatus = parsed.netFormulaStatus || 'LOCKED';
      let s4 = parsed.step4Status || 'LOCKED';

      // Self-heal Phase 3 scaffolding steps if prior step succeeded
      let trueOt = parsed.trueOtHoursStatus || 'LOCKED';
      if (phase === 3 && s1 === 'SUCCESS' && trueOt === 'LOCKED') trueOt = 'ACTIVE';
      setTrueOtHoursValue(parsed.trueOtHoursValue || '');
      setTrueOtHoursStatus(trueOt);

      let otMult = parsed.otMultiplierStatus || 'LOCKED';
      if (phase === 3 && trueOt === 'SUCCESS' && otMult === 'LOCKED') otMult = 'ACTIVE';
      setOtMultiplierValue(parsed.otMultiplierValue || '');
      setOtMultiplierStatus(otMult);

      let otForm = parsed.otFormulaStatus || 'LOCKED';
      if (phase === 3 && otMult === 'SUCCESS' && otForm === 'LOCKED') otForm = 'ACTIVE';
      setOtFormulaValue(parsed.otFormulaValue || '');
      setOtFormulaStatus(otForm);

      if (phase === 3 && otForm === 'SUCCESS' && s3 === 'LOCKED') s3 = 'ACTIVE';
      setStep3Status(s3);

      // Self-heal grossPayStatus, netFormulaStatus, step4Status
      if ((phase === 2 || phase === 3 || phase === 4) && s3 === 'SUCCESS' && grossStatus === 'LOCKED') {
        grossStatus = 'ACTIVE';
      }
      setGrossPayValue(parsed.grossPayValue || '');
      setGrossPayStatus(grossStatus);

      if ((phase === 2 || phase === 3 || phase === 4) && grossStatus === 'SUCCESS' && netFormStatus === 'LOCKED') {
        netFormStatus = 'ACTIVE';
      }
      setNetPayFormula(parsed.netPayFormula || '');
      setNetFormulaStatus(netFormStatus);

      if (((phase === 2 || phase === 3 || phase === 4) && netFormStatus === 'SUCCESS' && s4 === 'LOCKED') ||
          ((phase === 5 || phase === 6) && s3 === 'SUCCESS' && s4 === 'LOCKED')) {
        s4 = 'ACTIVE';
      }
      setNetPayValue(parsed.netPayValue || '');
      setStep4Status(s4);

      setPagIbigDeductionValue(parsed.pagIbigDeductionValue || '');
      setPagIbigDeductionStatus(parsed.pagIbigDeductionStatus || 'LOCKED');
      setPhilhealthErValue(parsed.philhealthErValue || '');
      setPhilhealthSssEeValue(parsed.philhealthSssEeValue || '');
      setPhilhealthErStatus(parsed.philhealthErStatus || 'LOCKED');
      setHolidayTypeValue(parsed.holidayTypeValue || '');
      setHolidayMultiplierValue(parsed.holidayMultiplierValue || '');
      setHolidayFormulaValue(parsed.holidayFormulaValue || '');
      setHolidayFormulaStatus(parsed.holidayFormulaStatus || 'LOCKED');
      setTribunalGross(parsed.tribunalGross || '');
      setTribunalDeductions(parsed.tribunalDeductions || '');
      setTribunalNet(parsed.tribunalNet || '');
      setTribunalStatus(parsed.tribunalStatus || 'ACTIVE');
      return true;
    } catch (_) {
      return false;
    }
  };

  // Restore a previously authenticated session from localStorage.
  // The `sessionChecked` flag ensures nothing is rendered until this effect completes,
  // guaranteeing that unauthenticated visits to "/" always land on the Login screen.
  //
  // The stored Bearer token is re-verified against the server first so stale or
  // pre-upgrade sessions (accounts that never set a password) are bounced back
  // to the Login screen instead of silently restoring.
  useEffect(() => {
    let cancelled = false;

    const clearTeacherSession = () => {
      localStorage.removeItem('teacher');
      localStorage.removeItem('teacherRoomStatus');
    };
    const clearStudentSession = () => {
      localStorage.removeItem('student');
      localStorage.removeItem('studentRoomCode');
    };

    const verifyAndRestore = async () => {
      const savedStudent = localStorage.getItem('student');
      const savedTeacher = localStorage.getItem('teacher');

      if (savedTeacher) {
        let parsedTeacher: any = null;
        try { parsedTeacher = JSON.parse(savedTeacher); } catch (_) {}
        if (!parsedTeacher?.token) {
          clearTeacherSession();
          if (!cancelled) { setCurrentView('LOGIN'); setSessionChecked(true); }
          return;
        }
        try {
          const res = await authFetch('/api/auth/me');
          if (cancelled) return;
          if (!res.ok) {
            clearTeacherSession();
            setCurrentView('LOGIN');
            setSessionChecked(true);
            return;
          }
        } catch (_) {
          // Network failure — restore optimistically so offline sessions still open.
        }

        if (cancelled) return;
        setTeacherName(parsedTeacher.teacherName || '');
        setTeacherSection(parsedTeacher.section || '');
        setTeacherEmail(parsedTeacher.teacherEmail || '');
        if (parsedTeacher.roomCode) {
          setRoomCode(parsedTeacher.roomCode);
        }
        setCurrentView('TEACHER_DASHBOARD');
      } else if (savedStudent) {
        let parsedStudent: any = null;
        try { parsedStudent = JSON.parse(savedStudent); } catch (_) {}
        if (!parsedStudent?.token) {
          clearStudentSession();
          if (!cancelled) { setCurrentView('LOGIN'); setSessionChecked(true); }
          return;
        }
        try {
          const res = await authFetch('/api/auth/me');
          if (cancelled) return;
          if (!res.ok) {
            clearStudentSession();
            setCurrentView('LOGIN');
            setSessionChecked(true);
            return;
          }
        } catch (_) {
          // Network failure — restore optimistically so offline sessions still open.
        }

        if (cancelled) return;
        setStudent(parsedStudent);
        const savedRoomCode = localStorage.getItem('studentRoomCode');
        if (savedRoomCode) {
          setRoomCode(savedRoomCode);
        }

        // If the student was inside a phase room when the page refreshed,
        // restore the phase view AND its autosaved progress instead of
        // dropping them back to the Dashboard.
        const studentNum = parsedStudent?.studentNumber;
        const namespace = getStorageNamespace(studentNum, savedRoomCode || '');
        const savedView = localStorage.getItem(currentViewKey(namespace));
        let restoredPhase = false;
        if (savedView && /^PHASE[1-7]$/.test(savedView)) {
          const phase = parseInt(savedView.replace('PHASE', ''), 10);
          if (loadPhaseStateFromStorage(phase, studentNum, savedRoomCode || '')) {
            setActivePhaseIndex(phase);
            setCurrentView(savedView);
            restoredPhase = true;
          }
        }
        if (!restoredPhase) {
          setCurrentView('DASHBOARD');
        }
      } else {
        // No saved session: always show Login
        if (!cancelled) setCurrentView('LOGIN');
      }

      // Mark the session check as complete so the app can render
      if (!cancelled) setSessionChecked(true);
    };

    verifyAndRestore();
    return () => { cancelled = true; };
  }, []);

  // Remember the student's current view so a page refresh mid-phase re-enters
  // the phase room instead of dropping back to the Dashboard.
  // Gated on sessionChecked so the initial (pre-restore) render can't wipe the
  // saved key before the restore effect has read it.
  useEffect(() => {
    if (!sessionChecked) return;
    try {
      const studentNum = (student as any)?.studentNumber;
      const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
      const key = currentViewKey(getStorageNamespace(studentNum, currentRoom));
      if (currentView === 'DASHBOARD' || /^PHASE[1-7]$/.test(currentView)) {
        localStorage.setItem(key, currentView);
      } else {
        localStorage.removeItem(key);
      }
    } catch (_) {}
  }, [sessionChecked, currentView, student, roomCode]);

  // --- PHASE PRESENCE & TIMER LIFECYCLE MANAGEMENT ---
  // Tracks active presence inside a phase room so the backend timer strictly
  // pauses when the student navigates away (e.g. to Dashboard) and only resumes
  // when actively inside the phase room.
  const isStudentInPhase = currentView.startsWith('PHASE');

  // Real-time per-phase elapsed timer (seconds)
  const [phaseTimers, setPhaseTimers] = useState<{ [phase: number]: number }>(() => {
    const initial: { [phase: number]: number } = {};
    let restoredNumber = '';
    try {
      const parsedStudent = JSON.parse(localStorage.getItem('student') || 'null');
      restoredNumber = (parsedStudent as any)?.studentNumber || '';
    } catch (_) {}
    const restoredRoom = localStorage.getItem('studentRoomCode') || '';
    const namespace = getStorageNamespace(restoredNumber, restoredRoom);
    for (let p = 1; p <= 7; p++) {
      try {
        const saved = localStorage.getItem(phaseTimerKey(p, namespace));
        initial[p] = saved ? parseInt(saved, 10) : 0;
      } catch (_) {
        initial[p] = 0;
      }
    }
    return initial;
  });

  const phaseTimersRef = useRef(phaseTimers);
  useEffect(() => {
    phaseTimersRef.current = phaseTimers;
  }, [phaseTimers]);

  const notifyPhaseEnter = async (phaseIndex?: number) => {
    const studentNum = (student as any)?.studentNumber;
    if (!studentNum) return;
    const targetPhase = phaseIndex || activePhaseIndex;
    const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
    const currentTimer = phaseTimersRef.current[targetPhase] ?? phaseTimers[targetPhase] ?? 0;
    const payload = JSON.stringify({
      studentNumber: studentNum,
      phase: targetPhase,
      timerSeconds: currentTimer
    });
    try {
      const enterUrl = currentRoom
        ? `${API_BASE_URL}/api/rooms/${currentRoom}/phase-enter`
        : `${API_BASE_URL}/api/students/phase-enter`;
      await authFetch(enterUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      });
    } catch (err) {
      console.error('[Timer] Failed to notify phase enter:', err);
    }
  };

  const notifyPhaseExit = async () => {
    const studentNum = (student as any)?.studentNumber;
    if (!studentNum) return;
    const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
    const currentTimer = phaseTimersRef.current[activePhaseIndex] ?? phaseTimers[activePhaseIndex] ?? 0;
    const payload = JSON.stringify({
      studentNumber: studentNum,
      phase: activePhaseIndex,
      timerSeconds: currentTimer
    });

    const exitUrl = currentRoom
      ? `${API_BASE_URL}/api/rooms/${currentRoom}/phase-exit`
      : `${API_BASE_URL}/api/students/phase-exit`;

    // Single delivery attempt: fetch with keepalive survives page teardown,
    // so a duplicate sendBeacon is unnecessary (and doubles backend writes).
    try {
      await authFetch(exitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      });
    } catch (err) {
      console.error('[Timer] Failed to notify phase exit:', err);
    }
  };

  const handleReturnToDashboard = () => {
    if (isCurrentPhaseComplete) {
      try {
        const studentNum = (student as any)?.studentNumber;
        const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
        sessionStorage.removeItem(phaseProgressKey(activePhaseIndex, getStorageNamespace(studentNum, currentRoom)));
      } catch (_) {}
      // Clear completed scenario state so re-auditing from dashboard generates a fresh scenario
      setScenario(null);
    }
    setCurrentView('DASHBOARD');
  };

  const handleStudentJoinedRoom = (code: string, stu: any, progressReset?: boolean) => {
    // Joining a room starts a fresh gameplay record: clear any local timers,
    // autosaved progress, or remembered view scoped to this room so pre-join
    // (free-play or prior-room) time never bleeds into the room's reports.
    if (code && stu?.studentNumber) {
      const roomNamespace = getStorageNamespace(stu.studentNumber, code);
      for (let p = 1; p <= 7; p++) {
        localStorage.removeItem(phaseTimerKey(p, roomNamespace));
        sessionStorage.removeItem(phaseProgressKey(p, roomNamespace));
      }
      localStorage.removeItem(currentViewKey(roomNamespace));
    }

    for (let p = 1; p <= 7; p++) {
      sessionStorage.removeItem(`phase${p}_state`);
      sessionStorage.removeItem(`phase_${p}_completed`);
      localStorage.removeItem(`phase_${p}_timer`);
      localStorage.removeItem(`phase_${p}_elapsed`);
      localStorage.removeItem(`phase_${p}_attempts`);
    }

    // Reset the in-memory gameplay state so the new room starts clean:
    // no leftover scenario, timers, step statuses, or strike counter.
    setScenario(null);
    setActivePhaseIndex(1);
    setPhaseTimers({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 });
    setExtractedA('');
    setExtractedB('');
    setStep1Status('ACTIVE');
    setExtractionAttempts(0);
    setSelectedRule('');
    setStep2Status('LOCKED');
    setCalculatedValue('');
    setStep3Status('LOCKED');
    setNetPayValue('');
    setStep4Status('LOCKED');
    setGrossPayValue('');
    setGrossPayStatus('LOCKED');
    setNetPayFormula('');
    setNetFormulaStatus('LOCKED');
    setPagIbigDeductionValue('');
    setPagIbigDeductionStatus('LOCKED');
    setPhilhealthErValue('');
    setPhilhealthSssEeValue('');
    setPhilhealthErStatus('LOCKED');
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
    setTribunalGross('');
    setTribunalDeductions('');
    setTribunalNet('');
    setTribunalStatus('ACTIVE');
    setFeedback('Scenario loaded. Extract the variables to begin.');

    setRoomCode(code);
    setStudent(stu);
    localStorage.setItem('studentRoomCode', code);
    localStorage.setItem('student', JSON.stringify(stu));
    setCurrentView('DASHBOARD');

    // Notify the student that their pre-room progress was wiped so the teacher
    // only tracks performance inside this room.
    if (progressReset) {
      triggerRerollToast('PROGRESS_RESET');
    }
  };

  const isCurrentPhaseComplete = activePhaseIndex === 1
    ? step3Status === 'SUCCESS'
    : activePhaseIndex === 7
      ? tribunalStatus === 'SUCCESS'
      : step4Status === 'SUCCESS';

  // Live timer interval: ticks every 1 second when active inside a phase room
  useEffect(() => {
    if (!isStudentInPhase || isCurrentPhaseComplete) return;

    const studentNum = (student as any)?.studentNumber;
    const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
    const namespace = getStorageNamespace(studentNum, currentRoom);

    const timerInterval = setInterval(() => {
      // Do not accrue time while the tab is hidden — the backend pauses the
      // phase on the visibilitychange exit beacon, so the client clock must
      // stay in lockstep.
      if (document.visibilityState !== 'visible') return;
      setPhaseTimers(prev => {
        const nextVal = (prev[activePhaseIndex] || 0) + 1;
        try {
          localStorage.setItem(phaseTimerKey(activePhaseIndex, namespace), nextVal.toString());
        } catch (_) {}
        return { ...prev, [activePhaseIndex]: nextVal };
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [isStudentInPhase, activePhaseIndex, isCurrentPhaseComplete, student, roomCode]);

  // Auto-persist active phase progress to sessionStorage so leaving to dashboard or reloading doesn't wipe progress
  useEffect(() => {
    if (!isStudentInPhase || !scenario || !(scenario as any).phaseId) return;

    const studentNum = (student as any)?.studentNumber;
    const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
    const namespace = getStorageNamespace(studentNum, currentRoom);

    // If the phase is completed, do NOT store it as an in-progress autosaved session
    if (isCurrentPhaseComplete) {
      try {
        sessionStorage.removeItem(phaseProgressKey(activePhaseIndex, namespace));
      } catch (_) {}
      return;
    }

    try {
      const stateToSave = {
        phaseId: activePhaseIndex,
        scenario,
        extractedA,
        extractedB,
        step1Status,
        extractionAttempts,
        selectedRule,
        step2Status,
        calculatedValue,
        step3Status,
        netPayValue,
        step4Status,
        grossPayValue,
        grossPayStatus,
        netPayFormula,
        netFormulaStatus,
        pagIbigDeductionValue,
        pagIbigDeductionStatus,
        philhealthErValue,
        philhealthSssEeValue,
        philhealthErStatus,
        trueOtHoursValue,
        trueOtHoursStatus,
        otMultiplierValue,
        otMultiplierStatus,
        otFormulaValue,
        otFormulaStatus,
        holidayTypeValue,
        holidayMultiplierValue,
        holidayFormulaValue,
        holidayFormulaStatus,
        tribunalGross,
        tribunalDeductions,
        tribunalNet,
        tribunalStatus
      };
      sessionStorage.setItem(phaseProgressKey(activePhaseIndex, namespace), JSON.stringify(stateToSave));
    } catch (_) {}
  }, [
    isStudentInPhase,
    activePhaseIndex,
    isCurrentPhaseComplete,
    scenario,
    extractedA,
    extractedB,
    step1Status,
    extractionAttempts,
    selectedRule,
    step2Status,
    calculatedValue,
    step3Status,
    netPayValue,
    step4Status,
    grossPayValue,
    grossPayStatus,
    netPayFormula,
    netFormulaStatus,
    pagIbigDeductionValue,
    pagIbigDeductionStatus,
    philhealthErValue,
    philhealthSssEeValue,
    philhealthErStatus,
    trueOtHoursValue,
    trueOtHoursStatus,
    otMultiplierValue,
    otMultiplierStatus,
    otFormulaValue,
    otFormulaStatus,
    holidayTypeValue,
    holidayMultiplierValue,
    holidayFormulaValue,
    holidayFormulaStatus,
    tribunalGross,
    tribunalDeductions,
    tribunalNet,
    tribunalStatus,
    student,
    roomCode
  ]);

  // 1. Hook into phase transition / component unmount lifecycle:
  // When entering a phase, start/resume the timer.
  // When leaving or unmounting, cleanup immediately triggers pause/stop.
  useEffect(() => {
    if (isStudentInPhase) {
      notifyPhaseEnter(activePhaseIndex);

      return () => {
        notifyPhaseExit();
      };
    }
  }, [isStudentInPhase, activePhaseIndex]);

  // 2. Periodic heartbeat while actively inside a phase: sends ping every 10s
  // Prevents runaway timer if mobile screen locks, browser crashes, or student disconnects
  useEffect(() => {
    if (!isStudentInPhase || isCurrentPhaseComplete) return;
    const studentNum = (student as any)?.studentNumber;
    if (!studentNum) return;
    const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
    const heartbeatUrl = currentRoom
      ? `${API_BASE_URL}/api/rooms/${currentRoom}/heartbeat`
      : `${API_BASE_URL}/api/students/heartbeat`;

    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const currentTimer = phaseTimersRef.current[activePhaseIndex] ?? 0;
      authFetch(heartbeatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: studentNum,
          phase: activePhaseIndex,
          timerSeconds: currentTimer
        }),
        keepalive: true
      }).catch(() => {});
    }, 10000);

    return () => clearInterval(heartbeatInterval);
  }, [isStudentInPhase, isCurrentPhaseComplete, student, roomCode, activePhaseIndex]);

  // 3. Tab visibility / mobile app backgrounding / screen lock detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (isStudentInPhase) {
          notifyPhaseExit();
        }
      } else if (document.visibilityState === 'visible') {
        if (isStudentInPhase && !isCurrentPhaseComplete) {
          notifyPhaseEnter(activePhaseIndex);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isStudentInPhase, activePhaseIndex, isCurrentPhaseComplete]);

  // 5. Beacon on page close / unload to freeze timer even if window or tab is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      const studentNum = (student as any)?.studentNumber;
      if (isStudentInPhase && studentNum) {
        const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
        const exitUrl = currentRoom
          ? `${API_BASE_URL}/api/rooms/${currentRoom}/phase-exit`
          : `${API_BASE_URL}/api/students/phase-exit`;
        const payload = JSON.stringify({ studentNumber: studentNum, phase: activePhaseIndex });
        // keepalive fetch (not sendBeacon) so the Bearer token is attached.
        authFetch(exitUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [isStudentInPhase, student, roomCode, activePhaseIndex]);

  // Poll for pending room invitations when logged in as a student without an active room
  useEffect(() => {
    const currentStudentNumber = (student as any)?.studentNumber;
    if (
      !currentStudentNumber ||
      roomCode ||
      currentView === 'TEACHER_LOBBY' ||
      currentView === 'TEACHER_DASHBOARD' ||
      currentView === 'LOGIN'
    ) {
      return;
    }

    let cancelled = false;

    const checkInvitations = async () => {
      try {
        const res = await authFetch(`/api/students/${currentStudentNumber}/invitations`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.hasInvitation && data.roomCode) {
            setRoomInvitation({
              roomCode: data.roomCode,
              teacherName: data.teacherName,
              section: data.section,
              teacherEmail: data.teacherEmail,
              roomStatus: data.roomStatus
            });
          } else {
            setRoomInvitation(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[App] Invitation polling error:', err);
        }
      }
    };

    checkInvitations();
    const interval = setInterval(checkInvitations, 6000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [student, currentView, roomCode]);

  const handleAcceptInvitation = async () => {
    if (!roomInvitation || !(student as any)?.studentNumber) return;
    setIsAcceptingInvite(true);
    try {
      const res = await authFetch(`/api/rooms/${roomInvitation.roomCode}/invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: (student as any).studentNumber
        })
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const targetCode = roomInvitation.roomCode;
        const updatedStudent = data.student ? {
          ...data.student,
          section: data.section || data.student.section,
          token: (student as any).token || data.student.token
        } : {
          ...(student as any),
          section: roomInvitation.section || (student as any).section
        };
        setRoomInvitation(null);
        setConfirmingInvitation(false);
        // Shared join path: clears stale gameplay state, persists the room,
        // and shows the progress-reset notice when pre-room progress was wiped.
        handleStudentJoinedRoom(targetCode, updatedStudent, !!data.progressReset);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to accept invitation.');
      }
    } catch (err: any) {
      alert('Error accepting invitation: ' + err.message);
    } finally {
      setIsAcceptingInvite(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!roomInvitation || !(student as any)?.studentNumber) return;
    setIsDecliningInvite(true);
    try {
      await authFetch(`/api/rooms/${roomInvitation.roomCode}/invitations/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: (student as any).studentNumber
        })
      });
      setRoomInvitation(null);
    } catch (err: any) {
      console.error('[App] Decline invitation error:', err);
      setRoomInvitation(null);
    } finally {
      setIsDecliningInvite(false);
    }
  };

  const renderInvitationModal = () => {
    if (!roomInvitation) return null;
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
        animation: 'fadeIn 0.25s ease'
      }}>
        <div style={{
          background: '#0d1527',
          border: '2px solid #38bdf8',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '500px',
          padding: '28px',
          boxShadow: '0 0 40px rgba(56, 189, 248, 0.35)',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Terminal Title Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e293b',
            paddingBottom: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            </div>
            <span style={{
              color: '#38bdf8',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              fontWeight: 'bold'
            }}>
              ROOM_INVITATION_DETECTED.EXE
            </span>
            <div style={{ width: '30px' }} />
          </div>

          {/* Radar Icon */}
          <div style={{ fontSize: '2.8rem', marginBottom: '12px' }}>
            📡
          </div>

          <h2 style={{
            color: '#facc15',
            fontSize: '1.35rem',
            margin: '0 0 8px 0',
            letterSpacing: '1px',
            fontWeight: 'bold'
          }}>
            YOU HAVE BEEN ADDED TO A ROOM!
          </h2>

          <p style={{
            color: '#94a3b8',
            fontSize: '0.88rem',
            marginBottom: '22px',
            lineHeight: '1.5'
          }}>
            Your instructor has invited you to join a live classroom session.
          </p>

          {/* Room Details Card */}
          <div style={{
            background: '#070d19',
            border: '1px solid #1e3a5f',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace' }}>ROOM CODE:</span>
              <span style={{ color: '#38bdf8', fontSize: '1.3rem', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'monospace' }}>
                {roomInvitation.roomCode}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace' }}>TEACHER:</span>
              <span style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 'bold' }}>
                {roomInvitation.teacherName || 'Instructor'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace' }}>SECTION:</span>
              <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                {roomInvitation.section || 'General'}
              </span>
            </div>
          </div>

          {/* Buttons: ACCEPT & DECLINE — ACCEPT routes through a reset warning first */}
          {confirmingInvitation ? (
            <div>
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '16px 18px',
                marginBottom: '18px',
                color: '#fca5a5',
                fontSize: '0.88rem',
                lineHeight: '1.55',
                textAlign: 'left'
              }}>
                <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#f87171', letterSpacing: '0.5px' }}>
                  ⚠️ NOTICE: FIRST ATTEMPT RESET
                </p>
                <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#f87171', fontSize: '0.92rem' }}>
                  Notice: Joining this room will reset your First Attempt progress to ensure accurate timer tracking.
                </p>
                <p style={{ margin: 0, color: '#fca5a5' }}>
                  All previous attempts and recorded times for room <strong>{roomInvitation?.roomCode}</strong> will be wiped. Once inside, your teacher will track your performance starting fresh from Phase 1 with accurate timer tracking.
                </p>
                <p style={{ margin: '8px 0 0', fontWeight: 'bold', color: '#fef08a' }}>
                  Do you wish to proceed?
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  type="button"
                  disabled={isAcceptingInvite || isDecliningInvite}
                  onClick={() => setConfirmingInvitation(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(100, 116, 139, 0.15)',
                    border: '1px solid #64748b',
                    color: '#cbd5e1',
                    padding: '12px 18px',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    cursor: 'pointer'
                  }}
                >
                  [ CANCEL ]
                </button>
                <button
                  type="button"
                  disabled={isAcceptingInvite || isDecliningInvite}
                  onClick={handleAcceptInvitation}
                  style={{
                    flex: 1.4,
                    background: '#b91c1c',
                    border: '1px solid #ef4444',
                    color: '#ffffff',
                    padding: '12px 18px',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  {isAcceptingInvite ? 'CONNECTING...' : '[ PROCEED & RESET ]'}
                </button>
              </div>
            </div>
          ) : (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              disabled={isAcceptingInvite || isDecliningInvite}
              onClick={handleDeclineInvitation}
              style={{
                flex: 1,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#f87171',
                padding: '12px 18px',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                cursor: 'pointer'
              }}
            >
              {isDecliningInvite ? 'DECLINING...' : '[ DECLINE ]'}
            </button>

            <button
              type="button"
              disabled={isAcceptingInvite || isDecliningInvite}
              onClick={() => setConfirmingInvitation(true)}
              style={{
                flex: 1.4,
                background: '#059669',
                border: '1px solid #10b981',
                color: '#ffffff',
                padding: '12px 18px',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                letterSpacing: '1px',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isAcceptingInvite ? 'CONNECTING...' : '[ ACCEPT ]'}
            </button>
          </div>
          )}
        </div>
      </div>
    );
  };


  const generateCalendarDays = (totalDays) => {
    const weekdaysList = [8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26];
    // Deterministic: same totalDays always yields the same grid, so a restored
    // scenario never shows a different calendar than the one the student extracted from.
    const otherDays = weekdaysList.filter(d => d !== 12);
    const presentDays = new Set([12, ...otherDays.slice(0, Math.max(0, totalDays - 1))]);
    
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

    if (newScenario) {
      (newScenario as any).phaseId = phaseToUse;
    }
    setScenario(newScenario);

    // Reset this phase's timer upon a genuine scenario reroll / drill reset
    const studentNum = (student as any)?.studentNumber;
    const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
    const namespace = getStorageNamespace(studentNum, currentRoom);
    setPhaseTimers(prev => {
      const updated = { ...prev, [phaseToUse]: 0 };
      try {
        localStorage.setItem(phaseTimerKey(phaseToUse, namespace), '0');
        sessionStorage.removeItem(phaseProgressKey(phaseToUse, namespace));
      } catch (_) {}
      return updated;
    });

    // Reset simulator inputs
    setExtractedA('');
    setExtractedB('');
    setSelectedRule('');
    setCalculatedValue('');
    setNetPayValue('');
    setGrossPayValue('');
    setNetPayFormula('');
    setPagIbigDeductionValue('');
    setPagIbigDeductionStatus('LOCKED');
    setPhilhealthErValue('');
    setPhilhealthSssEeValue('');
    setPhilhealthErStatus('LOCKED');

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
    try {
      const studentNum = (student as any)?.studentNumber;
      const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
      sessionStorage.removeItem(phaseProgressKey(activePhaseIndex, getStorageNamespace(studentNum, currentRoom)));
    } catch (_) {}

    if (activePhaseIndex === 1) {
      setCurrentView('PHASE2');
      handleRerollScenario(true, 2);
      setFeedback('Security & Biometrics Room entered. Scan the Biometrics Terminal and DOLE Poster to audit the tardiness deduction.');
    } else if (activePhaseIndex === 2) {
      setCurrentView('PHASE3');
      handleRerollScenario(true, 3);
      setFeedback('Production Line Room entered. Scan the Production Time Card and DOLE Overtime Poster to audit overtime premiums.');
    } else if (activePhaseIndex === 3) {
      setCurrentView('PHASE4');
      handleRerollScenario(true, 4);
      setFeedback('Factory Breakroom entered. Scan the Corkboard Corporate Memos and Timesheet Terminal to audit Regular Holiday Pay.');
    } else if (activePhaseIndex === 4) {
      setCurrentView('PHASE5');
      handleRerollScenario(true, 5);
      setFeedback('PC Lab / Bureaucracy Room entered. Scan the SSS contribution table and employee loan statement on the monitor to audit SSS deductions.');
    } else if (activePhaseIndex === 5) {
      setCurrentView('PHASE6');
      handleRerollScenario(true, 6);
      setFeedback('PC Lab / Bureaucracy Room entered. Scan the PhilHealth table and HR salary database to audit PhilHealth premium deductions.');
    } else if (activePhaseIndex === 6) {
      setCurrentView('PHASE7');
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

  const rerollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger a toast notification and auto-dismiss it after 3.5 seconds with proper ref cleanup
  const triggerRerollToast = (type: any) => {
    if (rerollTimeoutRef.current) {
      clearTimeout(rerollTimeoutRef.current);
    }
    setRerollToast(type);
    rerollTimeoutRef.current = setTimeout(() => {
      setRerollToast(null);
      rerollTimeoutRef.current = null;
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (rerollTimeoutRef.current) {
        clearTimeout(rerollTimeoutRef.current);
      }
    };
  }, []);

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
        roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
        module: mod,
        phase: ph,
        step: 'EXTRACT',
        timerSeconds: phaseTimers[activePhaseIndex] || 0,
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

      const response = await authFetch('/api/validation/submit', {
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
        } else if (activePhaseIndex === 5) {
          setPagIbigDeductionStatus('ACTIVE');
        } else if (activePhaseIndex === 6) {
          setPhilhealthErStatus('ACTIVE');
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
        setExtractionAttempts(prev => prev + 1);

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
      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
          module: mod,
          phase: ph,
          step: 'FILTER_LUNCH',
          timerSeconds: phaseTimers[activePhaseIndex] || 0,
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
      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
          module: mod,
          phase: ph,
          step: 'ESTABLISH_PREMIUM',
          timerSeconds: phaseTimers[activePhaseIndex] || 0,
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
      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
          module: mod,
          phase: ph,
          step: 'ESTABLISH_FORMULA',
          timerSeconds: phaseTimers[activePhaseIndex] || 0,
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
      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
          module: mod,
          phase: ph,
          step: 'ESTABLISH_PREMIUM',
          timerSeconds: phaseTimers[activePhaseIndex] || 0,
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
      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
          module: mod,
          phase: ph,
          step: 'ESTABLISH_FORMULA',
          timerSeconds: phaseTimers[activePhaseIndex] || 0,
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
 
  // Phase 5 Step 2: FIND PAG-IBIG DEDUCTION
  const handleValidatePagIbigDeduction = async () => {
    if (!pagIbigDeductionValue) {
      setFeedback('Please enter the statutory Pag-IBIG deduction.');
      return;
    }
    setLoading(true);
    setFeedback('Verifying Pag-IBIG contribution cap...');
    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
          module: mod,
          phase: ph,
          step: 'PAGIBIG_DEDUCTION',
          timerSeconds: phaseTimers[activePhaseIndex] || 0,
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
          submittedValueA: Number(pagIbigDeductionValue) || 0.0
        })
      });
      const data = await response.json();
      if (data.success) {
        setPagIbigDeductionStatus('SUCCESS');
        setStep3Status('ACTIVE'); // Unlocks Step 3: Find Basic Salary Pay
        setFeedback(data.message);
      } else {
        setPagIbigDeductionStatus('ERROR');
        setFeedback(data.message);
        if (data.redHerring) {
          setPagIbigDeductionValue('');
          triggerRerollToast('RED_HERRING');
          handleRerollScenario(false);
        } else if (data.drillTriggered) {
          handleRerollScenario();
        }
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Pag-IBIG validation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 5 Step 3: FIND BASIC SALARY PAY
  const handleValidateBasicSalary = async () => {
    if (!calculatedValue) {
      setFeedback('Please enter the Basic Salary.');
      return;
    }
    setLoading(true);
    setFeedback('Verifying Basic Salary...');
    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
          module: mod,
          phase: ph,
          step: 'BASIC_SALARY',
          timerSeconds: phaseTimers[activePhaseIndex] || 0,
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
          submittedValueA: Number(calculatedValue) || 0.0
        })
      });
      const data = await response.json();
      if (data.success) {
        setStep3Status('SUCCESS');
        setStep2Status('ACTIVE'); // Unlocks Step 4: Rule Identification
        setFeedback(data.message);
      } else {
        setStep3Status('ERROR');
        setFeedback(data.message);
        if (data.drillTriggered) handleRerollScenario();
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Basic Salary validation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Phase 6 Step 2: GET PHILHEALTH & SSS EE SHARES
  const handleValidatePhilhealthEr = async () => {
    if (!philhealthErValue || !philhealthSssEeValue) {
      setFeedback('Please enter both the computed PhilHealth EE Share and SSS EE Share.');
      return;
    }
    setLoading(true);
    setFeedback('Verifying statutory Employee (EE) share deductions...');
    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
          module: mod,
          phase: ph,
          step: 'PHILHEALTH_EE',
          timerSeconds: phaseTimers[activePhaseIndex] || 0,
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
          submittedValueA: Number(philhealthErValue) || 0.0,
          submittedValueB: Number(philhealthSssEeValue) || 0.0
        })
      });
      const data = await response.json();
      if (data.success) {
        setPhilhealthErStatus('SUCCESS');
        setStep2Status('ACTIVE'); // Unlocks Step 3: Tax Bracket Identification (mapped to step2Status)
        setFeedback(data.message);
      } else {
        setPhilhealthErStatus('ERROR');
        setFeedback(data.message);
        if (data.redHerring) {
          setPhilhealthErValue('');
          setPhilhealthSssEeValue('');
          triggerRerollToast('RED_HERRING');
          handleRerollScenario(false);
        } else if (data.drillTriggered) {
          handleRerollScenario();
        }
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Validation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Step 2: Rule Identification
  const handleValidateRule = async () => {
    if (!selectedRule) {
      setFeedback(activePhaseIndex === 6 ? 'Please select a tax bracket category.' : 'Please select a mathematical equation operator.');
      return;
    }

    setLoading(true);
    setFeedback(activePhaseIndex === 6 ? 'Verifying tax bracket category...' : 'Validating formula syntax with standard accounting laws...');

    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
          module: mod,
          phase: ph,
          step: activePhaseIndex === 6 ? 'TAX_BRACKET' : 'IDENTIFY_RULE',
          timerSeconds: phaseTimers[activePhaseIndex] || 0,
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
        if (activePhaseIndex === 5) {
          setStep4Status('ACTIVE');
        } else {
          setStep3Status('ACTIVE');
        }
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

  // Submit Step 3: Arithmetic Execution / Step 4: Withholding Tax
  const handleValidateExecution = async () => {
    if (!calculatedValue) {
      setFeedback(activePhaseIndex === 6 ? 'Please enter the calculated Withholding Tax.' : 'Please enter the final computed pay amount.');
      return;
    }

    setLoading(true);
    setFeedback(activePhaseIndex === 6 ? 'Auditing withholding tax calculations...' : 'Auditing final arithmetic ledger pay calculations...');

    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const requestPayload = {
        studentNumber: student?.studentNumber || 'STU-UNKNOWN',
        roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
        module: mod,
        phase: ph,
        step: activePhaseIndex === 6 ? 'WITHHOLDING_TAX' : 'EXECUTE',
        timerSeconds: phaseTimers[activePhaseIndex] || 0,
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

      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json();

      if (data.success) {
        setStep3Status('SUCCESS');
        if (activePhaseIndex === 1) {
          try {
            const studentNum = (student as any)?.studentNumber;
            const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
            sessionStorage.removeItem(phaseProgressKey(1, getStorageNamespace(studentNum, currentRoom)));
          } catch (_) {}
        }
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
      setFeedback(activePhaseIndex === 6 ? 'Network Error: Withholding tax verification failed.' : 'Network Error: Final ledger verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Phase 2 Step 4 / Phase 3 Step 6 / Phase 4 Step 5: Verify Gross Basic Pay
  const handleValidateGrossPay = async () => {
    if (!grossPayValue) {
      setFeedback('Please enter the computed Gross Basic Pay.');
      return;
    }
    setLoading(true);
    setFeedback('Verifying Gross Basic Pay computation...');
    try {
      const { module: mod, phase: ph } = getModuleAndPhase();
      const derivedDailyRate = scenario.dailyRate || (scenario.hourlyRate ? scenario.hourlyRate * 8.0 : 0.0);
      const derivedHourlyRate = scenario.hourlyRate || (scenario.dailyRate ? scenario.dailyRate / 8.0 : 0.0);
      const derivedDaysPresent = scenario.daysPresent || 0;
      const numGross = parseFloat(grossPayValue) || 0.0;

      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
          module: mod,
          phase: ph,
          step: 'COMPUTE_GROSS',
          timerSeconds: phaseTimers[activePhaseIndex] || 0,
          employeeName: scenario.employeeName,
          companyName: scenario.companyName,
          dailyRate: derivedDailyRate,
          hourlyRate: derivedHourlyRate,
          daysPresent: derivedDaysPresent,
          lateMinutes: scenario.lateMinutes ?? 0,
          earlyClockInMinutes: scenario.earlyClockInMinutes ?? 0,
          otHours: scenario.otHours ?? 0,
          unpaidLunchHours: scenario.unpaidLunchHours ?? 0,
          basicSalary: scenario.basicSalary,
          sssEeShare: scenario.sssEeShare,
          sssErShare: scenario.sssErShare,
          personalSalaryLoan: scenario.personalSalaryLoan,
          spouseLoan: scenario.spouseLoan,
          workedOnHoliday: scenario.workedOnHoliday,
          grossPay: numGross,
          submittedResult: numGross
        })
      });
      const data = await response.json();
      if (data.success) {
        setGrossPayStatus('SUCCESS');
        setNetFormulaStatus('ACTIVE');
        setFeedback(data.message);
      } else {
        setGrossPayStatus('ERROR');
        setFeedback(data.message);
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
      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
          module: mod,
          phase: ph,
          step: 'NET_PAY_FORMULA',
          timerSeconds: phaseTimers[activePhaseIndex] || 0,
          employeeName: scenario.employeeName,
          companyName: scenario.companyName,
          dailyRate: scenario.dailyRate,
          hourlyRate: scenario.hourlyRate,
          daysPresent: scenario.daysPresent,
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
          submittedRule: netPayFormula
        })
      });
      const data = await response.json();
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

      // Compute phase-appropriate gross pay and tardiness deduction
      const grossPay = grossPayValue
        ? parseFloat(grossPayValue)
        : (activePhaseIndex === 2
            ? parseFloat((scenario.hourlyRate * 8 * scenario.daysPresent).toFixed(2))
            : (activePhaseIndex === 5 || activePhaseIndex === 6)
                ? (scenario.basicSalary ?? 0)
                : parseFloat((scenario.dailyRate * scenario.daysPresent).toFixed(2)));

      const tardinessDeduction = activePhaseIndex === 2
        ? (calculatedValue
            ? parseFloat(parseFloat(calculatedValue).toFixed(2))
            : parseFloat(((scenario.hourlyRate / 60) * scenario.lateMinutes).toFixed(2)))
        : 0.0;

      const requestPayload = {
        studentNumber: student?.studentNumber || 'STU-UNKNOWN',
        roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
        module: mod,
        phase: ph,
        step: 'SYNTHESIS',
        timerSeconds: phaseTimers[activePhaseIndex] || 0,
        employeeName: scenario.employeeName,
        companyName: scenario.companyName,
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

      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json();

      if (data.success) {
        setStep4Status('SUCCESS');
        try {
          const studentNum = (student as any)?.studentNumber;
          const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
          sessionStorage.removeItem(phaseProgressKey(activePhaseIndex, getStorageNamespace(studentNum, currentRoom)));
        } catch (_) {}
        setFeedback(data.message);
      } else {
        setStep4Status('ERROR');
        setFeedback(data.message);
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
      const response = await authFetch('/api/validation/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: student?.studentNumber || 'STU-UNKNOWN',
          roomCode: roomCode || localStorage.getItem('studentRoomCode') || '',
          module: 'M4_TRIBUNAL',
          phase: 1,
          step: 'SUBMIT',
          timerSeconds: phaseTimers[7] || 0,
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
        try {
          const studentNum = (student as any)?.studentNumber;
          const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
          sessionStorage.removeItem(phaseProgressKey(7, getStorageNamespace(studentNum, currentRoom)));
        } catch (_) {}
        setFeedback(data.message);
      } else {
        setTribunalStatus('ERROR');
        setFeedback(data.message);
        // Regenerate scenario and clear inputs on every failed attempt
        const newScenario = generatePhase7Scenario();
        (newScenario as any).phaseId = 7;
        setScenario(newScenario as any);
        setTribunalGross('');
        setTribunalDeductions('');
        setTribunalNet('');
        setTribunalStatus('ACTIVE');
        const studentNum = (student as any)?.studentNumber;
        const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
        const namespace = getStorageNamespace(studentNum, currentRoom);
        setPhaseTimers(prev => {
          const updated = { ...prev, 7: 0 };
          try {
            localStorage.setItem(phaseTimerKey(7, namespace), '0');
            sessionStorage.removeItem(phaseProgressKey(7, namespace));
          } catch (_) {}
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback('Network Error: Cannot connect to the compliance validation server.');
    } finally {
      setLoading(false);
    }
  };

  // --- 6. CONDITIONAL SCREEN ROUTERS ---

  // Block rendering until the localStorage session-restore effect has fired.
  // This guarantees that fresh/unauthenticated navigations to "/" always show the
  // Login screen and never flash into a phase room or dashboard.
  if (!sessionChecked) {
    return null;
  }

  if (currentView === 'LOGIN') {
    return <Login 
      onLoginSuccess={(stu) => {
        setStudent(stu);
        setCurrentView('DASHBOARD');
      }}
      onTeacherCreateRoom={(code, name, sec, email) => {
        setRoomCode(code);
        setTeacherName(name);
        setTeacherSection(sec);
        setTeacherEmail(email || '');
        if (code) {
          localStorage.setItem('teacherRoomStatus', 'ACTIVE');
        }
        // Master Teacher Account: Directly route to centralized Teacher Dashboard
        setCurrentView('TEACHER_DASHBOARD');
      }}
      onStudentJoinRoom={handleStudentJoinedRoom}
    />;
  }

  if (currentView === 'TEACHER_LOBBY') {
    return <TeacherLobby
      roomCode={roomCode}
      teacherName={teacherName}
      teacherEmail={teacherEmail}
      section={teacherSection}
      onInitiateSession={() => {
        localStorage.setItem('teacherRoomStatus', 'ACTIVE');
      }}
      onViewDashboard={() => {
        setCurrentView('TEACHER_DASHBOARD');
      }}
      onSwitchRoom={(newCode, newSec) => {
        setRoomCode(newCode);
        if (newSec) setTeacherSection(newSec);
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
          try {
            const parsed = JSON.parse(storedTeacher);
            parsed.roomCode = newCode;
            if (newSec) parsed.section = newSec;
            localStorage.setItem('teacher', JSON.stringify(parsed));
          } catch (e) {
            console.error('Error updating teacher localStorage:', e);
          }
        }
      }}
      onBack={() => {
        void logout();
        localStorage.removeItem('teacher');
        localStorage.removeItem('teacherRoomStatus');
        setRoomCode('');
        setTeacherName('');
        setTeacherSection('');
        setTeacherEmail('');
        setCurrentView('LOGIN');
      }}
      onRoomCreated={(code) => {
        setRoomCode(code);
        localStorage.setItem('teacherRoomStatus', 'ACTIVE');
      }}
    />;
  }

  if (currentView === 'TEACHER_DASHBOARD') {
    return <TeacherDashboard
      roomCode={roomCode}
      teacherName={teacherName}
      teacherEmail={teacherEmail}
      section={teacherSection}
      onSwitchRoom={(newCode, newSec) => {
        setRoomCode(newCode);
        if (newSec) setTeacherSection(newSec);
        const storedTeacher = localStorage.getItem('teacher');
        if (storedTeacher) {
          try {
            const parsed = JSON.parse(storedTeacher);
            parsed.roomCode = newCode;
            if (newSec) parsed.section = newSec;
            localStorage.setItem('teacher', JSON.stringify(parsed));
          } catch (e) {
            console.error('Error updating teacher localStorage:', e);
          }
        }
      }}
      onBack={() => {
        // Return to teacher lobby
        setCurrentView('TEACHER_LOBBY');
      }}
      onExit={() => {
        // Teacher exits room / logs out back to LOGIN
        void logout();
        localStorage.removeItem('teacher');
        localStorage.removeItem('teacherRoomStatus');
        setRoomCode('');
        setTeacherName('');
        setTeacherSection('');
        setTeacherEmail('');
        setCurrentView('LOGIN');
      }}
    />;
  }

  if (currentView === 'STUDENT_WAITING') {
    setCurrentView('DASHBOARD');
    return null;
  }

  if (currentView === 'DASHBOARD') {
    return (
      <>
        <Dashboard 
          student={student}
          roomCode={roomCode}
          theme={theme}
          toggleTheme={toggleTheme}
          onSelectPhase={(phase) => {
            const isMemoryStateComplete = (scenario as any)?.phaseId === phase && (
              phase === 1
                ? step3Status === 'SUCCESS'
                : phase === 7
                  ? tribunalStatus === 'SUCCESS'
                  : step4Status === 'SUCCESS'
            );
            const hasOngoingState = (scenario as any)?.phaseId === phase && !isMemoryStateComplete;
            const studentNum = (student as any)?.studentNumber;
            const currentRoom = roomCode || localStorage.getItem('studentRoomCode') || '';
            const loadedFromStorage = !hasOngoingState
              && loadPhaseStateFromStorage(phase, studentNum, currentRoom);

            setActivePhaseIndex(phase);
            if (!hasOngoingState && !loadedFromStorage) {
              handleRerollScenario(true, phase);
            }
            
            let targetView = 'PHASE';
            if (phase === 1) {
              targetView = 'PHASE1';
              setFeedback('Simulator Room 1 entered. Scan HR Contract desk and June Calendar wall to extract variables.');
            } else if (phase === 2) {
              targetView = 'PHASE2';
              setFeedback('Security & Biometrics Room entered. Scan the Biometrics Terminal and DOLE Poster to audit the tardiness deduction.');
            } else if (phase === 3) {
              targetView = 'PHASE3';
              setFeedback('Production Line Room entered. Scan the Production Time Card and DOLE Overtime Poster to audit overtime premiums.');
            } else if (phase === 4) {
              targetView = 'PHASE4';
              setFeedback('Factory Breakroom entered. Scan the Corkboard Corporate Memos and Timesheet Terminal to audit Regular Holiday Pay.');
            } else if (phase === 5) {
              targetView = 'PHASE5';
              setFeedback('PC Lab / Bureaucracy Room entered. Scan the SSS contribution table and employee loan statement on the monitor to audit SSS deductions.');
            } else if (phase === 6) {
              targetView = 'PHASE6';
              setFeedback('PC Lab / Bureaucracy Room entered. Scan the PhilHealth table and HR salary database to audit PhilHealth premium deductions.');
            } else if (phase === 7) {
              targetView = 'PHASE7';
              setFeedback('Executive Boardroom entered. Scan the Master Case File in the Audit Folder on the table to perform the final payroll run.');
            } else {
              setFeedback(`Room for Phase ${phase} entered.`);
            }
            
            setCurrentView(targetView);
          }} 
          onStudentJoinRoom={handleStudentJoinedRoom}
        />
        {renderInvitationModal()}
      </>
    );
  }

  return (
    <div className={`app-background ${theme === 'light' ? 'light-mode' : ''}`}>
      <div className="app-container">
        
        {/* LEFT PANEL: The Room Grid */}
        <div className="left-panel">
          <div className="panel-header">
            <div className="panel-header-top">
              <div>
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

              {/* Theme Toggle Button: shows 'Light Mode' with toggle when dark; 'Dark Mode' with toggle when light */}
              <div 
                id="theme-mode-toggle"
                className="theme-mode-toggle"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTheme(); }}
              >
                <span className="theme-toggle-label">
                  {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </span>
                <div className={`theme-toggle-switch ${theme === 'light' ? 'toggle-active' : ''}`}>
                  <div className="theme-toggle-slider" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="room-content">
            {activePhaseIndex === 1 && <Phase1Room setActivePopup={setActivePopup} />}
            {activePhaseIndex === 2 && <Phase2Room setActivePopup={setActivePopup} />}
            {activePhaseIndex === 3 && <Phase3Room setActivePopup={setActivePopup} />}
            {activePhaseIndex === 4 && <Phase4Room setActivePopup={setActivePopup} />}
            {activePhaseIndex === 5 && <Phase5Room setActivePopup={setActivePopup} scenario={scenario} />}
            {activePhaseIndex === 6 && <Phase6Room setActivePopup={setActivePopup} scenario={scenario} />}
            {activePhaseIndex === 7 && <Phase7Room setActivePopup={setActivePopup} />}
          </div>

          <div className="panel-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="intel-icon">💬</span>
              <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                {activePhaseIndex === 1 
                  ? 'Click office objects or quick-shortcuts below to inspect details:' 
                  : activePhaseIndex === 2 
                    ? 'Click objects or quick-shortcuts below to inspect details:' 
                    : activePhaseIndex === 3
                      ? 'Click office objects or quick-shortcuts below to inspect details:'
                      : activePhaseIndex === 4
                        ? 'Click breakroom objects or quick-shortcuts below to inspect details:'
                        : activePhaseIndex === 5 || activePhaseIndex === 6
                          ? 'Click PC Lab objects or quick-shortcuts below to inspect details:'
                          : 'Click boardroom objects or quick-shortcuts below to inspect details:'}
              </span>
            </div>

            {/* Interactive Hotspot Quick-Access Chips */}
            <div className="quick-access-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {activePhaseIndex === 1 && (
                <>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('HR_DESK')}>📁 HR Contract Desk</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('WALL_CALENDAR')}>📅 Attendance Calendar</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('WHITEBOARD')}>📝 Gross Pay Whiteboard</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('DOOR')}>🚪 Exit Door</button>
                </>
              )}
              {activePhaseIndex === 2 && (
                <>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('BIOMETRICS')}>⏱️ Biometrics Terminal</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('WALL_CALENDAR')}>📅 Attendance Calendar</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('DOLE_POSTER')}>📌 DOLE Poster</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('P2_CONTRACT')}>📁 HR Cabinet</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('HANDBOOK')}>📘 Handbook</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('DOOR')}>🚪 Exit Door</button>
                </>
              )}
              {activePhaseIndex === 3 && (
                <>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('TIMECARD')}>⏱️ Production Time Card</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('WALL_CALENDAR')}>📅 Attendance Calendar</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('DOLE_OVERTIME')}>📌 DOLE OT Poster</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('P3_CONTRACT')}>📁 Contract</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('DOOR')}>🚪 Exit Door</button>
                </>
              )}
              {activePhaseIndex === 4 && (
                <>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('MEMOS')}>📌 Corkboard Memos</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('TIMESHEET_TERMINAL')}>⏱️ Timesheet Terminal</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('WALL_CALENDAR')}>📅 Attendance Calendar</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('DOLE_HOLIDAY')}>📜 DOLE Holiday Poster</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('P4_CONTRACT')}>📁 Contract</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('DOOR')}>🚪 Exit Door</button>
                </>
              )}
              {activePhaseIndex === 5 && (
                <>
                  <button type="button" className="quick-chip sss-chip" onClick={() => setActivePopup('SSS_TABLE')} title="View SSS Contribution Table">
                    📌 SSS Table
                  </button>
                  <button type="button" className="quick-chip loan-chip" onClick={() => setActivePopup('LOAN_STATEMENT')} title="View Employee Loan Statement">
                    🖥️ Loan Statement
                  </button>
                  <button type="button" className="quick-chip contract-chip" onClick={() => setActivePopup('P5_CONTRACT')} title="View Employee Contract Profile">
                    📁 Contract Profile
                  </button>
                  <button type="button" className="quick-chip pagibig-chip" onClick={() => setActivePopup('PAGIBIG_MEMO')} title="View HDMF Pag-IBIG Memo Circular">
                    📋 Pag-IBIG Memo
                  </button>
                  <button type="button" className="quick-chip handbook-chip" onClick={() => setActivePopup('HANDBOOK')} title="View Company Payroll Manual">
                    📘 Payroll Manual
                  </button>
                  <button type="button" className="quick-chip door-chip" onClick={() => setActivePopup('DOOR')} title="View PC Lab Exit Door">
                    🚪 Exit Door
                  </button>
                </>
              )}
              {activePhaseIndex === 6 && (
                <>
                  <button type="button" className="quick-chip philhealth-chip" onClick={() => setActivePopup('PHILHEALTH_TABLE')} title="View PhilHealth Contribution Table">
                    📌 PhilHealth Table
                  </button>
                  <button type="button" className="quick-chip salary-chip" onClick={() => setActivePopup('SALARY_DATABASE')} title="View HR Salary Database">
                    🖥️ Salary Database
                  </button>
                  <button type="button" className="quick-chip sss-chip" onClick={() => setActivePopup('SSS_TABLE')} title="View SSS Table Reference">
                    📌 SSS Reference
                  </button>
                  <button type="button" className="quick-chip loan-chip" onClick={() => setActivePopup('LOAN_STATEMENT')} title="View Employee Loan Statement">
                    🖥️ Loan Statement
                  </button>
                  <button type="button" className="quick-chip tax-chip" onClick={() => setActivePopup('TAX_TABLE')} title="View BIR Tax Withholding Table">
                    📈 BIR Tax Table
                  </button>
                  <button type="button" className="quick-chip contract-chip" onClick={() => setActivePopup('P6_CONTRACT')} title="View Employee Contract Profile">
                    📁 Contract Profile
                  </button>
                  <button type="button" className="quick-chip pagibig-chip" onClick={() => setActivePopup('PAGIBIG_MEMO')} title="View HDMF Pag-IBIG Memo Circular">
                    📋 Pag-IBIG Memo
                  </button>
                  <button type="button" className="quick-chip handbook-chip" onClick={() => setActivePopup('HANDBOOK')} title="View Company Payroll Manual">
                    📘 Payroll Manual
                  </button>
                  <button type="button" className="quick-chip door-chip" onClick={() => setActivePopup('DOOR')} title="View PC Lab Exit Door">
                    🚪 Exit Door
                  </button>
                </>
              )}
              {activePhaseIndex === 7 && (
                <>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('AUDIT_FOLDER')}>📁 Master Case File</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('HANDBOOK')}>📘 Payroll Manual</button>
                  <button type="button" className="quick-chip" onClick={() => setActivePopup('DOOR')}>🚪 Exit Door</button>
                </>
              )}
            </div>
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
          onReturnToDashboard={handleReturnToDashboard}
          timerSeconds={phaseTimers[activePhaseIndex] || 0}
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
          handleValidateExecution={activePhaseIndex === 5 ? handleValidateBasicSalary : handleValidateExecution}
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
          pagIbigDeductionValue={pagIbigDeductionValue}
          setPagIbigDeductionValue={setPagIbigDeductionValue}
          pagIbigDeductionStatus={pagIbigDeductionStatus}
          handleValidatePagIbigDeduction={handleValidatePagIbigDeduction}
          philhealthErValue={philhealthErValue}
          setPhilhealthErValue={setPhilhealthErValue}
          philhealthSssEeValue={philhealthSssEeValue}
          setPhilhealthSssEeValue={setPhilhealthSssEeValue}
          philhealthErStatus={philhealthErStatus}
          handleValidatePhilhealthEr={handleValidatePhilhealthEr}
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
          backgroundColor: rerollToast === 'RED_HERRING' ? '#450a0a' : (rerollToast === 'PROGRESS_RESET' ? '#052e16' : '#1c1400'),
          border: `1px solid ${rerollToast === 'RED_HERRING' ? '#ef4444' : (rerollToast === 'PROGRESS_RESET' ? '#10b981' : '#f59e0b')}`,
          color: rerollToast === 'RED_HERRING' ? '#f87171' : (rerollToast === 'PROGRESS_RESET' ? '#6ee7b7' : '#fbbf24'),
          maxWidth: '520px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '1.3rem' }}>
            {rerollToast === 'RED_HERRING' ? '🚨' : (rerollToast === 'PROGRESS_RESET' ? '🧾' : '🔄')}
          </span>
          <span>
            {rerollToast === 'RED_HERRING'
              ? 'RED HERRING DETECTED — Critical audit failure. A new Audit Case has been generated.'
              : rerollToast === 'PROGRESS_RESET'
                ? 'FIRST ATTEMPT RESET — Progress reset to ensure accurate timer tracking. Your teacher will now track your in-room performance.'
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

      {/* Student Room Invitation Modal */}
      {renderInvitationModal()}

    </div>
  );
}

export default App;
