import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TermsAndConditions = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Terms & Conditions | Refer & Earn";
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevContent = metaDesc?.getAttribute("content");
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Terms and Conditions for Refer & Earn – a marketplace connecting referral requesters and providers. Payments via Razorpay. No employment guarantees."
      );
    }
    return () => {
      document.title = "Refer and Earn";
      if (metaDesc && prevContent) metaDesc.setAttribute("content", prevContent);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              type="button"
              className="text-xl font-bold text-indigo-600 cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Refer & Earn
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
        <article className="bg-white rounded-xl shadow-lg p-6 sm:p-8 md:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Terms & Conditions
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Last updated: January 2025
          </p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                1. Introduction
              </h2>
              <p>
                Refer & Earn (“Platform”, “we”, “us”) is a digital marketplace
                that connects users seeking referrals (“Requesters”) with users
                who can provide referrals for a fee (“Providers”). By accessing
                or using the Platform, you agree to be bound by these Terms &
                Conditions. If you do not agree, do not use the Platform.
                Continued use of the Platform constitutes acceptance of these
                terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                2. Platform Role
              </h2>
              <p className="mb-3">
                The Platform acts only as a facilitator between Requesters and
                Providers. We enable introductions and payment flows; we do not
                participate in hiring, interviewing, or employment decisions.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  We do not act as a recruitment agency, staffing firm, or
                  employer.
                </li>
                <li>
                  We do not guarantee job placement, interviews, or any
                  employment outcome.
                </li>
                <li>
                  Outcomes depend entirely on employers and the parties to each
                  referral; the Platform is not responsible for those outcomes.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                3. User Eligibility
              </h2>
              <p className="mb-3">
                To use the Platform you must:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Be at least 18 years of age.</li>
                <li>
                  Provide accurate, current, and complete information when
                  registering and using the Platform.
                </li>
                <li>
                  Not use the Platform for any illegal or unauthorized purpose.
                </li>
              </ul>
              <p className="mt-3">
                We may suspend or terminate your account if you misuse the
                Platform, provide false information, or breach these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                4. Provider Responsibilities
              </h2>
              <p className="mb-3">
                Providers must:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Be genuinely employed or associated with the company they list
                  when offering referrals.
                </li>
                <li>
                  Provide referrals in good faith and not mislead Requesters
                  about their ability to refer or the nature of the referral.
                </li>
                <li>
                  Not make false claims about job openings, hiring processes, or
                  outcomes.
                </li>
              </ul>
              <p className="mt-3">
                Fake referrals, misrepresentation, or fraud may result in
                immediate account suspension or termination and forfeiture of
                payouts.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                5. Requester Responsibilities
              </h2>
              <p className="mb-3">
                Requesters must:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Maintain an accurate profile and provide correct job and
                  application details when requesting referrals.
                </li>
                <li>
                  Communicate respectfully with Providers and the Platform.
                </li>
                <li>
                  Not harass, abuse, or misuse Providers or the Platform.
                </li>
              </ul>
              <p className="mt-3">
                Violation of these responsibilities may lead to account
                suspension or termination.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                6. Payments & Payouts
              </h2>
              <p className="mb-3">
                Payments on the Platform are processed through Razorpay, a
                licensed payment gateway. By using paid features, you agree to
                Razorpay’s terms and our payment rules below.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Holding of funds:</strong> The Platform holds
                  payment until the referral is completed as per our defined
                  status (e.g. referral marked completed).
                </li>
                <li>
                  <strong>Service fee:</strong> The Platform charges a service
                  fee on transactions; the applicable amount is shown at the
                  time of payment.
                </li>
                <li>
                  <strong>Release of payouts:</strong> Provider payouts are
                  released only after (a) the referral is marked completed, and
                  (b) there are no open disputes or support tickets for that
                  referral. We do not guarantee timelines for employer
                  decisions; payout release is based on completion status on our
                  Platform only.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                7. Refunds & Disputes
              </h2>
              <p className="mb-3">
                Refund eligibility is determined by our policy and the
                circumstances of each case (e.g. referral not completed,
                Provider fault, or other qualifying conditions). Disputes should
                be raised through the Platform’s support ticket system. We will
                review the information provided by both parties and resolve
                disputes in line with our policies. The Platform’s decision
                after review is final.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                8. Reviews & Ratings
              </h2>
              <p className="mb-3">
                Users may submit one review per completed referral. Reviews must
                be honest and based on actual experience. False, defamatory, or
                abusive content is prohibited. We may moderate or remove
                content that violates these terms or applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                9. Prohibited Activities
              </h2>
              <p className="mb-3">
                You must not:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Use the Platform to imply or promise employment, job
                  placement, or interview outcomes; we make no such guarantees.
                </li>
                <li>
                  Impersonate any person, company, or entity.
                </li>
                <li>
                  Share personal contact details (e.g. phone, email, social
                  handles) to circumvent the Platform or for unsanctioned
                  off-platform dealings.
                </li>
                <li>
                  Bypass or circumvent Platform payments (e.g. paying or
                  receiving payment outside the Platform for referrals arranged
                  through us).
                </li>
                <li>
                  Use the Platform for fraud, spam, or any illegal activity.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                10. Limitation of Liability
              </h2>
              <p className="mb-3">
                To the fullest extent permitted by law:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  The Platform is not liable for hiring decisions, employer
                  actions, interview outcomes, or whether any user obtains a
                  job.
                </li>
                <li>
                  We are not liable for the conduct of users, employers, or
                  third parties.
                </li>
                <li>
                  Our liability is limited to the amount you paid to the
                  Platform in the twelve (12) months preceding the claim, except
                  where prohibited by law.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                11. Account Suspension & Termination
              </h2>
              <p className="mb-3">
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Breach these Terms & Conditions.</li>
                <li>Engage in fraud, abuse, or misrepresentation.</li>
                <li>Fail to cooperate in good faith in dispute resolution.</li>
                <li>Otherwise pose a risk to users or the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                12. Changes to Terms
              </h2>
              <p>
                We may update these Terms & Conditions from time to time. We
                will post the updated terms on the Platform and update the
                “Last updated” date. Your continued use of the Platform after
                changes constitutes acceptance of the revised terms. If you do
                not agree, you must stop using the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                13. Governing Law
              </h2>
              <p>
                These Terms & Conditions are governed by the laws of India.
                Any disputes are subject to the exclusive jurisdiction of the
                courts of India.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                14. Contact Information
              </h2>
              <p className="mb-3">
                For support and general inquiries, please use the support
                channel or email provided in the Platform (e.g. support/help
                section).
              </p>
              <p>
                For legal or compliance inquiries related to these terms,
                please contact us at the legal or contact email published on the
                Platform (e.g. on the Contact or About page).
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
};

export default TermsAndConditions;
