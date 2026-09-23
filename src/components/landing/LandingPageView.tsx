import { LandingAudience } from "@/components/landing/LandingAudience";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingTrustBar } from "@/components/landing/LandingTrustBar";
import { PwaStandaloneEntryRedirect } from "@/components/pwa/PwaStandaloneEntryRedirect";
import { SPEKIT } from "@/lib/spekit-targets";

export function LandingPageView() {
  return (
    <div
      className="min-h-dvh overflow-x-clip bg-background"
      data-spekit={SPEKIT.landingPage}
    >
      <PwaStandaloneEntryRedirect />
      <LandingNav />
      <main>
        <LandingHero />
        <LandingTrustBar />
        <LandingFeatures />
        <LandingAudience />
      </main>
      <LandingFooter />
    </div>
  );
}
