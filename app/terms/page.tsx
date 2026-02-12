import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | AskMyMoney",
  description:
    "Terms and conditions for using the AskMyMoney application.",
};

export default function TermsOfServicePage() {
  const effectiveDate = "February 12, 2026";

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-400 mb-12">
          Effective date: {effectiveDate}
        </p>

        <div className="space-y-10 text-sm leading-relaxed text-gray-300">
          {/* ---- Intro ---- */}
          <section>
            <p>
              These Terms of Service (&quot;Terms&quot;) govern your access to
              and use of the AskMyMoney application (&quot;Service&quot;),
              operated by Axite LLC (&quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot;). By using the Service you agree to these Terms.
              If you do not agree, do not use the Service.
            </p>
          </section>

          {/* ---- 1. Eligibility ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Eligibility
            </h2>
            <p>
              You must be at least 18 years old and capable of forming a binding
              contract to use the Service. By creating an account you represent
              that you meet these requirements.
            </p>
          </section>

          {/* ---- 2. Account ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Your Account
            </h2>
            <p>
              You are responsible for maintaining the security of your account
              credentials, including any passkeys associated with your account.
              You agree to notify us immediately if you suspect unauthorized
              access. We are not liable for losses arising from unauthorized use
              of your account.
            </p>
          </section>

          {/* ---- 3. The Service ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Description of the Service
            </h2>
            <p>
              AskMyMoney is an AI-powered financial assistant that connects to
              your bank accounts via Plaid and provides insights such as balance
              summaries, spending analysis, and transaction history through
              ChatGPT. The Service is informational only and does not execute
              financial transactions on your behalf.
            </p>
          </section>

          {/* ---- 4. Financial Data ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Financial Data &amp; Third-Party Services
            </h2>
            <p>
              By connecting a financial institution you authorize us to retrieve
              your account, balance, transaction, investment, and liability data
              through Plaid. Your use of Plaid is also subject to the{" "}
              <a
                href="https://plaid.com/legal/#end-user-services-agreement"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400 hover:text-blue-300"
              >
                Plaid End User Services Agreement
              </a>
              . You may disconnect any linked account at any time.
            </p>
          </section>

          {/* ---- 5. Acceptable Use ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable law
              </li>
              <li>
                Attempt to gain unauthorized access to the Service, other
                accounts, or our systems
              </li>
              <li>
                Reverse-engineer, decompile, or disassemble any part of the
                Service
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service
              </li>
              <li>
                Use the Service to transmit malware or other harmful code
              </li>
              <li>
                Resell, sublicense, or redistribute the Service without our
                prior written consent
              </li>
            </ul>
          </section>

          {/* ---- 6. Subscriptions & Billing ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Subscriptions &amp; Billing
            </h2>
            <p>
              Certain features may require a paid subscription. Subscription
              fees are billed in advance on a recurring basis through Stripe.
              You may cancel at any time; cancellation takes effect at the end
              of the current billing period. We do not provide refunds for
              partial billing periods unless required by law.
            </p>
          </section>

          {/* ---- 7. Not Financial Advice ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. Not Financial Advice
            </h2>
            <p>
              The Service provides informational summaries and insights about
              your financial data. It does <strong>not</strong> constitute
              financial, investment, tax, or legal advice. You should consult a
              qualified professional before making financial decisions. We are
              not a financial institution, broker, or registered investment
              adviser.
            </p>
          </section>

          {/* ---- 8. Disclaimer of Warranties ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Disclaimer of Warranties
            </h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE, OR THAT THE
              DATA PROVIDED WILL BE ACCURATE OR COMPLETE.
            </p>
          </section>

          {/* ---- 9. Limitation of Liability ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AXITE LLC AND ITS
              OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL,
              ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE. OUR
              TOTAL LIABILITY FOR ALL CLAIMS SHALL NOT EXCEED THE AMOUNT YOU
              PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* ---- 10. Indemnification ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              10. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold harmless Axite LLC from any
              claims, damages, losses, or expenses (including reasonable
              attorneys&apos; fees) arising from your use of the Service, your
              violation of these Terms, or your violation of any rights of a
              third party.
            </p>
          </section>

          {/* ---- 11. Termination ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              11. Termination
            </h2>
            <p>
              We may suspend or terminate your access to the Service at any time
              for any reason, including violation of these Terms. You may delete
              your account at any time. Upon termination, we will revoke all
              Plaid access tokens and delete your financial data in accordance
              with our{" "}
              <a
                href="/privacy"
                className="underline text-blue-400 hover:text-blue-300"
              >
                Privacy Policy
              </a>
              .
            </p>
          </section>

          {/* ---- 12. Changes ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              12. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. If we make material
              changes we will notify you by email or through the Service.
              Continued use of the Service after changes are posted constitutes
              acceptance of the revised Terms.
            </p>
          </section>

          {/* ---- 13. Governing Law ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              13. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of the State of Delaware,
              without regard to conflict of law principles. Any disputes arising
              under these Terms shall be resolved in the state or federal courts
              located in Delaware.
            </p>
          </section>

          {/* ---- 14. Contact ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              14. Contact Us
            </h2>
            <p>
              If you have questions about these Terms, contact us at:
            </p>
            <p className="mt-2">
              Axite LLC
              <br />
              Email:{" "}
              <a
                href="mailto:support@askmymoney.ai"
                className="underline text-blue-400 hover:text-blue-300"
              >
                support@askmymoney.ai
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
