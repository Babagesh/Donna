export function hasVerifiedSecondFactor(token) {
  if (!token) return false;
  const claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  return Array.isArray(claims.fva) && Number.isInteger(claims.fva[1]) && claims.fva[1] >= 0;
}