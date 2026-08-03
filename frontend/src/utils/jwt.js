// Minimal, dependency-free JWT payload decoder. This only reads the
// already-issued token's claims for DISPLAY purposes (expiry, issued-at)
// -- it does not verify the signature, which is correctly the backend's
// job, not something the frontend needs to (or safely can) do.
export function decodeJwtPayload(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}