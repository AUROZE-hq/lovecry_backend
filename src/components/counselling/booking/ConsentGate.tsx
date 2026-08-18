'use client';

import { useEffect } from 'react';
import ConsentDocumentViewer from '@/components/consent/ConsentDocumentViewer';
import ConsentCheckboxes, { acknowledgementLabels } from '@/components/consent/ConsentCheckboxes';
import SignaturePad from '@/components/consent/SignaturePad';
import TypedSignature from '@/components/consent/TypedSignature';
import type { BookingBootstrap } from './types';

type SignaturePayload = {
  legalName: string;
  method: 'DRAWN' | 'TYPED' | 'DRAWN_AND_TYPED';
  signatureDataUrl?: string;
  acknowledgements: string[];
};

type Props = {
  boot: BookingBootstrap;
  legalName: string;
  onLegalNameChange: (value: string) => void;
  drawn: string | null;
  onDrawnChange: (value: string | null) => void;
  acks: Record<string, boolean>;
  onAcksChange: (next: Record<string, boolean>) => void;
  error: string | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (signature: SignaturePayload) => void;
};

export default function ConsentGate({
  boot,
  legalName,
  onLegalNameChange,
  drawn,
  onDrawnChange,
  acks,
  onAcksChange,
  error,
  busy,
  onClose,
  onSubmit,
}: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  function submit() {
    onSubmit({
      legalName: legalName.trim(),
      method: drawn ? 'DRAWN_AND_TYPED' : 'TYPED',
      signatureDataUrl: drawn || undefined,
      acknowledgements: acknowledgementLabels(acks),
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-gate-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[20px] border border-white/10 bg-[#0c0a12] p-5 text-white sm:p-6"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f1328b]">Required consent</p>
        <h2 id="consent-gate-title" className="font-hero mt-2 text-2xl font-bold">
          Sign counselling consent
        </h2>
        <p className="mt-2 text-sm text-white/55">
          Current settings require a signed consent form before this appointment can be confirmed.
        </p>

        {boot.consent ? (
          <div className="mt-5">
            <ConsentDocumentViewer
              title={boot.consent.title}
              version={boot.consent.version}
              bodyText={boot.consent.bodyText}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-200">No active consent template is available.</p>
        )}

        <div className="mt-5 space-y-4">
          <TypedSignature value={legalName} onChange={onLegalNameChange} />
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-white/45">
              Draw signature (optional if typed name is provided)
            </p>
            <SignaturePad onChange={onDrawnChange} />
          </div>
          <ConsentCheckboxes checked={acks} onChange={onAcksChange} />
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="rounded-xl bg-[#f1328b] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? 'Confirming…' : 'Sign and confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
