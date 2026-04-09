import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'ASORIA Privacy Policy — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-4xl text-text mb-4">Privacy Policy</h1>
        <p className="text-text-dim font-body text-sm mb-12">Last updated: 9 April 2026</p>

        <div className="prose-custom space-y-8">
          <div>
            <h2 className="font-heading text-xl text-text mb-3">1. Data Controller</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              ASORIA is a product of Crokora, a company registered in the United Kingdom. Crokora acts as the data controller for all personal data processed through the ASORIA platform, including the website at asoria.app and the ASORIA mobile application for iOS and Android.
            </p>
            <p className="text-text-secondary font-body text-sm leading-relaxed mt-3">
              For any privacy-related inquiries, you may contact us at:{' '}
              <a href="mailto:crokora.official@gmail.com" className="text-primary hover:text-accent transition-colors">
                crokora.official@gmail.com
              </a>
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">2. Data We Collect</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed mb-3">
              We collect the following categories of personal data when you use ASORIA:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary font-body text-sm">
              <li><strong className="text-text">Account Information:</strong> Your email address, display name, and authentication credentials. If you sign in with Google, we receive your Google profile name and email address.</li>
              <li><strong className="text-text">Subscription and Payment Data:</strong> Subscription tier, billing cycle, and payment status. Actual payment card details are processed and stored exclusively by Stripe and are never transmitted to or stored on our servers.</li>
              <li><strong className="text-text">Usage Data:</strong> Information about how you use the application, including AI generation counts, project counts, session durations, feature usage, and engagement metrics such as points and streaks.</li>
              <li><strong className="text-text">Design Data:</strong> Architectural blueprints, floor plans, furniture placements, and associated metadata that you create within ASORIA.</li>
              <li><strong className="text-text">AR Scan Data:</strong> Room dimensions, photographs, depth maps, and spatial data collected when you use the augmented reality scanning features.</li>
              <li><strong className="text-text">Voice Input:</strong> Audio recordings submitted through the voice-to-text feature during the design interview, which are transcribed and then deleted. We do not retain audio recordings beyond the transcription process.</li>
              <li><strong className="text-text">Reference Images:</strong> Photographs you upload as style references during the design process.</li>
              <li><strong className="text-text">Contact Information:</strong> Name, email address, and message content submitted through our contact form.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">3. How We Use Your Data</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed mb-3">
              We process your personal data for the following purposes and on the following legal bases:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary font-body text-sm">
              <li><strong className="text-text">To provide and maintain the service</strong> (contractual necessity): We use your account information to authenticate you, your design data to render your projects, and your subscription data to manage access to features.</li>
              <li><strong className="text-text">To process payments</strong> (contractual necessity): We transmit subscription selections to Stripe to process your payments and manage your billing cycle.</li>
              <li><strong className="text-text">To generate AI content</strong> (contractual necessity): We send your design parameters, voice transcriptions, and reference images to our AI providers to generate architectural blueprints and designs.</li>
              <li><strong className="text-text">To improve the service</strong> (legitimate interest): We analyse anonymised and aggregated usage data to understand how features are used and to improve the platform.</li>
              <li><strong className="text-text">To communicate with you</strong> (legitimate interest or consent): We may send you important service updates, respond to your contact form submissions, and with your consent, send marketing communications.</li>
              <li><strong className="text-text">To ensure security</strong> (legitimate interest): We implement rate limiting, authentication checks, and access controls to protect the service and your data.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">4. Third-Party Services</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed mb-3">
              We share data with the following third-party service providers, each of whom processes data in accordance with their own privacy policies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary font-body text-sm">
              <li><strong className="text-text">Supabase (Database and Authentication):</strong> Stores your account data, designs, and application state. Data is hosted on Supabase Cloud infrastructure in EU-West region and encrypted at rest using AES-256.</li>
              <li><strong className="text-text">Stripe (Payment Processing):</strong> Processes all subscription payments. Stripe is PCI DSS Level 1 certified. We never store your full payment card details.</li>
              <li><strong className="text-text">Google (OAuth Authentication):</strong> If you choose to sign in with Google, your Google profile information is shared with us to create your account.</li>
              <li><strong className="text-text">Anthropic (AI Generation):</strong> Design parameters are sent to Anthropic&apos;s Claude API to generate architectural blueprints. Anthropic does not use your data to train their models when accessed via the API.</li>
              <li><strong className="text-text">OpenAI (Voice Transcription):</strong> Audio recordings are sent to OpenAI&apos;s Whisper API for transcription. Audio is processed in real-time and is not retained by OpenAI after transcription.</li>
              <li><strong className="text-text">Cloudflare (CDN):</strong> Static assets and images are served through Cloudflare&apos;s content delivery network to improve performance.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">5. Data Storage and Security</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              All personal data is stored on Supabase Cloud infrastructure located in the EU-West region. Data is encrypted at rest using AES-256 encryption and in transit using TLS 1.2 or higher. We implement Row Level Security (RLS) policies on all database tables to ensure that users can only access their own data. Access tokens are short-lived (15-minute expiry) with rotating 7-day refresh tokens stored securely on your device. API access is protected by rate limiting to prevent abuse.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">6. Data Retention</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              Your account data is retained for as long as your account remains active. Your designs and projects are retained indefinitely while your account is active. If you delete your account, your personal data will be permanently removed within 30 days, except where retention is required by law. After subscription cancellation, your designs remain accessible and exportable for 30 days. Contact form submissions are retained for 12 months for support purposes and then deleted.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">7. Your Rights (GDPR Articles 15-20)</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed mb-3">
              Under the UK General Data Protection Regulation (UK GDPR) and the EU General Data Protection Regulation (GDPR), you have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary font-body text-sm">
              <li><strong className="text-text">Right of Access (Article 15):</strong> You have the right to request a copy of all personal data we hold about you. We will respond to your request within 30 days.</li>
              <li><strong className="text-text">Right to Rectification (Article 16):</strong> You have the right to request correction of any inaccurate personal data we hold about you. You can update your display name and email through the application settings.</li>
              <li><strong className="text-text">Right to Erasure (Article 17):</strong> You have the right to request deletion of your personal data. Upon request, we will permanently delete your account and all associated data within 30 days, unless retention is required by law.</li>
              <li><strong className="text-text">Right to Restriction (Article 18):</strong> You have the right to request that we restrict the processing of your personal data in certain circumstances.</li>
              <li><strong className="text-text">Right to Data Portability (Article 20):</strong> You have the right to receive your personal data in a structured, commonly used, machine-readable format. You can export your designs from the application at any time.</li>
              <li><strong className="text-text">Right to Object (Article 21):</strong> You have the right to object to processing of your personal data based on legitimate interests.</li>
            </ul>
            <p className="text-text-secondary font-body text-sm leading-relaxed mt-3">
              To exercise any of these rights, please contact us at{' '}
              <a href="mailto:crokora.official@gmail.com" className="text-primary hover:text-accent transition-colors">
                crokora.official@gmail.com
              </a>
              . You also have the right to lodge a complaint with the UK Information Commissioner&apos;s Office (ICO) or your local supervisory authority.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">8. Cookies</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              ASORIA uses only essential session cookies required for authentication and security. These cookies are set by Supabase to maintain your login session and are strictly necessary for the service to function. We do not use any tracking cookies, advertising cookies, or analytics cookies. No consent banner is required as we only use strictly necessary cookies as defined under the UK Privacy and Electronic Communications Regulations (PECR) and the ePrivacy Directive.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">9. Children</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              ASORIA is not designed for or directed at children under the age of 16. We do not knowingly collect personal data from children under 16 years of age. If we become aware that we have collected personal data from a child under 16, we will take steps to delete that data as soon as possible. If you believe that a child under 16 has provided us with personal data, please contact us at{' '}
              <a href="mailto:crokora.official@gmail.com" className="text-primary hover:text-accent transition-colors">
                crokora.official@gmail.com
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">10. International Transfers</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              While our primary data storage is in the EU-West region, some of our third-party processors (such as Anthropic and OpenAI) may process data in the United States. Where personal data is transferred outside the UK or EEA, we ensure that appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) approved by the European Commission, or reliance on the processor&apos;s participation in recognised data protection frameworks.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">11. Changes to This Policy</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. If we make material changes, we will notify you by email at the address associated with your account at least 14 days before the changes take effect. Your continued use of the service after the effective date constitutes acceptance of the updated policy. We encourage you to review this policy periodically.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">12. Contact</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact our Data Protection team:
            </p>
            <div className="mt-3 glass rounded-card p-6">
              <p className="text-text font-body text-sm font-medium">Crokora</p>
              <p className="text-text-secondary font-body text-sm">Data Protection Inquiries</p>
              <a href="mailto:crokora.official@gmail.com" className="text-primary font-body text-sm hover:text-accent transition-colors">
                crokora.official@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
