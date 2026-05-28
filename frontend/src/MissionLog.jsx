import React from 'react';
import './Room.css';

export default function MissionLog({
  activePhaseIndex,
  scenario,
  loading,
  feedback,
  setActivePopup,
  handleRerollScenario,
  setCurrentView,
  student,

  extractedA,
  setExtractedA,
  extractedB,
  setExtractedB,
  step1Status,
  extractionAttempts,
  handleValidateExtraction,

  selectedRule,
  setSelectedRule,
  step2Status,
  handleValidateRule,

  calculatedValue,
  setCalculatedValue,
  step3Status,
  handleValidateExecution,

  grossPayValue,
  setGrossPayValue,
  grossPayStatus,
  handleValidateGrossPay,

  netPayFormula,
  setNetPayFormula,
  netFormulaStatus,
  handleValidateNetPayFormula,

  netPayValue,
  setNetPayValue,
  step4Status,
  handleValidateSynthesis,

  trueOtHoursValue,
  setTrueOtHoursValue,
  trueOtHoursStatus,
  handleValidateTrueOtHours,
  otMultiplierValue,
  setOtMultiplierValue,
  otMultiplierStatus,
  handleValidateOtMultiplier,
  otFormulaValue,
  setOtFormulaValue,
  otFormulaStatus,
  handleValidateOtFormula,
  holidayTypeValue,
  setHolidayTypeValue,
  holidayMultiplierValue,
  setHolidayMultiplierValue,
  holidayFormulaValue,
  setHolidayFormulaValue,
  holidayFormulaStatus,
  handleValidateHolidayMultiplier,
  handleValidateHolidayFormula,

  tribunalGross,
  setTribunalGross,
  tribunalDeductions,
  setTribunalDeductions,
  tribunalNet,
  setTribunalNet,
  handleValidateTribunal,
  tribunalStatus
}) {

  if (activePhaseIndex === 7) {
    // Tribunal Boardroom UI
    return (
      <div className="right-panel">
        <div className="mission-header" style={{ borderBottom: '2px solid #ef4444' }}>
          <h3 style={{ color: '#ef4444', letterSpacing: '1px' }}>⚖️ TRIBUNAL AUDIT LOG [PHASE 7]</h3>
          <span className="timer" style={{ color: tribunalStatus === 'SUCCESS' ? '#10b981' : '#ef4444' }}>
            {tribunalStatus === 'SUCCESS' ? '🟢 PASSED' : '🔴 PENDING AUDIT'}
          </span>
        </div>

        <div className="tracker-steps" style={{ overflowY: 'auto', padding: '10px 0' }}>
          <div className="step-card active-step" style={{ border: '2px solid #ef4444', boxShadow: '0 0 12px rgba(239, 68, 68, 0.15)' }}>
            <div className="step-title">
              <h4 style={{ color: '#f87171' }}>FINAL NET PAYROLL AUDIT</h4>
              <span className="badge" style={{ backgroundColor: tribunalStatus === 'SUCCESS' ? '#10b981' : '#ef4444', color: '#fff' }}>
                {tribunalStatus}
              </span>
            </div>

            <div className="inputs-container" style={{ marginTop: '15px' }}>
              <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                1. TOTAL GROSS EARNINGS (₱)
              </label>
              <input 
                type="number" 
                placeholder="Basic Gross + OT Pay + Holiday Pay" 
                className="tech-input"
                value={tribunalGross}
                onChange={(e) => setTribunalGross(e.target.value)}
                disabled={tribunalStatus === 'SUCCESS' || loading}
                style={{ border: '1px solid #ef4444', color: '#fff', marginBottom: '12px' }}
              />

              <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                2. TOTAL DEDUCTIONS (₱)
              </label>
              <input 
                type="number" 
                placeholder="Tardiness + SSS + PhilHealth" 
                className="tech-input"
                value={tribunalDeductions}
                onChange={(e) => setTribunalDeductions(e.target.value)}
                disabled={tribunalStatus === 'SUCCESS' || loading}
                style={{ border: '1px solid #ef4444', color: '#fff', marginBottom: '12px' }}
              />

              <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                3. FINAL NET PAY (₱)
              </label>
              <input 
                type="number" 
                placeholder="Gross Earnings - Total Deductions" 
                className="tech-input"
                value={tribunalNet}
                onChange={(e) => setTribunalNet(e.target.value)}
                disabled={tribunalStatus === 'SUCCESS' || loading}
                style={{ border: '1px solid #ef4444', color: '#fff', marginBottom: '12px' }}
              />

              <button 
                className="tech-link"
                onClick={() => setActivePopup('HANDBOOK')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  padding: 0,
                  textAlign: 'left',
                  marginBottom: '15px',
                  display: 'block'
                }}
              >
                💡 Need the complete formulas? Check the Company Payroll Manual
              </button>

              {tribunalStatus !== 'SUCCESS' && (
                <button 
                  className="run-btn" 
                  onClick={handleValidateTribunal} 
                  disabled={loading}
                  style={{ backgroundColor: '#b91c1c', borderColor: '#ef4444', fontWeight: 'bold' }}
                >
                  {loading ? 'SUBMITTING AUDIT...' : 'SUBMIT FINAL AUDIT TO BOARD >'}
                </button>
              )}
            </div>
          </div>

          {/* Pulsing Red/Green CTA for Exit Gate */}
          {tribunalStatus === 'SUCCESS' && (
            <div className="text-emerald-400 animate-pulse" style={{
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '1rem',
              border: '2px dashed #10b981',
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              marginTop: '15px',
              letterSpacing: '1px',
              color: '#34d399'
            }}>
              AUDIT COMPLETED SUCCESSFULY. [PROCEED TO EXIT DOOR]
            </div>
          )}

          {/* Diagnostic System Log Terminal */}
          <div className="feedback-terminal" style={{
            background: '#070a13',
            border: '1px solid #1e293b',
            padding: '10px 15px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            borderRadius: '4px',
            color: feedback.includes('FAILED') || feedback.includes('Discrepancy') ? '#ef4444' : '#60a5fa',
            marginTop: '10px'
          }}>
            <span style={{ color: '#ef4444' }}>TRIBUNAL_LOG&gt;&gt;</span> {feedback}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button 
            className="run-btn" 
            onClick={() => handleRerollScenario(true)} 
            disabled={loading}
            style={{ flex: 1, backgroundColor: '#1e293b', border: '1px solid #f87171', color: '#f87171', margin: 0, padding: '12px' }}
          >
            🔄 REROLL AUDIT CASE
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
    );
  }

  // Phases 1-6 standard UI
  // Phase 2, 3, and 4 have special multi-step scaffolding flows.
  const isSynthesisSupported = activePhaseIndex >= 2 && activePhaseIndex <= 6;

  return (
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
          
          {activePhaseIndex === 4 ? (
            <div className="inputs-container">
              <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>SELECT HOLIDAY CLASSIFICATION</label>
              <div className="input-hint-wrapper">
                <select
                  value={holidayTypeValue}
                  onChange={(e) => setHolidayTypeValue && setHolidayTypeValue(e.target.value)}
                  disabled={step1Status === 'SUCCESS' || loading}
                  className="tech-input"
                  style={{ backgroundColor: '#0b1120', color: '#fff', border: '1px solid #60a5fa' }}
                >
                  <option value="">-- SELECT HOLIDAY TYPE --</option>
                  <option value="REGULAR_HOLIDAY">Regular Holiday (2.00x)</option>
                  <option value="SPECIAL_NON_WORKING">Special Non-Working Holiday (1.30x)</option>
                  <option value="ORDINARY_WORKING">Ordinary Working Day (1.00x)</option>
                </select>
                <span className="input-info-icon">ⓘ
                  <div className="input-tooltip">
                    Hint: Check the breakroom calendar for the exact date of June 12 and verify its holiday classification on the DOLE Poster.
                  </div>
                </span>
              </div>
              
              {step1Status !== 'SUCCESS' && (
                <button className="run-btn" onClick={handleValidateExtraction} disabled={loading}>
                  {loading ? 'COMPLYING...' : 'VERIFY HOLIDAY TYPE >'}
                </button>
              )}
            </div>
          ) : (
            <div className="inputs-container">
              <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                {activePhaseIndex === 1
                  ? 'VARIABLE COMPONENT A (Daily Rate)' 
                  : activePhaseIndex === 2 || activePhaseIndex === 3
                    ? 'VARIABLE COMPONENT A (Hourly Rate)'
                    : activePhaseIndex === 5
                      ? 'VARIABLE COMPONENT A (SSS EE Share)'
                      : 'VARIABLE COMPONENT A (Basic Salary)'
                }
              </label>
              <div className="input-hint-wrapper">
                <input 
                  type="number" 
                  placeholder={
                    activePhaseIndex === 1 
                      ? "₱ Enter base Daily Rate" 
                      : activePhaseIndex === 2 || activePhaseIndex === 3
                        ? "₱ Enter base Hourly Rate"
                        : activePhaseIndex === 5
                          ? "₱ Enter SSS EE share"
                          : "₱ Enter Basic Salary"
                  } 
                  className="tech-input"
                  value={extractedA}
                  onChange={(e) => setExtractedA(e.target.value)}
                  disabled={step1Status === 'SUCCESS' || loading}
                />
                <span className="input-info-icon">ⓘ
                  <div className="input-tooltip">
                    {activePhaseIndex === 1
                      ? 'Open the HR desk contract folder. The base Daily Rate is listed in the compensation section of the employment contract.'
                      : (activePhaseIndex === 2 || activePhaseIndex === 3)
                        ? 'Check the HR Filing Cabinet. The Hourly Rate is listed on the employee\'s contract file (Form 109-B).'
                        : activePhaseIndex === 5
                          ? 'Click the SSS contribution table on the corkboard. Find the employee\'s salary bracket and read the Employee Share (EE) column.'
                          : 'Open the employment contract folder. Basic monthly salary is in the compensation section.'
                    }
                  </div>
                </span>
              </div>
              
              <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                {activePhaseIndex === 1 
                  ? 'VARIABLE COMPONENT B (Days Present)' 
                  : activePhaseIndex === 2 
                    ? 'VARIABLE COMPONENT B (Late Minutes)' 
                    : activePhaseIndex === 3
                      ? 'VARIABLE COMPONENT B (Total Recorded OT Hours)'
                      : activePhaseIndex === 5
                        ? 'VARIABLE COMPONENT B (Personal Salary Loan)'
                        : 'VARIABLE COMPONENT B (PhilHealth Rate)'
                }
              </label>
              <div className="input-hint-wrapper">
                <input 
                  type="number" 
                  placeholder={
                    activePhaseIndex === 1 
                      ? "Enter shifts worked" 
                      : activePhaseIndex === 2 
                        ? "Enter late minutes" 
                        : activePhaseIndex === 3
                          ? "Enter total recorded OT hours"
                          : activePhaseIndex === 5
                            ? "₱ Enter personal salary loan"
                            : "Enter standard rate (e.g. 0.025)"
                  } 
                  className="tech-input"
                  value={extractedB}
                  onChange={(e) => setExtractedB(e.target.value)}
                  disabled={step1Status === 'SUCCESS' || loading}
                />
                <span className="input-info-icon">ⓘ
                  <div className="input-tooltip">
                    {activePhaseIndex === 1
                      ? 'Count the days marked P (Present) on the wall calendar. Each marked day is one shift worked.'
                      : activePhaseIndex === 2
                        ? 'Check the Biometrics Terminal near the security gate. Sum all late minutes for the payroll month.'
                        : activePhaseIndex === 3
                          ? 'Check the production timecard. Extract the total recorded OT hours from the timesheet terminal.'
                          : activePhaseIndex === 5
                            ? 'Review the HR payroll file. Personal salary loan amount is in the financial liabilities section.'
                            : 'Refer to the PhilHealth premium table on the corkboard. Find the applicable employee share rate.'
                    }
                  </div>
                </span>
              </div>

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
          )}
        </div>

        {/* STEP 2: RULE IDENTIFICATION */}
        {activePhaseIndex !== 3 && activePhaseIndex !== 4 && (
          <div className={`step-card ${step2Status === 'ACTIVE' ? 'active-step' : ''} ${step2Status === 'SUCCESS' ? 'success-step' : ''} ${step2Status === 'ERROR' ? 'error-step' : ''} ${step2Status === 'LOCKED' ? 'locked-step' : ''}`}>
            <div className="step-title">
              <h4>② STEP 2: IDENTIFY CORE EQUATION</h4>
              <span className="badge" style={{ backgroundColor: step2Status === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
                {step2Status}
              </span>
            </div>
            
            {step2Status !== 'LOCKED' && (
              <div className="inputs-container">
                <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                  {activePhaseIndex === 1 
                    ? 'Gross Basic Pay Equation Formula:' 
                    : activePhaseIndex === 2 
                      ? 'Tardiness Deduction Equation Formula:' 
                      : activePhaseIndex === 5
                        ? 'SSS Deduction Equation Formula:'
                        : 'PhilHealth Premium Equation Formula:'
                  }
                </label>
                <select 
                  value={selectedRule}
                  onChange={(e) => setSelectedRule(e.target.value)}
                  disabled={step2Status === 'SUCCESS' || loading}
                  className="tech-input"
                  style={{ backgroundColor: '#0b1120', color: '#fff' }}
                >
                  <option value="">-- SELECT FORMULA --</option>
                  {activePhaseIndex === 1 && (
                    <>
                      <option value="ADDITION">Daily Rate + Days Present</option>
                      <option value="MULTIPLICATION">Daily Rate × Days Present (Multiplication)</option>
                      <option value="DIVISION">Daily Rate ÷ Days Present</option>
                    </>
                  )}
                  {activePhaseIndex === 2 && (
                    <>
                      <option value="TARDINESS_FORMULA">(Hourly Rate / 60) × Late Minutes</option>
                      <option value="OFFSET_FORMULA">(Hourly Rate / 60) × (Late Minutes - Early Clock-in)</option>
                      <option value="DAILY_RATE_DIV_60">(Daily Rate / 60) × Late Minutes</option>
                    </>
                  )}
                  {activePhaseIndex === 5 && (
                    <>
                      <option value="SSS_FORMULA">SSS EE Share + Personal Salary Loan</option>
                      <option value="SSS_ER_FORMULA">SSS EE Share + SSS ER Share + Personal Loan</option>
                      <option value="SSS_SPOUSE_FORMULA">SSS EE Share + Personal Loan + Spouse Loan</option>
                    </>
                  )}
                  {activePhaseIndex === 6 && (
                    <>
                      <option value="PHILHEALTH_FORMULA">Basic Salary × 0.025</option>
                      <option value="PHILHEALTH_TOTAL_FORMULA">Basic Salary × 0.05</option>
                      <option value="PHILHEALTH_DAILY_FORMULA">Daily Rate × 0.025</option>
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
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* PHASE 3 SCAFFOLDING STEPS 2, 3, 4 ─────────────────── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activePhaseIndex === 3 && (
          <>
            {/* Step 2: Filter Unpaid Lunch */}
            <div className={`step-card ${trueOtHoursStatus === 'ACTIVE' ? 'active-step' : ''} ${trueOtHoursStatus === 'SUCCESS' ? 'success-step' : ''} ${trueOtHoursStatus === 'ERROR' ? 'error-step' : ''} ${trueOtHoursStatus === 'LOCKED' ? 'locked-step' : ''}`}
              style={{ border: trueOtHoursStatus !== 'LOCKED' ? '2px solid #a855f7' : undefined, boxShadow: trueOtHoursStatus !== 'LOCKED' ? '0 0 10px rgba(168, 85, 247, 0.2)' : undefined }}>
              <div className="step-title">
                <h4 style={{ color: '#c084fc' }}>② STEP 2: FILTER UNPAID LUNCH</h4>
                <span className="badge" style={{ backgroundColor: trueOtHoursStatus === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
                  {trueOtHoursStatus}
                </span>
              </div>
              {trueOtHoursStatus !== 'LOCKED' && (
                <div className="inputs-container">
                  <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>TRUE OVERTIME WORKING HOURS (Hrs)</label>
                  <div className="input-hint-wrapper">
                    <input
                      type="number"
                      placeholder="Enter calculated True OT Hours"
                      className="tech-input"
                      value={trueOtHoursValue}
                      onChange={(e) => setTrueOtHoursValue && setTrueOtHoursValue(e.target.value)}
                      disabled={trueOtHoursStatus === 'SUCCESS' || loading}
                      style={{ border: '1px solid #a855f7', color: '#fff' }}
                    />
                    <span className="input-info-icon">ⓘ
                      <div className="input-tooltip">
                        Hint: Under Philippine labor standards, rest intervals (like lunch breaks) are unpaid. Deduct unpaid lunch break hours from total recorded hours to get true OT hours.
                      </div>
                    </span>
                  </div>
                  {trueOtHoursStatus !== 'SUCCESS' && (
                    <button className="run-btn" onClick={handleValidateTrueOtHours} disabled={loading} style={{ backgroundColor: '#6b21a8', borderColor: '#a855f7' }}>
                      {loading ? 'FILTERING LUNCH...' : 'FILTER LUNCH BREAK >'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Establish DOLE Premium */}
            <div className={`step-card ${otMultiplierStatus === 'ACTIVE' ? 'active-step' : ''} ${otMultiplierStatus === 'SUCCESS' ? 'success-step' : ''} ${otMultiplierStatus === 'ERROR' ? 'error-step' : ''} ${otMultiplierStatus === 'LOCKED' ? 'locked-step' : ''}`}
              style={{ border: otMultiplierStatus !== 'LOCKED' ? '2px solid #3b82f6' : undefined, boxShadow: otMultiplierStatus !== 'LOCKED' ? '0 0 10px rgba(59, 130, 246, 0.2)' : undefined }}>
              <div className="step-title">
                <h4 style={{ color: '#60a5fa' }}>③ STEP 3: ESTABLISH DOLE PREMIUM</h4>
                <span className="badge" style={{ backgroundColor: otMultiplierStatus === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
                  {otMultiplierStatus}
                </span>
              </div>
              {otMultiplierStatus !== 'LOCKED' && (
                <div className="inputs-container">
                  <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>Select DOLE OT Premium Multiplier:</label>
                  <div className="input-hint-wrapper">
                    <select
                      value={otMultiplierValue}
                      onChange={(e) => setOtMultiplierValue && setOtMultiplierValue(e.target.value)}
                      disabled={otMultiplierStatus === 'SUCCESS' || loading}
                      className="tech-input"
                      style={{ backgroundColor: '#0b1120', color: '#fff' }}
                    >
                      <option value="">-- SELECT OT MULTIPLIER --</option>
                      <option value="1.25">1.25x (Standard OT Premium)</option>
                      <option value="1.30">1.30x (Special Holiday Premium)</option>
                      <option value="1.50">1.50x (Rest Day Premium)</option>
                      <option value="2.00">2.00x (Regular Holiday Premium)</option>
                    </select>
                    <span className="input-info-icon">ⓘ
                      <div className="input-tooltip">
                        Hint: Review the DOLE Overtime Premium rates poster on the wall to identify the standard multiplier for normal work hours.
                      </div>
                    </span>
                  </div>
                  {otMultiplierStatus !== 'SUCCESS' && (
                    <button className="run-btn" onClick={handleValidateOtMultiplier} disabled={loading} style={{ backgroundColor: '#1d4ed8', borderColor: '#3b82f6' }}>
                      {loading ? 'VERIFYING MULTIPLIER...' : 'VERIFY MULTIPLIER >'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Step 4: Establish OT Formula */}
            <div className={`step-card ${otFormulaStatus === 'ACTIVE' ? 'active-step' : ''} ${otFormulaStatus === 'SUCCESS' ? 'success-step' : ''} ${otFormulaStatus === 'ERROR' ? 'error-step' : ''} ${otFormulaStatus === 'LOCKED' ? 'locked-step' : ''}`}
              style={{ border: otFormulaStatus !== 'LOCKED' ? '2px solid #eab308' : undefined, boxShadow: otFormulaStatus !== 'LOCKED' ? '0 0 10px rgba(234, 179, 8, 0.2)' : undefined }}>
              <div className="step-title">
                <h4 style={{ color: '#facc15' }}>④ STEP 4: ESTABLISH OT FORMULA</h4>
                <span className="badge" style={{ backgroundColor: otFormulaStatus === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
                  {otFormulaStatus}
                </span>
              </div>
              {otFormulaStatus !== 'LOCKED' && (
                <div className="inputs-container">
                  <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>Select the correct Overtime Pay equation:</label>
                  <div className="input-hint-wrapper">
                    <select
                      value={otFormulaValue}
                      onChange={(e) => setOtFormulaValue && setOtFormulaValue(e.target.value)}
                      disabled={otFormulaStatus === 'SUCCESS' || loading}
                      className="tech-input"
                      style={{ backgroundColor: '#0b1120', color: '#fff' }}
                    >
                      <option value="">-- SELECT OT FORMULA --</option>
                      <option value="HOURLY_X_1.25_X_TRUE_OT">[Hourly Rate] × [1.25] × [True OT Hours]</option>
                      <option value="DAILY_X_1.25">[Daily Rate] × [1.25]</option>
                      <option value="HOURLY_PLUS_1.25">[Hourly Rate] + [1.25]</option>
                    </select>
                    <span className="input-info-icon">ⓘ
                      <div className="input-tooltip">
                        Hint: Overtime premiums build on top of hourly compensation. Choose the formula that scales the hourly rate by the standard premium multiplier over true hours.
                      </div>
                    </span>
                  </div>
                  {otFormulaStatus !== 'SUCCESS' && (
                    <button className="run-btn" onClick={handleValidateOtFormula} disabled={loading} style={{ backgroundColor: '#a16207', borderColor: '#eab308' }}>
                      {loading ? 'VERIFYING FORMULA...' : 'VERIFY OT FORMULA >'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* PHASE 4 SCAFFOLDING STEPS 2, 3 ────────────────────── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activePhaseIndex === 4 && (
          <>
            {/* Step 2: Establish DOLE Premium */}
            <div className={`step-card ${step2Status === 'ACTIVE' ? 'active-step' : ''} ${step2Status === 'SUCCESS' ? 'success-step' : ''} ${step2Status === 'ERROR' ? 'error-step' : ''} ${step2Status === 'LOCKED' ? 'locked-step' : ''}`}
              style={{ border: step2Status !== 'LOCKED' ? '2px solid #3b82f6' : undefined, boxShadow: step2Status !== 'LOCKED' ? '0 0 10px rgba(59, 130, 246, 0.2)' : undefined }}>
              <div className="step-title">
                <h4 style={{ color: '#60a5fa' }}>② STEP 2: ESTABLISH DOLE PREMIUM</h4>
                <span className="badge" style={{ backgroundColor: step2Status === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
                  {step2Status}
                </span>
              </div>
              {step2Status !== 'LOCKED' && (
                <div className="inputs-container">
                  <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>Select DOLE Holiday Premium Multiplier:</label>
                  <div className="input-hint-wrapper">
                    <select
                      value={holidayMultiplierValue}
                      onChange={(e) => setHolidayMultiplierValue && setHolidayMultiplierValue(e.target.value)}
                      disabled={step2Status === 'SUCCESS' || loading}
                      className="tech-input"
                      style={{ backgroundColor: '#0b1120', color: '#fff' }}
                    >
                      <option value="">-- SELECT HOLIDAY MULTIPLIER --</option>
                      <option value="2.00">2.00x (Regular Holiday Double Pay)</option>
                      <option value="1.30">1.30x (Special Holiday Premium)</option>
                      <option value="1.50">1.50x (Rest Day Premium)</option>
                    </select>
                    <span className="input-info-icon">ⓘ
                      <div className="input-tooltip">
                        Hint: Regular Holidays (like Independence Day) qualify the employee for double pay (200%). Select the multiplier that represents this standard.
                      </div>
                    </span>
                  </div>
                  {step2Status !== 'SUCCESS' && (
                    <button className="run-btn" onClick={handleValidateHolidayMultiplier} disabled={loading} style={{ backgroundColor: '#1d4ed8', borderColor: '#3b82f6' }}>
                      {loading ? 'VERIFYING MULTIPLIER...' : 'VERIFY MULTIPLIER >'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Establish Holiday Formula */}
            <div className={`step-card ${holidayFormulaStatus === 'ACTIVE' ? 'active-step' : ''} ${holidayFormulaStatus === 'SUCCESS' ? 'success-step' : ''} ${holidayFormulaStatus === 'ERROR' ? 'error-step' : ''} ${holidayFormulaStatus === 'LOCKED' ? 'locked-step' : ''}`}
              style={{ border: holidayFormulaStatus !== 'LOCKED' ? '2px solid #eab308' : undefined, boxShadow: holidayFormulaStatus !== 'LOCKED' ? '0 0 10px rgba(234, 179, 8, 0.2)' : undefined }}>
              <div className="step-title">
                <h4 style={{ color: '#facc15' }}>③ STEP 3: ESTABLISH HOLIDAY FORMULA</h4>
                <span className="badge" style={{ backgroundColor: holidayFormulaStatus === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
                  {holidayFormulaStatus}
                </span>
              </div>
              {holidayFormulaStatus !== 'LOCKED' && (
                <div className="inputs-container">
                  <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>Select the correct Holiday Pay equation:</label>
                  <div className="input-hint-wrapper">
                    <select
                      value={holidayFormulaValue}
                      onChange={(e) => setHolidayFormulaValue && setHolidayFormulaValue(e.target.value)}
                      disabled={holidayFormulaStatus === 'SUCCESS' || loading}
                      className="tech-input"
                      style={{ backgroundColor: '#0b1120', color: '#fff' }}
                    >
                      <option value="">-- SELECT HOLIDAY FORMULA --</option>
                      <option value="DAILY_X_2.0">[Daily Rate] × [2.00]</option>
                      <option value="HOURLY_X_2.0">[Hourly Rate] × [2.00]</option>
                      <option value="DAILY_X_1.3">[Daily Rate] × [1.30]</option>
                    </select>
                    <span className="input-info-icon">ⓘ
                      <div className="input-tooltip">
                        Hint: Holiday double pay is computed based on the employee's standard Daily Rate. Select the correct formula.
                      </div>
                    </span>
                  </div>
                  {holidayFormulaStatus !== 'SUCCESS' && (
                    <button className="run-btn" onClick={handleValidateHolidayFormula} disabled={loading} style={{ backgroundColor: '#a16207', borderColor: '#eab308' }}>
                      {loading ? 'VERIFYING FORMULA...' : 'VERIFY HOLIDAY FORMULA >'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* STEP 3: ARITHMETIC EXECUTION */}
        <div className={`step-card ${step3Status === 'ACTIVE' ? 'active-step' : ''} ${step3Status === 'SUCCESS' ? 'success-step' : ''} ${step3Status === 'ERROR' ? 'error-step' : ''} ${step3Status === 'LOCKED' ? 'locked-step' : ''}`}>
          <div className="step-title">
            <h4>
              {activePhaseIndex === 3 
                ? '⑤ STEP 5: COMPUTE OVERTIME PAY'
                : activePhaseIndex === 4
                  ? '④ STEP 4: COMPUTE HOLIDAY PAY'
                  : '③ STEP 3: EXECUTE ARITHMETIC'
              }
            </h4>
            <span className="badge" style={{ backgroundColor: step3Status === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
              {step3Status}
            </span>
          </div>
          
          {step3Status !== 'LOCKED' && (
            <div className="inputs-container">
              <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                {activePhaseIndex === 1 
                  ? 'FINAL GROSS BASIC EARNINGS (₱)' 
                  : activePhaseIndex === 2 
                    ? 'TOTAL TARDINESS DEDUCTIONS (₱)' 
                    : activePhaseIndex === 3
                      ? 'FINAL OVERTIME PREMIUM PAY (₱)'
                      : activePhaseIndex === 4
                        ? 'FINAL REGULAR HOLIDAY PAY (₱)'
                        : activePhaseIndex === 5
                          ? 'TOTAL SSS DEDUCTIONS (₱)'
                          : 'FINAL PHILHEALTH PREMIUM DEDUCTION (₱)'
                }
              </label>
              <div className="input-hint-wrapper">
                <input 
                  type="number" 
                  placeholder="₱ Enter calculated amount" 
                  className="tech-input"
                  value={calculatedValue}
                  onChange={(e) => setCalculatedValue(e.target.value)}
                  disabled={step3Status === 'SUCCESS' || loading}
                />
                <span className="input-info-icon">ⓘ
                  <div className="input-tooltip">
                    {activePhaseIndex === 1
                      ? 'Multiply Daily Rate × Days Present. Confirm your arithmetic before entering.'
                      : activePhaseIndex === 2
                        ? 'Apply: (Hourly Rate ÷ 60) × Late Minutes. Use a calculator for precision.'
                        : activePhaseIndex === 3
                          ? 'Review the DOLE Overtime poster on the wall and verify your true OT hours.'
                          : activePhaseIndex === 4
                            ? 'Review the DOLE holiday poster on the breakroom corkboard and verify your daily rate.'
                            : activePhaseIndex === 5
                              ? 'Add SSS Employee Share + Personal Salary Loan (Variables A and B from Step 1).'
                              : 'Multiply Basic Salary × PhilHealth rate from Step 1.'
                    }
                  </div>
                </span>
              </div>
              
              {step3Status !== 'SUCCESS' && (
                <button className="run-btn" onClick={handleValidateExecution} disabled={loading}>
                  {loading ? 'AUDITING LEDGER...' : 'RUN FINAL LEDGER AUDIT >'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* PHASE 2 EXCLUSIVE: STEPS 4, 5, 6 — Gross Pay → Formula → Net Pay */}
        {/* ============================================================ */}

        {/* COMPUTE GROSS BASIC PAY (Step 4 for Phase 2, Step 6 for Phase 3, Step 5 for Phase 4) */}
        {(activePhaseIndex === 2 || activePhaseIndex === 3 || activePhaseIndex === 4) && (
          <div className={`step-card ${grossPayStatus === 'ACTIVE' ? 'active-step' : ''} ${grossPayStatus === 'SUCCESS' ? 'success-step' : ''} ${grossPayStatus === 'ERROR' ? 'error-step' : ''} ${grossPayStatus === 'LOCKED' ? 'locked-step' : ''}`}
            style={{ border: grossPayStatus !== 'LOCKED' ? '2px solid #8b5cf6' : undefined, boxShadow: grossPayStatus !== 'LOCKED' ? '0 0 10px rgba(139, 92, 246, 0.2)' : undefined }}>
            <div className="step-title">
              <h4 style={{ color: '#a78bfa' }}>
                {activePhaseIndex === 2 && '④ STEP 4: COMPUTE GROSS BASIC PAY'}
                {activePhaseIndex === 3 && '⑥ STEP 6: COMPUTE GROSS BASIC PAY'}
                {activePhaseIndex === 4 && '⑤ STEP 5: COMPUTE GROSS BASIC PAY'}
              </h4>
              <span className="badge" style={{ backgroundColor: grossPayStatus === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
                {grossPayStatus}
              </span>
            </div>

            {grossPayStatus !== 'LOCKED' && (
              <div className="inputs-container">
                <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                  VERIFIED GROSS BASIC PAY (₱)
                </label>
                {activePhaseIndex === 2 && (
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 6px 0', fontStyle: 'italic' }}>
                    Formula: Hourly Rate × 8 hrs/day × Days Present
                  </p>
                )}
                <div className="input-hint-wrapper">
                  <input
                    type="number"
                    placeholder="₱ Enter calculated Gross Pay"
                    className="tech-input"
                    value={grossPayValue}
                    onChange={(e) => setGrossPayValue(e.target.value)}
                    disabled={grossPayStatus === 'SUCCESS' || loading}
                    style={{ border: '1px solid #8b5cf6', color: '#fff' }}
                  />
                  <span className="input-info-icon">ⓘ
                    <div className="input-tooltip">
                      {activePhaseIndex === 2
                        ? 'Check the HR Filing Cabinet for the employee\'s contract file to find the Hourly Rate and multiply by the standard shift hours and days worked.'
                        : activePhaseIndex === 3
                          ? 'Review the employee contract file to find the Hourly Rate, then multiply by standard shift length (8 hours) and days present.'
                          : 'Check the HR Filing Cabinet for the employee\'s contract file. Find the Daily Rate and multiply by the total days present on the calendar.'
                      }
                    </div>
                  </span>
                </div>

                {grossPayStatus !== 'SUCCESS' && (
                  <button
                    className="run-btn"
                    onClick={handleValidateGrossPay}
                    disabled={loading}
                    style={{ backgroundColor: '#5b21b6', borderColor: '#8b5cf6' }}
                  >
                    {loading ? 'VERIFYING...' : 'VERIFY GROSS PAY >'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ESTABLISH SYNTHESIS FORMULA (Step 5 for Phase 2, Step 7 for Phase 3, Step 6 for Phase 4) */}
        {(activePhaseIndex === 2 || activePhaseIndex === 3 || activePhaseIndex === 4) && (
          <div className={`step-card ${netFormulaStatus === 'ACTIVE' ? 'active-step' : ''} ${netFormulaStatus === 'SUCCESS' ? 'success-step' : ''} ${netFormulaStatus === 'ERROR' ? 'error-step' : ''} ${netFormulaStatus === 'LOCKED' ? 'locked-step' : ''}`}
            style={{ border: netFormulaStatus !== 'LOCKED' ? '2px solid #f59e0b' : undefined, boxShadow: netFormulaStatus !== 'LOCKED' ? '0 0 10px rgba(245, 158, 11, 0.2)' : undefined }}>
            <div className="step-title">
              <h4 style={{ color: '#fbbf24' }}>
                {activePhaseIndex === 2 && '⑤ STEP 5: ESTABLISH NET PAY FORMULA'}
                {activePhaseIndex === 3 && '⑦ STEP 7: ESTABLISH SYNTHESIS FORMULA'}
                {activePhaseIndex === 4 && '⑥ STEP 6: ESTABLISH SYNTHESIS FORMULA'}
              </h4>
              <span className="badge" style={{ backgroundColor: netFormulaStatus === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
                {netFormulaStatus}
              </span>
            </div>

            {netFormulaStatus !== 'LOCKED' && (
              <div className="inputs-container">
                <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                  {activePhaseIndex === 2 ? 'Select the correct Net Pay equation:' : 'Select the correct Total Earnings equation:'}
                </label>
                <div className="input-hint-wrapper">
                  <select
                    value={netPayFormula}
                    onChange={(e) => setNetPayFormula(e.target.value)}
                    disabled={netFormulaStatus === 'SUCCESS' || loading}
                    className="tech-input"
                    style={{ backgroundColor: '#0b1120', color: '#fff' }}
                  >
                    {activePhaseIndex === 2 && (
                      <>
                        <option value="">-- SELECT NET PAY FORMULA --</option>
                        <option value="GROSS_MINUS_TARDINESS">[Gross Basic Pay] − [Tardiness Deductions]</option>
                        <option value="GROSS_PLUS_TARDINESS">[Gross Basic Pay] + [Tardiness Deductions]</option>
                        <option value="HOURLY_MINUS_TARDINESS">[Hourly Rate] − [Tardiness Deductions]</option>
                      </>
                    )}
                    {activePhaseIndex === 3 && (
                      <>
                        <option value="">-- SELECT TOTAL EARNINGS FORMULA --</option>
                        <option value="GROSS_PLUS_OT">[Gross Basic Pay] + [Overtime Pay]</option>
                        <option value="GROSS_MINUS_OT">[Gross Basic Pay] − [Overtime Pay]</option>
                        <option value="HOURLY_PLUS_OT">[Hourly Rate] + [Overtime Pay]</option>
                      </>
                    )}
                    {activePhaseIndex === 4 && (
                      <>
                        <option value="">-- SELECT TOTAL EARNINGS FORMULA --</option>
                        <option value="GROSS_PLUS_HOLIDAY">[Gross Basic Pay] + [Holiday Pay]</option>
                        <option value="GROSS_MINUS_HOLIDAY">[Gross Basic Pay] − [Holiday Pay]</option>
                        <option value="DAILY_PLUS_HOLIDAY">[Daily Rate] + [Holiday Pay]</option>
                      </>
                    )}
                  </select>
                  <span className="input-info-icon">ⓘ
                    <div className="input-tooltip">
                      {activePhaseIndex === 2
                        ? 'Select the formula that deducts late arrival penalties from basic monthly wages.'
                        : activePhaseIndex === 3
                          ? 'Select the formula that synthesizes the basic gross monthly pay and newly verified overtime pay.'
                          : 'Select the formula that synthesizes basic monthly wages and holiday premium double pay.'
                      }
                    </div>
                  </span>
                </div>

                {netFormulaStatus !== 'SUCCESS' && (
                  <button
                    className="run-btn"
                    onClick={handleValidateNetPayFormula}
                    disabled={loading}
                    style={{ backgroundColor: '#92400e', borderColor: '#f59e0b' }}
                  >
                    {loading ? 'VERIFYING FORMULA...' : 'VERIFY FORMULA >'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 4 (phases 3-6) / STEP 6 (phase 2): SYNTHESIS / FINAL NET PAY */}
        {/* ============================================================ */}
        {isSynthesisSupported && (
          <div className={`step-card ${step4Status === 'ACTIVE' ? 'active-step' : ''} ${step4Status === 'SUCCESS' ? 'success-step' : ''} ${step4Status === 'ERROR' ? 'error-step' : ''} ${step4Status === 'LOCKED' ? 'locked-step' : ''}`}
            style={{ border: '2px solid #3b82f6', boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)' }}>
            <div className="step-title">
              <h4 style={{ color: '#60a5fa' }}>
                {activePhaseIndex === 2 && '⑥ STEP 6: COMPUTE FINAL NET PAY'}
                {activePhaseIndex === 3 && '⑧ STEP 8: SYNTHESIZE TOTAL EARNINGS'}
                {activePhaseIndex === 4 && '⑦ STEP 7: SYNTHESIZE TOTAL EARNINGS'}
                {activePhaseIndex === 5 && '④ STEP 4: COMPUTE STAT DEDUCTIONS SO FAR'}
                {activePhaseIndex === 6 && '④ STEP 4: COMPUTE FINAL STAT DEDUCTIONS'}
              </h4>
              <span className="badge" style={{ backgroundColor: step4Status === 'SUCCESS' ? '#10b981' : '#475569', color: '#fff' }}>
                {step4Status}
              </span>
            </div>
            
            {step4Status !== 'LOCKED' && (
              <div className="inputs-container">
                <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                  {activePhaseIndex === 2 && 'FINAL TOTAL TAKE-HOME NET PAY (₱)'}
                  {activePhaseIndex === 3 && 'FINAL OVERTIME-ADJUSTED TOTAL EARNINGS (₱)'}
                  {activePhaseIndex === 4 && 'FINAL HOLIDAY-ADJUSTED TOTAL EARNINGS (₱)'}
                  {activePhaseIndex === 5 && 'TOTAL STATUTORY DEDUCTIONS SO FAR (₱)'}
                  {activePhaseIndex === 6 && 'FINAL STATUTORY DEDUCTIONS (₱)'}
                </label>
                {activePhaseIndex === 2 && (
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 6px 0', fontStyle: 'italic' }}>
                    Formula: Verified Gross Basic Pay − Verified Tardiness Deduction
                  </p>
                )}
                <div className="input-hint-wrapper">
                  <input 
                    type="number" 
                    placeholder={
                      activePhaseIndex === 2 
                        ? "₱ Gross Basic Pay − Tardiness Deduction" 
                        : activePhaseIndex === 3 || activePhaseIndex === 4
                          ? "₱ Enter calculated Total Earnings"
                          : "₱ Enter statutory deductions sum"
                    } 
                    className="tech-input"
                    value={netPayValue}
                    onChange={(e) => setNetPayValue(e.target.value)}
                    disabled={step4Status === 'SUCCESS' || loading}
                    style={{ border: '1px solid #3b82f6', color: '#fff' }}
                  />
                  <span className="input-info-icon">ⓘ
                    <div className="input-tooltip">
                      {activePhaseIndex === 2
                        ? 'Deduct tardiness from gross basic pay.'
                        : activePhaseIndex === 3 
                          ? 'Review the Company Payroll Manual to synthesize Overtime Pay into Total Gross Earnings.'
                          : activePhaseIndex === 4
                            ? 'Review the Company Payroll Manual to synthesize Holiday Pay into Total Gross Earnings.'
                            : 'Sum all statutory deductions calculated.'
                      }
                    </div>
                  </span>
                </div>
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
                  💡 Need the formula? Check the Company Payroll Manual
                </button>
                
                {step4Status !== 'SUCCESS' && (
                  <button className="run-btn" onClick={handleValidateSynthesis} disabled={loading} style={{ backgroundColor: '#1d4ed8', borderColor: '#3b82f6' }}>
                    {loading ? 'SYNTHESIZING...' : 'RUN FINAL SYNTHESIS AUDIT >'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pulsing Amber CTA for Phase Completion */}
        {((activePhaseIndex === 1 && step3Status === 'SUCCESS') || 
          (activePhaseIndex >= 2 && activePhaseIndex <= 6 && step4Status === 'SUCCESS')) && (
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
            MISSION PHASE {activePhaseIndex} COMPLETE. [PROCEED TO ROOM DOOR]
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
          color: feedback.includes('ERROR') || feedback.includes('Failed') || feedback.includes('incorrect') || feedback.includes('mismatch') ? '#ef4444' : '#60a5fa',
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
  );
}
