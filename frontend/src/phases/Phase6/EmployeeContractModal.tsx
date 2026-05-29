import React from 'react';
import '../../components/Shared/Popups.css';

interface EmployeeContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: any;
}

/**
 * Retro-styled modal for Phase 6 Employee Contract Profile (PhilHealth).
 */
export default function EmployeeContractModal({ isOpen, onClose, scenario }: EmployeeContractModalProps) {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>X</button>
        <div className="popup-content">
          <div className="popup-header">
            <h4>📁 Employee Profile & Contract (PhilHealth Audit)</h4>
            <p>Classified HR Document // Form 109-F</p>
          </div>

          <div className="data-box authentic-data" style={{ padding: '15px', lineHeight: '1.5' }}>
            <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Employee Name:</span> <strong>{scenario.employeeName || 'Maria Clara'}</strong>
            </div>
            <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Monthly Basic Salary:</span> <strong className="highlight-green">₱{(scenario.basicSalary ?? 28000.00).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
          </div>

          {/* Red Herring */}
          <div className="data-box herring-data" style={{ padding: '15px', marginTop: '15px', border: '1px solid #ef4444', borderRadius: '6px' }}>
            <span className="warning-label" style={{ color: '#f87171', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>⚠️ RED HERRING AUDIT NOISE (DO NOT EXTRACT)</span>
            <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Monthly De Minimis Rice Subsidy:</span> <strong>₱2,000.00</strong>
            </div>
            <p className="herring-note" style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px', fontStyle: 'italic' }}>
              ⭐ Note: PhilHealth premiums are strictly computed against the Monthly Basic Salary, excluding non-taxable allowances such as the De Minimis Rice Subsidy. Filter this out!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
