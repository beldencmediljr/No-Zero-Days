import React from 'react';
import pclabImage from '../../assets/phase5-6-pclab.png';
import '../../components/Shared/room-base.css';
import '../../components/Shared/Room.css';
import './Phase6.css';

interface Phase6RoomProps {
  setActivePopup: (popupName: string | null) => void;
}

/**
 * TSX Component managing hotspots for Phase 6 (PhilHealth Deductions).
 */
export default function Phase6Room({ setActivePopup }: Phase6RoomProps) {
  return (
    <div className="room-container pclab-floor phase6-room" style={{ position: 'relative' }}>
      <img 
        src={pclabImage} 
        alt="PC Lab / Bureaucracy Department" 
        className="background-image pixelated"
        style={{ imageRendering: 'pixelated', width: '100%' }}
      />
      {/* Hotspot 1: Notice Board Corkboard Memos */}
      <button 
        className="hotspot corkboard-hotspot" 
        title="📌 PhilHealth Premium Table" 
        onClick={() => setActivePopup('PHILHEALTH_TABLE')}
      />

      {/* Hotspot 2: PC Monitor (Loan Statement / HR Database) */}
      <button 
        className="hotspot monitor-hotspot" 
        title="🖥️ HR Salary Database" 
        onClick={() => setActivePopup('SALARY_DATABASE')}
      />

      {/* Hotspot 3: Exit Door */}
      <button 
        className="hotspot door-hotspot" 
        title="🚪 PC Lab Exit Door" 
        onClick={() => setActivePopup('DOOR')}
      />

      {/* Hotspot 4: Company Payroll Manual */}
      <button 
        className="hotspot handbook-hotspot" 
        title="📘 Company Payroll Manual" 
        onClick={() => setActivePopup('HANDBOOK')}
      />
    </div>
  );
}
