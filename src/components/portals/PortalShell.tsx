import Link from 'next/link';

type NavItem = { href: string; label: string };

export default function PortalShell({
  title,
  subtitle,
  email,
  nav,
  logoutAction,
  children,
}: {
  title: string;
  subtitle: string;
  email: string;
  nav: NavItem[];
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#050505] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f1328b]">{subtitle}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-white/50">{email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white"
            >
              Log out
            </button>
          </form>
        </div>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Portal sections">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/70 transition hover:border-[#f1328b]/40 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
