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
    <div className="room-container pclab-floor" style={{ position: 'relative' }}>
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
        style={{
          position: 'absolute',
          top: '15%',
          left: '12%',
          width: '24%',
          height: '32%',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          border: '1px dashed rgba(96, 165, 250, 0.4)'
        }}
      />

      {/* Hotspot 2: PC Monitor (Loan Statement / HR Database) */}
      <button 
        className="hotspot monitor-hotspot" 
        title="🖥️ HR Salary Database" 
        onClick={() => setActivePopup('SALARY_DATABASE')}
        style={{
          position: 'absolute',
          top: '40%',
          left: '52%',
          width: '16%',
          height: '24%',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          border: '1px dashed rgba(96, 165, 250, 0.4)'
        }}
      />

      {/* Hotspot 3: Exit Door */}
      <button 
        className="hotspot door-hotspot" 
        title="🚪 PC Lab Exit Door" 
        onClick={() => setActivePopup('DOOR')}
        style={{
          position: 'absolute',
          top: '10%',
          left: '38%',
          width: '12%',
          height: '35%',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          border: '1px dashed rgba(239, 68, 68, 0.4)'
        }}
      />

      {/* Hotspot 4: Company Payroll Manual */}
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
          backgroundColor: 'transparent',
          cursor: 'pointer',
          border: '1px dashed rgba(250, 204, 21, 0.4)'
        }}
      />
    </div>
  );
}
