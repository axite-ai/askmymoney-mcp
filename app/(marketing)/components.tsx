"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-surface/80 backdrop-blur-xl border-b border-subtle"
          : "bg-surface"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="AskMyMoney" width={46} height={15} />
          <span className="font-semibold text-default text-base tracking-tight">
            AskMyMoney
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <a
            href="#features"
            className="text-sm text-secondary hover:text-default transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-secondary hover:text-default transition-colors"
          >
            How It Works
          </a>
        </div>

        <Link
          href="https://chatgpt.com/apps"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-on-primary font-medium text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Try in ChatGPT
        </Link>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-subtle py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="AskMyMoney" width={40} height={13} />
            <span className="font-semibold text-default text-sm tracking-tight">
              AskMyMoney
            </span>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-secondary">
            <Link
              href="/privacy"
              className="hover:text-default transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-default transition-colors"
            >
              Terms of Service
            </Link>
            <a
              href="mailto:support@askmymoney.ai"
              className="hover:text-default transition-colors"
            >
              Support
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-tertiary">
            &copy; {new Date().getFullYear()} Axite. All rights reserved.
          </p>
          <p className="text-xs text-tertiary">
            Bank data secured by Plaid. Payments by Stripe.
          </p>
        </div>
      </div>
    </footer>
  );
}
