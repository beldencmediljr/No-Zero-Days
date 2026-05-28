import React from 'react';
import { ScenarioData } from '../../utils/scenarioGen';
import './Popups.css';

interface PopupsProps {
  activeHotspot: string | null;
  onClose: () => void;
  scenario: ScenarioData;
  isPhaseComplete: boolean;
  onProceed: () => void;
  onReroll: () => void;
  activePhaseIndex?: number;
  setActivePopup?: (name: string | null) => void;
}

/**
 * TSX Popups Manager. Routes overlay modals based on clicked hotspot keys.
 * Captures HR contract profiles, present-day calendars, DOLE rules posters,
 * and the newly introduced dynamic Biometric swipe log ledger for Phase 2.
 */
export default function Popups({
  activeHotspot,
  onClose,
  scenario,
  isPhaseComplete,
  onProceed,
  onReroll,
  activePhaseIndex = 1
}: PopupsProps) {

  if (!activeHotspot || !scenario) return null;

  const renderContent = () => {
    switch (activeHotspot) {
      case 'INTRO':
        return (
          <div className="popup-content" style={{ padding: '5px' }}>
            <div className="popup-header" style={{ borderBottom: '1px dashed #facc15', paddingBottom: '10px' }}>
              <h4 style={{ color: '#facc15' }}>
                {activePhaseIndex === 1 && '🎬 NARRATIVE BRIEFING: MORNING LOBBY AUDIT'}
                {activePhaseIndex === 2 && '🎬 NARRATIVE BRIEFING: FACTORY FLOOR AUDIT [PHASE 2]'}
                {activePhaseIndex === 3 && '🎬 NARRATIVE BRIEFING: PRODUCTION OVERTIME AUDIT [PHASE 3]'}
                {activePhaseIndex === 4 && '🎬 NARRATIVE BRIEFING: BREAKROOM HOLIDAY AUDIT [PHASE 4]'}
                {activePhaseIndex === 5 && '🎬 NARRATIVE BRIEFING: SSS DEDUCTIONS [PHASE 5]'}
                {activePhaseIndex === 6 && '🎬 NARRATIVE BRIEFING: PHILHEALTH PREMIUMS [PHASE 6]'}
                {activePhaseIndex === 7 && '🎬 NARRATIVE BRIEFING: THE BOARDROOM FINAL AUDIT [PHASE 7]'}
              </h4>
              <p>Assigned Auditor Case File // Cebu Institute of Technology - University</p>
            </div>

            <div className="data-box authentic-data" style={{ padding: '15px', lineHeight: '1.5', fontSize: '0.9rem' }}>
              {activePhaseIndex === 1 ? (
                <>
                  <p>
                    Welcome, Student Auditor. You have been assigned your first corporate payroll case file for <strong>{scenario.employeeName}</strong>, an entry-level worker at <strong>{scenario.companyName}</strong>.
                  </p>
                  <p>
                    Under standard Philippine labor audits, it is critical that we calculate basic earnings accurately. HR has loaded {scenario.employeeName}'s payroll records for June 2026.
                  </p>
                  <p style={{ color: '#facc15', fontWeight: 'bold', margin: '10px 0 5px 0' }}>
                    Your Mission Objectives:
                  </p>
                  <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                    <li>Search the room for the HR employee contract to identify their contracted <strong>Daily Rate</strong>.</li>
                    <li>Analyze the official wall calendar and count the <strong>Present (P) weekday shifts</strong> to find their worked days.</li>
                    <li>Deduct any allowance noise (Rice/Uniform) to calculate the authentic **Gross Basic Pay**.</li>
                  </ul>
                </>
              ) : activePhaseIndex === 2 ? (
                <>
                  <p>
                    Excellent work in the Lobby, Auditor! You have advanced to the <strong>Factory Floor & Security Control Point</strong>.
                  </p>
                  <p>
                    Your next task is to audit the tardiness penalties for <strong>{scenario.employeeName}</strong>. According to the compliance system, {scenario.employeeName} had biometric clock-in logs showing late arrivals and early entries for June 2026.
                  </p>
                  <p style={{ color: '#facc15', fontWeight: 'bold', margin: '10px 0 5px 0' }}>
                    Your Mission Objectives:
                  </p>
                  <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                    <li>Scan the <strong>Biometrics Terminal</strong> to review clock-in logs and extract the contracted <strong>Hourly Rate</strong> and <strong>Late Minutes</strong>.</li>
                    <li>Read the <strong>DOLE Compliance Poster</strong> to understand standard tardiness subtraction formulas.</li>
                    <li>Filter out early clock-in noise to compute the exact **Tardiness Deduction**.</li>
                  </ul>
                </>
              ) : activePhaseIndex === 3 ? (
                <>
                  <p>
                    Auditor, you have been promoted to the **Production Line & Supervisor's Desk**.
                  </p>
                  <p>
                    Your next task is to audit the Overtime Premium payments for <strong>{scenario.employeeName}</strong>. Standard labor codes require premium adjustments for extra work hours.
                  </p>
                  <p style={{ color: '#facc15', fontWeight: 'bold', margin: '10px 0 5px 0' }}>
                    Your Mission Objectives:
                  </p>
                  <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                    <li>Inspect the **Production Time Card** to extract the raw Overtime Hours and Hourly Rate.</li>
                    <li>Consult the **DOLE Overtime Policy Poster** to identify the standard Overtime Premium multiplier.</li>
                    <li>Ignore the **Unpaid Lunch break** noise to calculate the **Actual OT hours** and compute the correct **Overtime Premium Pay**.</li>
                  </ul>
                </>
              ) : activePhaseIndex === 4 ? (
                <>
                  <p>
                    Auditor, welcome to **The Factory Breakroom & Employee Notice Board**.
                  </p>
                  <p>
                    Your task is to audit the **Regular Holiday Pay** for <strong>{scenario.employeeName}</strong>. June 12 is Independence Day, a Regular Holiday. The employee worked a full shift on this day.
                  </p>
                  <p style={{ color: '#facc15', fontWeight: 'bold', margin: '10px 0 5px 0' }}>
                    Your Mission Objectives:
                  </p>
                  <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                    <li>Inspect the **Notice Board Corkboard** memos to identify the standard Regular Holiday vs decoy Special Holidays.</li>
                    <li>Scan the **Timesheet Terminal** to verify the hours worked and extract the standard **Daily Rate**.</li>
                    <li>Consult the **DOLE Holiday Policy Poster** to identify the correct multiplier and compute the **Holiday Pay**.</li>
                    <li>Synthesize their new running **Total Earnings** by adding the Holiday Pay to their basic gross pay.</li>
                  </ul>
                </>
              ) : activePhaseIndex === 5 ? (
                <>
                  <p>
                    Auditor, welcome to **The PC Lab / Bureaucracy Department**.
                  </p>
                  <p>
                    Your next task is to audit the SSS Deductions for <strong>{scenario.employeeName}</strong>. You need to inspect the SSS Contribution Table and the employee's loan statement to extract the correct statutory deductions.
                  </p>
                  <p style={{ color: '#facc15', fontWeight: 'bold', margin: '10px 0 5px 0' }}>
                    Your Mission Objectives:
                  </p>
                  <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                    <li>Scan the **Notice Board Corkboard** to check the **SSS Contribution Table** and extract the Employee EE Share. (Ignore Employer ER share decoy).</li>
                    <li>Review the **Employee Loan Statement** on the PC Monitor to extract the **Personal Salary Loan**. (Ignore Spouse loan decoy).</li>
                    <li>Calculate the **Total SSS Deduction** by adding the Employee EE Share and the Personal Salary Loan.</li>
                  </ul>
                </>
              ) : activePhaseIndex === 6 ? (
                <>
                  <p>
                    Auditor, you are still in **The PC Lab / Bureaucracy Department**, moving to Phase 6.
                  </p>
                  <p>
                    Your next task is to audit the PhilHealth Premium Deductions for <strong>{scenario.employeeName}</strong>. You need to check the PhilHealth memo and the HR salary database.
                  </p>
                  <p style={{ color: '#facc15', fontWeight: 'bold', margin: '10px 0 5px 0' }}>
                    Your Mission Objectives:
                  </p>
                  <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                    <li>Review the **PhilHealth Premium Table** on the notice board to extract the employee PhilHealth rate (2.5% or 0.025).</li>
                    <li>Read the **HR Salary Database PC** to extract the **Basic Salary**.</li>
                    <li>Compute the **PhilHealth Deduction** (Basic Salary × 0.025) and calculate the final statutory deductions (SSS Deductions + PhilHealth Deduction).</li>
                  </ul>
                </>
              ) : (
                <>
                  <p>
                    Welcome to the **Executive Boardroom**, Auditor. This is your final audit assessment.
                  </p>
                  <p>
                    You are presented with a single **Executive Audit Folder** containing a comprehensive summary of all variables for <strong>{scenario.employeeName}</strong>. You must perform the complete payroll run from scratch and submit your numbers directly to the Board of Trustees.
                  </p>
                  <p style={{ color: '#facc15', fontWeight: 'bold', margin: '10px 0 5px 0' }}>
                    Your Mission Objectives:
                  </p>
                  <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                    <li>Open the **Executive Audit Folder** and carefully note all 11 variables.</li>
                    <li>Calculate the **Total Gross Earnings** (Basic Gross + OT Pay + Holiday Pay).</li>
                    <li>Calculate the **Total Deductions** (Tardiness + SSS Deductions + PhilHealth Deductions).</li>
                    <li>Compute the **Final Net Pay** (Total Gross - Total Deductions) and submit your audit.</li>
                  </ul>
                </>
              )}
              <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                Click outside this modal or hit the "X" button at the top-right to begin auditing. Let's make sure there are no zero days!
              </p>
            </div>
          </div>
        );

      case 'HR_DESK':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📁 Employee Profile & Contract</h4>
              <p>Classified HR Document // Form 109-A</p>
            </div>

            <div className="data-box authentic-data" style={{ padding: '15px', lineHeight: '1.5' }}>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span>Employee Name:</span> <strong>{scenario.employeeName}</strong></div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span>Position Grade:</span> <strong>ABM Core Level 12</strong></div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Contract Daily Rate:</span> <strong className="highlight-green" style={{ color: '#10b981' }}>₱{scenario.dailyRate.toFixed(2)} / Day</strong></div>
            </div>

            {/* Red Herring Rule */}
            <div className="data-box herring-data" style={{ padding: '15px', marginTop: '15px', background: '#1e293b', border: '1px solid #ef4444', borderRadius: '6px' }}>
              <span className="warning-label" style={{ color: '#f87171', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>⚠️ RED HERRING AUDIT NOISE (DO NOT EXTRACT)</span>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span>Rice Subsidy:</span> <strong>₱1,200.00 / Month</strong></div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Uniform Allowance:</span> <strong>₱1,500.00 / Semester</strong></div>
              <p className="herring-note" style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px', fontStyle: 'italic' }}>
                ⭐ Note: According to Philippine accounting frameworks, standard Gross Basic Pay strictly uses the basic Daily Rate. Filter out these allowance distractions!
              </p>
            </div>
          </div>
        );

      case 'WALL_CALENDAR':
        const renderCalendarGrid = () => {
          const cells = [];
          // Week 1 (June 1 to 7)
          for (let d = 1; d <= 7; d++) {
            cells.push(<div key={`d-${d}`} className="cal-cell empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '35px', border: '1px solid #1e293b', color: '#475569' }}>{d}</div>);
          }
          // Weeks 2 to 5 (June 8 to 30)
          const weekdaysList = [8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26];
          const daysSet = new Set(weekdaysList);
          for (let d = 8; d <= 30; d++) {
            const isWeekend = (d % 7 === 6 || d % 7 === 0);
            if (daysSet.has(d)) {
              const status = scenario.calendarGrid && scenario.calendarGrid[d] ? scenario.calendarGrid[d] : 'A';
              const isPresent = status === 'P';
              const isHoliday = d === 12;
              cells.push(
                <div
                  key={`d-${d}`}
                  className={`cal-cell ${isPresent ? 'present' : 'absent'} ${isHoliday ? 'holiday' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '35px',
                    border: '1px solid #1e293b',
                    background: isHoliday ? '#451a03' : (isPresent ? '#064e3b' : '#7f1d1d'),
                    color: isHoliday ? '#fbbf24' : (isPresent ? '#34d399' : '#f87171'),
                    fontWeight: 'bold',
                    position: 'relative'
                  }}
                >
                  {d}
                  <span className={isPresent ? 'p-mark' : 'a-mark'} style={{ fontSize: '0.65rem', display: 'block', marginTop: '2px' }}>
                    {isPresent ? (isHoliday ? 'P★' : 'P') : 'A'}
                  </span>
                </div>
              );
            } else {
              cells.push(
                <div
                  key={`d-${d}`}
                  className="cal-cell empty"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '35px',
                    border: '1px solid #1e293b',
                    color: isWeekend ? '#ef4444' : '#475569',
                    background: isWeekend ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                  }}
                >
                  {d}
                </div>
              );
            }
          }
          return cells;
        };

        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📅 Official Wall Calendar - June 2026</h4>
              <p>Total verified present shifts: <strong className="highlight-green" style={{ color: '#10b981' }}>{scenario.daysPresent} Days</strong></p>
            </div>

            {/* The Visual Calendar Grid */}
            <div className="calendar-ui-box" style={{ padding: '15px', background: '#0b1120', border: '1px solid #1e293b', borderRadius: '8px', marginTop: '15px' }}>
              <div className="cal-header-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: 'bold', color: '#60a5fa', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span style={{ color: '#ef4444' }}>S</span><span style={{ color: '#ef4444' }}>S</span>
              </div>
              <div className="cal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.85rem' }}>
                {renderCalendarGrid()}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '12px', textAlign: 'center', fontStyle: 'italic' }}>
                ★ June 12 is Independence Day (Regular Holiday) - Present shift recorded.
              </p>
            </div>
          </div>
        );

      case 'WHITEBOARD':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📝 LOBBY ACADEMIC WHITEBOARD</h4>
            </div>
            <div className="whiteboard-box" style={{ padding: '20px', background: '#1e293b', border: '2px solid #64748b', borderRadius: '8px', marginTop: '15px', textAlign: 'center' }}>
              <h5 className="math-rule" style={{ color: '#60a5fa', margin: '0 0 10px 0', fontSize: '1rem', letterSpacing: '1px' }}>▼ GROSS EARNINGS BASIC LAW:</h5>
              <div className="formula-box" style={{ fontSize: '1.25rem', color: '#fbbf24', fontFamily: 'monospace', fontWeight: 'bold', background: '#0b1120', padding: '15px', borderRadius: '4px', border: '1px solid #334155' }}>
                Gross Pay = Daily Rate × Days Present
              </div>
            </div>
          </div>
        );

      case 'BIOMETRICS':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📟 Biometrics Swipe Logs</h4>
              <p>June 2026 // Week 2 Attendance Records</p>
            </div>

            <div className="data-box authentic-data" style={{ padding: '10px', marginBottom: '10px' }}>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Employee Profile Name:</span> <strong>{scenario.employeeName}</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span>Contracted Hourly Rate:</span> <strong className="highlight-green">₱{scenario.hourlyRate.toFixed(2)} / Hour</strong>
              </div>

              {/* Monthly Work Summary */}
              <div style={{ borderTop: '1px dashed #334155', marginTop: '8px', paddingTop: '8px' }}>
                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>📊 MONTHLY AUDIT WORK SUMMARY:</span>
                <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>Verified Shifts Worked (Days Present):</span> <strong>{scenario.daysPresent} Days</strong>
                </div>
                <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>Contracted Hours per Shift:</span> <strong>8.0 Hours / Day</strong>
                </div>
              </div>
            </div>

            <div className="calendar-ui-box" style={{ padding: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155', color: '#60a5fa', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>DAY</th>
                    <th style={{ padding: '8px' }}>TIME IN</th>
                    <th style={{ padding: '8px' }}>TIME OUT</th>
                    <th style={{ padding: '8px' }}>LATE (MINS)</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.biometricLogs.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px' }}>{log.day}</td>
                      <td style={{ padding: '8px', color: log.status === 'LATE' ? '#ef4444' : log.status === 'HOLIDAY' ? '#facc15' : '#e2e8f0' }}>
                        {log.timeIn}
                      </td>
                      <td style={{ padding: '8px', color: log.status === 'HOLIDAY' ? '#facc15' : '#e2e8f0' }}>{log.timeOut}</td>
                      <td style={{ padding: '8px', color: log.late > 0 ? '#ef4444' : '#e2e8f0', fontWeight: log.late > 0 ? 'bold' : 'normal' }}>
                        {log.late} mins
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px', fontStyle: 'italic' }}>
                * Standard working hours: 08:00 AM to 05:00 PM. Grace period is 0 mins. June 12 is Independence Day (No Shift).
              </p>
            </div>
          </div>
        );

      case 'TIMECARD':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📁 Production Time Card</h4>
              <p>June 2026 // Overtime Logging Records</p>
            </div>

            <div className="data-box authentic-data" style={{ padding: '10px', marginBottom: '10px' }}>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Employee Name:</span> <strong>{scenario.employeeName}</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span>Contracted Hourly Rate:</span> <strong className="highlight-green">₱{scenario.hourlyRate.toFixed(2)} / Hour</strong>
              </div>

              <div style={{ borderTop: '1px dashed #334155', marginTop: '8px', paddingTop: '8px' }}>
                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>📊 OVERTIME SHIFT LOGS SUMMARY:</span>
                <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>Shifts Worked (Days Present):</span> <strong>{scenario.daysPresent} Days</strong>
                </div>
                <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>Recorded Raw Overtime Hours:</span> <strong>{scenario.otHours} Hours</strong>
                </div>
                <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>Mandatory Unpaid Rest/Lunch Break:</span> <strong style={{ color: '#ef4444' }}>{scenario.unpaidLunchHours} Hour Unpaid Lunch</strong>
                </div>
              </div>
            </div>

            <div className="calendar-ui-box" style={{ padding: '10px', fontSize: '0.85rem', color: '#94a3b8' }}>
              <p>⚠️ <strong>Auditor Instruction:</strong> Employee rest intervals are strictly non-working. Calculate the Net working overtime hours before computing overtime premiums.</p>
            </div>
          </div>
        );

      case 'DOLE_POSTER':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📋 DOLE Compliance - Tardiness Regulations</h4>
              <p>Philippine Labor Advisory No. 12-B</p>
            </div>

            <div className="data-box authentic-data" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p><strong>1. STANDARD TARDINESS DEDUCTION RULE:</strong></p>
              <div className="formula-box" style={{ margin: '10px 0', padding: '10px', background: '#0b1120', border: '1px solid #1e293b', textAlign: 'center', color: '#fbbf24', fontWeight: 'bold' }}>
                Deductions = (Hourly Rate / 60) × Late Minutes
              </div>
              <p><strong>2. NON-OFFSETTING RULE:</strong></p>
              <p style={{ color: '#fca5a5' }}>
                ⚠️ Labor Advisory: Early clock-ins or overtime minutes CANNOT be used to reduce or offset late arrival minutes. Tardiness deductions must be computed strictly on raw late minutes.
              </p>
            </div>
          </div>
        );

      case 'DOLE_OVERTIME':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📋 DOLE Compliance - Overtime Premiums</h4>
              <p>Philippine Labour Code Article 87</p>
            </div>

            <div className="data-box authentic-data" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
              <p><strong>1. STANDARD OVERTIME PREMIUM MULTIPLIER:</strong></p>
              <div className="formula-box" style={{ margin: '10px 0', padding: '10px', background: '#0b1120', border: '1px solid #1e293b', textAlign: 'center', color: '#fbbf24', fontWeight: 'bold' }}>
                OT Pay = Hourly Rate × Actual OT Hours × 1.25
              </div>
              <p><strong>2. UNPAID BREAKS STANDARDS:</strong></p>
              <p style={{ color: '#fca5a5' }}>
                ⚠️ Labor Standard Section: Unpaid lunch breaks and rest periods are strictly NOT credited as active overtime hours. Raw overtime logs must be net of rest intervals.
              </p>
            </div>
          </div>
        );

      case 'DOLE_HOLIDAY':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📋 DOLE Compliance - Holiday Pay Multipliers</h4>
              <p>Philippine Labor Code Article 94</p>
            </div>

            <div className="data-box authentic-data" style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
              <p><strong>1. REGULAR HOLIDAY WORKED PREMIUM:</strong></p>
              <div className="formula-box" style={{ margin: '8px 0', padding: '8px', background: '#0b1120', border: '1px solid #1e293b', textAlign: 'center', color: '#fbbf24', fontWeight: 'bold' }}>
                Holiday Pay Rate = 200% (2.0x) of Daily Rate
              </div>
              <p><strong>2. SPECIAL NON-WORKING HOLIDAY WORKED PREMIUM:</strong></p>
              <div className="formula-box" style={{ margin: '8px 0', padding: '8px', background: '#0b1120', border: '1px solid #1e293b', textAlign: 'center', color: '#fbbf24', fontWeight: 'bold' }}>
                Special Holiday Rate = 130% (1.3x) of Daily Rate
              </div>
              <p style={{ color: '#fca5a5', marginTop: '10px' }}>
                ⚠️ <strong>Auditor Notice:</strong> Confusing the Regular Holiday multiplier (2.0x) with the Special Non-Working Holiday rate (1.3x) will result in validation auditing penalties. Double-check official memo dates!
              </p>
            </div>
          </div>
        );

      case 'MEMOS':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📌 Corporate Notice Board Memos</h4>
              <p>Apex Industrial Works // HR Notice Bulletin</p>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <div className="data-box authentic-data" style={{ flex: 1, padding: '10px', border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.05)' }}>
                <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '0.8rem' }}>📌 MEMO A: JUNE HOLIDAY</span>
                <p style={{ fontSize: '0.8rem', margin: '5px 0', color: '#e2e8f0' }}>
                  <strong>Subject:</strong> June 12 Holiday Schedule
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Please be guided that <strong>June 12 (Independence Day)</strong> is declared a <strong>Regular Holiday</strong>. Operations will run with special premium shifts.
                </p>
              </div>

              <div className="data-box herring-data" style={{ flex: 1, padding: '10px', border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)' }}>
                <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '0.8rem' }}>📌 MEMO B: AUGUST HOLIDAY</span>
                <p style={{ fontSize: '0.8rem', margin: '5px 0', color: '#e2e8f0' }}>
                  <strong>Subject:</strong> August 21 Holiday Notice
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Please notice that <strong>August 21 (Ninoy Aquino Day)</strong> is declared a <strong>Special Non-Working Holiday</strong>. Only emergency security reports.
                </p>
              </div>
            </div>
          </div>
        );

      case 'TIMESHEET_TERMINAL':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📟 Digital punch-clock Timesheet Terminal</h4>
              <p>Biometric Punch Audit // Case: {scenario.employeeName}</p>
            </div>

            <div className="data-box authentic-data" style={{ padding: '12px' }}>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Employee Name:</span> <strong>{scenario.employeeName}</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Standard Daily Rate:</span> <strong className="highlight-green">₱{scenario.dailyRate.toFixed(2)}</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Daily Shift Hours:</span> <strong>8.0 Hours / Shift</strong>
              </div>

              {/* Monthly Work Summary */}
              <div style={{ borderTop: '1px dashed #334155', marginTop: '8px', paddingTop: '8px' }}>
                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>📊 MONTHLY AUDIT WORK SUMMARY:</span>
                <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>Shifts Worked (Days Present):</span> <strong>{scenario.daysPresent} Days</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #334155', marginTop: '10px', paddingTop: '10px' }}>
                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>📅 HOLIDAY ATTENDANCE RECORD:</span>
                <table style={{ width: '100%', marginTop: '6px', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ color: '#60a5fa', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                      <th style={{ padding: '4px' }}>Date</th>
                      <th style={{ padding: '4px' }}>Shift Status</th>
                      <th style={{ padding: '4px' }}>Time In</th>
                      <th style={{ padding: '4px' }}>Time Out</th>
                      <th style={{ padding: '4px' }}>Worked Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '6px 4px' }}>June 12 (Fri)</td>
                      <td style={{ padding: '6px 4px', color: '#facc15' }}>REGULAR HOLIDAY</td>
                      <td style={{ padding: '6px 4px' }}>08:00 AM</td>
                      <td style={{ padding: '6px 4px' }}>05:00 PM</td>
                      <td style={{ padding: '6px 4px', color: '#10b981', fontWeight: 'bold' }}>8.0 Hours</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'SSS_TABLE':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📋 SSS Contribution Rate Table</h4>
              <p>Social Security System // Statutory Standard Rates</p>
            </div>
            <div className="data-box authentic-data" style={{ padding: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: '#60a5fa', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                    <th style={{ padding: '6px' }}>Contribution Type</th>
                    <th style={{ padding: '6px' }}>Monthly Rate</th>
                    <th style={{ padding: '6px' }}>Auditing Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '8px 6px' }}><strong>Employee EE Share</strong></td>
                    <td style={{ padding: '8px 6px', color: '#10b981', fontWeight: 'bold' }}>₱{(scenario.sssEeShare ?? 0).toFixed(2)}</td>
                    <td style={{ padding: '8px 6px', color: '#10b981' }}>STATUTORY DEDUCTION</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '8px 6px' }}><strong>Employer ER Share</strong></td>
                    <td style={{ padding: '8px 6px', color: '#fbbf24' }}>₱{(scenario.sssErShare ?? 0).toFixed(2)}</td>
                    <td style={{ padding: '8px 6px', color: '#ef4444', fontWeight: 'bold' }}>DECOY (DO NOT DEDUCT)</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '0.8rem', color: '#f87171' }}>
                ⚠️ <strong>CRITICAL AUDIT NOTICE:</strong> If you input the Employer (ER) share into the employee's deduction ledger, you will immediately trigger a compliance red herring reroll.
              </div>
            </div>
          </div>
        );

      case 'LOAN_STATEMENT':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>🖥️ Digital Employee Loan Statement</h4>
              <p>HR Accounts Ledger // Active Amortizations</p>
            </div>
            <div className="data-box authentic-data" style={{ padding: '12px' }}>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Employee Name:</span> <strong>{scenario.employeeName}</strong>
              </div>
              <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: '#60a5fa', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                    <th style={{ padding: '6px' }}>Loan Type</th>
                    <th style={{ padding: '6px' }}>Monthly Deduction</th>
                    <th style={{ padding: '6px' }}>Deduction Rule</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '8px 6px' }}><strong>Personal Salary Loan</strong></td>
                    <td style={{ padding: '8px 6px', color: '#10b981', fontWeight: 'bold' }}>₱{(scenario.personalSalaryLoan ?? 0).toFixed(2)}</td>
                    <td style={{ padding: '8px 6px', color: '#10b981' }}>DEDUCT FROM SALARY</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '8px 6px' }}><strong>Spouse Salary Loan</strong></td>
                    <td style={{ padding: '8px 6px', color: '#fbbf24' }}>₱{(scenario.spouseLoan ?? 0).toFixed(2)}</td>
                    <td style={{ padding: '8px 6px', color: '#ef4444', fontWeight: 'bold' }}>DECOY (DO NOT DEDUCT)</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '0.8rem', color: '#f87171' }}>
                ⚠️ <strong>CRITICAL AUDIT NOTICE:</strong> Spouse loans are personal debts of a spouse. Deducting them from this employee's basic pay will trigger an immediate compliance red herring reroll.
              </div>
            </div>
          </div>
        );

      case 'PHILHEALTH_TABLE':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📋 PhilHealth Premium Contribution Bulletin</h4>
              <p>National Insurance Memo // Standard Rates 2026</p>
            </div>
            <div className="data-box authentic-data" style={{ padding: '15px', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <p><strong>1. TOTAL PREMIUM RATE:</strong></p>
              <p>For June 2026, the total PhilHealth premium is <strong>5.0%</strong> of the employee's basic salary.</p>

              <p style={{ marginTop: '10px' }}><strong>2. EMPLOYEE VS EMPLOYER SPLIT:</strong></p>
              <p>The premium is split equally: 50% paid by the Employer, 50% paid by the Employee.</p>

              <div className="formula-box" style={{ margin: '12px 0', padding: '10px', background: '#0b1120', border: '1px solid #1e293b', textAlign: 'center', color: '#fbbf24', fontWeight: 'bold' }}>
                Employee Premium Rate = 5.0% × 50% = 2.5% (Multiplier: 0.025)
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                * Calculate PhilHealth Deduction by multiplying the basic salary of the employee by 0.025.
              </p>
            </div>
          </div>
        );

      case 'SALARY_DATABASE':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>🖥️ HR Salary Database Portal</h4>
              <p>Employee Payroll Records // Basic Compensation</p>
            </div>
            <div className="data-box authentic-data" style={{ padding: '15px' }}>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Employee Name:</span> <strong>{scenario.employeeName}</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Standard Daily Rate:</span> <strong>₱{(scenario.dailyRate ?? 0).toFixed(2)} / Day</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Days Worked (Present):</span> <strong>{scenario.daysPresent} Days</strong>
              </div>
              <div style={{ borderTop: '1px dashed #334155', marginTop: '12px', paddingTop: '12px' }}>
                <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                  <span>Basic Salary:</span> <strong style={{ color: '#10b981' }}>₱{(scenario.basicSalary ?? 0).toFixed(2)}</strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>
                  * Basic Salary = Daily Rate × Days Present. This is the base amount used for computing PhilHealth deductions.
                </p>
              </div>
            </div>
          </div>
        );

      case 'AUDIT_FOLDER':
        return (
          <div className="popup-content" style={{ maxWidth: '600px' }}>
            <div className="popup-header" style={{ borderBottom: '2px solid #ef4444', paddingBottom: '10px' }}>
              <h4 style={{ color: '#ef4444', letterSpacing: '1px' }}>📁 CONFIDENTIAL MASTER AUDIT CASE FILE</h4>
              <p>Audit Target: {scenario.employeeName} / Company: {scenario.companyName}</p>
            </div>
            <div className="data-box authentic-data" style={{ padding: '15px', maxHeight: '420px', overflowY: 'auto' }}>
              <p style={{ color: '#fbbf24', fontWeight: 'bold', borderBottom: '1px dashed #334155', paddingBottom: '4px' }}>
                [PART 1: BASIC CONTRACT & ATTENDANCE]
              </p>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>Daily Rate:</span> <strong>₱{(scenario.dailyRate ?? 0).toFixed(2)}</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>Contracted Days Worked:</span> <strong>{scenario.daysPresent} Days</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>Basic Salary:</span> <strong style={{ color: '#10b981' }}>₱{(scenario.basicSalary ?? 0).toFixed(2)}</strong>
              </div>

              <p style={{ color: '#fbbf24', fontWeight: 'bold', borderBottom: '1px dashed #334155', paddingBottom: '4px', marginTop: '12px' }}>
                [PART 2: ATTENDANCE LOGS & DEDUCTIONS]
              </p>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>Hourly Rate:</span> <strong>₱{(scenario.hourlyRate ?? 0).toFixed(2)}</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>Tardiness Minutes:</span> <strong>{scenario.lateMinutes} Minutes</strong>
              </div>

              <p style={{ color: '#fbbf24', fontWeight: 'bold', borderBottom: '1px dashed #334155', paddingBottom: '4px', marginTop: '12px' }}>
                [PART 3: OVERTIME & HOLIDAY EARNINGS]
              </p>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>Recorded OT Hours:</span> <strong>{(scenario.otHours ?? 0).toFixed(1)} Hours</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>Unpaid Lunch/Rest Hour:</span> <strong>{(scenario.unpaidLunchHours ?? 0).toFixed(1)} Hour</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>Worked on June 12 Regular Holiday:</span> <strong style={{ color: scenario.workedOnHoliday ? '#10b981' : '#f87171' }}>{scenario.workedOnHoliday ? 'YES' : 'NO'}</strong>
              </div>

              <p style={{ color: '#fbbf24', fontWeight: 'bold', borderBottom: '1px dashed #334155', paddingBottom: '4px', marginTop: '12px' }}>
                [PART 4: STATUTORY CONTRIBUTIONS & LOANS]
              </p>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>SSS Employee EE Share:</span> <strong>₱{(scenario.sssEeShare ?? 0).toFixed(2)}</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                <span>Personal Salary Loan:</span> <strong>₱{(scenario.personalSalaryLoan ?? 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        );

      case 'HANDBOOK':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📘 Audit Procedure Guide</h4>
              <p>{scenario.companyName} / Standard Operating Guidelines</p>
            </div>

            <div className="data-box authentic-data" style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
              <p><strong style={{ color: '#fbbf24' }}>STEP-BY-STEP PAYROLL AUDIT PROCEDURE:</strong></p>

              {activePhaseIndex === 3 ? (
                <>
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>1. Gross Basic Pay (Step 1):</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Determine Gross Pay using the base contracted rate and worked shifts.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>Gross Pay = Hourly Rate × 8 hours/day × Days Present</code>
                    </p>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <p><strong>2. Overtime Pay (Step 2):</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Determine active overtime hours by subtracting unpaid breaks (1.0 hour unpaid lunch) from raw OT hours.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>OT Pay = Hourly Rate × Actual OT Hours × 1.25</code>
                    </p>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <p><strong>3. Total Earnings Synthesis (Step 3):</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Synthesize the final overtime-adjusted earnings by adding the Overtime Pay to the verified Gross Basic Pay.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>Total Earnings = Gross Pay + OT Pay</code>
                    </p>
                  </div>
                </>
              ) : activePhaseIndex === 4 ? (
                <>
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>1. Regular Holiday Pay (Step 1-3):</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Identify the base <strong>Daily Rate</strong> from the Timesheet Terminal and the <strong>Regular Holiday multiplier (2.0)</strong> from the DOLE Poster.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>Holiday Pay = Daily Rate × 2.0</code>
                    </p>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <p><strong>2. Total Earnings Synthesis (Step 4):</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Synthesize the final holiday-adjusted earnings by adding the Holiday Pay to the basic Gross Pay.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>Total Earnings = Gross Pay + Holiday Pay = (Daily Rate × Days Present) + Holiday Pay</code>
                    </p>
                  </div>
                </>
              ) : activePhaseIndex === 5 || activePhaseIndex === 6 ? (
                <>
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>1. SSS Deduction Formula (Phase 5):</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Add Employee SSS EE share and personal salary loan. Employer ER shares and spouse loans are NOT deducted from basic pay.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>Total SSS Deduction = SSS EE Share + Personal Salary Loan</code>
                    </p>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>2. PhilHealth Deduction Formula (Phase 6):</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      PhilHealth premium is 5%, split 50/50. The employee share is 2.5% (0.025).
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>PhilHealth Deduction = Basic Salary × 0.025</code>
                    </p>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>3. Statutory Deductions Synthesis (Phase 6):</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Add the SSS deductions and the PhilHealth deductions together.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>Final Statutory Deductions = Total SSS Deduction + PhilHealth Deduction</code>
                    </p>
                  </div>
                </>
              ) : activePhaseIndex === 7 ? (
                <>
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>1. Total Gross Earnings:</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Sum of Basic Gross Pay, Overtime Pay, and Holiday Pay.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>Gross = (Daily Rate × Days Present) + OT Pay + Holiday Pay</code>
                      <br />
                      <code>OT Pay = Hourly Rate × (OT Hours - Unpaid Lunch) × 1.25</code>
                      <br />
                      <code>Holiday Pay = Daily Rate × 2.0 (if worked holiday)</code>
                    </p>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>2. Total Deductions:</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Sum of Tardiness deductions, SSS deductions, and PhilHealth deductions.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>Deductions = Tardiness + SSS Deduction + PhilHealth Deduction</code>
                      <br />
                      <code>Tardiness = (Hourly Rate / 60) × Late Minutes</code>
                      <br />
                      <code>SSS Deduction = SSS EE Share + Personal Salary Loan</code>
                      <br />
                      <code>PhilHealth Deduction = Basic Salary × 0.025</code>
                    </p>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>3. Final Net Pay:</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Subtract Total Deductions from Total Gross.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>Net Pay = Total Gross - Total Deductions</code>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>1. Gross Basic Pay (Step 1):</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Locate the contracted <strong>Hourly Rate</strong> on the Employee Contract or Biometrics Terminal header, and find the <strong>Days Present</strong> from the worked shifts.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>Gross Pay = Hourly Rate × 8 hours/day × Days Present</code>
                    </p>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <p><strong>2. Tardiness Deduction (Step 2):</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Review the official <strong>Biometrics Swipe Logs</strong> to sum the employee's raw late minutes. Early clock-in minutes must be ignored.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>Deduction = (Hourly Rate / 60) × Late Minutes</code>
                    </p>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <p><strong>3. Net Take-Home Pay (Step 3):</strong></p>
                    <p style={{ paddingLeft: '10px', color: '#94a3b8' }}>
                      Synthesize the final pay by subtracting the computed tardiness penalties from the verified Gross Basic Pay.
                      <br />
                      <span style={{ color: '#fbbf24' }}>Formula:</span> <code>Net Pay = Gross Pay - Tardiness Deduction</code>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'DOOR':
        return (
          <div className="popup-content">
            {isPhaseComplete ? (
              <>
                <div className="popup-header">
                  <h4 className="text-green" style={{ color: '#10b981' }}>🚪 EXIT DOORWAY BYPASSED</h4>
                  <p>Simulation Lab Lock: UNLOCKED</p>
                </div>
                <div className="data-box authentic-data text-center" style={{ padding: '20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '1rem', color: '#e2e8f0', marginBottom: '20px' }}>
                    {activePhaseIndex === 1 && "Congratulations! Your Gross Basic Pay calculations match Philippine auditing frameworks perfectly."}
                    {activePhaseIndex === 2 && "Congratulations! Your Tardiness Deduction calculations match Philippine auditing frameworks perfectly."}
                    {activePhaseIndex === 3 && "Congratulations! Your Overtime Premium calculations match Philippine auditing frameworks perfectly."}
                    {activePhaseIndex === 4 && "Congratulations! Your Regular Holiday Pay calculations match Philippine auditing frameworks perfectly."}
                    {activePhaseIndex === 5 && "Congratulations! Your SSS Deduction calculations match Philippine auditing frameworks perfectly."}
                    {activePhaseIndex === 6 && "Congratulations! Your PhilHealth Deduction calculations match Philippine auditing frameworks perfectly."}
                    {activePhaseIndex === 7 && "Congratulations! You have completed all audit procedures and mastered payroll simulation!"}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      onClick={onReroll}
                      className="login-btn"
                      style={{ flex: 1, border: '1px solid #facc15', color: '#facc15', margin: 0, padding: '12px' }}
                    >
                      TRY AGAIN 🔄
                    </button>
                    <button
                      onClick={onProceed}
                      className="login-btn"
                      style={{ flex: 1, border: '1px solid #10b981', color: '#10b981', margin: 0, padding: '12px' }}
                    >
                      {activePhaseIndex === 1 && 'PROCEED TO PHASE 2 >'}
                      {activePhaseIndex === 2 && 'PROCEED TO PHASE 3 >'}
                      {activePhaseIndex === 3 && 'PROCEED TO PHASE 4 >'}
                      {activePhaseIndex === 4 && 'PROCEED TO PHASE 5 >'}
                      {activePhaseIndex === 5 && 'PROCEED TO PHASE 6 >'}
                      {activePhaseIndex === 6 && 'PROCEED TO PHASE 7 >'}
                      {activePhaseIndex === 7 && 'PROCEED TO DASHBOARD >'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="popup-header">
                  <h4 className="text-red" style={{ color: '#ef4444' }}>🚨 ACCESS DENIED</h4>
                  <p>Simulation Lab Lock: LOCKED</p>
                </div>
                <div className="data-box herring-data text-center" style={{ padding: '20px', textAlign: 'center' }}>
                  <p style={{ color: '#fca5a5' }}>
                    {activePhaseIndex === 7
                      ? "Warning: Complete the Net Payroll Audit on the right-side Tribunal Audit panel to unlock the exit."
                      : "Warning: Complete the 4-step Cognitive Task calculations on the right-side Mission Log to unlock this doorway."
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>X</button>
        {renderContent()}
      </div>
    </div>
  );
}
