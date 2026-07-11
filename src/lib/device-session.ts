/** [AUTH-003] Pure device-lock comparison — last_session_id vs cookie token. */
export function isDeviceSessionValid(
  sessionToken: string | undefined,
  lastSessionId: string | null | undefined
): boolean {
  if (!sessionToken) {
    return true;
  }
  if (!lastSessionId) {
    return true;
  }
  return lastSessionId === sessionToken;
}
