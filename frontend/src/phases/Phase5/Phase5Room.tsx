import React from 'react';
import pclabImage from '../../assets/phase5-6-pclab.png';
import '../../components/Shared/room-base.css';
import '../../components/Shared/Room.css';
import './Phase5.css';

interface Phase5RoomProps {
  setActivePopup: (popupName: string | null) => void;
}

/**
 * TSX Component managing hotspots for Phase 5 (SSS Deductions).
 */
export default function Phase5Room({ setActivePopup }: Phase5RoomProps) {
  return (
    <div className="room-container pclab-floor phase5-room" style={{ position: 'relative' }}>
      <img 
        src={pclabImage} 
        alt="PC Lab / Bureaucracy Department" 
        className="background-image pixelated"
        style={{ imageRendering: 'pixelated', width: '100%' }}
      />
      {/* Hotspot 1: Notice Board Corkboard Memos */}
      <button 
        className="hotspot corkboard-hotspot" 
        title="📌 SSS Contribution Table" 
        onClick={() => setActivePopup('SSS_TABLE')}
      />

      {/* Hotspot 2: PC Monitor (Loan Statement / HR Database) */}
      <button 
        className="hotspot monitor-hotspot" 
        title="🖥️ Employee Loan Statement" 
        onClick={() => setActivePopup('LOAN_STATEMENT')}
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
