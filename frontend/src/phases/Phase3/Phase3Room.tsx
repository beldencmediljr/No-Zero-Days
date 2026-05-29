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
    <div className="room-container factory-floor phase3-room" style={{ position: 'relative' }}>
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
      />

      {/* Hotspot 2: DOLE Overtime Policy Poster */}
      <button
        className="hotspot poster-hotspot"
        title="📋 DOLE Overtime Poster"
        onClick={() => setActivePopup('DOLE_OVERTIME')}
      />

      {/* Hotspot 3: Company Payroll Policy Manual */}
      <button
        className="hotspot handbook-hotspot"
        title="📘 Company Payroll Manual"
        onClick={() => setActivePopup('HANDBOOK')}
      />

      {/* Hotspot 4: Supervisor Exit Door */}
      <button
        className="hotspot door-hotspot"
        title="🚪 Supervisor Exit Door"
        onClick={() => setActivePopup('DOOR')}
      />

      {/* Hotspot 5: HR Clipboard / Employee Contract */}
      <button
        className="hotspot clipboard-hotspot"
        title="📁 Employee Contract Profile"
        onClick={() => setActivePopup('P3_CONTRACT')}
      />
    </div>
  );
}
