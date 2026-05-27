import React from 'react';
import lobbyImage from './assets/phase1-lobby.png';
import factoryImage from './assets/phase2-biometrics.png';
import overtimeImage from './assets/phase3-overtime.png';
import './Room.css';

interface OfficeRoomProps {
  activePhaseIndex: number;
  setActivePopup: (popupName: string | null) => void;
}

/**
 * TSX Component managing hotspots for the Morning Lobby (Phase 1),
 * Factory Floor / Biometrics (Phase 2), and Factory Floor / Overtime Premiums (Phase 3).
 */
export default function OfficeRoom({ activePhaseIndex, setActivePopup }: OfficeRoomProps) {

  if (activePhaseIndex === 3) {
    return (
      <div className="room-container factory-floor" style={{ position: 'relative' }}>
        <img 
          src={overtimeImage} 
          alt="Supervisor Office & Assembly Line" 
          className="background-image pixelated"
          style={{ imageRendering: 'pixelated', width: '100%' }}
        />

        {/* --- Phase 3: Factory Floor / Overtime Hotspots --- */}
        
        {/* Hotspot 1: Production Time Card (on Supervisor's Desk) */}
        <button 
          className="hotspot timecard-hotspot" 
          title="📁 Production Time Card" 
          onClick={() => setActivePopup('TIMECARD')}
          style={{
            position: 'absolute',
            top: '55%',
            left: '20%',
            width: '18%',
            height: '18%',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: '1px dashed rgba(96, 165, 250, 0.4)'
          }}
        />

        {/* Hotspot 2: DOLE Overtime Policy Poster */}
        <button 
          className="hotspot poster-hotspot" 
          title="📋 DOLE Overtime Poster" 
          onClick={() => setActivePopup('DOLE_OVERTIME')}
          style={{
            position: 'absolute',
            top: '12%',
            left: '72%',
            width: '15%',
            height: '30%',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: '1px dashed rgba(251, 191, 36, 0.4)'
          }}
        />

        {/* Hotspot 3: Company Payroll Policy Manual */}
        <button 
          className="hotspot handbook-hotspot" 
          title="📘 Company Payroll Manual" 
          onClick={() => setActivePopup('HANDBOOK')}
          style={{
            position: 'absolute',
            top: '52%',
            left: '5%',
            width: '9%',
            height: '10%',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: '1px dashed rgba(250, 204, 21, 0.4)'
          }}
        />

        {/* Hotspot 4: Supervisor Exit Door */}
        <button 
          className="hotspot door-hotspot" 
          title="🚪 Supervisor Exit Door" 
          onClick={() => setActivePopup('DOOR')}
          style={{
            position: 'absolute',
            top: '10%',
            left: '44%',
            width: '12%',
            height: '35%',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: '1px dashed rgba(239, 68, 68, 0.4)'
          }}
        />
      </div>
    );
  }
  
  if (activePhaseIndex === 2) {
    return (
      <div className="room-container factory-floor" style={{ position: 'relative' }}>
        <img 
          src={factoryImage} 
          alt="Factory Floor Biometrics Station" 
          className="background-image pixelated"
          style={{ imageRendering: 'pixelated', width: '100%' }}
        />

        {/* --- Phase 2: Factory Floor / Security Hotspots --- */}
        
        {/* Hotspot 1: Biometric Terminal */}
        <button 
          className="hotspot biometrics-hotspot" 
          title="📟 Biometric Terminal Logs" 
          onClick={() => setActivePopup('BIOMETRICS')}
          style={{
            position: 'absolute',
            top: '18%',
            left: '14%',
            width: '15%',
            height: '25%',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: '1px dashed rgba(96, 165, 250, 0.4)'
          }}
        />

        {/* Hotspot 2: DOLE Attendance Policy Poster */}
        <button 
          className="hotspot poster-hotspot" 
          title="📋 DOLE Compliance Poster" 
          onClick={() => setActivePopup('DOLE_POSTER')}
          style={{
            position: 'absolute',
            top: '15%',
            left: '70%',
            width: '16%',
            height: '28%',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: '1px dashed rgba(251, 191, 36, 0.4)'
          }}
        />

        {/* Hotspot 3: Company Payroll Policy Manual */}
        <button 
          className="hotspot handbook-hotspot" 
          title="📘 Company Payroll Manual" 
          onClick={() => setActivePopup('HANDBOOK')}
          style={{
            position: 'absolute',
            top: '52%',
            left: '31%',
            width: '9%',
            height: '10%',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: '1px dashed rgba(250, 204, 21, 0.4)'
          }}
        />

        {/* Hotspot 4: Security Exit Door */}
        <button 
          className="hotspot door-hotspot" 
          title="🚪 Security Exit Gate" 
          onClick={() => setActivePopup('DOOR')}
          style={{
            position: 'absolute',
            top: '10%',
            left: '43%',
            width: '12%',
            height: '22%',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            border: '1px dashed rgba(239, 68, 68, 0.4)'
          }}
        />
      </div>
    );
  }

  // Fallback: Phase 1 Lobby
  return (
    <div className="room-container lobby-floor" style={{ position: 'relative' }}>
      <img 
        src={lobbyImage} 
        alt="Core Lobby" 
        className="background-image pixelated"
        style={{ imageRendering: 'pixelated', width: '100%' }}
      />

      {/* --- Phase 1: Core Lobby Hotspots --- */}
      <button 
        className="hotspot desk-hotspot" 
        title="📁 HR Contract Desk" 
        onClick={() => setActivePopup('HR_DESK')}
      />
      <button 
        className="hotspot calendar-hotspot" 
        title="📅 Official Attendance Calendar" 
        onClick={() => setActivePopup('WALL_CALENDAR')}
      />
      <button 
        className="hotspot whiteboard-hotspot" 
        title="📝 Gross Pay Whiteboard" 
        onClick={() => setActivePopup('WHITEBOARD')}
      />
      <button 
        className="hotspot handbook-hotspot" 
        title="📘 Company Payroll Manual" 
        onClick={() => setActivePopup('HANDBOOK')}
      />
      <button 
        className="hotspot door-hotspot" 
        title="🚪 Room Exit Door" 
        onClick={() => setActivePopup('DOOR')}
      />
    </div>
  );
}
