import React from 'react';
import lobbyImage from './assets/phase1-lobby.png'; 
import securityImage from './assets/phase2-biometrics.png'; 
import overtimeImage from './assets/phase3-overtime.png';
import breakroomImage from './assets/phase4-breakroom.png';
import './Room.css'; 

export default function Phase1Room({ setActivePopup, activePhaseIndex = 1 }) {
  
  if (activePhaseIndex === 4) {
    return (
      <div className="room-container">
        <img src={breakroomImage} alt="Employee Notice Board & Breakroom" className="background-image" />

        {/* Phase 4 hotspots */}
        <button 
          className="hotspot corkboard-hotspot" 
          title="📌 Corkboard Memos" 
          onClick={() => setActivePopup('MEMOS')}
          style={{
            position: 'absolute',
            top: '15%',
            left: '12%',
            width: '24%',
            height: '32%',
            cursor: 'pointer',
          }}
        ></button>
        <button 
          className="hotspot timesheet-hotspot" 
          title="📟 Timesheet Terminal" 
          onClick={() => setActivePopup('TIMESHEET_TERMINAL')}
          style={{
            position: 'absolute',
            top: '40%',
            left: '52%',
            width: '16%',
            height: '24%',
            cursor: 'pointer',
          }}
        ></button>
        <button 
          className="hotspot poster-hotspot" 
          title="📋 DOLE Holiday Poster" 
          onClick={() => setActivePopup('DOLE_HOLIDAY')}
          style={{
            position: 'absolute',
            top: '15%',
            left: '70%',
            width: '18%',
            height: '32%',
            cursor: 'pointer',
          }}
        ></button>
        <button 
          className="hotspot door-hotspot" 
          title="🚪 Breakroom Exit Door" 
          onClick={() => setActivePopup('DOOR')}
          style={{
            position: 'absolute',
            top: '10%',
            left: '38%',
            width: '12%',
            height: '35%',
            cursor: 'pointer',
          }}
        ></button>
        <button 
          className="hotspot handbook-hotspot" 
          title="📘 Company Payroll Manual" 
          onClick={() => setActivePopup('HANDBOOK')}
          style={{
            position: 'absolute',
            top: '55%',
            left: '3%',
            width: '9%',
            height: '10%',
            cursor: 'pointer',
          }}
        ></button>
      </div>
    );
  }

  if (activePhaseIndex === 3) {
    return (
      <div className="room-container">
        <img src={overtimeImage} alt="Supervisor Office & Assembly Line" className="background-image" />

        {/* Phase 3 hotspots */}
        <button 
          className="hotspot timecard-hotspot" 
          title="Production Time Card" 
          onClick={() => setActivePopup('TIMECARD')}
          style={{
            position: 'absolute',
            top: '55%',
            left: '20%',
            width: '18%',
            height: '18%',
            cursor: 'pointer',
          }}
        ></button>
        <button 
          className="hotspot poster-hotspot" 
          title="DOLE Overtime Poster" 
          onClick={() => setActivePopup('DOLE_OVERTIME')}
          style={{
            position: 'absolute',
            top: '12%',
            left: '72%',
            width: '15%',
            height: '30%',
            cursor: 'pointer',
          }}
        ></button>
        <button 
          className="hotspot handbook-hotspot" 
          title="Company Payroll Manual" 
          onClick={() => setActivePopup('HANDBOOK')}
          style={{
            position: 'absolute',
            top: '52%',
            left: '5%',
            width: '9%',
            height: '10%',
            cursor: 'pointer',
          }}
        ></button>
        <button 
          className="hotspot door-hotspot" 
          title="Supervisor Exit Door" 
          onClick={() => setActivePopup('DOOR')}
          style={{
            position: 'absolute',
            top: '10%',
            left: '44%',
            width: '12%',
            height: '35%',
            cursor: 'pointer',
          }}
        ></button>
      </div>
    );
  }

  if (activePhaseIndex === 2) {
    return (
      <div className="room-container">
        <img src={securityImage} alt="Security Control Point" className="background-image" />

        {/* Phase 2 hotspots */}
        <button className="hotspot biometrics-hotspot" title="Biometrics Swipe Logs" onClick={() => setActivePopup('BIOMETRICS')}></button>
        <button className="hotspot poster-hotspot" title="DOLE Compliance Poster" onClick={() => setActivePopup('DOLE_POSTER')}></button>
        <button className="hotspot handbook-hotspot" title="Company Payroll Manual" onClick={() => setActivePopup('HANDBOOK')}></button>
        <button className="hotspot door-hotspot" title="Exit Doorway Gate" onClick={() => setActivePopup('DOOR')}></button>
      </div>
    );
  }

  // Fallback / Phase 1
  return (
    <div className="room-container">
      <img src={lobbyImage} alt="Morning Lobby" className="background-image" />

      {/* The 5 Invisible Hotspots trigger Popups! */}
      <button className="hotspot desk-hotspot" title="HR Employee Contract" onClick={() => setActivePopup('HR_DESK')}></button>
      <button className="hotspot calendar-hotspot" title="Attendance June Calendar" onClick={() => setActivePopup('WALL_CALENDAR')}></button>
      <button className="hotspot whiteboard-hotspot" title="Gross Pay Equations" onClick={() => setActivePopup('WHITEBOARD')}></button>
      <button className="hotspot handbook-hotspot" title="Company Payroll Manual" onClick={() => setActivePopup('HANDBOOK')}></button>
      <button className="hotspot door-hotspot" title="Exit Doorway Gate" onClick={() => setActivePopup('DOOR')}></button>
    </div>
  );
}