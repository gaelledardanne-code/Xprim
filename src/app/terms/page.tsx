import { LegalPage } from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>
        By creating an Xprim account you agree to answer surveys honestly and only once per survey. XP is
        earned by completing eligible surveys and may be redeemed for the rewards listed on the Rewards page,
        subject to availability.
      </p>
      <p>
        Xprim reserves the right to withhold or reverse XP where we reasonably believe a survey was completed
        fraudulently, and to reject or approve reward redemption requests at our discretion.
      </p>
      <p>
        Surveys may be provided directly by Tagada or by third-party research providers (such as SurveyMonkey).
        Completing a third-party survey may also subject you to that provider&apos;s own terms.
      </p>
      <p>These terms are a V1 placeholder and will be replaced with reviewed legal terms in a future release.</p>
    </LegalPage>
  );
}
