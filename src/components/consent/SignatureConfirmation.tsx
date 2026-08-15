'use client';

type Props = {
  legalName: string;
  signedAtLabel: string;
};

export default function SignatureConfirmation({ legalName, signedAtLabel }: Props) {
  return (
    <div
      role="status"
      className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
    >
      Consent signed by <strong>{legalName}</strong> on {signedAtLabel}.
    </div>
  );
}
