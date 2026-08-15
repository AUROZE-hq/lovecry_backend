/** Push notification channel stub — enable after Google Calendar watch setup. */
export async function ensureCalendarWatch(): Promise<{ ok: boolean; message: string }> {
  return {
    ok: false,
    message: 'Calendar watch notifications will be enabled after Google credentials are pasted.',
  };
}
