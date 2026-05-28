import React from 'react';
import lobbyImage from '../../assets/phase1-lobby.png';
import '../../components/Shared/room-base.css';
import '../../components/Shared/Room.css';
import './Phase1.css';

interface Phase1RoomProps {
  setActivePopup: (popupName: string | null) => void;
}

/**
 * TSX Component managing hotspots for Phase 1 (Morning Lobby).
 */
export default function Phase1Room({ setActivePopup }: Phase1RoomProps) {
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
        className="hotspot door-hotspot" 
        title="🚪 Room Exit Door" 
        onClick={() => setActivePopup('DOOR')}
      />
    </div>
  );
}
