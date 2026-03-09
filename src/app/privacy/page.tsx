import { NavigationHero4 } from "@/components/ui/navigation-hero4"
import { Footer } from "@/components/ui/footer"

export const metadata = {
  title: "Privacy Policy — Sharpii.ai",
  description: "How Sharpii.ai collects, uses, and protects your data.",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <NavigationHero4 />

      <div className="container mx-auto px-4 max-w-3xl pt-32 pb-24">
        <h1 className="text-4xl font-black font-heading tracking-tight mb-10">Privacy Policy</h1>

        <div className="space-y-10 text-white/70 text-[15px] leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Who We Are</h2>
            <p>
              Sharpii.ai is operated by DopeStar Studios LLP, based in India. We are committed to
              protecting your privacy and handling your data with care.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">What We Collect</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-white/90">Account information</strong> — your name and email address provided during registration.</li>
              <li><strong className="text-white/90">Session data</strong> — IP address and browser information used solely to maintain a secure login session.</li>
              <li><strong className="text-white/90">Payment details</strong> — billing information handled securely by our payment provider. Card numbers are never stored on our servers.</li>
              <li><strong className="text-white/90">Usage data</strong> — images and prompts you submit for AI processing, along with the generated outputs, retained to power your generation history.</li>
              <li><strong className="text-white/90">Billing history</strong> — your subscription plan, credit balance, and transaction records.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">How We Use Your Data</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>To deliver and continuously improve the Sharpii.ai experience.</li>
              <li>To manage your account, subscription, and credit balance.</li>
              <li>To process payments and maintain billing records.</li>
              <li>To preserve your generation history for easy access.</li>
              <li>To authenticate your identity and protect your account.</li>
            </ul>
            <p className="mt-3">
              We do not sell your data to any third party, and we do not use advertising or behavioral tracking tools.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Data Storage</h2>
            <p>
              Your data is stored on secure, encrypted cloud infrastructure. Images you upload and
              AI-generated outputs are hosted on our content delivery network and remain accessible only to you.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Cookies</h2>
            <p>
              We use a single session cookie to keep you logged in across visits. We do not use
              marketing cookies, tracking pixels, or any third-party cookie-based services.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Data Retention</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Login sessions expire automatically after 7 days.</li>
              <li>Generation history is retained so your past outputs remain accessible.</li>
              <li>Payment and billing records are kept as required for accounting purposes.</li>
              <li>You may request complete deletion of your account and associated data at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data at any time.
              Simply write to us at{" "}
              <a href="mailto:contact@sharpii.ai" className="text-[#FFFF00] hover:underline">contact@sharpii.ai</a>{" "}
              and we will respond promptly.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base uppercase tracking-widest mb-3">Policy Updates</h2>
            <p>
              We may revise this policy periodically to reflect changes in our practices or applicable law.
              Continued use of Sharpii.ai following any updates indicates your acceptance of the revised policy.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </main>
  )
}
