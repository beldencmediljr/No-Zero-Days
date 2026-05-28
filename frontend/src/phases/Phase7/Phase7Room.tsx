import React from 'react';
import boardroomImage from '../../assets/phase7-boardroom.png';
import '../../components/Shared/room-base.css';
import '../../components/Shared/Room.css';
import './Phase7.css';

interface Phase7RoomProps {
  setActivePopup: (popupName: string | null) => void;
}

/**
 * TSX Component managing hotspots for Phase 7 (Executive Boardroom).
 */
export default function Phase7Room({ setActivePopup }: Phase7RoomProps) {
  return (
    <div className="room-container boardroom-floor phase7-room" style={{ position: 'relative' }}>
      <img 
        src={boardroomImage} 
        alt="Executive Boardroom" 
        className="background-image pixelated"
        style={{ imageRendering: 'pixelated', width: '100%' }}
      />
      {/* Hotspot 1: Executive Audit Folder */}
      <button 
        className="hotspot folder-hotspot" 
        title="📁 Executive Audit Folder" 
        onClick={() => setActivePopup('AUDIT_FOLDER')}
      />

      {/* Hotspot 2: Executive Exit Door */}
      <button 
        className="hotspot door-hotspot" 
        title="🚪 Boardroom Exit Door" 
        onClick={() => setActivePopup('DOOR')}
      />
    </div>
  );
}
