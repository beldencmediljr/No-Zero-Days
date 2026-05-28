import React from 'react';
import boardroomImage from '../../assets/phase7-boardroom.png';
import '../../components/Shared/room-base.css';
import '../../components/Shared/Room.css';

interface Phase7RoomProps {
  setActivePopup: (popupName: string | null) => void;
}

/**
 * TSX Component managing hotspots for Phase 7 (Executive Boardroom).
 */
export default function Phase7Room({ setActivePopup }: Phase7RoomProps) {
  return (
    <div className="room-container boardroom-floor" style={{ position: 'relative' }}>
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
        style={{
          position: 'absolute',
          top: '50%',
          left: '40%',
          width: '20%',
          height: '20%',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          border: '1px dashed rgba(251, 191, 36, 0.6)'
        }}
      />

      {/* Hotspot 2: Executive Exit Door */}
      <button 
        className="hotspot door-hotspot" 
        title="🚪 Boardroom Exit Door" 
        onClick={() => setActivePopup('DOOR')}
        style={{
          position: 'absolute',
          top: '10%',
          left: '75%',
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
