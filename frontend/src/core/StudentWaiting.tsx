import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../config';
import './Auth.css';

interface StudentWaitingProps {
  roomCode: string;
  studentName: string;
  onSessionStarted: () => void;
  onBack: () => void;
}

export default function StudentWaiting({ roomCode, studentName, onSessionStarted, onBack }: StudentWaitingProps) {
  const [status, setStatus] = useState('WAITING');
  const [participantCount, setParticipantCount] = useState(0);
  const [dots, setDots] = useState('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dotsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for session status every 3 seconds
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}/status`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          setParticipantCount(data.participantCount || 0);

          if (data.status === 'ACTIVE') {
            // Session has started! Navigate to Phase 1
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current);
            onSessionStarted();
          }
        }
      } catch (err) {
        console.error('[StudentWaiting] Poll error:', err);
      }
    };

    checkStatus(); // Immediate first check
    pollIntervalRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [roomCode, onSessionStarted]);

  // Animated loading dots
  useEffect(() => {
    dotsIntervalRef.current = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => {
      if (dotsIntervalRef.current) clearInterval(dotsIntervalRef.current);
    };
  }, []);

  return (
    <div className="auth-container">
      <div className="glow-overlay"></div>
      <div className="scanlines"></div>

      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="terminal-header">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
          <span className="terminal-title">NO_ZERO_DAYS_WAITING.EXE</span>
        </div>

        <div className="auth-body" style={{ textAlign: 'center' }}>
          {/* Waiting Animation */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '10px',
              animation: 'pulse-glow-border 2s infinite'
            }}>
              📡
            </div>
            <h2 style={{ color: '#facc15', fontSize: '1.4rem', margin: '0 0 8px 0' }}>
              WAITING FOR TEACHER{dots}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
              Your teacher will initiate the session when everyone is ready.
            </p>
          </div>

          {/* Room Info Card */}
          <div style={{
            background: '#0b1120',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#60a5fa', fontSize: '0.85rem' }}>ROOM CODE:</span>
              <strong style={{ color: '#facc15', fontSize: '1.1rem', letterSpacing: '3px' }}>{roomCode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#60a5fa', fontSize: '0.85rem' }}>YOUR NAME:</span>
              <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{studentName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#60a5fa', fontSize: '0.85rem' }}>STATUS:</span>
              <strong style={{ color: status === 'ACTIVE' ? '#10b981' : '#fbbf24', fontSize: '0.95rem' }}>
                {status === 'ACTIVE' ? '✓ SESSION STARTED' : '⏳ WAITING'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#60a5fa', fontSize: '0.85rem' }}>STUDENTS IN ROOM:</span>
              <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>{participantCount}</strong>
            </div>
          </div>

          {/* Loading Bar Animation */}
          <div style={{
            width: '100%',
            height: '4px',
            background: '#1e293b',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '30%',
              height: '100%',
              background: 'linear-gradient(90deg, #60a5fa, #facc15)',
              borderRadius: '2px',
              animation: 'loadingSweep 1.5s ease-in-out infinite'
            }}></div>
          </div>

          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: '1px solid #475569',
              color: '#94a3b8',
              padding: '10px 20px',
              fontFamily: "'Share Tech Mono', monospace",
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '0.85rem',
              transition: 'border-color 0.2s, color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            [ LEAVE ROOM ]
          </button>
        </div>

        <div className="auth-footer">
          <span>Connected to room // Listening for session start signal</span>
        </div>
      </div>

      {/* Loading sweep keyframes */}
      <style>{`
        @keyframes loadingSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
