import React, { useState } from 'react';
import API_BASE_URL from '../config';
import './Auth.css';

export default function Login({ onLoginSuccess, onTeacherCreateRoom, onStudentJoinRoom }) {
  const [studentNumber, setStudentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('GRADE12-ABM');
  const [section, setSection] = useState('GRADE12-ABM'); // kept for backward compatibility
  const [teacherSection, setTeacherSection] = useState('');
  const [teacherRoomCode, setTeacherRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Join Room Modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  const isTeacher = role === 'OM-TEACHER';



  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    setSection(newRole); // For backward compatibility with student registration
    setError('');
  };

  // Student registration (standard login)
  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentNumber.trim() || !fullName.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: studentNumber.trim(),
          fullName: fullName.trim(),
          section: section
        })
      });

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        try {
          const errBody = await response.text();
          errorDetail += `: ${errBody.substring(0, 200)}`;
        } catch (_) {}
        throw new Error(`Backend error — ${errorDetail}`);
      }

      const student = await response.json();
      localStorage.setItem('student', JSON.stringify(student));
      onLoginSuccess(student);
    } catch (err) {
      console.error('[Auth] Login error:', err);
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Teacher: Login
  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Store teacher info in localStorage without a room code initially
      localStorage.setItem('teacher', JSON.stringify({
        teacherName: fullName.trim(),
        section: teacherSection.trim(),
        roomCode: ''
      }));
      onTeacherCreateRoom('', fullName.trim(), teacherSection.trim());
    } catch (err) {
      console.error('[Auth] Login error:', err);
      setError('Failed to login.');
    } finally {
      setLoading(false);
    }
  };

  // Student: Join Room logic moved to Dashboard



  return (
    <div className="auth-container">
      <div className="glow-overlay"></div>
      <div className="scanlines"></div>
      
      <div className="auth-card">
        <div className="terminal-header">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
          <span className="terminal-title">NO_ZERO_DAYS_LOGIN.EXE</span>
        </div>

        <div className="auth-body">
          <div className="logo-section">
            <h1 className="title-glow">NO ZERO DAYS!</h1>
            <p className="subtitle">Interactive Philippine Payroll Simulator</p>
          </div>

          <form onSubmit={isTeacher ? handleTeacherSubmit : handleStudentSubmit} className="auth-form">
            {error && <div className="error-banner">{error}</div>}

            {/* Student Number — only for Students */}
            {!isTeacher && (
              <div className="input-group">
                <label>STUDENT NUMBER</label>
                <input 
                  type="text" 
                  placeholder="e.g., 2026-1002"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  disabled={loading}
                  className="retro-input"
                />
              </div>
            )}

            {/* Section — only for Teachers */}
            {isTeacher && (
              <div className="input-group">
                <label>SECTION</label>
                <input 
                  type="text" 
                  placeholder="e.g., Grade 12 - ABM A"
                  value={teacherSection}
                  onChange={(e) => setTeacherSection(e.target.value)}
                  disabled={loading}
                  className="retro-input"
                />
              </div>
            )}

            <div className="input-group">
              <label>FULL NAME</label>
              <input 
                type="text" 
                placeholder="e.g., Juan Dela Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="retro-input"
              />
            </div>

            <div className="input-group">
              <label>ROLE</label>
              <select 
                value={role} 
                onChange={handleRoleChange}
                disabled={loading}
                className="retro-select"
              >
                <option value="GRADE12-ABM">Grade 12 ABM Student</option>
                <option value="OM-TEACHER">O&amp;M Teacher</option>
                <option value="COLLEGE-STUDENT">College Student</option>
              </select>
            </div>

            {/* Teacher: Login button */}
            {isTeacher && (
              <button type="submit" disabled={loading} className="login-btn">
                {loading ? 'LOGGING IN...' : 'LOGIN >'}
              </button>
            )}

            {/* Student: Login / Register button */}
            {!isTeacher && (
              <>
                <button type="submit" disabled={loading} className="login-btn">
                  {loading ? 'CONNECTING...' : 'LOGIN / REGISTER >'}
                </button>
              </>
            )}
          </form>
        </div>

        <div className="auth-footer">
          <span>CIT-U // Grade 12 ABM Capstone</span>
        </div>
      </div>


    </div>
  );
}
