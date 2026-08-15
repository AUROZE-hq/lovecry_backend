import { redirect } from 'next/navigation';
import { isAdminUnlocked } from '@/lib/auth/admin-gate';
import { listAudits } from '@/lib/counselling/store';
import { AdminNav } from '../page';

export default async function AuditLogsPage() {
  if (!(await isAdminUnlocked())) redirect('/admin');
  const audits = await listAudits(100);

  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black">Audit logs</h1>
          <AdminNav />
        </div>
        <ul className="mt-8 space-y-2 text-sm">
          {audits.map((a) => (
            <li key={a.id} className="rounded-xl border border-white/10 px-4 py-3 text-white/65">
              <span className="font-mono text-xs text-white/35">{a.createdAt}</span>
              <br />
              {a.action} · {a.actorType} · appt {a.appointmentId}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
