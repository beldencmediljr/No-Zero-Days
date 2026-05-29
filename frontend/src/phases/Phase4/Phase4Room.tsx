import React from 'react';
import breakroomImage from '../../assets/phase4-breakroom.png';
import '../../components/Shared/room-base.css';
import '../../components/Shared/Room.css';
import './Phase4.css';

interface Phase4RoomProps {
  setActivePopup: (popupName: string | null) => void;
}

/**
 * TSX Component managing hotspots for Phase 4 (Regular Holiday Pay).
 */
export default function Phase4Room({ setActivePopup }: Phase4RoomProps) {
  return (
    <div className="room-container factory-floor phase4-room" style={{ position: 'relative' }}>
      <img 
        src={breakroomImage} 
        alt="Employee Notice Board & Breakroom" 
        className="background-image pixelated"
        style={{ imageRendering: 'pixelated', width: '100%' }}
      />

      {/* --- Phase 4: Breakroom & Notice Board Hotspots --- */}
      
      {/* Hotspot 1: Notice Board Corkboard Memos */}
      <button 
        className="hotspot corkboard-hotspot" 
        title="📌 Corkboard Memos" 
        onClick={() => setActivePopup('MEMOS')}
      />

      {/* Hotspot 2: Timesheet Terminal */}
      <button 
        className="hotspot timesheet-hotspot" 
        title="📟 Timesheet Terminal" 
        onClick={() => setActivePopup('TIMESHEET_TERMINAL')}
      />

      {/* Hotspot 3: DOLE Holiday Policy Poster */}
      <button 
        className="hotspot poster-hotspot" 
        title="📋 DOLE Holiday Poster" 
        onClick={() => setActivePopup('DOLE_HOLIDAY')}
      />

      {/* Hotspot 4: Breakroom Exit Door */}
      <button 
        className="hotspot door-hotspot" 
        title="🚪 Breakroom Exit Door" 
        onClick={() => setActivePopup('DOOR')}
      />

      {/* Hotspot 5: Company Payroll Policy Manual */}
      <button 
        className="hotspot handbook-hotspot" 
        title="📘 Company Payroll Manual" 
        onClick={() => setActivePopup('HANDBOOK')}
      />

      {/* Hotspot 6: HR Filing Cabinet / Employee Contract */}
      <button 
        className="hotspot cabinet-hotspot" 
        title="📁 Employee Contract Profile" 
        onClick={() => setActivePopup('P4_CONTRACT')}
      />
    </div>
  );
}
