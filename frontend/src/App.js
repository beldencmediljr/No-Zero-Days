import React, { useState } from 'react';
import Phase1Room from './Phase1Room';
import Popups from './Popups'; 
import './App.css'; 

function App() {
  const [activePopup, setActivePopup] = useState(null);
  
  // State for the Mission Log inputs
  const [extractedA, setExtractedA] = useState('');
  const [extractedB, setExtractedB] = useState('');

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

        {/* RIGHT PANEL: The Restored Mission Log! */}
        <div className="right-panel">
          <div className="mission-header">
            <h3>⚡ MISSION OBJECTIVE LOG</h3>
            <span className="timer">⌛ 03:10</span>
          </div>

          <div className="tracker-steps">
            {/* STEP 1: EXTRACT */}
            <div className="step-card active-step">
              <div className="step-title">
                <h4>① STEP 1: EXTRACT VARIABLES</h4>
                <span className="badge">ACTIVE</span>
              </div>
              <div className="inputs-container">
                <label>VARIABLE COMPONENT A</label>
                <input 
                  type="number" 
                  placeholder="Enter Daily Rate" 
                  className="tech-input"
                  value={extractedA}
                  onChange={(e) => setExtractedA(e.target.value)}
                />
                
                <label>VARIABLE COMPONENT B</label>
                <input 
                  type="number" 
                  placeholder="Enter Days Present" 
                  className="tech-input"
                  value={extractedB}
                  onChange={(e) => setExtractedB(e.target.value)}
                />
                
                <button className="run-btn" onClick={() => alert('Extraction complete! Proceeding to Step 2...')}>
                  RUN EXTRACTION UNIT {'>'}
                </button>
              </div>
            </div>

            {/* STEP 2 & 3 */}
            <div className="step-card locked-step">② STEP 2: IDENTIFY CORE RULE</div>
            <div className="step-card locked-step">③ STEP 3: EXECUTE ARITHMETIC</div>
          </div>
          
          <button className="escalate-btn">⚠ ESCALATE TO MANAGER</button>
        </div>

      </div>

      <Popups activeHotspot={activePopup} onClose={() => setActivePopup(null)} />
    </div>
  );
}

export default App;