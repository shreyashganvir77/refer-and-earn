import React from "react";
import { useNavigate } from "react-router-dom";

const ShippingReturnPolicy = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Shipping and Return Policy
          </h1>
          <p className="text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8 text-gray-600">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Digital Service Delivery
              </h2>
              <p className="leading-relaxed mb-4">
                Refer & Earn is a digital marketplace platform that provides
                referral services. As such, we do not ship physical products.
                All services are delivered digitally through our online platform.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-gray-700">
                  <strong>Service Delivery:</strong> Referral services are
                  delivered electronically through our platform. Once a referral
                  provider submits a referral on your behalf, you will receive
                  confirmation and access to the referral details through your
                  account dashboard.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Service Processing Time
              </h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Referral Submission Timeline
                  </h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      Referral providers typically submit referrals within 3-5
                      business days after accepting your request
                    </li>
                    <li>
                      You will receive email notifications at each stage of the
                      referral process
                    </li>
                    <li>
                      Referral status updates are available in real-time through
                      your account dashboard
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Payment Processing
                  </h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      Payments are processed immediately upon service
                      confirmation
                    </li>
                    <li>
                      Referral provider payouts are released after successful
                      referral submission and verification
                    </li>
                    <li>
                      Refunds, when applicable, are processed within 5-10
                      business days
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Return and Cancellation Policy
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Service Cancellation
                  </h3>
                  <p className="mb-2">
                    You may cancel a referral request before the referral provider
                    has submitted the referral:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      <strong>Before Submission:</strong> Full refund will be
                      processed automatically
                    </li>
                    <li>
                      <strong>After Submission:</strong> Cancellation is not
                      possible as the service has been completed
                    </li>
                    <li>
                      <strong>Provider Cancellation:</strong> If the referral
                      provider cancels, you will receive a full refund
                      automatically
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Service Returns
                  </h3>
                  <p className="mb-2">
                    Since we provide digital services, traditional "returns" do
                    not apply. However, we offer the following:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      <strong>Unsatisfactory Service:</strong> If a referral
                      provider fails to meet agreed terms, you may be eligible
                      for a refund or service credit
                    </li>
                    <li>
                      <strong>Non-Delivery:</strong> If a referral is not
                      submitted within the agreed timeframe, you will receive a
                      full refund
                    </li>
                    <li>
                      <strong>Dispute Resolution:</strong> Our support team will
                      review disputes and work to resolve issues fairly
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Refund Eligibility
              </h2>
              <div className="space-y-3">
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="font-semibold text-gray-800 mb-2">
                    Eligible for Refund:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Referral not submitted within agreed timeframe</li>
                    <li>Referral provider cancels before submission</li>
                    <li>You cancel before referral submission</li>
                    <li>Technical issues preventing service delivery</li>
                    <li>Verified service quality issues</li>
                  </ul>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="font-semibold text-gray-800 mb-2">
                    Not Eligible for Refund:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Referral successfully submitted (service completed)</li>
                    <li>Job application rejected by company (referral was provided)</li>
                    <li>Change of mind after referral submission</li>
                    <li>Failure to follow up on submitted referral</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Refund Process
              </h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    How to Request a Refund
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>
                      Log into your Refer & Earn account and navigate to "My
                      Referrals"
                    </li>
                    <li>
                      Select the referral request you wish to cancel/refund
                    </li>
                    <li>
                      Click "Request Refund" or contact our support team
                    </li>
                    <li>
                      Provide details about why you're requesting a refund
                    </li>
                    <li>
                      Our team will review your request within 2-3 business days
                    </li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Refund Processing Time
                  </h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      Approved refunds are processed within 5-10 business days
                    </li>
                    <li>
                      Refunds are credited to your original payment method
                    </li>
                    <li>
                      You will receive email confirmation once the refund is
                      processed
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Contact for Returns/Refunds
              </h2>
              <p className="mb-4">
                For questions about returns, cancellations, or refunds, please
                contact our support team:
              </p>
              <div className="space-y-2">
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:support@referandearn.com"
                    className="text-indigo-600 hover:underline"
                  >
                    support@referandearn.com
                  </a>
                </p>
                <p>
                  <strong>Support Hours:</strong> Monday - Friday, 9:00 AM - 6:00
                  PM IST
                </p>
                <p>
                  <strong>Response Time:</strong> We aim to respond to all
                  inquiries within 24-48 hours
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingReturnPolicy;
