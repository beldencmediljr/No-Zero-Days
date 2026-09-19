import React, { useState, useEffect, useCallback, useRef } from 'react';
import API_BASE_URL from '../config';
import './TeacherLobby.css';

interface Participant {
  studentNumber: string;
  fullName: string;
  section: string;
  joinedAt: string;
}

interface TeacherLobbyProps {
  roomCode: string;
  teacherName: string;
  section: string;
  onInitiateSession: () => void;
  onBack: () => void;
  onRoomCreated: (code: string) => void;
}

export default function TeacherLobby({ roomCode, teacherName, section, onInitiateSession, onBack, onRoomCreated }: TeacherLobbyProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [customRoomCode, setCustomRoomCode] = useState('');

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomRoomCode(code);
  };

  // Fetch participants from backend
  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}/participants`);
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
        setParticipantCount(data.participantCount || 0);
      }
    } catch (err) {
      console.error('[TeacherLobby] Failed to fetch participants:', err);
    }
  }, [roomCode]);

  // Poll every 3 seconds for new participants, but ONLY if a room is active
  useEffect(() => {
    if (roomCode) {
      fetchParticipants(); // Initial fetch
      pollIntervalRef.current = setInterval(fetchParticipants, 3000);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchParticipants, roomCode]);

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    setError('');

    try {
      const payload: Record<string, string> = {
        teacherName: teacherName,
        section: section
      };
      if (customRoomCode.trim()) {
        payload.roomCode = customRoomCode.trim().toUpperCase();
      }
      const response = await fetch(`${API_BASE_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        try {
          const errBody = await response.text();
          errorDetail += `: ${errBody.substring(0, 200)}`;
        } catch (_) {}
        throw new Error(`Backend error — ${errorDetail}`);
      }

      const data = await response.json();
      
      // Update localStorage
      const saved = localStorage.getItem('teacher');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.roomCode = data.roomCode;
        localStorage.setItem('teacher', JSON.stringify(parsed));
      }

      onRoomCreated(data.roomCode);
    } catch (err) {
      console.error('[TeacherLobby] Create room error:', err);
      setError('Failed to create room.');
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
      // Fallback: select the text
    });
  };

  // Initiate the session
  const handleInitiate = async () => {
    if (participantCount === 0) {
      setError('Cannot start a session with no students. Wait for students to join.');
      return;
    }
    setInitiating(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        // Stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
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

  return (
    <div className="lobby-container">
      <div className="glow-overlay"></div>
      <div className="scanlines"></div>

      <div className="lobby-card">
        <div className="terminal-header">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
          <span className="terminal-title">NO_ZERO_DAYS_ROOM.EXE</span>
        </div>

        <div className="lobby-body">
          {/* Room Creation UI (if room not yet created) */}
          {!roomCode ? (
            <div style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #334155', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ color: '#fbbf24', marginTop: 0 }}>GENERATE A CLASSROOM</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '15px' }}>
                You have not started a session yet. Create a room to get a code for your students.
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#60a5fa', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px' }}>ROOM CODE (Optional)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="E.G., NZD4X9"
                    value={customRoomCode}
                    onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                    disabled={isCreatingRoom}
                    maxLength={10}
                    style={{ flex: 1, padding: '10px', background: '#0b1120', border: '1px solid #334155', color: '#fff', fontSize: '1.2rem', letterSpacing: '3px', textTransform: 'uppercase' }}
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    disabled={isCreatingRoom}
                    style={{ padding: '0 15px', background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    🎲 GENERATE
                  </button>
                </div>
                <span style={{ color: '#475569', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  Leave blank for a random code.
                </span>
              </div>

              <button 
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
                style={{ width: '100%', padding: '12px', background: '#3b82f6', border: 'none', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {isCreatingRoom ? 'CREATING...' : 'CREATE ROOM >'}
              </button>
            </div>
          ) : (
            <div className="room-code-display" onClick={handleCopyCode}>
              <span className="room-code-label">SHARE THIS ROOM CODE WITH YOUR STUDENTS</span>
              <div className="room-code-value">{roomCode}</div>
              <span className="room-code-hint">Click to copy</span>
              {copied && <span className="copied-toast">COPIED!</span>}
            </div>
          )}

          {/* Room Info */}
          <div className="room-info-bar">
            <div className="room-info-item">
              <span>TEACHER: </span><strong>{teacherName}</strong>
            </div>
            <div className="room-info-item">
              <span>SECTION: </span><strong>{section || 'N/A'}</strong>
            </div>
            <button className="lobby-back-btn" onClick={onBack}>[ EXIT ROOM ]</button>
          </div>

          {/* Student Counter */}
          <div className="student-counter">
            <span className="counter-icon">👥</span>
            <span className="counter-text">{participantCount} STUDENT{participantCount !== 1 ? 'S' : ''} JOINED</span>
            <div className="counter-pulse"></div>
          </div>

          {/* Student List */}
          <div className="student-list-container">
            <div className="student-list-header">
              <span>#</span>
              <span>STUDENT NAME</span>
              <span>STUDENT NUMBER</span>
            </div>
            {participants.length === 0 ? (
              <div className="empty-list-message">
                <span className="empty-icon">📡</span>
                Waiting for students to join using code <strong style={{ color: '#facc15' }}>{roomCode}</strong>...
              </div>
            ) : (
              participants.map((p, index) => (
                <div key={p.studentNumber} className="student-list-row" style={{ animationDelay: `${index * 0.05}s` }}>
                  <span className="row-index">{index + 1}</span>
                  <span>{p.fullName}</span>
                  <span style={{ color: '#94a3b8' }}>{p.studentNumber}</span>
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

          {/* Initiate Session Button */}
          <button
            className="initiate-btn"
            onClick={handleInitiate}
            disabled={initiating || participantCount === 0}
          >
            {initiating ? 'STARTING SESSION...' : `INITIATE SESSION > (${participantCount} STUDENT${participantCount !== 1 ? 'S' : ''})`}
          </button>
        </div>

        <div className="lobby-footer">
          <span>Room active // Students will be directed to Phase 1 after session initiation</span>
        </div>
      </div>
    </div>
  );
}
