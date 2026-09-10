import { LegalPage } from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Xprim (operated by Tagada) collects the information you provide when you register (name, email, date
        of birth, gender, country and region) and when you complete profiling questions, so that we can match
        you with relevant surveys and manage your XP balance and rewards.
      </p>
      <p>
        We also record basic participation metadata (timestamps, and a privacy-safe hashed identifier derived
        from your IP address) to help detect fraudulent activity in the future. We do not store your raw IP
        address.
      </p>
      <p>
        When you complete a survey hosted by an external provider (such as SurveyMonkey), that provider may
        collect your survey responses directly under their own privacy policy.
      </p>
      <p>
        We plan to support consent management, data export and account deletion requests, and defined data
        retention periods in a future version. Until then, contact us if you would like your data reviewed or
        removed.
      </p>
    </LegalPage>
  );
}
