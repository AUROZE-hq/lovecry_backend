type Props = {
  compact?: boolean;
};

export default function MarketplaceHero({ compact = false }: Props) {
  return (
    <section className="site-header-gradient relative overflow-hidden px-4 pb-10 pt-[calc(var(--site-header-height)+1.75rem)] sm:px-6 sm:pb-14 sm:pt-[calc(var(--site-header-height)+2.5rem)]">
      <div className={`relative mx-auto max-w-6xl ${compact ? 'lg:text-center' : 'text-left lg:text-center'}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/90 lg:tracking-[0.35em]">
          LoveCry Marketplace
        </p>
        <h1 className="font-hero mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Wear the message.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-white/90 sm:text-lg lg:mx-auto">
          <span className="lg:hidden">Official LoveCry merchandise.</span>
          <span className="hidden lg:inline">
            Official LoveCry merchandise — made to carry the message beyond the moment.
          </span>
        </p>
      </div>
    </section>
  );
}
