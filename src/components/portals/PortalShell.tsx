import Link from 'next/link';

type NavItem = { href: string; label: string };

export default function PortalShell({
  title,
  subtitle,
  email,
  displayName,
  nav,
  activeHref,
  logoutAction,
  children,
}: {
  title: string;
  subtitle?: string;
  email: string;
  displayName?: string;
  nav: NavItem[];
  activeHref?: string;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#050505] px-4 pb-20 pt-[calc(var(--site-header-height)+1.5rem)] text-white sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] lg:self-start">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#f1328b]">Donor Portal</p>
          <p className="mt-3 text-lg font-bold text-white">{displayName || 'Donor'}</p>
          <p className="mt-1 break-all text-sm text-white/45">{email}</p>

          <nav className="mt-6 space-y-2" aria-label="Donor portal">
            {nav.map((item) => {
              const active = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? 'bg-[#f1328b]/15 text-[#f1328b]'
                      : 'text-white/75 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <form action={logoutAction} className="mt-8">
            <button type="submit" className="text-sm text-white/45 hover:text-white">
              Sign out
            </button>
          </form>
        </aside>

        <section>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-white/55">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}

export const DONOR_PORTAL_NAV: NavItem[] = [
  { href: '/donor/donations', label: 'Giving History' },
  { href: '/donor/receipts', label: 'Receipts' },
  { href: '/donor/monthly', label: 'Monthly Giving' },
  { href: '/donor/profile', label: 'Profile' },
];
