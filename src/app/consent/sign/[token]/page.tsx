'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ConsentDocumentViewer from '@/components/consent/ConsentDocumentViewer';
import ConsentCheckboxes, { acknowledgementLabels } from '@/components/consent/ConsentCheckboxes';
import SignaturePad from '@/components/consent/SignaturePad';
import TypedSignature from '@/components/consent/TypedSignature';

export default function ConsentSignPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [consent, setConsent] = useState<{ title: string; version: string; bodyText: string } | null>(
    null
  );
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [legalName, setLegalName] = useState('');
  const [drawn, setDrawn] = useState<string | null>(null);
  const [acks, setAcks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/public/consent/${token}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Invalid link');
        setConsent(j.consent);
        setAlreadySigned(j.alreadySigned);
        if (j.summary?.clientFirstName) {
          setLegalName('');
        }
      })
      .catch((e) => setError(e.message));
  }, [token]);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/public/consent/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legalName: legalName.trim(),
        method: drawn ? 'DRAWN_AND_TYPED' : 'TYPED',
        signatureDataUrl: drawn || undefined,
        acknowledgements: acknowledgementLabels(acks),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'Could not sign');
      return;
    }
    router.push(`/bookings/manage/${token}`);
  }

  if (error && !consent) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 pt-28 text-red-200">{error}</main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black">Sign consent</h1>
        {alreadySigned ? (
          <p className="mt-4 text-white/70">This consent form is already signed. Thank you.</p>
        ) : (
          <>
            {consent && (
              <div className="mt-6">
                <ConsentDocumentViewer {...consent} />
              </div>
            )}
            <div className="mt-6 space-y-4">
              <TypedSignature value={legalName} onChange={setLegalName} />
              <SignaturePad onChange={setDrawn} />
              <ConsentCheckboxes checked={acks} onChange={setAcks} />
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="rounded-full bg-[#f1328b] px-6 py-2.5 text-sm font-bold"
              >
                {busy ? 'Saving…' : 'Submit signature'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
