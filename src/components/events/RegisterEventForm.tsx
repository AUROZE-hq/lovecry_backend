import { registerPublicEventAction } from '@/app/events/actions';

type RegisterEventFormProps = {
  eventId: string;
  slug: string;
  closedReason?: string | null;
};

export default function RegisterEventForm({ eventId, slug, closedReason }: RegisterEventFormProps) {
  if (closedReason) {
    return (
      <p className="rounded-2xl border border-[#E8DFEF] bg-[#F7F4F0] px-4 py-3 text-sm text-[#5C4A6B]" role="status">
        {closedReason}
      </p>
    );
  }

  return (
    <form action={registerPublicEventAction} className="space-y-4 rounded-3xl border border-[#E8DFEF] bg-white p-6">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <div>
        <label htmlFor="fullName" className="text-sm font-semibold text-[#2A1A38]">
          Full name *
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          className="mt-1 w-full rounded-xl border border-[#E8DFEF] px-3 py-2 text-sm text-[#2A1A38] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#693492]"
        />
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-[#2A1A38]">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-[#E8DFEF] px-3 py-2 text-sm text-[#2A1A38] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#693492]"
        />
      </div>
      <div>
        <label htmlFor="phone" className="text-sm font-semibold text-[#2A1A38]">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="mt-1 w-full rounded-xl border border-[#E8DFEF] px-3 py-2 text-sm text-[#2A1A38] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#693492]"
        />
      </div>
      <button
        type="submit"
        className="min-h-11 w-full rounded-full bg-[#693492] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#4B2A63] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#693492] sm:w-auto"
      >
        Confirm registration
      </button>
    </form>
  );
}
