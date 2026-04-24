import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import RotatingBanana from '@/src/components/rotating-banana';
import LandingCountdown from '../_components/landing-countdown';

export default function WelcomePage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <RotatingBanana solid={true} />

      {/* Date info and sponsors - top right */}
      <div className="absolute top-6 right-6 z-10">
        <div className="flex flex-col gap-1">
          <p className="font-logo text-base text-primary tracking-wide">
            21.nov - 23.nov @ santiago
          </p>
          <LandingCountdown />
          <Link
            href={'/sponsor-deck' as any}
            className="group flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <span>sponsors</span>
            <ArrowUpRight className="group-hover:-translate-y-0.5 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={'/25/arcade' as any}
            className="group flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <span>arcade challenge</span>
            <ArrowUpRight className="group-hover:-translate-y-0.5 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Bottom section */}
      <div className="absolute right-0 bottom-8 left-0">
        <div className="flex flex-col items-center">
          <Link href="/apply" className="text-primary hover:underline">
            apply
          </Link>
        </div>
      </div>
    </div>
  );
}
