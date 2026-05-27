import React, { useState } from 'react';
import Phase1Room from './Phase1Room';
import Popups from './Popups'; 
import Login from './Login';
import Dashboard from './Dashboard';
import './App.css'; 

function App() {
  // --- 1. NAVIGATION STATE ---
  // Controls which screen the user is currently seeing
  const [currentView, setCurrentView] = useState('LOGIN'); 

  // --- 2. PHASE 1 MISSION STATE ---
  const [activePopup, setActivePopup] = useState(null);
  const [extractedA, setExtractedA] = useState('');
  const [extractedB, setExtractedB] = useState('');
  const [step1Status, setStep1Status] = useState('ACTIVE'); 
  const [feedback, setFeedback] = useState('');

  // --- 3. BACKEND FETCH LOGIC ---
  const handleExtraction = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/phase1/validate-extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyRate: parseFloat(extractedA),
          daysPresent: parseInt(extractedB)
        })
      });

      const data = await response.json();

      if (data.success) {
        setStep1Status('SUCCESS');
        setFeedback(data.message);
      } else {
        setStep1Status('ERROR');
        setFeedback(data.message);
        if (data.redHerring) setExtractedA(''); 
      }
    } catch (error) {
      console.error("Database connection failed:", error);
      setFeedback("System Error: Cannot connect to the server.");
    }
  };

  // --- 4. CONDITIONAL RENDERING (ROUTING) ---

  // Show Login Screen
  if (currentView === 'LOGIN') {
    return <Login onLoginSuccess={() => setCurrentView('DASHBOARD')} />;
  }

  // Show Dashboard Screen
  if (currentView === 'DASHBOARD') {
    return <Dashboard onSelectPhase={(phaseId) => {
      if (phaseId === 1) setCurrentView('PHASE1');
    }} />;
  }

  // Show Phase 1 Environment
  return (
    <div className="app-background">
      <div className="app-container">
        
        {/* LEFT PANEL: The Room */}
        <div className="left-panel">
          <div className="panel-header">
            <h2 className="room-title">ROOM 1: THE CORE FOUNDATION LOBBY</h2>
            <p className="room-subtitle">Basic Math, Gross Pay Calculations, and Tardiness Deductions</p>
          </div>
          
          <div className="room-content">
            <Phase1Room setActivePopup={setActivePopup} />
          </div>

          <div className="panel-footer">
            <span className="intel-icon">💬</span> Click objects in the room to analyze documents.
          </div>
        </div>

        {/* RIGHT PANEL: The Mission Log */}
        <div className="right-panel">
          <div className="mission-header">
            <h3>⚡ MISSION OBJECTIVE LOG</h3>
            <span className="timer">⌛ 03:10</span>
          </div>

          <div className="tracker-steps">
            
            {/* STEP 1: EXTRACT */}
            <div className={`step-card ${step1Status === 'ACTIVE' ? 'active-step' : ''} ${step1Status === 'SUCCESS' ? 'success-step' : ''} ${step1Status === 'ERROR' ? 'error-step' : ''}`}>
              <div className="step-title">
                <h4>① STEP 1: EXTRACT VARIABLES</h4>
                <span className="badge">{step1Status}</span>
              </div>
              
              <div className="inputs-container">
                <label>VARIABLE COMPONENT A (Daily Rate)</label>
                <input 
                  type="number" 
                  placeholder="Enter Amount" 
                  className="tech-input"
                  value={extractedA}
                  onChange={(e) => setExtractedA(e.target.value)}
                  disabled={step1Status === 'SUCCESS'}
                />
                
                <label>VARIABLE COMPONENT B (Days Present)</label>
                <input 
                  type="number" 
                  placeholder="Enter Days" 
                  className="tech-input"
                  value={extractedB}
                  onChange={(e) => setExtractedB(e.target.value)}
                  disabled={step1Status === 'SUCCESS'}
                />
                
                {step1Status !== 'SUCCESS' && (
                  <button className="run-btn" onClick={handleExtraction}>
                    RUN EXTRACTION UNIT {'>'}
                  </button>
                )}

                {/* Display Backend Feedback */}
                {feedback && (
                  <div className={`feedback-msg ${step1Status === 'SUCCESS' ? 'text-green' : 'text-red'}`} style={{marginTop: '10px', fontSize: '0.9rem'}}>
                    {feedback}
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2 & 3 */}
            <div className={`step-card ${step1Status === 'SUCCESS' ? 'active-step' : 'locked-step'}`}>② STEP 2: IDENTIFY CORE RULE</div>
            <div className="step-card locked-step">③ STEP 3: EXECUTE ARITHMETIC</div>
          </div>
          
          <button className="escalate-btn" onClick={() => setCurrentView('DASHBOARD')}>
            [ RETURN TO DASHBOARD ]
          </button>
        </div>

      </div>

      {/* Renders the floating popups on top of everything */}
      <Popups activeHotspot={activePopup} onClose={() => setActivePopup(null)} />
    </div>
  );
}

export default App;