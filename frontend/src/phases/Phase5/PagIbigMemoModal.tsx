import React from 'react';
import '../../components/Shared/Popups.css';

interface PagIbigMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * HDMF Pag-IBIG Circular Modal displaying standard capped rates.
 */
export default function PagIbigMemoModal({ isOpen, onClose }: PagIbigMemoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>X</button>
        <div className="popup-content">
          <div className="popup-header">
            <h4>📋 HDMF Pag-IBIG Circular</h4>
            <p>Home Development Mutual Fund // Statutory Standards</p>
          </div>

          <div className="data-box authentic-data" style={{ padding: '15px', lineHeight: '1.6' }}>
            <p><strong>1. MANDATORY CONTRIBUTIONS:</strong></p>
            <p>For all covered employees, the monthly Pag-IBIG contribution is computed based on the basic monthly salary. Under the updated statutory schedule:</p>

            <div className="formula-box" style={{ margin: '12px 0', padding: '10px', background: '#0b1120', border: '1px solid #1e293b', textAlign: 'center', color: '#fbbf24', fontWeight: 'bold' }}>
              Pag-Ibig Contribution Cap = ₱200.00
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '8px' }}>
              * For basic monthly salaries of ₱10,000 and above, the maximum employee deduction is capped strictly at ₱200.00.
            </p>
          </div>

          {/* Red Herring Decoy */}
          <div className="data-box herring-data" style={{ padding: '15px', marginTop: '15px', border: '1px solid #ef4444', borderRadius: '6px' }}>
            <span className="warning-label" style={{ color: '#f87171', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>⚠️ RED HERRING AUDIT NOISE (DO NOT EXTRACT)</span>
            <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Pag-Ibig Employer (ER) Share:</span> <strong>₱200.00</strong>
            </div>
            <p className="herring-note" style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px', fontStyle: 'italic' }}>
              ⭐ Note: Your employer matches this amount exactly, contributing another ₱200 for a total monthly savings of ₱400.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
