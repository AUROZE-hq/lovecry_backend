import Link from 'next/link';
import { Handshake, Heart, Users } from 'lucide-react';

const actions = [
  {
    href: '/member',
    title: 'Join Us',
    description: 'Create a member account to follow programs and community gatherings.',
    icon: Users,
  },
  {
    href: '/contact',
    title: 'Volunteer',
    description: 'Reach out if you would like to support LoveCry with your time and skills.',
    icon: Heart,
  },
  {
    href: '/contact',
    title: 'Partner With Us',
    description: 'Contact LoveCry to discuss collaboration, mentorship, or community partnerships.',
    icon: Handshake,
  },
] as const;

export default function BePartOfTheChange() {
  return (
    <section
      className="overflow-hidden rounded-3xl border border-[#E8DFEF] bg-[#FBF8FC] p-5 sm:p-8 lg:p-10"
      aria-labelledby="be-part"
    >
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10">
        <div className="min-w-0">
          <h2 id="be-part" className="font-news-headline text-2xl leading-tight text-[#2A1A38] sm:text-3xl lg:text-4xl">
            Be Part of the Change
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#6B5A78]">
            Healing happens in community. Whether you join a gathering, volunteer, or partner with LoveCry, there is a
            place for you.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="min-h-11 rounded-2xl p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#693492] sm:p-2"
              >
                <Icon className="h-7 w-7 text-[#693492] sm:h-8 sm:w-8" aria-hidden />
                <h3 className="mt-3 font-semibold text-[#2A1A38]">{action.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6B5A78]">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
