"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowLeftRight,
  PieChart,
  ShieldCheck,
  Calculator,
  Lightbulb,
  Lock,
  Zap,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Scroll-reveal hook (IntersectionObserver, no framer-motion)        */
/* ------------------------------------------------------------------ */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ------------------------------------------------------------------ */
/*  RevealCard                                                         */
/* ------------------------------------------------------------------ */

function RevealCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="reveal group p-6 rounded-xl bg-surface border border-subtle hover:border-default transition-colors shadow-hairline"
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-16 overflow-hidden">
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Tag */}
        <div className="animate-fade-up" style={{ animationDelay: "0s" }}>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium tracking-wide uppercase">
            <Zap className="w-3 h-3" />
            AI-Powered Finance
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up mt-8 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight text-default"
          style={{ animationDelay: "0.1s" }}
        >
          Your finances,{" "}
          <span className="font-display italic text-primary">
            one conversation
          </span>{" "}
          away
        </h1>

        {/* Description */}
        <p
          className="animate-fade-up mt-6 text-lg sm:text-xl text-secondary max-w-xl mx-auto leading-relaxed"
          style={{ animationDelay: "0.2s" }}
        >
          AskMyMoney connects your bank accounts to ChatGPT. Ask about your
          balances, spending, and financial health&nbsp;&mdash; and get instant,
          accurate answers.
        </p>

        {/* CTAs */}
        <div
          className="animate-fade-up mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ animationDelay: "0.3s" }}
        >
          <Link
            href="https://chatgpt.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-primary text-on-primary font-semibold px-6 py-3 rounded-xl transition-all flex items-center gap-2 hover:opacity-90"
          >
            Get Started
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#features"
            className="text-secondary hover:text-default font-medium px-6 py-3 rounded-xl border border-default hover:border-default transition-all"
          >
            See Features
          </a>
        </div>
      </div>

      {/* Chat mockup */}
      <div
        className="animate-fade-up relative z-10 mt-16 w-full max-w-2xl mx-auto"
        style={{ animationDelay: "0.45s" }}
      >
        <ChatMockup />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat Mockup                                                        */
/* ------------------------------------------------------------------ */

function ChatMockup() {
  return (
    <div className="relative">
      <div className="relative bg-surface-secondary rounded-2xl border border-subtle overflow-hidden shadow-sm">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-subtle">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-surface-tertiary" />
            <div className="w-2.5 h-2.5 rounded-full bg-surface-tertiary" />
            <div className="w-2.5 h-2.5 rounded-full bg-surface-tertiary" />
          </div>
          <span className="text-xs text-tertiary ml-2">ChatGPT</span>
        </div>

        {/* Messages */}
        <div className="p-5 space-y-5">
          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-surface-tertiary rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
              <p className="text-sm text-default">
                What did I spend on food this month?
              </p>
            </div>
          </div>

          {/* AI response */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-[10px] font-bold">$</span>
              </div>
              <div className="space-y-3 flex-1 min-w-0">
                <p className="text-sm text-default">
                  Here&apos;s your food spending for this month:
                </p>

                {/* Widget card */}
                <div className="bg-surface rounded-xl border border-subtle overflow-hidden">
                  <div className="px-4 py-3 border-b border-subtle">
                    <span className="text-xs font-medium text-tertiary uppercase tracking-wider">
                      Spending Breakdown
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    {(
                      [
                        {
                          label: "Dining Out",
                          amount: "$423.50",
                          pct: 53,
                          opacity: "100",
                        },
                        {
                          label: "Groceries",
                          amount: "$318.24",
                          pct: 39,
                          opacity: "70",
                        },
                        {
                          label: "Coffee & Snacks",
                          amount: "$62.80",
                          pct: 8,
                          opacity: "40",
                        },
                      ] as const
                    ).map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-secondary">
                            {item.label}
                          </span>
                          <span className="text-xs font-medium text-default">
                            {item.amount}
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${item.pct}%`,
                              opacity: `${Number(item.opacity) / 100}`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-subtle flex items-center justify-between">
                      <span className="text-xs font-medium text-secondary">
                        Total
                      </span>
                      <span className="text-sm font-semibold text-default">
                        $804.54
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-default">
                  That&apos;s 12% less than last month. Your grocery spending
                  decreased by $47.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trust Bar                                                          */
/* ------------------------------------------------------------------ */

function TrustBar() {
  const items = [
    { icon: Lock, label: "256-bit encryption" },
    { icon: ShieldCheck, label: "Secured by Plaid" },
    { icon: Zap, label: "Built for ChatGPT" },
  ];

  return (
    <section className="py-12 border-y border-subtle">
      <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 sm:gap-16">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 text-secondary">
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Wallet,
    title: "Account Balances",
    description:
      "See all your checking, savings, and credit card balances across every linked institution.",
  },
  {
    icon: ArrowLeftRight,
    title: "Transaction History",
    description:
      "Search and filter your transactions. Ask about specific merchants, dates, or categories.",
  },
  {
    icon: PieChart,
    title: "Spending Insights",
    description:
      "Understand where your money goes with automatic categorization and trend analysis.",
  },
  {
    icon: ShieldCheck,
    title: "Account Health",
    description:
      "Get alerts for low balances, unusual activity, overdrafts, and high credit utilization.",
  },
  {
    icon: Calculator,
    title: "Budget Planning",
    description:
      "Create budgets using the 50/30/20 rule. Track needs, wants, and savings goals.",
  },
  {
    icon: Lightbulb,
    title: "Financial Tips",
    description:
      "Receive personalized advice on saving, investing, debt management, and building credit.",
  },
];

function Features() {
  const headerRef = useReveal<HTMLDivElement>();

  return (
    <section id="features" className="py-24 sm:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div ref={headerRef} className="reveal text-center mb-16">
          <span className="text-primary text-xs font-medium uppercase tracking-widest">
            Features
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-default">
            Everything you need to{" "}
            <span className="font-display italic text-primary">understand</span>{" "}
            your money
          </h2>
          <p className="mt-4 text-secondary max-w-lg mx-auto">
            Ask anything about your finances in plain English. AskMyMoney
            handles the rest.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <RevealCard key={title} delay={i * 0.06}>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-default mb-2">
                {title}
              </h3>
              <p className="text-sm text-secondary leading-relaxed">
                {description}
              </p>
            </RevealCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    number: "01",
    title: "Install in ChatGPT",
    description:
      "Add AskMyMoney from the ChatGPT app store. It takes less than a minute.",
  },
  {
    number: "02",
    title: "Link Your Accounts",
    description:
      "Securely connect your bank accounts through Plaid. Your data is encrypted end-to-end.",
  },
  {
    number: "03",
    title: "Ask Anything",
    description:
      "Ask ChatGPT about your finances. Get instant, accurate answers with real data.",
  },
];

function HowItWorks() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section
      id="how-it-works"
      className="py-24 sm:py-32 px-6 border-t border-subtle"
    >
      <div className="max-w-6xl mx-auto">
        <div ref={ref} className="reveal">
          <div className="text-center mb-16">
            <span className="text-primary text-xs font-medium uppercase tracking-widest">
              How It Works
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-default">
              Three steps to{" "}
              <span className="font-display italic text-primary">
                financial clarity
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {STEPS.map(({ number, title, description }) => (
              <div key={number} className="border-t border-subtle pt-6">
                <div className="text-5xl font-bold text-primary/20 mb-4 font-mono">
                  {number}
                </div>
                <h3 className="text-xl font-semibold text-default mb-2">
                  {title}
                </h3>
                <p className="text-secondary leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA                                                                */
/* ------------------------------------------------------------------ */

function CTASection() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="py-24 sm:py-32 px-6">
      <div ref={ref} className="reveal max-w-2xl mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-default">
          Stop guessing.{" "}
          <span className="font-display italic text-primary">
            Start asking.
          </span>
        </h2>
        <p className="mt-6 text-secondary text-lg">
          Your financial data, accessible through the AI assistant you already
          use.
        </p>
        <div className="mt-8">
          <Link
            href="https://chatgpt.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 bg-primary hover:opacity-90 text-on-primary font-semibold px-8 py-4 rounded-xl transition-all text-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <CTASection />
    </>
  );
}
