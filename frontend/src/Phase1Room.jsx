import React from 'react';
import lobbyImage from './assets/phase1-lobby.png'; 
import './Room.css'; 

export default function Phase1Room({ setActivePopup }) {
  
  return (
    <div className="room-container">
      <img src={lobbyImage} alt="Morning Lobby" className="background-image" />

      {/* The 4 Invisible Hotspots now trigger Popups! */}
      <button className="hotspot desk-hotspot" onClick={() => setActivePopup('HR_DESK')}></button>
      <button className="hotspot calendar-hotspot" onClick={() => setActivePopup('WALL_CALENDAR')}></button>
      <button className="hotspot whiteboard-hotspot" onClick={() => setActivePopup('WHITEBOARD')}></button>
      <button className="hotspot door-hotspot" onClick={() => setActivePopup('DOOR')}></button>
    </div>
  );
}