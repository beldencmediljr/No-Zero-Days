import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../config';
import './TeacherLobby.css';

interface StudentProgress {
  studentNumber: string;
  fullName: string;
  section: string;
  completedPhases: number;
  currentPhaseTitle: string;
  attempts: number;
  status: string;
}

interface TeacherDashboardProps {
  roomCode: string;
  teacherName: string;
  onBack: () => void;
}

export default function TeacherDashboard({ roomCode, teacherName, onBack }: TeacherDashboardProps) {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setError('');
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to load dashboard.');
      }
    } catch (err) {
      console.error('[TeacherDashboard] Fetch error:', err);
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomCode) {
      fetchDashboardStats();
      pollIntervalRef.current = setInterval(fetchDashboardStats, 3000);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  return (
    <div className="lobby-container">
      <div className="glow-overlay"></div>
      <div className="scanlines"></div>

      <div className="lobby-card" style={{ maxWidth: '1200px' }}>
        <div className="terminal-header">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
          <span className="terminal-title">NO_ZERO_DAYS_TEACHER_DASHBOARD.EXE</span>
        </div>

        <div className="lobby-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
            <div>
              <h2 style={{ color: '#60a5fa', margin: '0 0 5px 0', fontSize: '1.8rem', textTransform: 'uppercase' }}>
                LIVE PROGRESS MONITOR
              </h2>
              <p style={{ color: '#94a3b8', margin: 0 }}>
                Room: <strong style={{ color: '#fbbf24', letterSpacing: '2px' }}>{roomCode}</strong> | Supervisor: {teacherName}
              </p>
            </div>
            <button 
              onClick={onBack}
              style={{
                background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold'
              }}
            >
              [ END SESSION ]
            </button>
          </div>

          {error && <div style={{ color: '#ef4444', marginBottom: '15px' }}>Error: {error}</div>}

          {loading ? (
            <div style={{ color: '#60a5fa', textAlign: 'center', padding: '40px' }}>INITIALIZING DASHBOARD SENSORS...</div>
          ) : (
            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
              {students.length === 0 ? (
                <div style={{ color: '#94a3b8', fontStyle: 'italic', gridColumn: '1 / -1' }}>No students have joined yet.</div>
              ) : (
                students.map((stu, idx) => {
                  const percent = Math.round((stu.completedPhases / 7) * 100);
                  const isCompleted = stu.status === 'COMPLETED';

                  return (
                    <div key={idx} style={{
                      background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #334155', borderRadius: '8px', padding: '20px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <div>
                          <strong style={{ color: '#fff', fontSize: '1.1rem', display: 'block' }}>{stu.fullName}</strong>
                          <span style={{ color: '#60a5fa', fontSize: '0.8rem' }}>{stu.studentNumber} • {stu.section}</span>
                        </div>
                        <div style={{ 
                          background: isCompleted ? '#064e3b' : '#1e3a8a', 
                          color: isCompleted ? '#10b981' : '#60a5fa',
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
                        }}>
                          {isCompleted ? 'PASSED' : 'ACTIVE'}
                        </div>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.8rem' }}>
                          <span style={{ color: '#94a3b8' }}>Overall Completion:</span>
                          <strong style={{ color: '#10b981' }}>{percent}% ({stu.completedPhases} / 7)</strong>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#0b1120', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)' }}></div>
                        </div>
                      </div>

                      <div style={{ background: '#0b1120', padding: '10px', borderRadius: '4px', border: '1px solid #1e293b' }}>
                        <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginBottom: '4px' }}>CURRENT OBJECTIVE:</div>
                        <div style={{ color: '#fbbf24', fontSize: '0.9rem', marginBottom: '8px' }}>{stu.currentPhaseTitle}</div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Session Attempts:</span>
                          <span style={{
                            color: stu.attempts > 5 ? '#ef4444' : '#fff',
                            fontWeight: 'bold'
                          }}>{stu.attempts}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
