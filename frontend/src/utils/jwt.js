export const decodeToken = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    let normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padding = 4 - (normalized.length % 4 || 4);
    normalized = normalized + '='.repeat(padding);
    const decoded = JSON.parse(atob(normalized));
    return decoded;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
};
