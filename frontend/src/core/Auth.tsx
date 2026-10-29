import React, { useState } from 'react';
import { authFetch, extractErrorMessage } from '../utils/api';
import './Auth.css';

interface LoginProps {
  onLoginSuccess: (student: any) => void;
  onTeacherCreateRoom: (roomCode: string, teacherName: string, section: string, teacherEmail: string) => void;
  onStudentJoinRoom?: (roomCode: string, student: any) => void;
}

export default function Login({ onLoginSuccess, onTeacherCreateRoom }: LoginProps) {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [studentNumber, setStudentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [upgradeConfirm, setUpgradeConfirm] = useState('');
  const [upgradePending, setUpgradePending] = useState<{ studentNumber: string; fullName: string } | null>(null);
  const [role, setRole] = useState<'GRADE12-ABM' | 'OM-TEACHER'>('GRADE12-ABM');
  const [teacherSection, setTeacherSection] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Password recovery: link emailed via /auth/forgot-password carries
  // ?reset=<token>; presence of the token switches this screen into
  // the reset form.
  const [resetToken] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('reset')
  );
  const [resetDone, setResetDone] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const isTeacher = role === 'OM-TEACHER';

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as 'GRADE12-ABM' | 'OM-TEACHER';
    setRole(newRole);
    setPassword('');
    setError('');
  };

  const validateTeacherEmail = (email: string) => {
    const gmailRegex = /^[^\s@]+@gmail\.com$/i;
    return gmailRegex.test(email.trim());
  };

  // Teacher: forgot password (emails a reset link)
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError('Please enter your Gmail address.');
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await authFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Failed to send reset email.'));
      }
      const data = await res.json().catch(() => ({}));
      setInfo(data.message || 'If a teacher account exists for that email, a password reset link has been sent.');
      setShowForgot(false);
      setForgotEmail('');
    } catch (err: any) {
      console.error('[Auth] Forgot password error:', err);
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Teacher: complete the reset from the emailed link (?reset=<token>)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;
    if (resetPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (resetPassword !== resetConfirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: resetPassword })
      });
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Password reset failed.'));
      }
      setResetPassword('');
      setResetConfirm('');
      setResetDone(true);
      setInfo('✓ Password has been reset. You can now sign in with your new password.');
      // Drop the token from the URL so a refresh doesn't reopen this form.
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err: any) {
      console.error('[Auth] Reset password error:', err);
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Student: Login handler (existing account check)
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNumber.trim()) {
      setError('Please enter your Student Number or Email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        studentNumber: studentNumber.trim(),
        name: fullName.trim(),
        fullName: fullName.trim(),
        role: role,
        password: password || undefined
      };

      const response = await authFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Login failed.'));
      }

      const student = await response.json();
      if (student.requiresUpgrade) {
        // Legacy pre-password account: identity verified, but the student must
        // attach an email + password before regaining access.
        setUpgradePending({
          studentNumber: student.studentNumber,
          fullName: student.fullName
        });
        setError('');
        return;
      }
      localStorage.setItem('student', JSON.stringify(student));
      onLoginSuccess(student);
    } catch (err: any) {
      console.error('[Auth] Student Login error:', err);
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Student: Upgrade handler (legacy account attaching email + password)
  const handleStudentUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradePending) return;

    if (!studentEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (upgradePassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (upgradePassword !== upgradeConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authFetch('/api/auth/upgrade-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentNumber: upgradePending.studentNumber,
          fullName: upgradePending.fullName,
          email: studentEmail.trim(),
          password: upgradePassword
        })
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Credential update failed.'));
      }

      const student = await response.json();
      localStorage.setItem('student', JSON.stringify(student));
      setUpgradePending(null);
      setUpgradePassword('');
      setUpgradeConfirm('');
      onLoginSuccess(student);
    } catch (err: any) {
      console.error('[Auth] Student Upgrade error:', err);
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Student: Sign Up handler (register new profile)
  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNumber.trim() || !fullName.trim()) {
      setError('Please fill in both Student Number and Full Name.');
      return;
    }
    if (!studentEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        studentNumber: studentNumber.trim(),
        name: fullName.trim(),
        fullName: fullName.trim(),
        role: role,
        email: studentEmail.trim(),
        password: password,
        section: '' // Inherited upon joining teacher room
      };

      const response = await authFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Sign up failed.'));
      }

      const student = await response.json();
      localStorage.setItem('student', JSON.stringify(student));
      onLoginSuccess(student);
    } catch (err: any) {
      console.error('[Auth] Student Sign Up error:', err);
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Teacher: Login handler (Master Teacher Account)
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherEmail.trim()) {
      setError('Please enter your Gmail address (e.g., teacher@gmail.com).');
      return;
    }
    if (!validateTeacherEmail(teacherEmail)) {
      setError('Please enter a valid Gmail address ending in @gmail.com (e.g., teacher@gmail.com).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        email: teacherEmail.trim(),
        teacherEmail: teacherEmail.trim(),
        name: fullName.trim(),
        fullName: fullName.trim(),
        role: role,
        password: password || undefined
      };

      const loginRes = await authFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!loginRes.ok) {
        throw new Error(await extractErrorMessage(loginRes, `Teacher account not found for ${teacherEmail.trim()}. Please switch to Sign Up.`));
      }

      const teacherData = await loginRes.json();
      const effectiveName = teacherData?.fullName || fullName.trim() || 'O&M Teacher';
      const effectiveEmail = teacherData?.email || teacherEmail.trim();
      const token = teacherData?.token || '';

      // Persist the session FIRST so the room lookup below is authenticated.
      const teacherStorage = {
        teacherId: teacherData?.id,
        teacherName: effectiveName,
        teacherEmail: effectiveEmail,
        token,
        section: '',
        roomCode: ''
      };
      localStorage.setItem('teacher', JSON.stringify(teacherStorage));

      // Fetch existing rooms for this teacher (identity comes from the Bearer token)
      let activeCode = '';
      let activeSection = '';
      try {
        const roomsRes = await authFetch('/api/teachers/rooms');
        if (roomsRes.ok) {
          const rooms = await roomsRes.json();
          if (Array.isArray(rooms) && rooms.length > 0) {
            activeCode = rooms[0].roomCode || '';
            activeSection = rooms[0].section || '';
          }
        }
      } catch (_) {}

      teacherStorage.section = activeSection;
      teacherStorage.roomCode = activeCode;
      localStorage.setItem('teacher', JSON.stringify(teacherStorage));
      if (activeCode) {
        localStorage.setItem('teacherRoomStatus', 'ACTIVE');
      } else {
        // No room under this teacher — drop any stale room status from a
        // previous session so the lobby state doesn't resurrect itself.
        localStorage.removeItem('teacherRoomStatus');
      }

      onTeacherCreateRoom(activeCode, effectiveName, activeSection, effectiveEmail);
    } catch (err: any) {
      console.error('[Auth] Teacher Login error:', err);
      setError(err.message || 'Failed to login.');
    } finally {
      setLoading(false);
    }
  };

  // Teacher: Sign Up handler (Master Teacher Account Creation)
  const handleTeacherSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!teacherEmail.trim()) {
      setError('Please enter your Gmail address (e.g., teacher@gmail.com).');
      return;
    }
    if (!validateTeacherEmail(teacherEmail)) {
      setError('Please enter a valid Gmail address ending in @gmail.com (e.g., teacher@gmail.com).');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        email: teacherEmail.trim(),
        teacherEmail: teacherEmail.trim(),
        name: fullName.trim(),
        fullName: fullName.trim(),
        role: role,
        password: password,
        section: teacherSection.trim()
      };

      const regRes = await authFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!regRes.ok) {
        throw new Error(await extractErrorMessage(regRes, 'Failed to register teacher account.'));
      }

      const teacherData = await regRes.json();
      const effectiveName = teacherData?.fullName || fullName.trim();
      const effectiveEmail = teacherData?.email || teacherEmail.trim();
      const initialSectionName = teacherSection.trim() || 'Grade 12 - ABM A';

      const teacherStorage = {
        teacherId: teacherData?.id,
        teacherName: effectiveName,
        teacherEmail: effectiveEmail,
        token: teacherData?.token || '',
        section: initialSectionName,
        roomCode: ''
      };
      localStorage.setItem('teacher', JSON.stringify(teacherStorage));

      // Create the initial classroom room (owner derives from the Bearer token)
      let initialRoomCode = '';
      try {
        const createRes = await authFetch('/api/rooms/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teacherName: effectiveName,
            section: initialSectionName
          })
        });
        if (createRes.ok) {
          const roomData = await createRes.json();
          initialRoomCode = roomData.roomCode || '';
        }
      } catch (createErr) {
        console.warn('[Auth] Initial room creation error:', createErr);
      }

      teacherStorage.roomCode = initialRoomCode;
      localStorage.setItem('teacher', JSON.stringify(teacherStorage));
      if (initialRoomCode) {
        localStorage.setItem('teacherRoomStatus', 'ACTIVE');
      }

      onTeacherCreateRoom(initialRoomCode, effectiveName, initialSectionName, effectiveEmail);
    } catch (err: any) {
      console.error('[Auth] Teacher Sign Up error:', err);
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (authMode === 'LOGIN') {
      if (isTeacher) {
        handleTeacherLogin(e);
      } else {
        handleStudentLogin(e);
      }
    } else {
      if (isTeacher) {
        handleTeacherSignup(e);
      } else {
        handleStudentSignup(e);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="glow-overlay"></div>
      <div className="scanlines"></div>

      <div className="auth-card">
        <div className="terminal-header">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
          <span className="terminal-title">No Zero Days: Payroll Simulator</span>
        </div>

        <div className="auth-body">
          <div className="logo-section">
            <h1 className="title-glow" style={{ fontSize: '1.9rem', letterSpacing: '0.5px' }}>
              No Zero Days: Payroll Simulator
            </h1>
            <p className="subtitle">Interactive Philippine Payroll Accounting Laboratory</p>
          </div>

          {resetToken && !resetDone ? (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div style={{
                background: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid #fbbf24',
                color: '#fbbf24',
                padding: '12px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '14px',
                letterSpacing: '0.5px'
              }}>
                ⚠ PASSWORD RESET — Choose a new password for your teacher account.
              </div>
              {error && <div className="error-banner">{error}</div>}
              <div className="input-group">
                <label>NEW PASSWORD</label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  disabled={loading}
                  className="retro-input"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="input-group">
                <label>CONFIRM NEW PASSWORD</label>
                <input
                  type="password"
                  placeholder="Re-enter your new password"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  disabled={loading}
                  className="retro-input"
                  autoComplete="new-password"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="login-btn">
                {loading ? 'RESETTING PASSWORD...' : 'RESET PASSWORD >'}
              </button>
            </form>
          ) : showForgot ? (
            <form onSubmit={handleForgotPassword} className="auth-form">
              <div style={{
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid #3b82f6',
                color: '#93c5fd',
                padding: '12px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '14px',
                letterSpacing: '0.5px'
              }}>
                Enter your teacher Gmail address and we'll email you a password reset link (valid for 15 minutes).
              </div>
              {error && <div className="error-banner">{error}</div>}
              <div className="input-group">
                <label>TEACHER GMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="e.g., teacher@gmail.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={loading}
                  className="retro-input"
                  autoComplete="email"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="login-btn">
                {loading ? 'SENDING RESET LINK...' : 'SEND RESET LINK >'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForgot(false); setError(''); }}
                disabled={loading}
                className="logout-btn"
                style={{ width: '100%', marginTop: '10px' }}
              >
                [ BACK TO LOGIN ]
              </button>
            </form>
          ) : (
          <>
          {info && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid #22c55e',
              color: '#4ade80',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '14px',
              letterSpacing: '0.5px',
              textAlign: 'center'
            }}>
              {info}
            </div>
          )}

          {/* Unmerged Login & Sign Up Navigation Tabs */}
          {!upgradePending && (
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'LOGIN'}
              className={`auth-tab-btn ${authMode === 'LOGIN' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('LOGIN');
                setError('');
              }}
            >
              [ LOGIN ]
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'SIGNUP'}
              className={`auth-tab-btn ${authMode === 'SIGNUP' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('SIGNUP');
                setError('');
              }}
            >
              [ SIGN UP ]
            </button>
          </div>
          )}
          {!upgradePending ? (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-banner">{error}</div>}

            {/* Role Selection: strictly Grade 12 ABM Student and O&M Teacher */}
            <div className="input-group">
              <label>ACCOUNT ROLE</label>
              <select
                value={role}
                onChange={handleRoleChange}
                disabled={loading}
                className="retro-select"
              >
                <option value="GRADE12-ABM">Grade 12 ABM Student</option>
                <option value="OM-TEACHER">O&amp;M Teacher</option>
              </select>
            </div>

            {/* Student Identifier — ID or Email at Login; ID only at Sign Up */}
            {!isTeacher && (
              <div className="input-group">
                <label>
                  {authMode === 'SIGNUP' ? 'STUDENT NUMBER' : 'STUDENT NUMBER OR EMAIL'}
                </label>
                <input
                  type="text"
                  placeholder={authMode === 'SIGNUP' ? 'e.g., 2026-1002' : 'e.g., 2026-1002 or student@gmail.com'}
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  disabled={loading}
                  className="retro-input"
                  required
                />
              </div>
            )}

            {/* Student Email — Sign Up only (required for new accounts) */}
            {!isTeacher && authMode === 'SIGNUP' && (
              <div className="input-group">
                <label>EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="e.g., student@gmail.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  disabled={loading}
                  className="retro-input"
                  required
                />
              </div>
            )}

            {/* Student Password — required at Sign Up, optional at Login */}
            {!isTeacher && (
              <div className="input-group">
                <label>
                  {authMode === 'SIGNUP'
                    ? 'PASSWORD'
                    : 'PASSWORD (REQUIRED IF YOU HAVE SET ONE)'}
                </label>
                <input
                  type="password"
                  placeholder={authMode === 'SIGNUP' ? 'At least 8 characters' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="retro-input"
                  autoComplete={authMode === 'SIGNUP' ? 'new-password' : 'current-password'}
                  required={authMode === 'SIGNUP'}
                />
              </div>
            )}

            {/* Teacher Fields: Gmail, Password & Section */}
            {isTeacher && (
              <>
                <div className="input-group">
                  <label>GMAIL ADDRESS (FOR AUDIT REPORTS)</label>
                  <input
                    type="email"
                    placeholder="e.g., teacher@gmail.com"
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    disabled={loading}
                    className="retro-input"
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Section completion summaries and Excel reports will be sent to this Gmail.
                  </span>
                </div>

                <div className="input-group">
                  <label>
                    {authMode === 'SIGNUP'
                      ? 'PASSWORD'
                      : 'PASSWORD (REQUIRED IF YOU HAVE SET ONE)'}
                  </label>
                  <input
                    type="password"
                    placeholder={authMode === 'SIGNUP' ? 'At least 8 characters' : 'Leave blank if you never set one'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="retro-input"
                    autoComplete={authMode === 'SIGNUP' ? 'new-password' : 'current-password'}
                    required={authMode === 'SIGNUP'}
                  />
                  {authMode === 'LOGIN' && (
                    <>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      No password yet? Leave this blank to sign in. Entering one here secures and claims your account.
                    </span>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setForgotEmail(teacherEmail); setError(''); }}
                      disabled={loading}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        padding: 0,
                        marginTop: '6px',
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot password?
                    </button>
                    </>
                  )}
                </div>

                {authMode === 'SIGNUP' && (
                  <div className="input-group">
                    <label>CLASS SECTION NAME</label>
                    <input
                      type="text"
                      placeholder="e.g., Grade 12 - ABM A"
                      value={teacherSection}
                      onChange={(e) => setTeacherSection(e.target.value)}
                      disabled={loading}
                      className="retro-input"
                      required
                    />
                  </div>
                )}
              </>
            )}

            {/* Full Name Field — student Sign Up only; teachers keep it at both modes */}
            {(isTeacher || authMode === 'SIGNUP') && (
            <div className="input-group">
              <label>
                {isTeacher
                  ? authMode === 'LOGIN'
                    ? 'TEACHER FULL NAME (OPTIONAL)'
                    : 'TEACHER FULL NAME'
                  : 'STUDENT FULL NAME'}
              </label>
              <input
                type="text"
                placeholder={
                  isTeacher
                    ? authMode === 'LOGIN'
                      ? 'Optional during login (e.g., Maria Santos)'
                      : 'e.g., Maria Santos'
                    : 'e.g., Juan Dela Cruz'
                }
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="retro-input"
                required
              />
            </div>
            )}

            {/* Action Submit Button */}
            <button type="submit" disabled={loading} className="login-btn">
              {loading
                ? (authMode === 'LOGIN' ? 'AUTHENTICATING...' : 'CREATING ACCOUNT...')
                : (authMode === 'LOGIN' ? 'LOG IN >' : 'SIGN UP >')}
            </button>
          </form>
          ) : (
          <form onSubmit={handleStudentUpgrade} className="auth-form">
            {error && <div className="error-banner">{error}</div>}

            <div style={{
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid #fbbf24',
              color: '#fbbf24',
              padding: '12px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '14px',
              letterSpacing: '0.5px'
            }}>
              ⚠ SECURITY UPDATE REQUIRED — Your account was created before email &amp; password
              protection was enabled. Add your credentials below to regain access to your account.
            </div>

            <div className="input-group">
              <label>STUDENT NUMBER</label>
              <input
                type="text"
                value={upgradePending.studentNumber}
                disabled
                className="retro-input"
              />
            </div>

            <div className="input-group">
              <label>FULL NAME</label>
              <input
                type="text"
                value={upgradePending.fullName}
                disabled
                className="retro-input"
              />
            </div>

            <div className="input-group">
              <label>EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="e.g., student@gmail.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                disabled={loading}
                className="retro-input"
                autoComplete="email"
                required
              />
            </div>

            <div className="input-group">
              <label>NEW PASSWORD</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={upgradePassword}
                onChange={(e) => setUpgradePassword(e.target.value)}
                disabled={loading}
                className="retro-input"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="input-group">
              <label>CONFIRM PASSWORD</label>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={upgradeConfirm}
                onChange={(e) => setUpgradeConfirm(e.target.value)}
                disabled={loading}
                className="retro-input"
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'SECURING ACCOUNT...' : 'UPDATE CREDENTIALS >'}
            </button>
            <button
              type="button"
              onClick={() => {
                setUpgradePending(null);
                setUpgradePassword('');
                setUpgradeConfirm('');
                setError('');
              }}
              disabled={loading}
              className="logout-btn"
              style={{ width: '100%', marginTop: '10px' }}
            >
              [ CANCEL ]
            </button>
          </form>
          )}

          {/* Quick tab switcher prompt */}
          {!upgradePending && (
          <div className="auth-switch-prompt">
            {authMode === 'LOGIN' ? (
              <span>
                New user?{' '}
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => {
                    setAuthMode('SIGNUP');
                    setError('');
                  }}
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already registered?{' '}
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setError('');
                  }}
                >
                  Log in to your account
                </button>
              </span>
            )}
          </div>
          )}
          </>
          )}
        </div>

        <div className="auth-footer" style={{ borderTop: '1px solid #1e293b' }}>
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
            Philippine Labor &amp; Payroll Compliance Simulation
          </span>
        </div>
      </div>
    </div>
  );
}
