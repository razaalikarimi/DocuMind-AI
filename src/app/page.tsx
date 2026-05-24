"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  FileText,
  MessageSquare,
  Zap,
  Shield,
  Search,
  BookOpen,
  Star,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { APP_NAME } from "@/constants";

// ============================================================
// HERO SECTION
// ============================================================

function HeroSection() {
  const { isSignedIn } = useUser();

  return (
    <section className="hero-section">
      {/* Background decoration */}
      <div className="hero-bg">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-grid" />
      </div>

      <div className="container">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hero-badge"
        >
          <Sparkles size={14} />
          <span>Powered by GPT-4o + RAG Technology</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="hero-title"
        >
          Chat with your
          <br />
          <span className="text-gradient">PDFs using AI</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hero-subtitle"
        >
          Upload any PDF and instantly get AI-powered answers, insights, and
          summaries. Built for researchers, students, lawyers, and professionals.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="hero-cta"
        >
          <Link
            href={isSignedIn ? "/dashboard" : "/sign-up"}
            className="btn-primary"
          >
            {isSignedIn ? "Go to Dashboard" : "Start for Free"}
            <ArrowRight size={18} />
          </Link>
          <Link href="#features" className="btn-secondary">
            See how it works
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="hero-social-proof"
        >
          <div className="hero-stars">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill="currentColor" className="star-icon" />
            ))}
          </div>
          <p>Trusted by <strong>10,000+</strong> researchers and professionals</p>
        </motion.div>

        {/* Demo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="hero-demo"
        >
          <div className="demo-window">
            <div className="demo-titlebar">
              <div className="demo-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <span className="demo-title">DocuMind AI — Research Paper.pdf</span>
            </div>
            <div className="demo-content">
              <div className="demo-message demo-message-user">
                <span>What are the key findings of this research paper?</span>
              </div>
              <div className="demo-message demo-message-ai">
                <div className="demo-ai-icon">
                  <Sparkles size={12} />
                </div>
                <div className="demo-ai-text">
                  <p>Based on the paper, the key findings are:</p>
                  <ul>
                    <li>The proposed method achieves <strong>94.2% accuracy</strong> on benchmark datasets</li>
                    <li>Processing speed improved by <strong>3.7x</strong> over previous approaches</li>
                    <li>Works effectively on <strong>low-resource languages</strong></li>
                  </ul>
                  <div className="demo-source">
                    <FileText size={12} />
                    <span>Page 4, Section 3.2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// FEATURES SECTION
// ============================================================

const features = [
  {
    icon: <Zap size={22} />,
    title: "Instant AI Answers",
    description:
      "Get precise, contextual answers from your documents in seconds. Powered by GPT-4o with advanced RAG retrieval.",
  },
  {
    icon: <Search size={22} />,
    title: "Semantic Search",
    description:
      "Our AI understands meaning, not just keywords. Find what you need even when you don't know the exact words.",
  },
  {
    icon: <BookOpen size={22} />,
    title: "Source Citations",
    description:
      "Every answer comes with exact page references. Know exactly where the information came from.",
  },
  {
    icon: <MessageSquare size={22} />,
    title: "Multi-turn Conversations",
    description:
      "Have natural conversations across multiple documents. The AI remembers context throughout your session.",
  },
  {
    icon: <Shield size={22} />,
    title: "Enterprise Security",
    description:
      "Your documents are encrypted at rest and in transit. SOC2 compliant with RBAC and audit logging.",
  },
  {
    icon: <FileText size={22} />,
    title: "Multi-PDF Workspaces",
    description:
      "Organize documents into workspaces. Chat across multiple PDFs simultaneously for comprehensive research.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="features-section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          <span className="section-label">Features</span>
          <h2>Everything you need to understand your documents</h2>
          <p>
            DocuMind combines cutting-edge AI with an intuitive interface,
            making document analysis fast, accurate, and delightful.
          </p>
        </motion.div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="feature-card"
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PRICING SECTION
// ============================================================

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for personal projects and exploration",
    features: [
      "3 PDFs per workspace",
      "1 workspace",
      "50 AI messages/day",
      "10MB file size limit",
      "Standard support",
    ],
    cta: "Get Started Free",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For power users and professionals",
    features: [
      "50 PDFs per workspace",
      "10 workspaces",
      "1,000 AI messages/day",
      "100MB file size limit",
      "Priority support",
      "Advanced analytics",
      "API access",
    ],
    cta: "Start Pro Trial",
    href: "/sign-up?plan=pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams and organizations at scale",
    features: [
      "Unlimited PDFs",
      "Unlimited workspaces",
      "Unlimited AI messages",
      "500MB file size limit",
      "Dedicated support",
      "SSO & SAML",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@documind.ai",
    highlighted: false,
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="pricing-section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          <span className="section-label">Pricing</span>
          <h2>Simple, transparent pricing</h2>
          <p>Start free and scale as you grow. No hidden fees.</p>
        </motion.div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`pricing-card ${plan.highlighted ? "pricing-card-highlighted" : ""}`}
            >
              {plan.highlighted && (
                <div className="pricing-badge">Most Popular</div>
              )}
              <div className="pricing-header">
                <h3>{plan.name}</h3>
                <div className="pricing-price">
                  <span className="price-amount">{plan.price}</span>
                  {plan.period && (
                    <span className="price-period">{plan.period}</span>
                  )}
                </div>
                <p>{plan.description}</p>
              </div>
              <ul className="pricing-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <ChevronRight size={14} className="check-icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={plan.highlighted ? "btn-primary" : "btn-outline"}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// HEADER
// ============================================================

function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <div className="logo-icon">
            <Sparkles size={18} />
          </div>
          <span>{APP_NAME}</span>
        </Link>

        <nav className="header-nav">
          <Link href="#features">Features</Link>
          <Link href="#pricing">Pricing</Link>
          <Link href="/docs">Docs</Link>
        </nav>

        <div className="header-actions">
          {isSignedIn ? (
            <Link href="/dashboard" className="btn-primary btn-sm">
              Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="btn-ghost btn-sm">
                Sign in
              </Link>
              <Link href="/sign-up" className="btn-primary btn-sm">
                Get started <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================
// FOOTER
// ============================================================

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="logo">
            <div className="logo-icon">
              <Sparkles size={16} />
            </div>
            <span>{APP_NAME}</span>
          </div>
          <p>The intelligent way to work with documents.</p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>Product</h4>
            <Link href="#features">Features</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="/changelog">Changelog</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link href="/about">About</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/careers">Careers</Link>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/security">Security</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} DocuMind AI. All rights reserved.</p>
      </div>
    </footer>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
      </main>
      <Footer />

      <style>{`
        /* ---- Layout ---- */
        .landing-page { min-height: 100vh; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

        /* ---- Header ---- */
        .site-header {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          background: var(--bg-overlay);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
        }
        .header-inner {
          display: flex; align-items: center; gap: 40px;
          height: 64px;
        }
        .logo {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem; font-weight: 700;
          color: var(--text-primary) !important;
        }
        .logo-icon {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, var(--accent-500), var(--teal-500));
          display: flex; align-items: center; justify-content: center;
          color: white;
        }
        .header-nav {
          display: flex; gap: 32px; flex: 1;
        }
        .header-nav a {
          font-size: 0.9rem; font-weight: 500;
          color: var(--text-secondary) !important;
          transition: color var(--transition-fast);
        }
        .header-nav a:hover { color: var(--text-primary) !important; }
        .header-actions {
          display: flex; align-items: center; gap: 12px; margin-left: auto;
        }

        /* ---- Buttons ---- */
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent-600);
          color: white !important;
          font-weight: 600; font-size: 0.9rem;
          padding: 10px 20px; border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
          border: none; cursor: pointer;
        }
        .btn-primary:hover {
          background: var(--accent-700);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--bg-elevated);
          color: var(--text-primary) !important;
          font-weight: 500; font-size: 0.9rem;
          padding: 10px 20px; border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
          transition: all var(--transition-fast);
        }
        .btn-secondary:hover {
          background: var(--bg-subtle);
          border-color: var(--border-strong);
        }
        .btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          background: transparent;
          color: var(--text-primary) !important;
          font-weight: 600; font-size: 0.9rem;
          padding: 12px 24px; border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
          transition: all var(--transition-fast);
          width: 100%;
        }
        .btn-outline:hover { background: var(--bg-subtle); }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent;
          color: var(--text-secondary) !important;
          font-weight: 500; font-size: 0.875rem;
          padding: 8px 14px; border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }
        .btn-ghost:hover { background: var(--bg-muted); color: var(--text-primary) !important; }
        .btn-sm { padding: 8px 16px !important; font-size: 0.875rem !important; }

        /* ---- Hero ---- */
        .hero-section {
          min-height: 100vh; display: flex; align-items: center;
          padding: 120px 0 80px; position: relative; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0; pointer-events: none;
        }
        .hero-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.15;
        }
        .hero-orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, var(--accent-400), transparent);
          top: -200px; right: -100px;
        }
        .hero-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, var(--teal-400), transparent);
          bottom: -100px; left: -50px;
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(var(--border-subtle) 1px, transparent 1px),
                            linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px);
          background-size: 48px 48px;
          opacity: 0.4;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent-50); border: 1px solid var(--accent-200);
          color: var(--accent-600); font-size: 0.8rem; font-weight: 500;
          padding: 6px 14px; border-radius: 999px; margin-bottom: 28px;
        }
        .dark .hero-badge {
          background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3);
        }
        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 800; line-height: 1.1;
          margin-bottom: 24px; max-width: 700px;
        }
        .hero-subtitle {
          font-size: 1.125rem; color: var(--text-muted);
          max-width: 560px; margin-bottom: 36px; line-height: 1.7;
        }
        .hero-cta {
          display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 40px;
        }
        .hero-social-proof {
          display: flex; align-items: center; gap: 12px;
          color: var(--text-muted); font-size: 0.875rem;
          margin-bottom: 60px;
        }
        .hero-stars { display: flex; gap: 2px; }
        .star-icon { color: #F59E0B; }
        .hero-social-proof strong { color: var(--text-primary); }

        /* ---- Demo Window ---- */
        .hero-demo { max-width: 720px; }
        .demo-window {
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
        }
        .demo-titlebar {
          display: flex; align-items: center; gap: 12px;
          background: var(--bg-subtle);
          border-bottom: 1px solid var(--border-subtle);
          padding: 12px 16px;
        }
        .demo-dots { display: flex; gap: 6px; }
        .dot { width: 12px; height: 12px; border-radius: 50%; }
        .dot-red    { background: #FF5F57; }
        .dot-yellow { background: #FFBD2E; }
        .dot-green  { background: #27C93F; }
        .demo-title {
          font-size: 0.8rem; color: var(--text-muted);
          font-family: monospace; flex: 1; text-align: center;
        }
        .demo-content { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .demo-message { padding: 12px 16px; border-radius: var(--radius-lg); font-size: 0.9rem; }
        .demo-message-user {
          background: var(--accent-50); border: 1px solid var(--accent-100);
          color: var(--text-primary); align-self: flex-end; max-width: 80%;
        }
        .dark .demo-message-user {
          background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.2);
        }
        .demo-message-ai {
          display: flex; gap: 12px; align-items: flex-start;
        }
        .demo-ai-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: linear-gradient(135deg, var(--accent-500), var(--teal-500));
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0; margin-top: 4px;
        }
        .demo-ai-text { flex: 1; }
        .demo-ai-text p { margin-bottom: 8px; color: var(--text-secondary); font-size: 0.9rem; }
        .demo-ai-text ul { padding-left: 16px; }
        .demo-ai-text li { margin-bottom: 4px; font-size: 0.875rem; color: var(--text-secondary); }
        .demo-source {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--bg-subtle); border: 1px solid var(--border-subtle);
          padding: 4px 10px; border-radius: 999px;
          font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;
        }

        /* ---- Sections ---- */
        .section-header { text-align: center; max-width: 640px; margin: 0 auto 64px; }
        .section-label {
          display: inline-block; font-size: 0.75rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 1.5px;
          color: var(--accent-600); margin-bottom: 12px;
        }
        .section-header h2 { margin-bottom: 16px; }
        .section-header p { color: var(--text-muted); font-size: 1.05rem; }

        /* ---- Features ---- */
        .features-section {
          padding: 100px 0; background: var(--bg-subtle);
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
        }
        .features-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
        }
        @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .features-grid { grid-template-columns: 1fr; } }
        .feature-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 28px;
          transition: all var(--transition-normal);
        }
        .feature-card:hover {
          border-color: var(--accent-200);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .feature-icon {
          width: 44px; height: 44px; border-radius: var(--radius-md);
          background: var(--accent-50); border: 1px solid var(--accent-100);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-600); margin-bottom: 16px;
        }
        .dark .feature-icon {
          background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.2);
        }
        .feature-card h3 { font-size: 1rem; margin-bottom: 8px; }
        .feature-card p { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }

        /* ---- Pricing ---- */
        .pricing-section { padding: 100px 0; }
        .pricing-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
        }
        @media (max-width: 900px) { .pricing-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; } }
        .pricing-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 32px; position: relative;
          display: flex; flex-direction: column; gap: 24px;
          transition: all var(--transition-normal);
        }
        .pricing-card:hover { box-shadow: var(--shadow-md); }
        .pricing-card-highlighted {
          border-color: var(--accent-400);
          box-shadow: 0 0 0 1px var(--accent-200), var(--shadow-lg);
        }
        .pricing-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(135deg, var(--accent-500), var(--teal-500));
          color: white; font-size: 0.75rem; font-weight: 600;
          padding: 4px 16px; border-radius: 999px; white-space: nowrap;
        }
        .pricing-header h3 { font-size: 1.125rem; margin-bottom: 8px; }
        .pricing-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; }
        .price-amount { font-size: 2rem; font-weight: 700; color: var(--text-primary); font-family: 'Outfit', sans-serif; }
        .price-period { font-size: 0.875rem; color: var(--text-muted); }
        .pricing-header p { font-size: 0.875rem; color: var(--text-muted); }
        .pricing-features { list-style: none; flex: 1; display: flex; flex-direction: column; gap: 10px; }
        .pricing-features li { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; }
        .check-icon { color: var(--accent-500); flex-shrink: 0; }
        .pricing-card .btn-primary { width: 100%; justify-content: center; }

        /* ---- Footer ---- */
        .site-footer {
          background: var(--bg-subtle);
          border-top: 1px solid var(--border-subtle);
          padding: 60px 0 0;
        }
        .footer-inner {
          display: grid; grid-template-columns: 1fr auto; gap: 80px;
          padding-bottom: 48px;
        }
        @media (max-width: 768px) { .footer-inner { grid-template-columns: 1fr; gap: 40px; } }
        .footer-brand .logo { margin-bottom: 12px; }
        .footer-brand p { font-size: 0.875rem; color: var(--text-muted); }
        .footer-links { display: flex; gap: 64px; }
        .footer-col { display: flex; flex-direction: column; gap: 12px; }
        .footer-col h4 { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); }
        .footer-col a { font-size: 0.875rem; color: var(--text-secondary) !important; }
        .footer-col a:hover { color: var(--text-primary) !important; }
        .footer-bottom {
          border-top: 1px solid var(--border-subtle);
          padding: 20px 24px; text-align: center;
        }
        .footer-bottom p { font-size: 0.8rem; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
