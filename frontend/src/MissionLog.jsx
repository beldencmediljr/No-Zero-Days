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

  netPayValue,
  setNetPayValue,
  step4Status,
  handleValidateSynthesis,

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
              <div className="input-hint-wrapper">
                <input 
                  type="number" 
                  placeholder="Basic Gross + OT Pay + Holiday Pay" 
                  className="tech-input"
                  value={tribunalGross}
                  onChange={(e) => setTribunalGross(e.target.value)}
                  disabled={tribunalStatus === 'SUCCESS' || loading}
                  style={{ border: '1px solid #ef4444', color: '#fff' }}
                />
                <span className="input-info-icon">ⓘ
                  <div className="input-tooltip">Sum all earnings across prior rooms: Gross Basic Pay (Phase 1) + Overtime Premium (Phase 3) + Holiday Pay (Phase 4). Each amount was calculated and validated during the respective room audit steps.</div>
                </span>
              </div>

              <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                2. TOTAL DEDUCTIONS (₱)
              </label>
              <div className="input-hint-wrapper">
                <input 
                  type="number" 
                  placeholder="Tardiness + SSS + PhilHealth" 
                  className="tech-input"
                  value={tribunalDeductions}
                  onChange={(e) => setTribunalDeductions(e.target.value)}
                  disabled={tribunalStatus === 'SUCCESS' || loading}
                  style={{ border: '1px solid #ef4444', color: '#fff' }}
                />
                <span className="input-info-icon">ⓘ
                  <div className="input-tooltip">Add all deductions validated across prior rooms: Tardiness Deduction (Phase 2) + SSS Total (Phase 5) + PhilHealth Premium (Phase 6). Each value was confirmed during the respective room audit.</div>
                </span>
              </div>

              <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                3. FINAL NET PAY (₱)
              </label>
              <div className="input-hint-wrapper">
                <input 
                  type="number" 
                  placeholder="Gross Earnings - Total Deductions" 
                  className="tech-input"
                  value={tribunalNet}
                  onChange={(e) => setTribunalNet(e.target.value)}
                  disabled={tribunalStatus === 'SUCCESS' || loading}
                  style={{ border: '1px solid #ef4444', color: '#fff' }}
                />
                <span className="input-info-icon">ⓘ
                  <div className="input-tooltip">Subtract the total deductions from total gross earnings. This is the employee's final take-home net pay for the entire audit period. Both values come from the two fields entered just above.</div>
                </span>
              </div>

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
          
          <div className="inputs-container">
            <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
              {activePhaseIndex === 1 || activePhaseIndex === 4
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
                  activePhaseIndex === 1 || activePhaseIndex === 4 
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
                  {(activePhaseIndex === 1 || activePhaseIndex === 4)
                    ? 'Open the HR desk contract folder on the left side of the room. The employee\'s base daily rate is printed on the employment contract inside.'
                    : (activePhaseIndex === 2 || activePhaseIndex === 3)
                      ? 'Check the supervisor\'s clipboard or the timecard terminal near the assembly line. The base hourly rate is listed on the employee\'s shift agreement.'
                      : activePhaseIndex === 5
                        ? 'Click the SSS deduction table posted on the office corkboard. Find the employee\'s gross salary bracket and read the Employee Share (EE) column.'
                        : 'Open the employment contract folder at the main desk. The employee\'s basic monthly salary is printed in the compensation section.'
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
                    ? 'VARIABLE COMPONENT B (Actual OT Hours)'
                    : activePhaseIndex === 4
                      ? 'VARIABLE COMPONENT B (Holiday Multiplier)'
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
                        ? "Enter actual OT hours"
                        : activePhaseIndex === 4
                          ? "Enter holiday multiplier (e.g. 2.0)"
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
                    ? 'Count the days marked with a P (Present) on the monthly wall calendar in the lobby. Each marked day represents one shift worked by the employee.'
                    : activePhaseIndex === 2
                      ? 'Click the biometric swipe log terminal near the security gate. Sum all tardiness minutes recorded for this employee across the current payroll month.'
                      : activePhaseIndex === 3
                        ? 'Examine the production timecard on the supervisor\'s desk. Subtract the standard 8-hour shift from the total hours clocked to find actual overtime hours.'
                        : activePhaseIndex === 4
                          ? 'Check the DOLE holiday policy poster on the breakroom corkboard. The correct premium multiplier for a Regular Holiday is stated in the premium rates section.'
                          : activePhaseIndex === 5
                            ? 'Review the employee\'s payroll file at the HR desk. The personal salary loan deduction amount is itemized in the financial liabilities section.'
                            : 'Refer to the PhilHealth premium table posted on the office corkboard. The applicable employee share rate is displayed as a decimal percentage.'
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
              <label style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>
                {activePhaseIndex === 1 
                  ? 'Gross Basic Pay Equation Formula:' 
                  : activePhaseIndex === 2 
                    ? 'Tardiness Deduction Equation Formula:' 
                    : activePhaseIndex === 3
                      ? 'Overtime Premium Equation Formula:'
                      : activePhaseIndex === 4
                        ? 'Regular Holiday Pay Equation Formula:'
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
                {activePhaseIndex === 3 && (
                  <>
                    <option value="OT_FORMULA">Hourly Rate × OT Hours × 1.25</option>
                    <option value="OT_ADDITION">Hourly Rate + OT Hours + 1.25</option>
                    <option value="OT_DAILY">Daily Rate × OT Hours × 1.25</option>
                  </>
                )}
                {activePhaseIndex === 4 && (
                  <>
                    <option value="HOLIDAY_FORMULA">Daily Rate × 2.0 (Regular Holiday Pay)</option>
                    <option value="DAILY_RATE_X_1.3">Daily Rate × 1.3 (Special Non-Working Holiday)</option>
                    <option value="HOURLY_RATE_X_8">Hourly Rate × 8 (Standard Shift)</option>
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
                      ? 'Multiply Daily Rate × Days Present. Use the in-room calculator panel to confirm your arithmetic before entering this value.'
                      : activePhaseIndex === 2
                        ? 'Apply: (Hourly Rate ÷ 60) × Late Minutes. Use the calculator to compute the precise tardiness deduction amount.'
                        : activePhaseIndex === 3
                          ? 'Apply: Hourly Rate × Overtime Hours × 1.25. The 1.25 multiplier is the legal overtime premium required under DOLE regulations.'
                          : activePhaseIndex === 4
                            ? 'Multiply Daily Rate × the holiday multiplier shown on the corkboard poster. Confirm the correct holiday type before applying the multiplier.'
                            : activePhaseIndex === 5
                              ? 'Add the SSS Employee Share to the Personal Salary Loan amount. Both values were entered as Variable A and B in Step 1 above.'
                              : 'Multiply Basic Salary × the PhilHealth rate entered in Step 1. This gives the employee\'s total PhilHealth premium contribution.'
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

        {/* STEP 4: SYNTHESIS COMPUTE NET PAY / TOTAL EARNINGS / STATUTORY DEDUCTIONS */}
        {isSynthesisSupported && (
          <div className={`step-card ${step4Status === 'ACTIVE' ? 'active-step' : ''} ${step4Status === 'SUCCESS' ? 'success-step' : ''} ${step4Status === 'ERROR' ? 'error-step' : ''} ${step4Status === 'LOCKED' ? 'locked-step' : ''}`} style={{ border: '2px solid #3b82f6', boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)' }}>
            <div className="step-title">
              <h4 style={{ color: '#60a5fa' }}>
                {activePhaseIndex === 2 && '④ STEP 4: COMPUTE NET PAY'}
                {(activePhaseIndex === 3 || activePhaseIndex === 4) && '④ STEP 4: COMPUTE TOTAL EARNINGS'}
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
                <div className="input-hint-wrapper">
                  <input 
                    type="number" 
                    placeholder={
                      activePhaseIndex === 2 
                        ? "₱ Enter calculated Net Pay" 
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
                        ? 'Subtract the tardiness deduction (Step 3 result) from the employee\'s gross basic pay computed in Phase 1. The difference is the take-home net pay.'
                        : (activePhaseIndex === 3 || activePhaseIndex === 4)
                          ? 'Add the premium pay from Step 3 to the employee\'s gross basic earnings from Phase 1. The total is the overtime or holiday adjusted earnings.'
                          : activePhaseIndex === 5
                            ? 'Add the SSS Employee Share and personal salary loan from Steps 1 and 3 to get the total SSS-related deductions accumulated so far.'
                            : 'Add the SSS deductions total (Phase 5) to the PhilHealth premium (Step 3 of this phase) for the complete statutory deduction total.'
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
          color: feedback.includes('ERROR') || feedback.includes('Failed') || feedback.includes('mismatch') ? '#ef4444' : '#60a5fa',
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
