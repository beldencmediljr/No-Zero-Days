import React, { useState, useEffect } from 'react';
import './Auth.css';

export default function Dashboard({ onSelectPhase }) {
  const [student, setStudent] = useState({ fullName: 'Temporary Student', studentNumber: 'STU-UNKNOWN', section: 'ABM-A' });
  const [progressList, setProgressList] = useState([]);
  const [selectedPhaseSummary, setSelectedPhaseSummary] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const defaultRoadmap = [
    { phaseId: 1, title: "Phase 1: Basic Gross Pay", description: "Audit morning Lobby Daily Rate and Shifts worked.", status: "ACTIVE", bestScore: 0, module: "M1_MATH", phaseIndex: 1 },
    { phaseId: 2, title: "Phase 2: Tardiness Deductions", description: "Audit biometric clock-in logs and raw late minutes.", status: "LOCKED", bestScore: 0, module: "M1_MATH", phaseIndex: 2 },
    { phaseId: 3, title: "Phase 3: Overtime Premiums", description: "Verify OT multipliers and unpaid lunch breaks.", status: "LOCKED", bestScore: 0, module: "M2_MULTIPLIERS", phaseIndex: 1 },
    { phaseId: 4, title: "Phase 4: Regular Holiday Pay", description: "Audit Regular Holiday Double Pay rules.", status: "LOCKED", bestScore: 0, module: "M2_MULTIPLIERS", phaseIndex: 2 },
    { phaseId: 5, title: "Phase 5: SSS Deductions", description: "Verify SSS EE share vs ER share deductions.", status: "LOCKED", bestScore: 0, module: "M3_BUREAUCRACY", phaseIndex: 1 },
    { phaseId: 6, title: "Phase 6: PhilHealth Premiums", description: "Verify PhilHealth premium percentages.", status: "LOCKED", bestScore: 0, module: "M3_BUREAUCRACY", phaseIndex: 2 },
    { phaseId: 7, title: "Phase 7: Net Payroll Boardroom", description: "Audit the complete Net Pay ledger unscaffolded.", status: "LOCKED", bestScore: 0, module: "M4_TRIBUNAL", phaseIndex: 1 }
  ];

  const fetchProgress = async (studentNum) => {
    try {
      const res = await fetch(`http://localhost:8080/api/progress/status?studentNumber=${studentNum}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setProgressList(data);
        }
      }
    } catch (err) {
      console.error("Failed to load progress roadmap", err);
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    const savedStudent = localStorage.getItem('student');
    if (savedStudent) {
      const parsed = JSON.parse(savedStudent);
      setStudent(parsed);
      fetchProgress(parsed.studentNumber);
    } else {
      setLoadingProgress(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('student');
    window.location.reload();
  };

  // Raw progression tracking list from backend
  const rawRoadmap = progressList.length > 0 ? progressList : defaultRoadmap;
  
  // Calculate completed phases (purely informational)
  const completedCount = rawRoadmap.filter(p => p.status === 'COMPLETED').length;
  const completionPercent = Math.round((completedCount / 7.0) * 100);

  // Scenario Lock Override: Set all LOCKED phases to ACTIVE for practice accessibility
  const activeRoadmap = rawRoadmap.map(p => {
    if (p.status === 'LOCKED') {
      return { ...p, status: 'ACTIVE' };
    }
    return p;
  });

  const handleCardClick = (phase) => {
    const originalProgress = rawRoadmap.find(r => r.phaseId === phase.phaseId);
    if (originalProgress && originalProgress.status === 'COMPLETED') {
      setSelectedPhaseSummary(originalProgress);
    } else {
      onSelectPhase(phase.phaseId);
    }
  };

  return (
    <div className="auth-container" style={{ padding: '20px', boxSizing: 'border-box', overflowY: 'auto' }}>
      <div className="glow-overlay"></div>
      <div className="scanlines"></div>

      <div className="dashboard-card" style={{ width: '95%', maxWidth: '1100px' }}>
        <div className="terminal-header">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
          <span className="terminal-title">NO_ZERO_DAYS_ROADMAP.EXE</span>
        </div>

        <div className="dashboard-body">
          <div className="logo-section" style={{ marginBottom: '20px' }}>
            <h1 className="title-glow" style={{ fontSize: '2rem' }}>AUDIT ROADMAP COMMAND CENTER</h1>
            <p className="subtitle" style={{ fontSize: '0.9rem' }}>Navigate and master each payroll accounting phase</p>
          </div>

          <div className="student-info-bar" style={{ padding: '10px 20px', marginBottom: '20px' }}>
            <div className="info-item">
              <span>STUDENT:</span> <strong>{student.fullName}</strong>
            </div>
            <div className="info-item">
              <span>SECTION:</span> <strong>{student.section}</strong>
            </div>
            <div className="info-item">
              <span>ID:</span> <strong>{student.studentNumber}</strong>
            </div>
            <button className="logout-btn" onClick={handleLogout}>[ LOGOUT ]</button>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-container" style={{ marginBottom: '25px', background: 'rgba(30, 41, 59, 0.4)', padding: '15px 20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', letterSpacing: '1px' }}>
              <span style={{ color: '#60a5fa' }}>OVERALL AUDITING ROADMAP COMPLETION:</span>
              <strong style={{ color: '#10b981' }}>{completionPercent}% COMPLETE ({completedCount} / 7 PHASES)</strong>
            </div>
            <div style={{ width: '100%', height: '12px', background: '#0b1120', borderRadius: '6px', overflow: 'hidden', border: '1px solid #334155' }}>
              <div style={{ width: `${completionPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', transition: 'width 0.5s ease-in-out' }}></div>
            </div>
          </div>

          {loadingProgress ? (
            <div style={{ textAlign: 'center', color: '#60a5fa', padding: '40px', fontFamily: 'monospace' }}>
              🚀 LOADING SIMULATOR ROADMAP FROM LEDGER DATABASE...
            </div>
          ) : (
            <div className="dashboard-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ display: 'grid', gap: '20px' }}>
              {activeRoadmap.map((p) => {
                const originalProgress = rawRoadmap.find(r => r.phaseId === p.phaseId);
                const isCompleted = originalProgress && originalProgress.status === 'COMPLETED';
                
                let cardClass = "module-card";
                if (isCompleted) {
                  cardClass += " completed";
                } else {
                  cardClass += " active"; // All other phases are active and fully available!
                }

                return (
                  <div 
                    key={p.phaseId} 
                    className={cardClass}
                    onClick={() => handleCardClick(p)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px dashed #334155', paddingBottom: '8px' }}>
                        <span style={{ color: isCompleted ? '#10b981' : '#fbbf24', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {isCompleted ? '✓ COMPLETED' : '▶ AVAILABLE'}
                        </span>
                        <span style={{ color: isCompleted ? '#10b981' : '#fbbf24', fontWeight: 'bold' }}>
                          {(p.completionPercentage !== undefined ? p.completionPercentage : (isCompleted ? 100 : 0))}%
                        </span>
                      </div>
                      <h3 className="card-title" style={{ fontSize: '1.05rem', color: '#fff', border: 'none', padding: 0, margin: '5px 0' }}>
                        {p.title}
                      </h3>
                      <p className="module-desc" style={{ fontSize: '0.8rem', minHeight: '60px', margin: '8px 0 12px 0' }}>
                        {p.description}
                      </p>
                    </div>

                    <div className="module-footer" style={{ marginTop: 'auto' }}>
                      {isCompleted ? (
                        <button 
                          className="enter-btn" 
                          style={{ width: '100%', backgroundColor: '#10b981', color: '#000' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPhase(p.phaseId);
                          }}
                        >
                          RE-AUDIT [✓]
                        </button>
                      ) : (
                        <button 
                          className="enter-btn animate-pulse" 
                          style={{ width: '100%', backgroundColor: '#fbbf24', color: '#000' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPhase(p.phaseId);
                          }}
                        >
                          START AUDIT &gt;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dashboard-footer">
          <span>Simulation command line registry active // CIT-U Payroll Lab</span>
        </div>
      </div>

      {/* Audit Report Card Modal */}
      {selectedPhaseSummary && (
        <div className="popup-overlay" style={{ zIndex: 9999 }}>
          <div className="popup-card" style={{ borderTop: '4px solid #10b981', padding: '20px', maxWidth: '450px', width: '90%' }}>
            <button className="close-btn" onClick={() => setSelectedPhaseSummary(null)}>X</button>
            <div className="popup-header" style={{ marginBottom: '15px', borderBottom: '1px dashed #334155', paddingBottom: '10px' }}>
              <h4 style={{ color: '#10b981', margin: 0, fontSize: '1.2rem' }}>🏆 PHASE AUDIT REPORT CARD</h4>
              <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>{selectedPhaseSummary.title}</p>
            </div>
            
            <div className="data-box authentic-data" style={{ padding: '15px', marginBottom: '15px', background: '#0b1120', border: '1px solid #1e293b', borderRadius: '6px' }}>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#60a5fa' }}>Audited Phase:</span> <strong>Phase {selectedPhaseSummary.phaseId}</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#60a5fa' }}>Status:</span> <strong style={{ color: '#10b981' }}>COMPLETED ✓</strong>
              </div>
              <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#60a5fa' }}>Best Audit Score:</span> <strong className="highlight-green" style={{ fontSize: '1.3rem', color: '#10b981' }}>{selectedPhaseSummary.bestScore}%</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '15px', fontStyle: 'italic', borderTop: '1px dashed #1e293b', paddingTop: '10px', margin: '15px 0 0 0' }}>
                * Audit score is calculated dynamically based on calculation attempt efficiency. Practice leads to zero errors!
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="escalate-btn" 
                onClick={() => setSelectedPhaseSummary(null)} 
                style={{ flex: 1, margin: 0, padding: '12px', background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', borderRadius: '4px', fontFamily: 'monospace' }}
              >
                [ ROADMAP ]
              </button>
              <button 
                className="run-btn" 
                onClick={() => {
                  onSelectPhase(selectedPhaseSummary.phaseId);
                  setSelectedPhaseSummary(null);
                }} 
                style={{ flex: 1, margin: 0, padding: '12px', backgroundColor: '#10b981', border: 'none', color: '#000', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}
              >
                RE-ENTER AUDIT &gt;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
