import HomeWithIntro from '@/components/HomeWithIntro';
import HeroSec from '@/components/HeroSec';
import EventsSection from '@/components/EventsSection';
import AboutSection from '@/components/AboutSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import NewsletterSection from '@/components/NewsletterSection';

export default function Home() {
  return (
    <HomeWithIntro>
      <main className="relative">
        <HeroSec />
        <EventsSection />
        <AboutSection />
        <NewsletterSection />
        <TestimonialsSection />
      </main>
    </HomeWithIntro>
  );
}
