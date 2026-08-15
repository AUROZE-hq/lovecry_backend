import { donationEnv } from '@/lib/config/env';
import { getPublicReceiptPolicyMessage } from '@/lib/receipts/eligibility';

export default function ReceiptPolicyNotice() {
  const message = getPublicReceiptPolicyMessage();
  const threshold = donationEnv.charity.receiptThresholdCents / 100;

  return (
    <aside
      className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm leading-relaxed text-white/70"
      aria-label="Donation receipt policy"
    >
      <p className="font-semibold text-white/90">Receipt policy</p>
      <p className="mt-2">{message}</p>
      {donationEnv.charity.receiptingEnabled && (
        <p className="mt-2 text-xs text-white/45">
          LoveCry&apos;s policy issues official receipts for eligible gifts of ${threshold}+ CAD. A{' '}
          ${(threshold - 0.01).toFixed(2)} donation does not receive an official tax receipt; $
          {threshold.toFixed(2)} does.
        </p>
      )}
    </aside>
  );
}
