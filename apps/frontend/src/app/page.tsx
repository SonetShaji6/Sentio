import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sentio - Data Intelligence",
  description:
    "Sentio empowers teams with secure, fast, and intelligent cloud dashboards. Manage profiles, upload securely, and analyze effortlessly.",
  openGraph: {
    title: "Sentio",
    description: "Data Intelligence.",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="landing-layout">
      {/* Navbar */}
      <nav className="landing-nav">
        <Link href="/" className="landing-logo">
          Sentio
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="btn btn-secondary">
            Sign In
          </Link>
          <Link href="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="hero-tag">Sentio 2.0 is now available</div>
        <h1 className="hero-title">Intelligence that drives action</h1>
        <p className="hero-desc">
          Transform your raw data into structured dashboards. Sentio provides
          enterprise-grade security with a clean, minimal interface designed for
          speed and clarity.
        </p>
        <div className="hero-actions">
          <Link href="/register" className="btn btn-primary">
            Start for free
          </Link>
          <Link href="/login" className="btn btn-secondary">
            View Documentation
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section className="landing-features">
        <div className="features-grid">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m8 17 4 4 4-4" />
              </svg>
            </div>
            <h3 className="feature-title">Cloud Storage</h3>
            <p className="feature-desc">
              Seamlessly upload and manage assets with enterprise-grade Azure
              Blob integration. Instant delivery globally.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="feature-title">Bank-level Security</h3>
            <p className="feature-desc">
              State-of-the-art bcrypt hashing and JWT authentication. Your
              users' data is encrypted and secure by default.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <h3 className="feature-title">Dynamic Dashboards</h3>
            <p className="feature-desc">
              Beautiful, responsive, and blazing fast React dashboards. Manage
              profiles and visualize data in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "40px 24px",
          textAlign: "center",
          borderTop: "1px solid var(--color-border)",
          marginTop: "auto",
        }}
      >
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>
          &copy; {new Date().getFullYear()} Sentio Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
