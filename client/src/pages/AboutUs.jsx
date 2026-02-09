import React from "react";
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1
              className="text-xl font-bold text-indigo-600 cursor-pointer"
              onClick={() => navigate("/")}
            >
              Refer & Earn
            </h1>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">About Us</h1>

          {/* Business Category Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Business Category
            </h2>
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded">
              <p className="text-gray-700 font-medium mb-2">
                Job Referral Marketplace Platform
              </p>
              <p className="text-gray-600">
                Refer & Earn is a digital marketplace platform that connects job
                seekers with referral providers. We operate as an intermediary
                service facilitating professional referrals in the technology
                and corporate sectors. Our platform enables individuals to
                request referrals for job opportunities and allows employees to
                provide referrals while earning compensation for successful
                placements.
              </p>
            </div>
          </section>

          {/* Our Mission Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 leading-relaxed">
              At Refer & Earn, we believe that everyone deserves access to
              quality job opportunities. Our mission is to democratize the
              referral process by creating a transparent, fair, and efficient
              marketplace where job seekers can find the referrals they need,
              and referral providers can monetize their professional networks
              while helping others advance their careers.
            </p>
          </section>

          {/* How It Works Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              How It Works
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    For Job Seekers
                  </h3>
                  <p className="text-gray-600">
                    Browse companies and find referral providers who can help
                    you get your dream job. Connect with verified employees and
                    request referrals for positions you're interested in.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    For Referral Providers
                  </h3>
                  <p className="text-gray-600">
                    Help others by providing referrals and earn money for
                    successful placements. Build your reputation through reviews
                    and ratings from satisfied job seekers.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Refund Policy Section */}
          <section id="refund" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Refund Policy
            </h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Payment and Refund Terms
                </h3>
                <p className="mb-3">
                  All payments made through the Refer & Earn platform are
                  processed securely. Refunds are handled on a case-by-case
                  basis according to the following guidelines:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Successful Referral:</strong> Once a referral is
                    successfully submitted and accepted by the company, the
                    payment is final and non-refundable.
                  </li>
                  <li>
                    <strong>Failed Referral:</strong> If a referral provider
                    fails to submit a referral within the agreed timeframe, you
                    may be eligible for a full refund. Contact our support team
                    to initiate the refund process.
                  </li>
                  <li>
                    <strong>Rejected Application:</strong> Refunds are not
                    provided if your job application is rejected by the company,
                    as the referral service was completed successfully.
                  </li>
                  <li>
                    <strong>Provider Cancellation:</strong> If a referral
                    provider cancels before submitting the referral, you will
                    receive a full refund automatically.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Refund Processing
                </h3>
                <p>
                  Refunds, when approved, will be processed within 5-10 business
                  days to the original payment method. For any refund requests
                  or disputes, please contact our support team at{" "}
                  <a
                    href="mailto:referandearn88@gmail.com"
                    className="text-indigo-600 hover:underline"
                  >
                    referandearn88@gmail.com
                  </a>
                  .
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Dispute Resolution
                </h3>
                <p>
                  If you have concerns about a referral service or payment, our
                  support team will review your case and work with both parties
                  to reach a fair resolution. We are committed to ensuring a
                  positive experience for all users.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Contact Us
            </h2>
            <p className="text-gray-600 mb-4">
              Have questions or need support? We're here to help!
            </p>
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:referandearn88@gmail.com"
                  className="text-indigo-600 hover:underline"
                >
                  referandearn88@gmail.com
                </a>
              </p>
              <p>
                <strong>Support Hours:</strong> Monday - Friday, 9:00 AM - 6:00
                PM IST
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
