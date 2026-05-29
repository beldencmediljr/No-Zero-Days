import React, { useState } from 'react';
import pclabImage from '../../assets/phase5-6-pclab.png';
import '../../components/Shared/room-base.css';
import '../../components/Shared/Room.css';
import './Phase6.css';
import EmployeeContractModal from './EmployeeContractModal';
import PagIbigMemoModal from '../Phase5/PagIbigMemoModal';

interface Phase6RoomProps {
  setActivePopup: (popupName: string | null) => void;
  scenario: any;
}

/**
 * TSX Component managing hotspots for Phase 6 (PhilHealth Deductions).
 */
export default function Phase6Room({ setActivePopup, scenario }: Phase6RoomProps) {
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isPagIbigOpen, setIsPagIbigOpen] = useState(false);

  return (
    <div className="room-container pclab-floor phase6-room" style={{ position: 'relative' }}>
      <img 
        src={pclabImage} 
        alt="PC Lab / Bureaucracy Department" 
        className="background-image pixelated"
        style={{ imageRendering: 'pixelated', width: '100%' }}
      />
      {/* Hotspot 1: Notice Board Corkboard Memos (PhilHealth) */}
      <button 
        className="hotspot corkboard-hotspot" 
        title="📌 PhilHealth Premium Table" 
        onClick={() => setActivePopup('PHILHEALTH_TABLE')}
      />

      {/* Hotspot 2: PC Monitor (HR Salary Database) */}
      <button 
        className="hotspot monitor-hotspot" 
        title="🖥️ HR Salary Database" 
        onClick={() => setActivePopup('SALARY_DATABASE')}
      />

      {/* Hotspot 3: Exit Door */}
      <button 
        className="hotspot door-hotspot" 
        title="🚪 PC Lab Exit Door" 
        onClick={() => setActivePopup('DOOR')}
      />

      {/* Hotspot 4: Company Payroll Manual */}
      <button 
        className="hotspot handbook-hotspot" 
        title="📘 Company Payroll Manual" 
        onClick={() => setActivePopup('HANDBOOK')}
      />

      {/* Hotspot 5: Employee Contract Folder */}
      <button 
        className="hotspot contract-hotspot" 
        title="📁 Employee Contract Profile" 
        onClick={() => setIsContractOpen(true)}
      />

      {/* Hotspot 6: SSS Premium Table */}
      <button 
        className="hotspot sss-hotspot" 
        title="📌 SSS Contribution Table" 
        onClick={() => setActivePopup('SSS_TABLE')}
      />

      {/* Hotspot 7: Personal Salary Loan Statement */}
      <button 
        className="hotspot loan-hotspot" 
        title="🖥️ Employee Loan Statement" 
        onClick={() => setActivePopup('LOAN_STATEMENT')}
      />

      {/* Hotspot 8: HDMF Pag-IBIG Memo Circular */}
      <button 
        className="hotspot pagibig-hotspot" 
        title="📋 HDMF Pag-IBIG Circular" 
        onClick={() => setIsPagIbigOpen(true)}
      />

      {/* Hotspot 9: BIR Tax Withholding Table */}
      <button 
        className="hotspot tax-hotspot" 
        title="📈 BIR Withholding Tax Table" 
        onClick={() => setActivePopup('TAX_TABLE')}
      />

      {/* Employee Contract Profile Modal */}
      <EmployeeContractModal 
        isOpen={isContractOpen} 
        onClose={() => setIsContractOpen(false)} 
        scenario={scenario}
      />

      {/* HDMF Pag-IBIG Memo Circular Modal */}
      <PagIbigMemoModal 
        isOpen={isPagIbigOpen} 
        onClose={() => setIsPagIbigOpen(false)} 
      />
    </div>
  );
}
