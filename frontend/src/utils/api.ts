import API_BASE_URL from '../config';

const STUDENT_KEY = 'student';
const TEACHER_KEY = 'teacher';
const TEACHER_ROOM_STATUS_KEY = 'teacherRoomStatus';

function readStoredToken(): string | null {
  try {
    const studentRaw = localStorage.getItem(STUDENT_KEY);
    if (studentRaw) {
      const student = JSON.parse(studentRaw);
      if (student && typeof student.token === 'string' && student.token) {
        return student.token;
      }
    }
    const teacherRaw = localStorage.getItem(TEACHER_KEY);
    if (teacherRaw) {
      const teacher = JSON.parse(teacherRaw);
      if (teacher && typeof teacher.token === 'string' && teacher.token) {
        return teacher.token;
      }
    }
  } catch (_) {
    // Corrupted storage — treat as logged out
  }
  return null;
}

export function getAuthToken(): string | null {
  return readStoredToken();
}

function clearAuthStorage() {
  try {
    localStorage.removeItem(STUDENT_KEY);
    localStorage.removeItem(TEACHER_KEY);
    localStorage.removeItem(TEACHER_ROOM_STATUS_KEY);
  } catch (_) {}
}

/**
 * True when the backend rejected the attached token itself (expired/invalid),
 * as opposed to a business-level 401. Inspects a cloned body so callers can
 * still read the original response.
 */
async function isSessionRejection(res: Response): Promise<boolean> {
  try {
    const data = await res.clone().json();
    const msg: string = data && typeof data.error === 'string' ? data.error : '';
    return /session expired|invalid or expired session/i.test(msg);
  } catch (_) {
    return false;
  }
}

/**
 * fetch() wrapper that attaches the current session's Bearer token.
 * Use for every authenticated API call so requests survive the backend
 * interceptor's token check. Accepts either a path ("/api/...") or an
 * absolute URL.
 *
 * If the backend rejects the attached token as expired/invalid, auth storage
 * is cleared and the app reloads to the sign-in screen. Business-level 401s
 * (e.g., wrong role) are passed through untouched.
 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  const token = readStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && token && document.visibilityState === 'visible') {
    if (await isSessionRejection(res)) {
      clearAuthStorage();
      window.location.href = window.location.origin + window.location.pathname;
    }
  }
  return res;
}

export async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === 'string' && data.error) {
      return data.error;
    }
  } catch (_) {
    try {
      const text = await res.text();
      if (text) return text;
    } catch (_) {}
  }
  return fallback;
}

/**
 * Best-effort server logout (clears the session token), then wipes local
 * auth storage. Safe to call even when the stored token is already invalid.
 */
export async function logout(): Promise<void> {
  const token = readStoredToken();
  if (token) {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {
      // Network failure — local cleanup below still logs the user out
    }
  }
  clearAuthStorage();
}
