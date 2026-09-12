import { redirect } from 'next/navigation';
import { DonorAuthError, consumeDonorAuthToken } from '@/lib/auth/donor-gate';

type Props = { searchParams: Promise<{ token?: string }> };

export default async function DonorAuthVerifyPage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (!token) redirect('/donor?error=missing_token');

  try {
    await consumeDonorAuthToken(token);
    redirect('/donor/donations');
  } catch (err) {
    const message = err instanceof DonorAuthError ? err.message : 'invalid_token';
    redirect(`/donor?error=${encodeURIComponent(message)}`);
  }
}
