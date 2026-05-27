import React from 'react';
import { ScenarioData } from './utils/scenarioGen';
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
              ) : (
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
              )}
              <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                Click outside this modal or hit the "X" button at the top-right to begin auditing. Let's make sure there are no zero days!
              </p>
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
                    <th style={{ padding: '8px' }}>EARLY IN (MINS)</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.biometricLogs.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px' }}>{log.day}</td>
                      <td style={{ padding: '8px', color: log.status === 'LATE' ? '#ef4444' : log.status === 'EARLY IN' ? '#34d399' : log.status === 'HOLIDAY' ? '#facc15' : '#e2e8f0' }}>
                        {log.timeIn}
                      </td>
                      <td style={{ padding: '8px', color: log.status === 'HOLIDAY' ? '#facc15' : '#e2e8f0' }}>{log.timeOut}</td>
                      <td style={{ padding: '8px', color: log.late > 0 ? '#ef4444' : '#e2e8f0', fontWeight: log.late > 0 ? 'bold' : 'normal' }}>
                        {log.late} mins
                      </td>
                      <td style={{ padding: '8px', color: log.early > 0 ? '#34d399' : '#e2e8f0', fontWeight: log.early > 0 ? 'bold' : 'normal' }}>
                        {log.early} mins
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

      case 'HANDBOOK':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📘 Audit Procedure Guide</h4>
              <p>{scenario.companyName} // Standard Operating Guidelines</p>
            </div>
            
            <div className="data-box authentic-data" style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
              <p><strong style={{ color: '#fbbf24' }}>STEP-BY-STEP PAYROLL AUDIT PROCEDURE:</strong></p>
              
              {activePhaseIndex !== 3 ? (
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
              ) : (
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
                      {activePhaseIndex === 3 && 'PROCEED TO DASHBOARD >'}
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
                    Warning: Complete the 4-step Cognitive Task calculations on the right-side Mission Log to unlock this doorway.
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
