import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { requirePermission, AuthError } from '@/lib/auth/permissions';
import {
  listConsentTemplates,
  activateConsentTemplate,
  upsertConsentTemplate,
  getSettings,
} from '@/lib/counselling/store';
import { sha256 } from '@/lib/counselling/tokens';
import { AdminNav } from '../page';

export const metadata = { title: 'Consent forms | Counselling Admin' };

export default async function ConsentFormsAdminPage() {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const templates = await listConsentTemplates();
  const settings = await getSettings();

  async function createVersion(formData: FormData) {
    'use server';
    try {
      await requirePermission('counselling.write');
    } catch (err) {
      if (err instanceof AuthError) redirect('/admin');
      throw err;
    }
    const title = String(formData.get('title') || 'LoveCry Counselling Consent');
    const version = String(formData.get('version') || '');
    const bodyText = String(formData.get('bodyText') || '');
    if (!version || !bodyText) return;
    await upsertConsentTemplate({
      id: crypto.randomUUID(),
      title,
      version,
      status: 'DRAFT',
      documentHash: sha256(bodyText),
      bodyText,
      effectiveAt: new Date().toISOString(),
    });
    redirect('/admin/counselling/consent-forms');
  }

  async function activate(formData: FormData) {
    'use server';
    try {
      await requirePermission('counselling.write');
    } catch (err) {
      if (err instanceof AuthError) redirect('/admin');
      throw err;
    }
    await activateConsentTemplate(String(formData.get('id')));
    redirect('/admin/counselling/consent-forms');
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black">Consent forms</h1>
          <AdminNav />
        </div>
        <p className="mt-2 text-sm text-white/50">
          Policy B (default): book first, sign by {settings.consentDeadlineHours}h before.
          PDF Drive upload activates with Google credentials tomorrow.
        </p>

        <ul className="mt-8 space-y-3">
          {templates.map((t) => (
            <li key={t.id} className="rounded-2xl border border-white/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">
                    {t.title} · v{t.version}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-white/40">{t.status}</p>
                  <p className="mt-1 font-mono text-[10px] text-white/35">{t.documentHash}</p>
                </div>
                {t.status !== 'ACTIVE' && (
                  <form action={activate}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase"
                    >
                      Activate
                    </button>
                  </form>
                )}
              </div>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-xs text-white/55">
                {t.bodyText.slice(0, 800)}
                {t.bodyText.length > 800 ? '…' : ''}
              </pre>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-lg font-bold">New immutable version</h2>
        <form action={createVersion} className="mt-3 space-y-3">
          <input
            name="title"
            defaultValue="LoveCry Counselling Consent"
            className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm"
          />
          <input
            name="version"
            placeholder="1.1"
            required
            className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm"
          />
          <textarea
            name="bodyText"
            required
            rows={8}
            placeholder="Paste consent form text (PDF binary templates tomorrow with Drive)"
            className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-full bg-[#693492] px-5 py-2.5 text-sm font-bold">
            Save draft version
          </button>
        </form>
      </div>
    </main>
  );
}
