'use client';

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export default function TypedSignature({ value, onChange, disabled }: Props) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-white/45">
        Typed legal name
      </span>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="name"
        className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-lg italic text-white outline-none focus:border-[#f1328b]/60"
        placeholder="Full legal name"
      />
    </label>
  );
}
