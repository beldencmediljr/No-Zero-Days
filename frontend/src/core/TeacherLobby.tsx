import React, { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '../utils/api';
import './TeacherLobby.css';

interface Participant {
  studentNumber: string;
  fullName: string;
  section: string;
  joinedAt: string;
  status?: string;
}

interface TeacherLobbyProps {
  roomCode: string;
  teacherName: string;
  teacherEmail?: string;
  section: string;
  onInitiateSession: () => void;
  onBack: () => void;
  onRoomCreated: (code: string) => void;
  onViewDashboard?: () => void;
  onSwitchRoom?: (newCode: string, newSec?: string) => void;
}

export default function TeacherLobby({ roomCode, teacherName, teacherEmail, section, onInitiateSession, onBack, onRoomCreated, onViewDashboard, onSwitchRoom }: TeacherLobbyProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [initiating, setInitiating] = useState(false);
  // Start as false (WAITING) so the INITIATE SESSION button is visible for a
  // freshly created room; the status poll corrects this on mount.
  const [sessionActive, setSessionActive] = useState(false);
  const [error, setError] = useState('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);

  const [teacherRooms, setTeacherRooms] = useState<any[]>([]);

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [customRoomCode, setCustomRoomCode] = useState('');

  // Add Student state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState('');

  // Delete student loading state
  const [deletingStudentNum, setDeletingStudentNum] = useState<string | null>(null);

  // Email report state
  const [currentTeacherEmail, setCurrentTeacherEmail] = useState(teacherEmail || '');
  const [sendingEmailReport, setSendingEmailReport] = useState(false);
  const [emailReportToast, setEmailReportToast] = useState('');

  // Room lifecycle state (archive/delete)
  const [roomArchived, setRoomArchived] = useState(false);
  const [archivingRoom, setArchivingRoom] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [roomActionMsg, setRoomActionMsg] = useState('');

  // Change password state
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwMsg, setChangePwMsg] = useState('');

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomRoomCode(code);
  };

  // Fetch participants from backend
  const fetchParticipants = useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await authFetch(`/api/rooms/${roomCode}/participants`);
      if (cancelledRef.current) return;
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
        setParticipantCount(data.participantCount || 0);
      }
    } catch (err) {
      console.error('[TeacherLobby] Failed to fetch participants:', err);
    }
  }, [roomCode]);

  // Check room status from backend
  const checkRoomStatus = useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await authFetch(`/api/rooms/${roomCode}/status`);
      if (cancelledRef.current) return;
      if (res.ok) {
        const data = await res.json();
        // Track the authoritative room status in both directions so a room
        // reset back to WAITING also restores the INITIATE button.
        setSessionActive(data.status === 'ACTIVE');
        setRoomArchived(data.status === 'COMPLETED');
        if (data.teacherEmail) {
          setCurrentTeacherEmail(data.teacherEmail);
        }
      }
    } catch (_) {}
  }, [roomCode]);

  // Poll every 3 seconds for new participants & status, but ONLY if a room is active
  useEffect(() => {
    if (roomCode) {
      cancelledRef.current = false;
      fetchParticipants(); // Initial fetch
      checkRoomStatus();
      pollIntervalRef.current = setInterval(() => {
        fetchParticipants();
        checkRoomStatus();
      }, 3000);
    }
    return () => {
      cancelledRef.current = true;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchParticipants, checkRoomStatus, roomCode]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await authFetch('/api/teachers/rooms');
        if (res.ok) {
          const rooms = await res.json();
          setTeacherRooms(rooms || []);
        }
      } catch (err) {
        console.error('Failed to fetch teacher rooms in lobby:', err);
      }
    };
    fetchRooms();
  }, [currentTeacherEmail, teacherEmail, roomCode]);

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    setError('');

    if (currentTeacherEmail.trim()) {
      const gmailRegex = /^[^\s@]+@gmail\.com$/i;
      if (!gmailRegex.test(currentTeacherEmail.trim())) {
        setError('Teacher email must be a valid Gmail address (e.g., teacher@gmail.com).');
        setIsCreatingRoom(false);
        return;
      }
    }

    try {
      const payload: Record<string, string> = {
        teacherName: teacherName,
        teacherEmail: currentTeacherEmail.trim(),
        section: section
      };
      if (customRoomCode.trim()) {
        payload.roomCode = customRoomCode.trim().toUpperCase();
      }
      const response = await authFetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          errorDetail = errData.error || errorDetail;
        } catch (_) {
          const errBody = await response.text();
          if (errBody) errorDetail += `: ${errBody.substring(0, 150)}`;
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      
      // Update localStorage
      const saved = localStorage.getItem('teacher');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.roomCode = data.roomCode;
        localStorage.setItem('teacher', JSON.stringify(parsed));
      }
      localStorage.setItem('teacherRoomStatus', 'ACTIVE');
      setSessionActive(true);
      onInitiateSession();

      onRoomCreated(data.roomCode);
    } catch (err: any) {
      console.error('[TeacherLobby] Create room error:', err);
      setError(err.message || 'Failed to create room.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Copy room code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {
      // Fallback
    });
  };

  // Initiate the session
  const handleInitiate = async () => {
    if (participantCount === 0) {
      setError('Cannot start a session with no students. Add or wait for students to join.');
      return;
    }
    setInitiating(true);
    setError('');
    try {
      const res = await authFetch(`/api/rooms/${roomCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setSessionActive(true);
        // Do NOT stop polling: keep polling alive so teacher sees joined students in real-time
        onInitiateSession();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to start session.');
      }
    } catch (err) {
      console.error('[TeacherLobby] Initiate error:', err);
      setError('Network error. Cannot connect to server.');
    } finally {
      setInitiating(false);
    }
  };

  // Add student manually
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentNumber.trim() || !newStudentName.trim()) {
      setAddStudentError('Student number and full name are required.');
      return;
    }
    setIsAddingStudent(true);
    setAddStudentError('');
    try {
      const res = await authFetch(`/api/rooms/${roomCode}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: newStudentNumber.trim(),
          fullName: newStudentName.trim(),
          section: section
        })
      });
      if (res.ok) {
        setNewStudentNumber('');
        setNewStudentName('');
        setShowAddModal(false);
        fetchParticipants();
      } else {
        const data = await res.json().catch(() => ({}));
        setAddStudentError(data.error || 'Failed to add student.');
      }
    } catch (err: any) {
      setAddStudentError(err.message || 'Connection error.');
    } finally {
      setIsAddingStudent(false);
    }
  };

  // Remove student from room
  const handleRemoveStudent = async (studentNum: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName} (${studentNum}) from the room?`)) {
      return;
    }
    setDeletingStudentNum(studentNum);
    try {
      const res = await authFetch(`/api/rooms/${roomCode}/students/${studentNum}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchParticipants();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to remove student.');
      }
    } catch (err: any) {
      alert('Error removing student: ' + err.message);
    } finally {
      setDeletingStudentNum(null);
    }
  };

  const handleSendReportEmail = async () => {
    if (!roomCode) return;
    const targetEmail = (currentTeacherEmail || teacherEmail || '').trim();
    if (!targetEmail) {
      const emailInput = prompt('Enter teacher email to receive classroom report:');
      if (!emailInput || !emailInput.trim()) return;
      setCurrentTeacherEmail(emailInput.trim());
      sendEmailTo(emailInput.trim());
      return;
    }
    sendEmailTo(targetEmail);
  };

  const sendEmailTo = async (email: string) => {
    setSendingEmailReport(true);
    setEmailReportToast('');
    try {
      const res = await authFetch(`/api/rooms/${roomCode}/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherEmail: email })
      });
      if (res.ok) {
        setEmailReportToast(`✓ Classroom report sent to ${email}!`);
        setTimeout(() => setEmailReportToast(''), 5000);
      } else {
        const data = await res.json().catch(() => ({}));
        setEmailReportToast(`✕ ${data.error || 'Failed to send report.'}`);
        setTimeout(() => setEmailReportToast(''), 6000);
      }
    } catch (err: any) {
      setEmailReportToast(`✕ Error sending email: ${err.message}`);
      setTimeout(() => setEmailReportToast(''), 6000);
    } finally {
      setSendingEmailReport(false);
    }
  };

  // Archive (close) the room — non-destructive; all classroom data is kept.
  const handleArchiveRoom = async () => {
    if (!window.confirm('Archive this room? The room can no longer be started, but all classroom data is preserved.')) {
      return;
    }
    setArchivingRoom(true);
    setRoomActionMsg('');
    try {
      const res = await authFetch(`/api/rooms/${roomCode}/close`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSessionActive(false);
        setRoomArchived(true);
        setRoomActionMsg('✓ Room archived. Classroom data is preserved.');
      } else {
        setRoomActionMsg(`✕ ${data.error || 'Failed to archive room.'}`);
      }
    } catch (err: any) {
      setRoomActionMsg(`✕ Error archiving room: ${err.message}`);
    } finally {
      setArchivingRoom(false);
    }
  };

  // Permanently delete the room and its classroom records. Free-play
  // (untagged) progress is preserved by the backend.
  const handleDeleteRoom = async () => {
    if (!window.confirm(`DELETE room ${roomCode}? This permanently removes the room, its participants, and this room's classroom records. Free-play progress is preserved.`)) {
      return;
    }
    if (!window.confirm('This action CANNOT be undone. Are you absolutely sure you want to permanently delete this room?')) {
      return;
    }
    setDeletingRoom(true);
    setRoomActionMsg('');
    try {
      const res = await authFetch(`/api/rooms/${roomCode}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const saved = localStorage.getItem('teacher');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            parsed.roomCode = '';
            localStorage.setItem('teacher', JSON.stringify(parsed));
          } catch (_) {}
        }
        localStorage.removeItem('teacherRoomStatus');
        onBack();
      } else {
        setRoomActionMsg(`✕ ${data.error || 'Failed to delete room.'}`);
      }
    } catch (err: any) {
      setRoomActionMsg(`✕ Error deleting room: ${err.message}`);
    } finally {
      setDeletingRoom(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw) {
      setChangePwMsg('✕ Please enter your current password.');
      return;
    }
    if (newPw.length < 8) {
      setChangePwMsg('✕ New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setChangePwMsg('✕ New passwords do not match.');
      return;
    }
    setChangePwLoading(true);
    setChangePwMsg('');
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setChangePwMsg('✓ Password changed successfully.');
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
        setShowChangePw(false);
      } else {
        setChangePwMsg(`✕ ${data.error || 'Failed to change password.'}`);
      }
    } catch (err: any) {
      setChangePwMsg(`✕ Error: ${err.message}`);
    } finally {
      setChangePwLoading(false);
    }
  };

  return (
    <div className="lobby-container">
      <div className="glow-overlay"></div>
      <div className="scanlines"></div>

      <div className="lobby-card">
        <div className="terminal-header">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
          <span className="terminal-title">No Zero Days: Payroll Simulator</span>
        </div>

        <div className="lobby-body">
          {/* Room Creation UI (if room not yet created) */}
          {!roomCode ? (
            <div style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid #334155', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#fbbf24', margin: 0, fontSize: '1.2rem', letterSpacing: '1px' }}>GENERATE A CLASSROOM</h3>
                <button 
                  type="button" 
                  className="lobby-back-btn" 
                  onClick={onBack}
                  style={{ margin: 0 }}
                >
                  [ EXIT ]
                </button>
              </div>

              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
                Create a room session to generate a passcode for your enrolled students.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px' }}>
                  TEACHER REPORT EMAIL
                </label>
                <input 
                  type="email" 
                  placeholder="e.g., teacher@gmail.com"
                  value={currentTeacherEmail}
                  onChange={(e) => setCurrentTeacherEmail(e.target.value)}
                  disabled={isCreatingRoom}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px', background: '#0b1120', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '1rem' }}
                  required
                />
                <span style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>
                  Each teacher's room will send reports exclusively to their entered email address.
                </span>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px' }}>ROOM CODE (Optional)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="E.G., NZD4X9"
                    value={customRoomCode}
                    onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                    disabled={isCreatingRoom}
                    maxLength={10}
                    style={{ flex: 1, padding: '12px', background: '#0b1120', border: '1px solid #334155', borderRadius: '4px', color: '#fff', fontSize: '1.2rem', letterSpacing: '3px', textTransform: 'uppercase' }}
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    disabled={isCreatingRoom}
                    style={{ padding: '0 18px', background: '#1e293b', border: '1px solid #475569', borderRadius: '4px', color: '#cbd5e1', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    🎲 GENERATE
                  </button>
                </div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>
                  Leave blank for a random 6-character code.
                </span>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  marginBottom: '15px'
                }}>
                  {error}
                </div>
              )}

              <button 
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
                style={{ width: '100%', padding: '14px', background: '#2563eb', border: 'none', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', letterSpacing: '1px' }}
              >
                {isCreatingRoom ? 'CREATING...' : 'CREATE ROOM >'}
              </button>
            </div>
          ) : (
            <>
              {/* Sections Switcher Bar if teacher has rooms */}
              {teacherRooms.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  marginBottom: '15px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ color: '#facc15', fontSize: '0.8rem', fontWeight: 'bold' }}>🏫 SECTIONS:</span>
                  {teacherRooms.map((r: any) => (
                    <button
                      key={r.roomCode}
                      type="button"
                      onClick={() => onSwitchRoom && onSwitchRoom(r.roomCode, r.section)}
                      style={{
                        background: r.roomCode === roomCode ? '#2563eb' : '#1e293b',
                        color: r.roomCode === roomCode ? '#fff' : '#cbd5e1',
                        border: r.roomCode === roomCode ? '1px solid #60a5fa' : '1px solid #475569',
                        padding: '5px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: r.roomCode === roomCode ? 'bold' : 'normal'
                      }}
                    >
                      {r.section || r.roomCode} ({r.roomCode})
                    </button>
                  ))}
                  {onViewDashboard && (
                    <button
                      type="button"
                      onClick={onViewDashboard}
                      style={{
                        marginLeft: 'auto',
                        background: '#059669',
                        color: '#fff',
                        border: '1px solid #10b981',
                        padding: '5px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        letterSpacing: '0.5px'
                      }}
                    >
                      📊 MASTER DASHBOARD &gt;
                    </button>
                  )}
                </div>
              )}

              {/* Room Code Display */}
              <div className="room-code-display" onClick={handleCopyCode} title="Click to copy code">
                <span className="room-code-label">SHARE THIS ROOM CODE WITH YOUR STUDENTS</span>
                <div className="room-code-value">{roomCode}</div>
                <span className="room-code-hint">Click anywhere to copy</span>
                {copied && <span className="copied-toast">COPIED!</span>}
              </div>

              {/* Room Info */}
              <div className="room-info-bar">
                <div className="room-info-item">
                  <span>TEACHER: </span><strong>{teacherName}</strong>
                </div>
                {(currentTeacherEmail || teacherEmail) && (
                  <div className="room-info-item">
                    <span>REPORT EMAIL: </span><strong style={{ color: '#38bdf8' }}>{currentTeacherEmail || teacherEmail}</strong>
                  </div>
                )}
                <div className="room-info-item">
                  <span>SECTION: </span><strong>{section || 'N/A'}</strong>
                </div>
                <button className="lobby-back-btn" onClick={onBack}>[ EXIT ROOM ]</button>
              </div>

              {/* Account Settings (change password) */}
              <div style={{ marginBottom: '15px' }}>
                <button
                  type="button"
                  onClick={() => { setShowChangePw(!showChangePw); setChangePwMsg(''); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  {showChangePw ? '▾ HIDE ACCOUNT SETTINGS' : '▸ ACCOUNT SETTINGS (CHANGE PASSWORD)'}
                </button>
                {showChangePw && (
                  <form onSubmit={handleChangePassword} style={{
                    marginTop: '10px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '14px'
                  }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px' }}>CURRENT PASSWORD</label>
                      <input
                        type="password"
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        disabled={changePwLoading}
                        style={{ width: '100%', padding: '10px', background: '#0b1120', border: '1px solid #334155', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                        autoComplete="current-password"
                        required
                      />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px' }}>NEW PASSWORD</label>
                      <input
                        type="password"
                        placeholder="At least 8 characters"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        disabled={changePwLoading}
                        style={{ width: '100%', padding: '10px', background: '#0b1120', border: '1px solid #334155', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px' }}>CONFIRM NEW PASSWORD</label>
                      <input
                        type="password"
                        placeholder="Re-enter your new password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        disabled={changePwLoading}
                        style={{ width: '100%', padding: '10px', background: '#0b1120', border: '1px solid #334155', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                    {changePwMsg && (
                      <div style={{
                        color: changePwMsg.startsWith('✕') ? '#f87171' : '#4ade80',
                        fontSize: '0.8rem',
                        marginBottom: '10px',
                        fontWeight: 'bold'
                      }}>
                        {changePwMsg}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={changePwLoading}
                      style={{
                        padding: '9px 16px',
                        background: '#2563eb',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {changePwLoading ? 'CHANGING...' : 'CHANGE PASSWORD >'}
                    </button>
                  </form>
                )}
              </div>

              {/* Action Row & Student Counter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div className="student-counter" style={{ margin: 0 }}>
                  <span className="counter-icon">👥</span>
                  <span className="counter-text">{participantCount} STUDENT{participantCount !== 1 ? 'S' : ''} ENROLLED</span>
                  <div className="counter-pulse"></div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid #3b82f6',
                    color: '#60a5fa',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>➕</span> ADD STUDENT
                </button>
              </div>

              {/* Student List */}
              <div className="student-list-container">
                <div className="student-list-header" style={{ gridTemplateColumns: '40px 1.5fr 1.2fr 80px' }}>
                  <span>#</span>
                  <span>STUDENT NAME</span>
                  <span>STUDENT NUMBER</span>
                  <span style={{ textAlign: 'right' }}>ACTION</span>
                </div>
                {participants.length === 0 ? (
                  <div className="empty-list-message">
                    <span className="empty-icon">📡</span>
                    Waiting for students to join using code <strong style={{ color: '#facc15' }}>{roomCode}</strong> or add them manually above.
                  </div>
                ) : (
                  participants.map((p, index) => (
                    <div key={p.studentNumber} className="student-list-row" style={{ gridTemplateColumns: '40px 1.5fr 1.2fr 80px', animationDelay: `${index * 0.05}s`, alignItems: 'center' }}>
                      <span className="row-index">{index + 1}</span>
                      <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{p.fullName}</span>
                        {p.status === 'INVITED' ? (
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: 'rgba(234, 179, 8, 0.15)',
                            border: '1px solid #eab308',
                            color: '#facc15',
                            letterSpacing: '0.5px',
                            fontWeight: 'normal'
                          }}>
                            INVITED
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid #22c55e',
                            color: '#4ade80',
                            letterSpacing: '0.5px',
                            fontWeight: 'normal'
                          }}>
                            JOINED
                          </span>
                        )}
                      </span>
                      <span style={{ color: '#94a3b8' }}>{p.studentNumber}</span>
                      <div style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          disabled={deletingStudentNum === p.studentNumber}
                          onClick={() => handleRemoveStudent(p.studentNumber, p.fullName)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid #ef4444',
                            color: '#f87171',
                            padding: '3px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                          title="Remove from room"
                        >
                          {deletingStudentNum === p.studentNumber ? '...' : 'DELETE'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Error Banner */}
              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  marginBottom: '15px'
                }}>
                  {error}
                </div>
              )}

              {/* Session Controls */}
              {sessionActive ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.12)',
                    border: '1px solid #22c55e',
                    color: '#4ade80',
                    padding: '14px 18px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    letterSpacing: '1px'
                  }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      boxShadow: '0 0 10px #22c55e',
                      display: 'inline-block'
                    }}></span>
                    SESSION ACTIVE // {participantCount} STUDENT{participantCount !== 1 ? 'S' : ''} CONNECTED
                  </div>

                  <button
                    type="button"
                    onClick={handleSendReportEmail}
                    disabled={sendingEmailReport}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #0284c7',
                      color: '#38bdf8',
                      padding: '10px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    title="Send classroom audit report to teacher email"
                  >
                    <span>✉️</span>
                    <span>
                      {sendingEmailReport
                        ? 'SENDING EMAIL REPORT...'
                        : (currentTeacherEmail || teacherEmail
                            ? `SEND EMAIL REPORT TO ${(currentTeacherEmail || teacherEmail).toUpperCase()}`
                            : 'SEND EMAIL REPORT')}
                    </span>
                  </button>

                  {emailReportToast && (
                    <div style={{
                      color: emailReportToast.startsWith('✕') ? '#f87171' : '#4ade80',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      padding: '8px 12px',
                      background: emailReportToast.startsWith('✕') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                      borderRadius: '4px',
                      border: emailReportToast.startsWith('✕') ? '1px solid #ef4444' : '1px solid #22c55e'
                    }}>
                      {emailReportToast}
                    </div>
                  )}

                  {onViewDashboard && (
                    <button
                      type="button"
                      onClick={onViewDashboard}
                      style={{
                        background: '#1e293b',
                        border: '1px solid #3b82f6',
                        color: '#60a5fa',
                        padding: '10px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        letterSpacing: '0.5px'
                      }}
                    >
                      📊 VIEW LIVE ANALYTICS DASHBOARD &gt;
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    className="initiate-btn"
                    onClick={handleInitiate}
                    disabled={initiating || participantCount === 0 || !roomCode || roomArchived}
                  >
                    {initiating ? 'STARTING SESSION...' : `INITIATE SESSION > (${participantCount} STUDENT${participantCount !== 1 ? 'S' : ''})`}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendReportEmail}
                    disabled={sendingEmailReport}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #0284c7',
                      color: '#38bdf8',
                      padding: '10px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    title="Send classroom audit report to teacher email"
                  >
                    <span>✉️</span>
                    <span>
                      {sendingEmailReport
                        ? 'SENDING EMAIL REPORT...'
                        : (currentTeacherEmail || teacherEmail
                            ? `SEND EMAIL REPORT TO ${(currentTeacherEmail || teacherEmail).toUpperCase()}`
                            : 'SEND EMAIL REPORT')}
                    </span>
                  </button>

                  {emailReportToast && (
                    <div style={{
                      color: emailReportToast.startsWith('✕') ? '#f87171' : '#4ade80',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      padding: '8px 12px',
                      background: emailReportToast.startsWith('✕') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                      borderRadius: '4px',
                      border: emailReportToast.startsWith('✕') ? '1px solid #ef4444' : '1px solid #22c55e'
                    }}>
                      {emailReportToast}
                    </div>
                  )}

                </div>
              )}

              {/* Room Lifecycle Controls (owner-only) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {roomArchived && (
                  <div style={{
                    background: 'rgba(148, 163, 184, 0.15)',
                    border: '1px solid #94a3b8',
                    color: '#cbd5e1',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    letterSpacing: '1px'
                  }}>
                    📦 THIS ROOM IS ARCHIVED // CLASSROOM DATA PRESERVED
                  </div>
                )}
                {roomActionMsg && (
                  <div style={{
                    color: roomActionMsg.startsWith('✕') ? '#f87171' : '#4ade80',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    padding: '8px 12px',
                    background: roomActionMsg.startsWith('✕') ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                    borderRadius: '4px',
                    border: roomActionMsg.startsWith('✕') ? '1px solid #ef4444' : '1px solid #22c55e'
                  }}>
                    {roomActionMsg}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleArchiveRoom}
                    disabled={archivingRoom || deletingRoom || roomArchived}
                    style={{
                      flex: 1,
                      background: 'rgba(148, 163, 184, 0.15)',
                      border: '1px solid #94a3b8',
                      color: '#cbd5e1',
                      padding: '9px 14px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px'
                    }}
                    title="Archive this room. Data is kept; the room can no longer be started."
                  >
                    {archivingRoom ? 'ARCHIVING...' : '📦 ARCHIVE ROOM'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteRoom}
                    disabled={archivingRoom || deletingRoom}
                    style={{
                      flex: 1,
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid #ef4444',
                      color: '#f87171',
                      padding: '9px 14px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px'
                    }}
                    title="Permanently delete this room and its classroom records. Free-play data is preserved."
                  >
                    {deletingRoom ? 'DELETING...' : '🗑 DELETE ROOM'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="lobby-footer">
          <span>{roomCode ? 'Room active // Students will be directed to Phase 1 after session initiation' : 'Create a room to generate a passcode'}</span>
        </div>
      </div>

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '450px',
            padding: '24px',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#60a5fa', margin: 0, fontSize: '1.2rem' }}>➕ ENROLL NEW STUDENT</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {addStudentError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '12px' }}>
                {addStudentError}
              </div>
            )}

            <form onSubmit={handleAddStudent}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>STUDENT NUMBER / ID</label>
                <input
                  type="text"
                  placeholder="e.g., 2024-00142"
                  value={newStudentNumber}
                  onChange={(e) => setNewStudentNumber(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#0b1120', border: '1px solid #334155', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>FULL NAME</label>
                <input
                  type="text"
                  placeholder="e.g., Maria Santos"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#0b1120', border: '1px solid #334155', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isAddingStudent}
                  style={{ padding: '8px 18px', background: '#3b82f6', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {isAddingStudent ? 'ADDING...' : 'CONFIRM & ADD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
