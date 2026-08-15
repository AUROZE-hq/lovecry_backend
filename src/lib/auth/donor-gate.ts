export const DONOR_COOKIE = 'lovecry_donor_email';

export async function getDonorEmailFromCookies(
  getCookie: (name: string) => { value: string } | undefined
): Promise<string | null> {
  return getCookie(DONOR_COOKIE)?.value ?? null;
}
