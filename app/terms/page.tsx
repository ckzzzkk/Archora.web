import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'ASORIA Terms of Service — the agreement governing your use of the platform.',
};

export default function TermsPage() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-4xl text-text mb-4">Terms of Service</h1>
        <p className="text-text-dim font-body text-sm mb-12">Last updated: 9 April 2026</p>

        <div className="prose-custom space-y-8">
          <div>
            <h2 className="font-heading text-xl text-text mb-3">1. Introduction and Acceptance</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and Crokora (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), the operator of the ASORIA platform. ASORIA encompasses the website located at asoria.app, the ASORIA mobile application available for iOS and Android, and all related services, tools, and features (collectively, the &quot;Service&quot;).
            </p>
            <p className="text-text-secondary font-body text-sm leading-relaxed mt-3">
              By creating an account, subscribing to a plan, or otherwise accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not use the Service.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">2. Service Description</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              ASORIA is an AI-powered architecture design platform that enables users to generate architectural floor plans and blueprints through artificial intelligence, edit and customise designs in a 2D and 3D design studio, scan physical rooms using augmented reality, explore designs through immersive 3D walkthroughs, and share and monetise design templates within the community marketplace. The Service utilises artificial intelligence, including large language models and computer vision, to generate design content. All AI-generated outputs are computational suggestions intended for conceptual and planning purposes only.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">3. Account Responsibilities</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              You must provide accurate, complete, and current information when creating your account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must be at least 16 years of age to create an account. You agree to notify us immediately at crokora.official@gmail.com if you become aware of any unauthorised use of your account. We reserve the right to suspend or terminate accounts that we reasonably believe have been compromised or are being used in violation of these Terms.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">4. Subscription Terms</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed mb-3">
              ASORIA offers four subscription tiers: Starter (free), Creator, Pro, and Architect. The specific features, limits, and pricing for each tier are displayed on our pricing page and may be updated from time to time.
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary font-body text-sm">
              <li><strong className="text-text">Billing:</strong> Paid subscriptions are billed either monthly or annually, as selected at the time of purchase. Annual subscriptions are charged in a single upfront payment at a discounted rate. All prices are in US Dollars and are inclusive of applicable taxes unless otherwise stated.</li>
              <li><strong className="text-text">Auto-Renewal:</strong> All paid subscriptions automatically renew at the end of each billing period at the then-current price, unless cancelled before the renewal date. You will receive a reminder email at least 7 days before each renewal.</li>
              <li><strong className="text-text">Cancellation:</strong> You may cancel your subscription at any time through the Manage Subscription page in your account settings, which links to the Stripe billing portal. Upon cancellation, you will retain access to your paid features until the end of your current billing period. No partial refunds are provided for unused portions of a billing period.</li>
              <li><strong className="text-text">Plan Changes:</strong> You may upgrade your subscription at any time and will be charged a prorated amount for the remainder of your current billing period. Downgrades take effect at the end of the current billing period.</li>
              <li><strong className="text-text">Payment Processing:</strong> All payments are processed securely by Stripe, Inc. By subscribing, you agree to Stripe&apos;s terms of service and privacy policy. We do not store your payment card information on our servers.</li>
              <li><strong className="text-text">Free Trial:</strong> We may offer free trial periods for paid subscriptions. At the end of a free trial, your subscription will automatically convert to a paid subscription unless cancelled before the trial expires.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">5. Acceptable Use</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed mb-3">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary font-body text-sm">
              <li>Generate designs for illegal structures or buildings that violate local planning and building regulations.</li>
              <li>Upload, share, or distribute content that infringes upon the intellectual property rights of third parties, including copyrighted architectural designs, plans, or photographs.</li>
              <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Service or its underlying AI models.</li>
              <li>Use automated scripts, bots, or other means to access the Service in a manner that exceeds reasonable use or circumvents rate limits.</li>
              <li>Publish or share content through the community marketplace that is offensive, misleading, fraudulent, or otherwise objectionable.</li>
              <li>Attempt to gain unauthorised access to other users&apos; accounts, data, or designs.</li>
              <li>Use the Service to compete with or create a substantially similar product to ASORIA.</li>
            </ul>
            <p className="text-text-secondary font-body text-sm leading-relaxed mt-3">
              We reserve the right to investigate violations and take appropriate action, including suspension or termination of accounts, removal of content, and reporting to law enforcement authorities.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">6. Intellectual Property</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed mb-3">
              <strong className="text-text">Your Content:</strong> You retain full ownership of all designs, blueprints, floor plans, and other creative content that you create using ASORIA (&quot;User Content&quot;). By using the Service, you grant us a limited, non-exclusive, worldwide licence to store, display, and process your User Content solely for the purpose of providing the Service to you. If you publish User Content to the community marketplace, you grant other users a licence to view and, where applicable, use your templates in accordance with the marketplace terms.
            </p>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              <strong className="text-text">Our Platform:</strong> The ASORIA platform, including its software, user interface, design, branding, logos, AI models, and all associated intellectual property, is owned by Crokora and protected by copyright, trademark, and other intellectual property laws. Nothing in these Terms grants you any right to use the ASORIA name, logos, or branding for any purpose without our prior written consent.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">7. AI-Generated Content Disclaimer</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              Designs, blueprints, and floor plans generated by ASORIA&apos;s artificial intelligence are provided as conceptual suggestions and planning aids only. They are <strong className="text-text">not</strong> certified engineering plans, structural assessments, or building-code-compliant architectural drawings. AI-generated content should not be used as the sole basis for construction, renovation, or structural modification without independent review and certification by a qualified architect, structural engineer, or building professional licensed in your jurisdiction. While ASORIA&apos;s AI considers general structural principles, it cannot account for local building codes, soil conditions, environmental factors, or site-specific requirements. You acknowledge that any reliance on AI-generated designs for construction or renovation purposes is entirely at your own risk.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">8. Limitation of Liability</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              To the maximum extent permitted by applicable law, Crokora and its directors, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, or goodwill, arising out of or in connection with your use of the Service. In particular, we shall not be liable for any damages, losses, injuries, or claims arising from construction, renovation, or building work undertaken based on designs or plans generated by the Service. Our total aggregate liability for any claims arising under these Terms shall not exceed the amount you paid to us for the Service during the twelve (12) months immediately preceding the event giving rise to the claim, or one hundred pounds sterling (GBP 100), whichever is greater.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">9. Indemnification</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              You agree to indemnify, defend, and hold harmless Crokora and its directors, officers, employees, and agents from and against any and all claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in connection with your use of the Service, your User Content, your violation of these Terms, or your violation of any rights of a third party.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">10. Dispute Resolution and Governing Law</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any dispute arising out of or in connection with these Terms, including any question regarding their existence, validity, or termination, shall be subject to the exclusive jurisdiction of the courts of England and Wales. Nothing in these Terms affects your statutory rights as a consumer under the Consumer Rights Act 2015 or other applicable consumer protection legislation.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">11. Termination</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              Either party may terminate this agreement at any time. You may terminate by cancelling your subscription and deleting your account. We may terminate or suspend your account immediately if you breach these Terms or engage in conduct that we reasonably believe is harmful to the Service, other users, or third parties. Upon termination, your right to access the Service ceases. However, you will have a period of 30 days following termination to export your designs and data. After this 30-day period, we may permanently delete your data in accordance with our Privacy Policy. Sections 6, 7, 8, 9, and 10 of these Terms shall survive termination.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">12. Modifications to the Service and Terms</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time. We may update these Terms from time to time. If we make material changes, we will notify you by email at least 14 days before the changes take effect. Your continued use of the Service after the effective date of any changes constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Service and cancel your subscription.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">13. Severability</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving its original intent.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">14. Entire Agreement</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Crokora regarding the use of the Service and supersede all prior agreements, understandings, and communications, whether written or oral, relating to the subject matter hereof.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-text mb-3">15. Contact</h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="mt-3 border border-sketch rounded-card bg-surface p-6">
              <p className="text-text font-body text-sm font-medium">Crokora</p>
              <p className="text-text-secondary font-body text-sm">Legal Inquiries</p>
              <a href="mailto:asoria.app@gmail.com" className="text-primary font-body text-sm hover:text-accent transition-colors">
                asoria.app@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
