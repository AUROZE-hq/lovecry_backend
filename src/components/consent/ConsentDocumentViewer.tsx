'use client';

type Props = {
  title: string;
  version: string;
  bodyText: string;
};

export default function ConsentDocumentViewer({ title, version, bodyText }: Props) {
  return (
    <article
      className="max-h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-relaxed text-white/75"
      tabIndex={0}
      aria-label={`${title} version ${version}`}
    >
      <header className="mb-4 border-b border-white/10 pb-3">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-1 text-xs uppercase tracking-widest text-white/40">Version {version}</p>
      </header>
      <pre className="whitespace-pre-wrap font-sans">{bodyText}</pre>
    </article>
  );
}
