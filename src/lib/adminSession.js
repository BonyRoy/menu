const KEY = "menucraft_admin_session";

export function getAdminSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.loginId ? data : null;
  } catch {
    return null;
  }
}

export function setAdminSession(loginId) {
  sessionStorage.setItem(KEY, JSON.stringify({ loginId, at: Date.now() }));
}

export function clearAdminSession() {
  sessionStorage.removeItem(KEY);
}
