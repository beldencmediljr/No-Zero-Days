import React from 'react';
import overtimeImage from '../../assets/phase3-overtime.png';
import '../../components/Shared/room-base.css';
import '../../components/Shared/Room.css';
import './Phase3.css';

interface Phase3RoomProps {
  setActivePopup: (popupName: string | null) => void;
}

/**
 * TSX Component managing hotspots for Phase 3 (Overtime Pay).
 */
export default function Phase3Room({ setActivePopup }: Phase3RoomProps) {
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
          top: '11%',
          left: '0%',
          width: '8.5%',
          height: '12%',
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
          left: '35%',
          width: '14%',
          height: '15%',
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
          top: '60%',
          left: '25%',
          width: '7.5%',
          height: '7.5%',
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
          top: '14%',
          left: '50%',
          width: '15%',
          height: '26%',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          border: '1px dashed rgba(239, 68, 68, 0.4)'
        }}
      />
    </div>
  );
}
