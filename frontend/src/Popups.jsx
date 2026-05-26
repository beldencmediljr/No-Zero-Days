import React from 'react';
import './Popups.css'; 

export default function Popups({ activeHotspot, onClose }) {
  if (!activeHotspot) return null;

  const renderContent = () => {
    switch (activeHotspot) {
      case 'HR_DESK':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📁 Employee Profile & Contract</h4>
              <p>Classified HR Document // Form 109-A</p>
            </div>
            
            <div className="data-box authentic-data">
              <div className="data-row"><span>Employee Name:</span> <strong>Juan Dela Cruz</strong></div>
              <div className="data-row"><span>Position Grade:</span> <strong>ABM Core Level 12</strong></div>
              <div className="data-row"><span>Contract Daily Rate:</span> <strong className="highlight-green">₱800.00 / Day</strong></div>
            </div>

            {/* Red Herring Rule */}
            <div className="data-box herring-data">
              <span className="warning-label">⚠️ RED HERRING AUDIT NOISE (DO NOT EXTRACT)</span>
              <div className="data-row"><span>Rice Subsidy:</span> <strong>₱1,200.00 / Month</strong></div>
              <div className="data-row"><span>Uniform Allowance:</span> <strong>₱1,500.00 / Semester</strong></div>
              <p className="herring-note">
                ⭐ Note: According to Philippine accounting frameworks, standard Gross Basic Pay strictly uses the basic Daily Rate. Filter out these allowance distractions!
              </p>
            </div>
          </div>
        );

      case 'WALL_CALENDAR':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📅 Official Wall Calendar - June 2026</h4>
              <p>Total verified present shifts: <strong className="highlight-green">14 Days</strong></p>
            </div>
            
            {/* The Visual Calendar Grid */}
            <div className="calendar-ui-box">
              <div className="cal-header-row">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span className="weekend-text">S</span><span className="weekend-text">S</span>
              </div>
              <div className="cal-grid">
                {/* Week 1 */}
                <div className="cal-cell empty">1</div><div className="cal-cell empty">2</div><div className="cal-cell empty">3</div>
                <div className="cal-cell empty">4</div><div className="cal-cell empty">5</div><div className="cal-cell empty">6</div><div className="cal-cell empty">7</div>
                
                {/* Week 2 */}
                <div className="cal-cell present">8<span className="p-mark">P</span></div>
                <div className="cal-cell present">9<span className="p-mark">P</span></div>
                <div className="cal-cell present">10<span className="p-mark">P</span></div>
                <div className="cal-cell present">11<span className="p-mark">P</span></div>
                <div className="cal-cell present holiday">12<span className="p-mark">P★</span></div>
                <div className="cal-cell empty">13</div><div className="cal-cell empty">14</div>
                
                {/* Week 3 */}
                <div className="cal-cell present">15<span className="p-mark">P</span></div>
                <div className="cal-cell absent">16<span className="a-mark">A</span></div>
                <div className="cal-cell present">17<span className="p-mark">P</span></div>
                <div className="cal-cell present">18<span className="p-mark">P</span></div>
                <div className="cal-cell present">19<span className="p-mark">P</span></div>
                <div className="cal-cell empty">20</div><div className="cal-cell empty">21</div>

                {/* Week 4 */}
                <div className="cal-cell present">22<span className="p-mark">P</span></div>
                <div className="cal-cell present">23<span className="p-mark">P</span></div>
                <div className="cal-cell present">24<span className="p-mark">P</span></div>
                <div className="cal-cell present">25<span className="p-mark">P</span></div>
                <div className="cal-cell present">26<span className="p-mark">P</span></div>
                <div className="cal-cell empty">27</div><div className="cal-cell empty">28</div>
              </div>
            </div>
          </div>
        );

      case 'WHITEBOARD':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4>📝 LOBBY ACADEMIC WHITEBOARD</h4>
            </div>
            <div className="whiteboard-box">
              <h5 className="math-rule">▼ GROSS EARNINGS BASIC LAW:</h5>
              <div className="formula-box">Gross Pay = Daily Rate × Days Present</div>
            </div>
          </div>
        );

      case 'DOOR':
        return (
          <div className="popup-content">
            <div className="popup-header">
              <h4 className="text-red">🚨 ACCESS DENIED</h4>
            </div>
            <div className="data-box herring-data text-center">
              <p>Complete the Mission Log calculations on the right side of your screen to unlock this door!</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <button className="close-btn" onClick={onClose}>X</button>
        {renderContent()}
        <div className="popup-footer">
          <button className="confirm-btn" onClick={onClose}>CONFIRM & CLOSE</button>
        </div>
      </div>
    </div>
  );
}