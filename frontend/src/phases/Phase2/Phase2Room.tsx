import React from 'react';
import factoryImage from '../../assets/phase2-biometrics.png';
import '../../components/Shared/room-base.css';
import '../../components/Shared/Room.css';
import './Phase2.css';

interface Phase2RoomProps {
  setActivePopup: (popupName: string | null) => void;
}

/**
 * TSX Component managing hotspots for Phase 2 (Biometrics).
 */
export default function Phase2Room({ setActivePopup }: Phase2RoomProps) {
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
      />

      {/* Hotspot 2: DOLE Attendance Policy Poster */}
      <button 
        className="hotspot poster-hotspot" 
        title="📋 DOLE Compliance Poster" 
        onClick={() => setActivePopup('DOLE_POSTER')}
      />

      {/* Hotspot 3: Company Payroll Policy Manual */}
      <button 
        className="hotspot handbook-hotspot" 
        title="📘 Company Payroll Manual" 
        onClick={() => setActivePopup('HANDBOOK')}
      />

      {/* Hotspot 4: Security Exit Door */}
      <button 
        className="hotspot phase2-door-hotspot" 
        title="🚪 Security Exit Gate" 
        onClick={() => setActivePopup('DOOR')}
      />
    </div>
  );
}
