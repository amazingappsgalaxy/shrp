import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { Footer } from "@/components/ui/footer"

export const metadata = {
  title: "Terms of Service — Sharpii.ai",
  description: "Terms and conditions for using Sharpii.ai.",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <NavigationHero4 />

      <div className="container mx-auto px-4 max-w-3xl pt-32 pb-24">
        <h1 className="text-4xl font-black font-heading tracking-tight mb-10">Terms of Service</h1>

        <div className="space-y-10 text-white/70 text-[15px] leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Agreement</h2>
            <p>
              By accessing or using Sharpii.ai, you agree to be bound by these Terms of Service.
              Sharpii.ai is operated by DopeStar Studios LLP, India. These terms govern your use of our
              platform and all services offered through it.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">The Service</h2>
            <p>
              Sharpii.ai offers AI-powered tools for image enhancement, upscaling, editing, and generation.
              We are continuously evolving our platform and may introduce, modify, or discontinue features
              as part of our ongoing development.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Accounts</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>You are responsible for providing accurate information during registration.</li>
              <li>Keeping your login credentials secure is your responsibility.</li>
              <li>Each account is intended for individual use and may not be shared or transferred.</li>
              <li>We reserve the right to suspend or terminate accounts that are found to be in violation of these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Credits and Subscriptions</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Credits are required to access AI processing features on the platform.</li>
              <li>Subscription credits are allocated at the start of each billing cycle and expire at its end.</li>
              <li>Unused credits are not carried forward to the next billing period.</li>
              <li>Credits hold no monetary value and cannot be transferred between accounts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Payments and Refunds</h2>
            <p>
              All purchases made on Sharpii.ai — including subscriptions, day passes, and credit top-ups
              — are final and non-refundable. We maintain a strict no-refund policy.
            </p>
            <p className="mt-3">
              You may cancel your subscription at any time through your account settings. Upon cancellation,
              no further charges will be made, and you will retain access to the service through the end
              of your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Your Content</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>You retain full ownership of the images you upload to Sharpii.ai.</li>
              <li>By using the service, you grant us permission to process your content solely for the purpose of delivering the requested output.</li>
              <li>You are responsible for ensuring that all content you upload complies with applicable laws and does not infringe upon any third-party rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Acceptable Use</h2>
            <p>While using Sharpii.ai, you agree to refrain from:</p>
            <ul className="space-y-2 list-disc list-inside mt-2">
              <li>Using the platform for any unlawful or harmful purpose.</li>
              <li>Uploading illegal, offensive, or rights-infringing content.</li>
              <li>Attempting to exploit, reverse-engineer, or disrupt the platform.</li>
              <li>Reselling or redistributing access to the service.</li>
            </ul>
            <p className="mt-3">
              Accounts found in violation of these guidelines may be terminated immediately and without refund.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Content Safety & Prohibited Content</h2>
            <p>
              Sharpii.ai is strictly prohibited from being used to generate, process, or distribute sexually
              explicit, pornographic, or NSFW (Not Safe For Work) content of any kind. This includes but is
              not limited to nudity, sexual acts, or content that sexualises real or fictional individuals.
            </p>
            <p className="mt-3">
              You may not use our platform to create content that depicts minors in any sexual or inappropriate
              context. Any attempt to do so will result in immediate account termination, reporting to the
              appropriate authorities, and permanent ban from the service.
            </p>
            <p className="mt-3">
              We employ automated and manual moderation to detect and prevent prohibited content. Violations
              will be actioned without notice and without refund.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Service Availability</h2>
            <p>
              We are committed to maintaining a reliable platform, though we cannot guarantee uninterrupted
              availability. Sharpii.ai shall not be held liable for any disruptions, data loss, or
              service outages beyond our reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Limitation of Liability</h2>
            <p>
              Sharpii.ai is provided on an "as is" basis. To the fullest extent permitted by applicable law,
              DopeStar Studios LLP shall not be liable for any indirect, incidental, or consequential
              damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Updates to These Terms</h2>
            <p>
              We reserve the right to update these terms at any time. When we do, we will revise the
              document accordingly. Your continued use of Sharpii.ai following any changes constitutes
              your acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Contact</h2>
            <p>
              For any questions or concerns regarding these terms, please contact us at{" "}
              <a href="mailto:contact@sharpii.ai" className="text-[#FFFF00] hover:underline">contact@sharpii.ai</a>.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </main>
  )
}
