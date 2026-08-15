'use client';

const DEFAULT_ITEMS = [
  {
    id: 'read',
    label: 'I confirm that I have read and understood the consent form.',
  },
  {
    id: 'agree',
    label:
      'I agree to participate in counselling services under the terms described in this form.',
  },
  {
    id: 'intent',
    label:
      'I confirm that the electronic signature I provide is my signature and that I intend to sign this consent form electronically.',
  },
] as const;

type Props = {
  checked: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
};

export default function ConsentCheckboxes({ checked, onChange }: Props) {
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Consent acknowledgements</legend>
      {DEFAULT_ITEMS.map((item) => (
        <label key={item.id} className="flex cursor-pointer gap-3 text-sm text-white/80">
          <input
            type="checkbox"
            checked={Boolean(checked[item.id])}
            onChange={(e) => onChange({ ...checked, [item.id]: e.target.checked })}
            className="mt-1 h-4 w-4 accent-[#f1328b]"
          />
          <span>{item.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function acknowledgementLabels(checked: Record<string, boolean>): string[] {
  return DEFAULT_ITEMS.filter((i) => checked[i.id]).map((i) => i.label);
}
