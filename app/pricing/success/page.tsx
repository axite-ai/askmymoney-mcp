"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SubscriptionSuccessPage() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect back to ChatGPT
          // Check if we came from ChatGPT
          if (document.referrer.includes('chatgpt.com') || document.referrer.includes('chat.openai.com')) {
            window.location.href = document.referrer;
          } else {
            // Fallback to home page
            window.location.href = "/";
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-green-500/20 p-6">
            <svg
              className="w-16 h-16 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Welcome to AskMyMoney!
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Your subscription is now active. You can start using all premium features right away.
        </p>

        {/* Features List */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold mb-4 text-center">What's Next?</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-gray-300">
                Connect your bank accounts via Plaid
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-gray-300">
                Ask questions about your finances in ChatGPT
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-gray-300">
                Get AI-powered spending insights
              </span>
            </li>
          </ul>
        </div>

        {/* Redirect Info */}
        <p className="text-gray-400 mb-6">
          Redirecting you back in <span className="text-blue-400 font-semibold">{countdown}</span> seconds...
        </p>

        {/* Manual Navigation */}
        <div className="space-x-4">
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
