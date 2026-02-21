import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AskMyMoney",
  description: "How AskMyMoney collects, uses, and protects your financial data.",
};

export default function PrivacyPolicyPage() {
  const effectiveDate = "February 10, 2026";

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-400 mb-12">
          Effective date: {effectiveDate}
        </p>

        <div className="space-y-10 text-sm leading-relaxed text-gray-300">
          {/* ---- Intro ---- */}
          <section>
            <p>
              AskMyMoney (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is
              operated by Axite LLC. This Privacy Policy explains how we
              collect, use, store, and share your information when you use the
              AskMyMoney application (&quot;Service&quot;) through ChatGPT or
              our website.
            </p>
          </section>

          {/* ---- 1. Data We Collect ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Data We Collect
            </h2>

            <h3 className="font-medium text-foreground mt-4 mb-1">
              Account Information
            </h3>
            <p>
              When you sign up we collect your name, email address, and profile
              image via Google OAuth. We also store session tokens and, if you
              enroll, passkey (FIDO2/WebAuthn) credentials for passwordless
              authentication.
            </p>

            <h3 className="font-medium text-foreground mt-4 mb-1">
              Financial Data (via Plaid)
            </h3>
            <p>
              When you connect a financial institution through Plaid we receive
              and store:
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1">
              <li>
                Account metadata &mdash; name, masked account number (last 4
                digits), type, subtype, and currency
              </li>
              <li>
                Balances &mdash; current and available balances
              </li>
              <li>
                Transactions &mdash; date, amount, merchant name, category, and
                payment channel
              </li>
              <li>
                Investment holdings and transactions (if applicable)
              </li>
              <li>
                Liabilities such as credit cards and loans (if applicable)
              </li>
            </ul>
            <p className="mt-2">
              We do <strong>not</strong> store your bank login credentials.
              Credentials are entered directly into Plaid&apos;s secure Link
              interface and are never transmitted to our servers.
            </p>

            <h3 className="font-medium text-foreground mt-4 mb-1">
              Subscription &amp; Billing Data
            </h3>
            <p>
              Payments are processed by Stripe. We store your Stripe customer
              ID, subscription plan, and billing period. We do{" "}
              <strong>not</strong> store credit card numbers or payment method
              details.
            </p>

            <h3 className="font-medium text-foreground mt-4 mb-1">
              Automatically Collected Data
            </h3>
            <p>
              We collect session identifiers, IP addresses, and user-agent
              strings for authentication and security purposes. We do not use
              third-party analytics, tracking pixels, or advertising cookies.
            </p>
          </section>

          {/* ---- 2. How We Use Your Data ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. How We Use Your Data
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and operate the Service (balance checks, spending insights, budget tools)</li>
              <li>Authenticate your identity and manage sessions</li>
              <li>Process subscription billing via Stripe</li>
              <li>Send transactional emails (connection confirmations, error alerts, consent expiration warnings)</li>
              <li>Maintain audit logs for security and dispute resolution</li>
              <li>Improve the reliability and performance of the Service</li>
            </ul>
            <p className="mt-2">
              We do <strong>not</strong> sell, rent, or share your financial
              data with marketers or third parties for advertising purposes.
            </p>
          </section>

          {/* ---- 3. Data Storage & Security ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Data Storage &amp; Security
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Plaid access tokens are encrypted at rest using AES-256-GCM
                before being stored in our database.
              </li>
              <li>All connections use HTTPS/TLS encryption in transit.</li>
              <li>
                Sessions expire after 30 days and are stored with
                HttpOnly, Secure, SameSite cookies.
              </li>
              <li>
                Plaid webhook payloads are verified via JWT signature and
                SHA-256 body hash before processing.
              </li>
              <li>
                All data queries are scoped to your user ID &mdash; you can
                only access your own data.
              </li>
            </ul>
          </section>

          {/* ---- 4. Third-Party Services ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              4. Third-Party Services
            </h2>
            <p>We share limited data with the following service providers solely to operate the Service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                <strong>Plaid Inc.</strong> &mdash; Connects to your financial
                institutions and provides account, transaction, and balance
                data. Plaid&apos;s use of your data is governed by the{" "}
                <a
                  href="https://plaid.com/legal/#end-user-privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-400 hover:text-blue-300"
                >
                  Plaid End User Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Stripe Inc.</strong> &mdash; Processes subscription
                payments. We share your email and plan selection. Stripe&apos;s
                privacy policy is available at{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-400 hover:text-blue-300"
                >
                  stripe.com/privacy
                </a>
                .
              </li>
              <li>
                <strong>Resend</strong> &mdash; Delivers transactional emails.
                We share your email address and name only for the purpose of
                sending Service-related notifications.
              </li>
              <li>
                <strong>OpenAI (ChatGPT)</strong> &mdash; The Service runs as a
                ChatGPT app. Aggregated financial summaries (not raw
                transaction data) are returned to ChatGPT in response to your
                queries. OpenAI&apos;s data usage is governed by the{" "}
                <a
                  href="https://openai.com/policies/row-privacy-policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-400 hover:text-blue-300"
                >
                  OpenAI Privacy Policy
                </a>
                .
              </li>
            </ul>
          </section>

          {/* ---- 5. Data Retention ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              5. Data Retention
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Financial data</strong> (transactions, balances) is
                retained while your account is active and your bank connection
                remains linked.
              </li>
              <li>
                <strong>Sessions</strong> expire after 30&nbsp;days
                automatically.
              </li>
              <li>
                <strong>Audit logs</strong> (connection and deletion records)
                are retained indefinitely for compliance and dispute resolution.
              </li>
              <li>
                When you disconnect a bank account, we soft-delete the
                associated items and revoke the Plaid access token. An audit
                record of the disconnection is kept.
              </li>
              <li>
                When you delete your account, we revoke all Plaid access
                tokens, delete all associated financial data, and remove
                sessions, API keys, and OAuth tokens.
              </li>
            </ul>
          </section>

          {/* ---- 6. Your Rights ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              6. Your Rights
            </h2>
            <p>Depending on your jurisdiction you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Access</strong> the personal data we hold about you
              </li>
              <li>
                <strong>Delete</strong> your account and associated data
              </li>
              <li>
                <strong>Disconnect</strong> individual bank accounts at any time
              </li>
              <li>
                <strong>Export</strong> your data upon request
              </li>
              <li>
                <strong>Object</strong> to or restrict certain processing
                activities
              </li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at the address below.
            </p>
          </section>

          {/* ---- 7. Cookies ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              7. Cookies
            </h2>
            <p>
              We use a single essential session cookie
              (<code className="text-xs bg-gray-800 rounded px-1 py-0.5">better_auth_session</code>)
              to maintain your authenticated session. It is HttpOnly, Secure,
              and set with SameSite=Lax. We do not use analytics, advertising,
              or third-party tracking cookies.
            </p>
          </section>

          {/* ---- 8. Children ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              8. Children&apos;s Privacy
            </h2>
            <p>
              The Service is not intended for users under the age of 18. We do
              not knowingly collect personal information from children. If you
              believe a child has provided us with personal data, please
              contact us and we will promptly delete it.
            </p>
          </section>

          {/* ---- 9. Changes ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. If we make
              material changes we will notify you by email or through the
              Service. Your continued use of the Service after a change
              constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* ---- 10. Contact ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              10. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or wish to
              exercise your data rights, contact us at:
            </p>
            <p className="mt-2">
              Axite LLC
              <br />
              Email:{" "}
              <a
                href="mailto:privacy@askmymoney.ai"
                className="underline text-blue-400 hover:text-blue-300"
              >
                privacy@askmymoney.ai
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
