'use client';

import { useState } from 'react';
import { slugifyTitle } from '@/lib/events/slug';
import { MARKETPLACE_SIZE_OPTIONS } from '@/lib/marketplace/types';
import { createMarketplaceProductAction } from '@/app/admin/marketplace/actions';

const fieldClass =
  'mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm normal-case text-white';
const labelClass = 'text-xs uppercase tracking-wider text-white/45';

export default function MarketplaceProductForm({ canWrite }: { canWrite: boolean }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [sizes, setSizes] = useState<string[]>([...MARKETPLACE_SIZE_OPTIONS]);

  function toggleSize(label: string) {
    setSizes((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label]
    );
  }

  return (
    <form action={createMarketplaceProductAction} className="mt-8 space-y-8">
      <fieldset className="space-y-4 rounded-2xl border border-white/10 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wider text-white/70">
          Product information
        </legend>
        <label className="block">
          <span className={labelClass}>Name</span>
          <input
            name="name"
            required
            value={name}
            disabled={!canWrite}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugifyTitle(e.target.value));
            }}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Slug</span>
          <input
            name="slug"
            required
            value={slug}
            disabled={!canWrite}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Subtitle</span>
          <input name="subtitle" disabled={!canWrite} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Description</span>
          <textarea name="description" required rows={5} disabled={!canWrite} className={fieldClass} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Category</span>
            <input name="category" disabled={!canWrite} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Badge</span>
            <input name="badge" disabled={!canWrite} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Price (optional, CAD dollars)</span>
            <input name="price" type="text" inputMode="decimal" placeholder="Leave blank for CA$ —" disabled={!canWrite} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Currency</span>
            <input name="currency" defaultValue="CAD" disabled={!canWrite} className={fieldClass} />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-white/10 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wider text-white/70">Product images</legend>
        <label className="block">
          <span className={labelClass}>Front image URL/path</span>
          <input name="frontImageUrl" required defaultValue="/ProductImageFront.png" disabled={!canWrite} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Front alt text</span>
          <input name="frontImageAlt" disabled={!canWrite} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Back image URL/path</span>
          <input name="backImageUrl" required defaultValue="/ProductImageBack.png" disabled={!canWrite} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Back alt text</span>
          <input name="backImageAlt" disabled={!canWrite} className={fieldClass} />
        </label>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-white/10 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wider text-white/70">Available sizes</legend>
        <div className="flex flex-wrap gap-3">
          {MARKETPLACE_SIZE_OPTIONS.map((label) => (
            <label key={label} className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                name="sizes"
                value={label}
                checked={sizes.includes(label)}
                disabled={!canWrite}
                onChange={() => toggleSize(label)}
                className="accent-[#f1328b]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-white/10 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wider text-white/70">Product message</legend>
        <label className="block">
          <span className={labelClass}>Message eyebrow</span>
          <input name="messageEyebrow" disabled={!canWrite} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Message title</span>
          <input name="messageTitle" disabled={!canWrite} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Message subtitle</span>
          <input name="messageSubtitle" disabled={!canWrite} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Message body</span>
          <textarea name="messageBody" rows={4} disabled={!canWrite} className={fieldClass} />
        </label>
      </fieldset>

      <fieldset className="space-y-4 rounded-2xl border border-white/10 p-5">
        <legend className="px-2 text-sm font-bold uppercase tracking-wider text-white/70">Publishing</legend>
        <label className="block">
          <span className={labelClass}>Status</span>
          <select name="status" defaultValue="DRAFT" disabled={!canWrite} className={fieldClass}>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" name="featured" className="accent-[#f1328b]" disabled={!canWrite} />
          Featured product
        </label>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" name="inStock" defaultChecked className="accent-[#f1328b]" disabled={!canWrite} />
          In stock
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={!canWrite}
        className="rounded-full bg-gradient-to-r from-[#693492] to-[#f1328b] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50"
      >
        Add Product
      </button>
    </form>
  );
}
